extends Control
## THE GUILD — a faithful port of the registration flow in src/App.tsx (townMode === "guild").
##
## Registration is STAGED: 説明 → 職業 → 顔 → 来歴 → 気質 → 能力 → 名前, ONE decision at a time, with the
## stepper always visible and 戻る/次へ in fixed places. The port had collapsed everything into ONE screen (a
## class list, six aptitude chips and a name cycler side by side) — the shape React deliberately moved away
## from (IMP-028). 顔 / 来歴 / 気質 used to share a single "appearance" step; the playtest asked for each to be
## its own decision, with the FACE chosen first (it is the thing the player sees).
##
## What each step owns (and why it is its own step):
##   説明 — the guild master asks who you are before writing anything down; the hall behind him shows the
##          party you already have and the way to the roster.
##   職業 — a bounded LIST beside a stable detail pane: the cursor's calling reads into the pane
##          (signature, formation, aptitude, starting gear NAMED from the catalog — never a raw id).
##   顔 — the FACE, chosen first from a provided pool. It is decoupled from class and origin, and the step
##          says so: the face can be changed later or replaced with the player's own imported image.
##   来歴 — origin: what the recruit did before the guild, with the line the choice is actually made on.
##   気質 — nature: the disposition that colours the aptitudes.
##   能力 — spend the bonus pool: base vs allocated side by side, so a point's effect is visible BEFORE
##          it is committed. 次へ stays disabled while points remain unspent (React does the same).
##   名前 — name, title and notes. Text entry is allowed here, and 名を見繕う fills all three, so a player
##          who does not want to invent one is never blocked.
##
## Everything above the fold is built from the SAME create() the parity gate proves byte-identical to TS
## (rules/character_creation.gd), so the preview is the adventurer that will actually be registered.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Fmt := preload("res://scripts/town_format.gd")
const WorldResources := preload("res://scripts/world_resources.gd")
const Draft := preload("res://scripts/guild_draft.gd")
const CharacterCreation := preload("res://scripts/rules/character_creation.gd")
const Techniques := preload("res://scripts/rules/techniques.gd")
const SliceRules := preload("res://scripts/rules/slice_rules.gd")

const STEPS := ["briefing", "class", "face", "background", "trait", "bonus", "name"]
const APTITUDE_KEYS := ["might", "agility", "spirit", "wit", "luck"]
const PARTY_MAX := 6
const BG := Color("0b0d09")

var _run: Node = null
var _world: Dictionary = {}
var _world_id: String = "default"
var _data: Dictionary = {}
var _fallback_state: Dictionary = {}

var _step: String = "briefing"
var _draft: Dictionary = {}
var _roster_open: bool = false
# Roster EDIT: which existing member is being edited, and the working copy of their identity fields.
var _roster_selected_id: String = ""
var _roster_draft: Dictionary = {}
var _event_text: String = ""

var _pending_focus: Control = null   # where this step lands the cursor when it opens
var _claimed_focus: Control = null   # the control the LAST action wants the cursor back on
var _focus_key: String = ""
var _host: Control = null
var _engine_cache: Dictionary = {}

func _ready() -> void:
	await get_tree().process_frame
	_acquire_state()
	_draft = Draft.fresh(1)
	_rebuild()

func _acquire_state() -> void:
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_world = _run.world
		_data = _run.character_data
		# NB: do NOT start_guild() here — it wipes party+reserve. A NEW game is cleared once by the scenario
		# picker; re-entering the guild from town (to register more adventurers) must KEEP the roster, or
		# leaving registration midway and coming back would delete everyone already made (playtest bug).
	else:
		_world = _read_json("res://data/worlds/default.json").get("world", {})
		_data = _read_json("res://data/character-data.json")
		_fallback_state = {"party": [], "phase": "town"}

func state() -> Dictionary:
	return _run.state if _run else _fallback_state

## Test seam for the UX-parity gate: each registration step is its own contract, so the gate has to be
## able to stand ON a step. Without this only 説明 would ever be measured — which is exactly how the
## missing four steps went unnoticed.
func set_ui_state(ui: Dictionary) -> void:
	if ui.has("step"): _enter_step(String(ui["step"]))
	if ui.has("roster"): _roster_open = bool(ui["roster"])
	_rebuild()

func set_world_override(world_id: String) -> void:
	_run = null
	_world_id = world_id
	_world = _read_json("res://data/worlds/%s.json" % world_id).get("world", {})
	if _fallback_state.is_empty():
		_fallback_state = {"party": [], "phase": "town"}
	_rebuild()

func set_state_override(patched: Dictionary) -> void:
	_run = null
	_fallback_state = patched
	_rebuild()

# --- shell ----------------------------------------------------------------------------------------
func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
		remove_child(child)
	_pending_focus = null
	_claimed_focus = null

	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var backdrop := TextureRect.new()
	backdrop.texture = _texture(_asset("ui/guild-hall.jpg"))
	backdrop.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	backdrop.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	backdrop.modulate = Color(1, 1, 1, 0.30)
	add_child(backdrop)
	var scrim := ColorRect.new()
	scrim.color = Color("07100892")
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 56)
	margin.add_theme_constant_override("margin_right", 56)
	margin.add_theme_constant_override("margin_top", 36)
	margin.add_theme_constant_override("margin_bottom", 36)
	add_child(margin)

	var col := UI.col(12)
	margin.add_child(col)
	_host = col

	col.add_child(_header())
	col.add_child(_stepper())
	if _event_text != "":
		col.add_child(UI.event_window(_event_text))

	var body := UI.row()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	col.add_child(body)

	var main_frame := PanelContainer.new()
	main_frame.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	main_frame.add_theme_stylebox_override("panel", _guild_frame_style())
	var main := UI.col(10)
	main_frame.add_child(main)
	body.add_child(main_frame)
	if _step != "briefing":
		main.add_child(_preview_card())
	main.add_child(_step_panel())

	# The hall stands beside the briefing only. During the steps it would be a SECOND focus surface, and
	# the arrows would wander out of the question the player is being asked (the same reason React stopped
	# rendering it alongside the form).
	if _step == "briefing":
		body.add_child(_hall_panel())

	# Every choice on these steps rebuilds the screen, so the cursor has to be PUT BACK on the control
	# the player was using — otherwise spending a point on 運 throws the cursor up to 筋力 and the next
	# press lands somewhere the player was not looking.
	var target: Control = _claimed_focus if _claimed_focus != null else _pending_focus
	if target:
		call_deferred("_focus_control", target)

func _focus_control(control: Control) -> void:
	# The rebuild that follows a fast repeat can free this control before the deferred call runs.
	if is_instance_valid(control) and control.is_inside_tree():
		control.grab_focus()

## Claim the cursor for a control the last action named. Disabled controls never claim it — a cursor
## parked on a dead command is the same as no cursor.
func _claim(control: Control, key: String) -> void:
	control.set_meta("focus_key", key)
	if key != "" and key == _focus_key and not (control is Button and (control as Button).disabled):
		_claimed_focus = control

func _header() -> Control:
	var head := UI.row()
	head.add_child(UI.grow(UI.label(I18n.t("party.studioHeading"), 30, UI.GOLD)))
	head.add_child(UI.label("%d/%d" % [_party().size(), PARTY_MAX], 22, UI.INK))
	return head

## The stepper is a map of the flow, and it is walkable: React lets the player jump back to a decided
## step. The CURRENT step is marked with a caret rather than the focus colour — gold means focus here as
## everywhere else, and two golds on one screen is how a player presses Confirm on the wrong thing.
func _stepper() -> Control:
	var row := UI.row()
	row.add_child(UI.label("%s:" % I18n.t("party.creationSteps"), 15, UI.DIM))
	for step in STEPS:
		var current: bool = step == _step
		var text := "%s %s" % ["▸" if current else " ", I18n.t("party.step.%s" % step)]
		var b := UI.button(text, func(): _goto(String(step)), Vector2(120, 34), 15)
		b.add_theme_color_override("font_color", UI.INK if current else UI.DIM)
		row.add_child(b)
	return row

# --- the developing adventurer -------------------------------------------------------------------
## Reserved above EVERY step but the briefing (IMP-028): the face and the numbers the current choices
## produce, so no step hides the person being made.
func _preview_card() -> Control:
	var character := _build_character()

	var row := UI.row()
	# The face is a player CHOICE made at the 顔 step (IMP-039), decoupled from class and origin. Before that
	# step it is genuinely undecided, so the preview shows a "？" rather than implying a face never picked.
	var face_chosen: bool = STEPS.find(_step) >= STEPS.find("face")
	if face_chosen:
		var portrait := TextureRect.new()
		portrait.custom_minimum_size = Vector2(96, 116)
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		portrait.texture = WorldResources.portrait_texture(String(_draft.get("portraitRef", "")), _draft_portrait_path())
		row.add_child(UI.card(portrait))
	else:
		var unknown := UI.label("？", 52, UI.DIM)
		unknown.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		unknown.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		unknown.custom_minimum_size = Vector2(96, 116)
		row.add_child(UI.card(unknown))

	var text := UI.col(4)
	var name_line := String(character.get("name", "")).strip_edges()
	if name_line == "":
		name_line = I18n.t("party.namePlaceholder")
	text.add_child(UI.label(name_line, 24, UI.INK))
	text.add_child(UI.label("%s · %s" % [_class_label(String(_draft.get("classId", ""))), _row_label(String(character.get("row", "front")))], 16, UI.DIM))
	text.add_child(UI.label("%s  %s" % [I18n.t("party.aptitude"), _aptitude_line(character.get("aptitude", {}))], 16, UI.INK))
	text.add_child(UI.label("HP %d · %s %d-%d · %s %d" % [
		int(character.get("maxHp", 0)),
		I18n.t("party.damage"), int(character.get("damageMin", 0)), int(character.get("damageMax", 0)),
		I18n.t("party.speed"), int(character.get("speed", 0))
	], 16, UI.OK))
	row.add_child(UI.grow(text))
	return UI.card(row)

# --- steps ----------------------------------------------------------------------------------------
func _step_panel() -> Control:
	match _step:
		"class": return _class_step()
		"face": return _face_step()
		"background": return _background_step()
		"trait": return _trait_step()
		"bonus": return _bonus_step()
		"name": return _name_step()
		_: return _briefing_step()

func _briefing_step() -> Control:
	var col := UI.col(10)
	var head := UI.row()
	var master := TextureRect.new()
	master.custom_minimum_size = Vector2(132, 184)
	master.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	# Fit the WHOLE figure — the guild master is full-length NPC art, so COVERED cropped his head/feet.
	master.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	master.texture = _texture(_asset("characters/npc-guild-master.png"))
	head.add_child(master)
	var speech := UI.col(6)
	speech.add_child(UI.label(I18n.t("party.guildMaster"), 20, UI.GOLD))
	speech.add_child(UI.prose(I18n.t("party.guildBriefing"), 18, UI.INK, 720))
	head.add_child(UI.grow(speech))
	col.add_child(head)

	# One command only: "説明を聞かない" led to the exact same _goto("class"), so it was a choice that
	# chose nothing. Registration IS the briefing being read one step at a time.
	var actions := UI.row()
	var start := UI.button(I18n.t("party.startRegistration"), func(): _goto("class"), Vector2(260, 46), 19)
	actions.add_child(start)
	# 見繕う — deal a COMPLETE random adventurer in one press (React's quick-recruit), for a player who would
	# rather be handed a recruit than walk the seven steps. Registers straight away.
	var quick := UI.button(I18n.t("party.quickRecruit"), func(): _random_recruit(), Vector2(200, 46), 18)
	quick.disabled = _party().size() >= PARTY_MAX
	actions.add_child(quick)
	col.add_child(actions)
	if _party().size() >= PARTY_MAX:
		col.add_child(UI.label(I18n.t("party.partyReadyHeading"), 19, UI.GOLD))
		col.add_child(UI.prose(I18n.t("party.partyReadyCopy"), 16, UI.DIM, 720))
		start.disabled = true
	_pending_focus = start if not start.disabled else null
	return UI.card(col)

func _class_step() -> Control:
	var col := UI.col(10)
	col.add_child(UI.label(I18n.t("party.chooseClass"), 22, UI.GOLD))

	var body := UI.row()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	col.add_child(body)

	# The bounded list. Focus IS the cursor: moving onto a calling reads it into the pane beside it, so the
	# player compares by MOVING (the detail follows), and CONFIRMING a calling is what advances — there is no
	# separate 次へ on this step (playtest). Back is the stepper above and Cancel.
	var list := UI.col(2)
	for class_def in _data.get("classes", []):
		var id := String(class_def.get("id", ""))
		var b := UI.button("%s   %s" % [_class_label(id), _row_label(String(class_def.get("rowPreference", "front")))], func(): _confirm_class(id), Vector2(280, 34), 16)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.focus_entered.connect(func(): _select_class(id))
		if id == String(_draft.get("classId", "")):
			b.add_theme_color_override("font_color", UI.INK)
			_pending_focus = b
		list.add_child(b)
	body.add_child(UI.scroller(list, Vector2(300, 420)))

	var detail := UI.col(6)
	detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var selected := Draft.find(_data.get("classes", []), String(_draft.get("classId", "")))
	detail.add_child(UI.label(_class_label(String(selected.get("id", ""))), 22, UI.INK))
	detail.add_child(UI.prose(String(selected.get("description", {}).get("ja", "")), 16, UI.DIM, 640))
	detail.add_child(_fact(I18n.t("party.formation"), _row_label(String(selected.get("rowPreference", "front")))))

	# §9.6 — THE CLASS PROMISE. The step used to say what a class WAS (row, aptitudes, starting gear) and
	# never what it could DO, which after §9.4 is the whole of a class's contract: its techniques now, the
	# ones it grows into, the exploration it is trusted with, and the thing it cannot answer. Choosing
	# blind from a stat line is the "data-entry grid" §9.6 forbids in another shape.
	var class_id := String(selected.get("id", ""))
	detail.add_child(_promise_fact(I18n.t("party.classPromiseNow"), _techniques_at_creation(class_id)))
	detail.add_child(_promise_fact(I18n.t("party.classPromiseLater"), _techniques_later(class_id)))
	var exploration := _exploration_line(class_id)
	if exploration != "":
		detail.add_child(_fact(I18n.t("party.classPromiseExploration"), exploration))
	# The stated weakness, in the class's own words. A promise without a cost is a advertisement.
	var weakness := String(((_capabilities(class_id).get("weakness", {}) as Dictionary).get("ja", "")))
	if weakness != "":
		detail.add_child(_fact(I18n.t("party.classPromiseWeakness"), weakness))
	detail.add_child(_fact(I18n.t("party.aptitudeLabel"), _aptitude_line(selected.get("aptitude", {}))))
	# NAMED from the catalog — a raw id ("militia-sabre") in normal play is a gate failure.
	var gear := []
	for entry in selected.get("equipment", []):
		gear.append(Fmt.localized_catalog_name(_world, String(entry.get("id", ""))))
	detail.add_child(_fact(I18n.t("party.equipment"), " / ".join(PackedStringArray(gear))))
	# FIXED-height detail pane — a taller class (more techniques) used to grow the pane and jolt the whole
	# step; now it is a stable 420 box that scrolls if a calling has more to say, so switching classes never
	# makes the layout jump.
	var detail_pane := UI.scroller(detail, Vector2(660, 420))
	detail_pane.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(UI.grow(UI.card(detail_pane)))

	# No 次へ/戻る here: confirming a calling in the list IS the advance (playtest). Back is the stepper + Cancel.
	return UI.card(col)


# --- §9.6 class promise -----------------------------------------------------------------------------
# All of this is READ FROM THE EXPORTED CATALOG (classCapabilities + techniques + techniqueLabelKeys),
# never restated here: §9.5 deleted five GDScript literals that had each quietly fallen behind the rules,
# and a guild screen listing techniques from memory would be the sixth.

func _capabilities(class_id: String) -> Dictionary:
	var caps: Dictionary = _engine().get("classCapabilities", {})
	var entry: Variant = caps.get(class_id, null)
	return entry if typeof(entry) == TYPE_DICTIONARY else {}

func _technique_name(id: String) -> String:
	return Techniques.label(id, _engine())

## What the adventurer walks in able to do — the level-1 grants. §5 wants two or three of these.
func _techniques_at_creation(class_id: String) -> String:
	var names := []
	for grant in _capabilities(class_id).get("combatTechniques", []):
		if int((grant as Dictionary).get("level", 1)) <= 1:
			names.append(_technique_promise(String((grant as Dictionary).get("techniqueId", ""))))
	return "\n".join(PackedStringArray(names)) if not names.is_empty() else I18n.t("party.classPromiseNone")

## What it grows into. Unlock levels remain rules data, but are deliberately not shown as a rigid
## shopping list during recruitment: players choose a role by its future options, not by a timetable.
func _techniques_later(class_id: String) -> String:
	var names := []
	for grant in _capabilities(class_id).get("combatTechniques", []):
		var level := int((grant as Dictionary).get("level", 1))
		if level <= 1:
			continue
		names.append(_technique_promise(String((grant as Dictionary).get("techniqueId", ""))))
	return "\n".join(PackedStringArray(names)) if not names.is_empty() else I18n.t("party.classPromiseNone")

func _technique_promise(id: String) -> String:
	# NAME first, then what it does — "ヒール：味方を小回復" reads as a skill entry, not a description with
	# the skill's name tucked in parentheses at the end.
	var summary := Techniques.summary(id, _engine())
	var name := _technique_name(id)
	return "%s：%s" % [name, summary] if summary != "" else name

## The exploration this class is trusted with, named rather than scored. Empty for the seven classes
## §4 gives no exploration proficiency at all — they simply do not show the line.
func _exploration_line(class_id: String) -> String:
	const ACTION_KEYS := {
		"investigate": "party.explorationInvestigate", "disarm": "party.explorationDisarm",
		"unlock": "party.explorationUnlock", "detectSecret": "party.explorationDetectSecret",
		"escape": "party.explorationEscape", "map": "party.explorationMap"
	}
	var specialist := []
	var trained := []
	var exploration: Dictionary = _capabilities(class_id).get("exploration", {})
	for action in ACTION_KEYS.keys():
		if not exploration.has(action):
			continue
		var label := I18n.t(String(ACTION_KEYS[action]))
		if String(exploration[action]) == "specialist":
			specialist.append(label)
		elif String(exploration[action]) == "trained":
			trained.append(label)
	var parts := []
	if not specialist.is_empty():
		parts.append("%s：%s" % [I18n.t("party.proficiencySpecialist"), "・".join(PackedStringArray(specialist))])
	if not trained.is_empty():
		parts.append("%s：%s" % [I18n.t("party.proficiencyTrained"), "・".join(PackedStringArray(trained))])
	return "　".join(PackedStringArray(parts))

func _engine() -> Dictionary:
	if _engine_cache.is_empty():
		if _run != null and _run.get("engine") != null:
			_engine_cache = _run.engine
		else:
			_engine_cache = _read_json("res://data/engine-data.json")
	return _engine_cache

## 顔 — FIRST of the three appearance decisions (playtest): the face the player sees, chosen from a provided
## pool. Decoupled from class and origin, and the step SAYS so — the face can be changed later or replaced
## with the player's own imported image (party.faceProvidedNote).
func _face_step() -> Control:
	var col := UI.col(10)
	col.add_child(UI.label(I18n.t("party.chooseFace"), 22, UI.GOLD))
	col.add_child(UI.prose(I18n.t("party.faceProvidedNote"), 15, UI.DIM, 760))

	var body := UI.row()
	# The chosen face at a reserved size, beside the pool it is picked from.
	var face := UI.col(4)
	face.add_child(UI.label("%s（選んだ顔）" % I18n.t("party.portrait"), 15, UI.DIM))
	var portrait := TextureRect.new()
	portrait.custom_minimum_size = Vector2(220, 260)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.texture = WorldResources.portrait_texture(String(_draft.get("portraitRef", "")), _draft_portrait_path())
	face.add_child(UI.card(portrait))
	var import_btn := UI.button(I18n.t("party.importImage"), func(): _import_portrait(func(ref: String): _set_draft_portrait(ref)), Vector2(220, 38), 15)
	_claim(import_btn, "face:import")
	face.add_child(import_btn)
	body.add_child(face)

	var choices := UI.col(8)
	choices.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	choices.add_child(_section_head(I18n.t("party.step.face"), "reroll:face", func(): _reroll_appearance("face")))
	choices.add_child(_face_pool())
	body.add_child(choices)
	col.add_child(body)

	col.add_child(_flow_actions("class", "background"))
	return UI.card(col)

## 来歴 — origin: what the recruit did before the guild, with the line the choice is actually made on. Its own
## step now (#6 / playtest), so picking an origin never silently rewrites the face or the nature.
func _background_step() -> Control:
	var col := UI.col(10)
	col.add_child(UI.label(I18n.t("party.chooseBackground"), 22, UI.GOLD))

	var background := Draft.find(_data.get("backgrounds", []), String(_draft.get("backgroundId", "")))
	col.add_child(_section_head(I18n.t("party.background"), "reroll:background", func(): _reroll_appearance("background")))
	col.add_child(_chip_row(_data.get("backgrounds", []), String(_draft.get("backgroundId", "")), func(id: String): _select_background(id), "bg", true))
	col.add_child(UI.prose(String(background.get("notes", {}).get("ja", "")), 16, UI.DIM, 760))

	col.add_child(_flow_actions("face", "trait"))
	return UI.card(col)

## 気質 — nature: the disposition that colours the aptitudes. Its own step (#6 / playtest).
func _trait_step() -> Control:
	var col := UI.col(10)
	col.add_child(UI.label(I18n.t("party.chooseTrait"), 22, UI.GOLD))

	col.add_child(_section_head(I18n.t("party.trait"), "reroll:trait", func(): _reroll_appearance("trait")))
	col.add_child(_chip_row(_data.get("traits", []), String(_draft.get("traitId", "")), func(id: String): _select_trait(id), "trait", true))

	col.add_child(_flow_actions("background", "bonus"))
	return UI.card(col)

func _bonus_step() -> Control:
	var col := UI.col(10)
	var head := UI.row()
	var heading := UI.col(4)
	heading.add_child(UI.label(I18n.t("party.allocateBonus"), 22, UI.GOLD))
	heading.add_child(UI.label(I18n.t("party.bonusRemaining", {
		"remaining": Draft.remaining(_draft), "pool": int(_draft.get("bonusPool", 0))
	}), 18, UI.INK))
	head.add_child(UI.grow(heading))
	var reroll := UI.button(I18n.t("party.rerollBonus"), func(): _reroll_bonus(), Vector2(200, 38), 16)
	_claim(reroll, "bonus:reroll")
	head.add_child(reroll)
	col.add_child(head)

	var character := _build_character()
	var bonus: Dictionary = _draft.get("bonusAptitude", {})
	var grid := UI.col(4)
	var header := UI.row()
	header.add_child(_cell(I18n.t("party.aptitudeLabel"), 120, UI.DIM))
	header.add_child(_cell(I18n.t("party.base"), 70, UI.DIM))
	header.add_child(_cell("", 52, UI.DIM))
	header.add_child(_cell(I18n.t("party.current"), 70, UI.DIM))
	header.add_child(_cell("", 52, UI.DIM))
	header.add_child(_cell(I18n.t("party.allocated"), 70, UI.DIM))
	header.add_child(_cell(I18n.t("party.effectLabel"), 200, UI.DIM))
	grid.add_child(header)

	var first_stepper: Button = null
	for key in APTITUDE_KEYS:
		var spent := int(bonus.get(key, 0))
		var total := int(character.get("aptitude", {}).get(key, 0))
		var line := UI.row()
		line.add_child(_cell(I18n.t("aptitude.%s" % key), 120, UI.INK))
		line.add_child(_cell(str(total - spent), 70, UI.DIM))
		var minus := UI.button("−", func(): _adjust(String(key), -1), Vector2(52, 34), 18)
		minus.disabled = spent <= 0
		_claim(minus, "bonus:-:%s" % key)
		line.add_child(minus)
		line.add_child(_cell(str(total), 70, UI.INK))
		var plus := UI.button("＋", func(): _adjust(String(key), 1), Vector2(52, 34), 18)
		plus.disabled = Draft.remaining(_draft) <= 0
		_claim(plus, "bonus:+:%s" % key)
		line.add_child(plus)
		# Spending the LAST point disables the ＋ under the cursor; the same row's − keeps the player on
		# the aptitude they were adjusting instead of throwing them to the top of the table.
		if _claimed_focus == null and _focus_key == "bonus:+:%s" % key and not minus.disabled:
			_claimed_focus = minus
		line.add_child(_cell("+%d" % spent if spent > 0 else "", 70, UI.OK))
		# What the point actually buys — the SAME effect words the party menu shows, so 素質 reads the same
		# on the creation table and on the隊列 status page. Always on: a spend is never a blind guess (#5).
		line.add_child(_cell(I18n.t("partyMenu.aptitudeEffect.%s" % key), 200, UI.DIM))
		grid.add_child(line)
		if first_stepper == null and not plus.disabled:
			first_stepper = plus
	col.add_child(UI.card(grid))

	col.add_child(UI.label("HP %d / %s %d-%d / %s %d / %s %d" % [
		int(character.get("maxHp", 0)),
		I18n.t("party.damage"), int(character.get("damageMin", 0)), int(character.get("damageMax", 0)),
		I18n.t("party.accuracy"), int(character.get("accuracy", 0)),
		I18n.t("party.speed"), int(character.get("speed", 0))
	], 17, UI.INK))

	# React keeps 次へ disabled until the pool is spent: unspent points are lost forever once registered,
	# so the flow refuses to walk past them silently.
	var actions := _flow_actions("trait", "name")
	var next_button := UI.first_focusable(actions)
	col.add_child(actions)
	if first_stepper:
		_pending_focus = first_stepper
	elif next_button:
		_pending_focus = next_button
	return UI.card(col)

func _name_step() -> Control:
	var col := UI.col(10)
	var head := UI.row()
	var heading := UI.col(4)
	heading.add_child(UI.label(I18n.t("party.nameAdventurer"), 22, UI.GOLD))
	heading.add_child(UI.prose(I18n.t("party.identityCopy"), 16, UI.DIM, 720))
	head.add_child(UI.grow(heading))
	var suggest := UI.button(I18n.t("party.rerollIdentity"), func(): _reroll_identity(), Vector2(200, 38), 16)
	_claim(suggest, "identity:reroll")
	head.add_child(suggest)
	col.add_child(head)

	var fields := UI.row()
	fields.add_child(_identity_field(I18n.t("party.name"), String(_draft.get("name", "")), I18n.t("party.namePlaceholder"), func(v: String): _draft["name"] = v, "name"))
	fields.add_child(_identity_field(I18n.t("party.editTitle"), String(_draft.get("title", "")), I18n.t("party.titlePlaceholder"), func(v: String): _draft["title"] = v, "title"))
	col.add_child(fields)

	var notes := UI.col(4)
	var notes_head := UI.row()
	notes_head.add_child(UI.grow(UI.label(I18n.t("party.notes"), 15, UI.DIM)))
	var notes_dice := UI.button(I18n.t("party.rerollField"), func(): _reroll_field("notes"), Vector2(110, 30), 13)
	_claim(notes_dice, "identity:notes")
	notes_head.add_child(notes_dice)
	notes.add_child(notes_head)
	var notes_edit := TextEdit.new()
	notes_edit.text = String(_draft.get("notes", ""))
	notes_edit.placeholder_text = I18n.t("party.notesPlaceholder")
	notes_edit.custom_minimum_size = Vector2(760, 96)
	notes_edit.add_theme_font_size_override("font_size", 16)
	notes_edit.text_changed.connect(func(): _draft["notes"] = notes_edit.text)
	notes.add_child(notes_edit)
	# The record is the one multi-line field on this screen; a controller can get its caret stuck here with
	# no way out. Spell out the Start-role SUBMIT key that commits registration from anywhere on the step.
	notes.add_child(UI.label(I18n.t("party.submitHint"), 14, UI.GOLD))
	col.add_child(notes)

	var character := _build_character()
	var review := UI.col(4)
	review.add_child(UI.label(I18n.t("party.review"), 17, UI.GOLD))
	review.add_child(UI.label(_display_name(), 20, UI.INK))
	review.add_child(UI.label("%s · %s · %s" % [
		_class_label(String(_draft.get("classId", ""))),
		Draft.label_ja(_data.get("backgrounds", []), String(_draft.get("backgroundId", ""))),
		Draft.label_ja(_data.get("traits", []), String(_draft.get("traitId", "")))
	], 16, UI.DIM))
	review.add_child(UI.label(_aptitude_line(character.get("aptitude", {})), 16, UI.DIM))
	col.add_child(UI.card(review))

	var actions := UI.row()
	actions.add_child(UI.button(I18n.t("party.back"), func(): _goto("bonus"), Vector2(160, 44), 18))
	var add := UI.button(I18n.t("party.add"), func(): _register(), Vector2(260, 44), 19)
	add.disabled = _party().size() >= PARTY_MAX or Draft.remaining(_draft) > 0
	actions.add_child(add)
	# A disabled command must say what is holding it — unspent points are the only thing that blocks
	# registration here, and they are two steps back.
	if Draft.remaining(_draft) > 0:
		actions.add_child(UI.label(I18n.t("party.bonusRemaining", {
			"remaining": Draft.remaining(_draft), "pool": int(_draft.get("bonusPool", 0))
		}), 16, UI.DIM))
	col.add_child(actions)
	_pending_focus = add if not add.disabled else suggest
	return UI.card(col)

# --- the hall (briefing only) ---------------------------------------------------------------------
func _hall_panel() -> Control:
	var col := UI.col(8)
	col.custom_minimum_size = Vector2(420, 0)
	col.add_child(UI.label(I18n.t("party.heading"), 20, UI.GOLD))

	var party := _party()
	if party.is_empty():
		col.add_child(UI.prose(I18n.t("town.departureCopy"), 16, UI.DIM, 380))
	for row in ["front", "back"]:
		col.add_child(UI.label(_row_label(row), 14, UI.DIM))
		var any := false
		for member in party:
			if String(member.get("row", "front")) != row:
				continue
			any = true
			var line := UI.col(2)
			line.add_child(UI.label(String(member.get("name", "?")), 17, UI.INK))
			line.add_child(UI.label("%s · %s" % [
				_class_label(String(member.get("classId", ""))),
				I18n.t("party.hpAtk", {"hp": int(member.get("hp", 0)), "maxHp": int(member.get("maxHp", 0)), "attack": int(member.get("attack", 0))})
			], 14, UI.DIM))
			col.add_child(UI.card(line, Color(String(member.get("accentColor", "#c9a765")))))
		if not any:
			col.add_child(UI.label("—", 15, UI.DIM))

	# The roster is the hall's OTHER job: who is out, who is benched. Full roster management (bench /
	# recall / retire) is the town's guild counter — this opens the same list so the hall is not a dead
	# end while the party is still being built.
	if _roster_open:
		col.add_child(UI.label(I18n.t("party.manageRoster"), 16, UI.GOLD))
		# Every registered adventurer — party AND reserve — is selectable, so names/来歴 can be corrected
		# after registration (playtest: "ギルドで名前変更できない / 冒険者情報の修正できないの？").
		var everyone: Array = []
		everyone.append_array(state().get("party", []))
		everyone.append_array(state().get("reserve", []))
		if everyone.is_empty():
			col.add_child(UI.label("—", 15, UI.DIM))
		var picker := UI.row()
		for member in everyone:
			var mid := String(member.get("id", ""))
			var pick := UI.button(String(member.get("name", "?")), func(): _roster_select(mid), Vector2(150, 34), 14)
			if mid == _roster_selected_id:
				pick.add_theme_color_override("font_color", UI.GOLD)
			_claim(pick, "roster:%s" % mid)
			picker.add_child(pick)
		col.add_child(picker)
		var editing := _member_by_id(_roster_selected_id)
		if not editing.is_empty():
			var edit_row := UI.row()
			var face := UI.col(6)
			var portrait := TextureRect.new()
			portrait.custom_minimum_size = Vector2(120, 146)
			portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
			# Prefer the working draft's imported ref (a fresh pick), else the member's current portrait.
			var preview_ref := String(_roster_draft.get("portraitRef", ""))
			if preview_ref == "":
				preview_ref = String(editing.get("portraitRef", ""))
			portrait.texture = WorldResources.portrait_texture(preview_ref, _member_portrait_path(editing))
			face.add_child(UI.card(portrait))
			var import_btn := UI.button(I18n.t("party.importImage"), func(): _import_portrait(func(ref: String): _roster_draft["portraitRef"] = ref; _rebuild()), Vector2(180, 36), 14)
			_claim(import_btn, "roster:import")
			face.add_child(import_btn)
			edit_row.add_child(face)
			var fields := UI.col(4)
			fields.add_child(_roster_field(I18n.t("party.editName"), String(_roster_draft.get("name", "")), I18n.t("party.namePlaceholder"), "name"))
			fields.add_child(_roster_field(I18n.t("party.editTitle"), String(_roster_draft.get("title", "")), I18n.t("party.titlePlaceholder"), "title"))
			fields.add_child(_roster_field(I18n.t("party.editNotes"), String(_roster_draft.get("notes", "")), I18n.t("party.notesPlaceholder"), "notes"))
			edit_row.add_child(fields)
			col.add_child(edit_row)
			var save := UI.button(I18n.t("party.editSave"), func(): _save_roster_edit(), Vector2(200, 40), 16)
			_claim(save, "roster:save")
			col.add_child(save)
		col.add_child(UI.button(I18n.t("party.rosterDone"), func(): _set_roster(false), Vector2(200, 40), 16))
	else:
		col.add_child(UI.button(I18n.t("party.manageRoster"), func(): _set_roster(true), Vector2(220, 40), 16))

	var add := UI.button(I18n.t("party.add"), func(): _goto("class"), Vector2(220, 44), 17)
	add.disabled = party.size() >= PARTY_MAX
	col.add_child(add)

	var depart := UI.button("▶ %sへ" % I18n.t("map.town"), func(): _depart(), Vector2(220, 48), 19)
	depart.disabled = party.is_empty()
	col.add_child(depart)
	if _pending_focus == null and not depart.disabled:
		_pending_focus = depart
	return UI.card(col)

# --- actions --------------------------------------------------------------------------------------
func _goto(step: String) -> void:
	_enter_step(step)
	_rebuild()

## Entering a step is not just setting a variable — the name step arrives pre-filled. The test seam goes
## through here too, so the state the gate photographs is the state a player actually walks into.
func _enter_step(step: String) -> void:
	# React fills a blank identity on the way INTO the name step, so the last screen is never an empty
	# form the player has to invent their way out of.
	if step == "name":
		Draft.suggest_if_blank(_draft, _data)
	# A new step lands the cursor where THAT step wants it, not where the last one left it.
	_focus_key = ""
	_step = step

func _select_class(id: String) -> void:
	if String(_draft.get("classId", "")) == id:
		return
	_draft["classId"] = id
	_rebuild()

## Confirming a calling in the list picks it AND advances to 顔 — the class step has no separate 次へ (playtest).
func _confirm_class(id: String) -> void:
	_draft["classId"] = id
	_goto("face")

func _select_background(id: String) -> void:
	_draft["backgroundId"] = id
	_focus_key = "bg:%s" % id
	_rebuild()

func _select_portrait(key: String) -> void:
	_draft["portraitKey"] = key
	# Picking a provided face overrides an imported image — the built-in face wins so the choice is honest.
	_draft.erase("portraitRef")
	_draft.erase("visualProfile")
	_focus_key = "face:%s" % key
	_rebuild()

# Store an imported portrait on the draft as a data URL (+ its visualProfile.baseRef), exactly as React does.
func _set_draft_portrait(ref: String) -> void:
	_draft["portraitRef"] = ref
	var vp: Dictionary = _draft.get("visualProfile", {}) if typeof(_draft.get("visualProfile", null)) == TYPE_DICTIONARY else {}
	vp["focusX"] = vp.get("focusX", 50)
	vp["focusY"] = vp.get("focusY", 38)
	vp["baseRef"] = ref
	_draft["visualProfile"] = vp
	_focus_key = "face:import"
	_rebuild()

func _select_trait(id: String) -> void:
	_draft["traitId"] = id
	_focus_key = "trait:%s" % id
	_rebuild()

func _reroll_origin() -> void:
	Draft.reroll_origin(_draft, _data)
	_focus_key = "origin:reroll"
	_rebuild()

## Re-roll ONE appearance facet — 顔 / 来歴 / 気質 — leaving the other two as the player left them (#6).
func _reroll_appearance(field: String) -> void:
	match field:
		"face": Draft.reroll_face(_draft, _data)
		"background": Draft.reroll_background(_draft, _data)
		"trait": Draft.reroll_trait(_draft, _data)
	_focus_key = "reroll:%s" % field
	_rebuild()

func _reroll_bonus() -> void:
	Draft.reroll_bonus(_draft)
	_focus_key = "bonus:reroll"
	_rebuild()

func _reroll_identity() -> void:
	Draft.reroll_identity(_draft, _data)
	_focus_key = "identity:reroll"
	_rebuild()

## Re-roll ONE identity field, leaving the other two as the player left them (#7).
func _reroll_field(field: String) -> void:
	match field:
		"name": Draft.reroll_name(_draft)
		"title": Draft.reroll_title(_draft)
		"notes": Draft.reroll_notes(_draft, _data)
	_focus_key = "identity:%s" % field
	_rebuild()

func _adjust(key: String, delta: int) -> void:
	Draft.adjust(_draft, key, delta)
	_focus_key = "bonus:%s:%s" % ["+" if delta > 0 else "-", key]
	_rebuild()

func _set_roster(open: bool) -> void:
	_roster_open = open
	if not open:
		_roster_selected_id = ""
	_rebuild()

# A member's built-in portrait PATH (fallback when they carry no imported data-URL portrait).
func _member_portrait_path(member: Dictionary) -> String:
	var ref := String(member.get("portraitRef", ""))
	var key := "gate"
	const BUILTIN := "builtin://portrait/"
	if ref.begins_with(BUILTIN):
		key = ref.substr(BUILTIN.length())
	var path := _asset("portraits/%s.png" % key)
	return path if FileAccess.file_exists(path) else _asset("portraits/gate.png")

func _member_by_id(id: String) -> Dictionary:
	if id == "":
		return {}
	for member in state().get("party", []):
		if String(member.get("id", "")) == id:
			return member
	for member in state().get("reserve", []):
		if String(member.get("id", "")) == id:
			return member
	return {}

# Select an existing member to edit; seed the working draft from their current identity.
func _roster_select(id: String) -> void:
	_roster_selected_id = id
	var m := _member_by_id(id)
	# Seed an imported portrait so re-saving keeps the face; a built-in face leaves it blank (an empty
	# portraitRef means "leave the portrait as it is", so renaming never clobbers a chosen face).
	var existing_ref := String(m.get("portraitRef", ""))
	_roster_draft = {
		"name": String(m.get("name", "")),
		"title": String(m.get("title", "")),
		"notes": String(m.get("notes", "")),
		"accentColor": String(m.get("accentColor", "#c9a765")),
		"portraitRef": existing_ref if existing_ref.begins_with("data:image") else ""
	}
	_focus_key = "roster:%s" % id
	_rebuild()

# A plain identity LineEdit for the roster editor — no reroll dice (that targets the CREATION draft).
func _roster_field(label_text: String, value: String, placeholder: String, field: String) -> Control:
	var box := UI.col(4)
	box.add_child(UI.label(label_text, 15, UI.DIM))
	var edit := LineEdit.new()
	edit.text = value
	edit.placeholder_text = placeholder
	edit.custom_minimum_size = Vector2(360, 40)
	edit.add_theme_font_size_override("font_size", 18)
	edit.text_changed.connect(func(v: String): _roster_draft[field] = v)
	box.add_child(edit)
	return box

# Commit the edit through the durable rule (trims, and covers party/reserve/retired), then write state back.
func _save_roster_edit() -> void:
	if _roster_selected_id == "" or String(_roster_draft.get("name", "")).strip_edges() == "":
		return
	var command := {
		"type": "edit_member_identity",
		"characterId": _roster_selected_id,
		"name": String(_roster_draft.get("name", "")),
		"title": String(_roster_draft.get("title", "")),
		"notes": String(_roster_draft.get("notes", "")),
		"accentColor": String(_roster_draft.get("accentColor", "#c9a765"))
	}
	# Only carry a portrait when one was imported this session — an empty ref leaves the current face alone.
	var ref := String(_roster_draft.get("portraitRef", ""))
	if ref.begins_with("data:image"):
		command["portraitRef"] = ref
	var result: Dictionary = SliceRules.resolve(state(), command, _world, _engine())
	var next: Dictionary = result.get("state", state())
	if _run != null:
		_run.state = next
	else:
		_fallback_state = next
	_event_text = "%s: %s" % [I18n.t("party.review"), String(_roster_draft.get("name", ""))]
	_focus_key = "roster:%s" % _roster_selected_id
	_rebuild()

func _register() -> void:
	var party := _party()
	if party.size() >= PARTY_MAX or Draft.remaining(_draft) > 0:
		return
	var character := _build_character()
	character["id"] = _run.mint_id() if _run else "char.%d" % party.size()
	character["memory"] = {"deeds": [], "injuries": 0, "notableVictories": [], "retreats": 0}
	party.append(character)
	state()["party"] = party
	_event_text = I18n.t("party.review") + ": " + String(character.get("name", ""))
	# The next recruit starts from a fresh draft (its own bonus pool), as React does after a submit.
	_draft = Draft.fresh(int(_draft.get("bonusSeed", 1)) + 7)
	_step = "briefing" if party.size() >= PARTY_MAX else "class"
	_rebuild()

# 見繕う — fill the draft with a complete RANDOM adventurer and register it in one press. Lands back on the
# briefing so the player can deal another or start building one by hand.
func _random_recruit() -> void:
	if _party().size() >= PARTY_MAX:
		return
	var class_ids := []
	for c in _data.get("classes", []):
		class_ids.append(String(c.get("id", "")))
	var seed := int(_draft.get("bonusSeed", 1)) * 31 + _party().size() * 101 + 7
	Draft.randomize(_draft, _data, class_ids, seed)
	_register()
	if _party().size() < PARTY_MAX:
		_enter_step("briefing")
		_rebuild()

func _depart() -> void:
	get_tree().change_scene_to_file("res://scenes/town.tscn")

## The "Start"-role SUBMIT key commits registration even from INSIDE the 覚え書き text field. A multi-line
## field otherwise traps a controller — arrows move the caret, nothing escapes — so a player could reach the
## name step and never register (playtest). Handled in _input (before the field consumes the key), name step
## only, and only when the draft is actually registerable.
func _input(event: InputEvent) -> void:
	if _step != "name" or _roster_open:
		return
	if event.is_action_pressed("submit") and _party().size() < PARTY_MAX and Draft.remaining(_draft) <= 0:
		_register()
		get_viewport().set_input_as_handled()

## Cancel resolves exactly one step: the roster closes, then the flow walks back, and the briefing is the
## floor (there is nothing behind the guild but the title).
func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("cancel"):
		return
	if _roster_open:
		_set_roster(false)
	else:
		var index := STEPS.find(_step)
		if index > 0:
			_goto(STEPS[index - 1])
		else:
			return
	get_viewport().set_input_as_handled()

# --- derivation -----------------------------------------------------------------------------------
## The adventurer the current draft produces — built by the SAME ported create() the parity gate proves
## against TS, so the preview cannot promise something registration would not deliver.
func _build_character() -> Dictionary:
	var character: Dictionary = CharacterCreation.create({
		"name": _display_name(),
		"classId": String(_draft.get("classId", "warrior")),
		"backgroundId": String(_draft.get("backgroundId", "watch")),
		"traitIds": [String(_draft.get("traitId", "steady"))],
		"bonusAptitude": _draft.get("bonusAptitude", {}),
		"portraitRef": "builtin://portrait/%s" % String(_draft.get("portraitKey", "gate")),
		"seed": "guild:%d" % int(_draft.get("bonusSeed", 1)),
	}, _data)
	# create() ports the BUILD MATH only; the written identity is the draft's. Blanks fall back the way
	# createGuildCharacter does — to the origin's note and the calling's name — except in Japanese, since
	# an English default would be the raw-English leak AGENTS.md bars from normal play.
	var background := Draft.find(_data.get("backgrounds", []), String(_draft.get("backgroundId", "")))
	var title := String(_draft.get("title", "")).strip_edges()
	var notes := String(_draft.get("notes", "")).strip_edges()
	character["title"] = title if title != "" else _class_label(String(_draft.get("classId", "")))
	character["notes"] = notes if notes != "" else String(background.get("notes", {}).get("ja", ""))
	character["traitId"] = String(_draft.get("traitId", "steady"))
	# An imported portrait (data URL) overrides the built-in face key on the registered adventurer.
	if String(_draft.get("portraitRef", "")).begins_with("data:image"):
		character["portraitRef"] = String(_draft["portraitRef"])
		character["visualProfile"] = _draft.get("visualProfile", {})
	return character

## During calling selection the player needs an immediate visual difference. Background portraits are
## still chosen on the next step; this class figure is the current discipline's readable preview.
func _preview_figure_path() -> String:
	var class_id := String(_draft.get("classId", "warrior"))
	var legacy: Dictionary = _engine().get("legacyClassMapping", {})
	class_id = String(legacy.get(class_id, class_id))
	var sub := "characters/adventurer-%s-base.png" % class_id
	var pack_path := _asset(sub)
	return pack_path if FileAccess.file_exists(pack_path) else "res://assets/worlds/default/%s" % sub

func _draft_portrait_path() -> String:
	var key := String(_draft.get("portraitKey", "gate"))
	var path := _asset("portraits/%s.png" % key)
	return path if FileAccess.file_exists(path) else _asset("portraits/gate.png")

func _face_keys() -> Array:
	return Draft.face_keys(_data)

## A section header (来歴 / 顔 / 気質) with its own 見繕う button on the right — the per-facet random of #6.
func _section_head(title: String, reroll_key: String, on_reroll: Callable) -> Control:
	var head := UI.row()
	head.add_child(UI.grow(UI.label(title, 18, UI.GOLD)))
	var dice := UI.button(I18n.t("party.rerollField"), on_reroll, Vector2(150, 32), 14)
	_claim(dice, reroll_key)
	head.add_child(dice)
	return head

func _face_pool() -> Control:
	var grid := GridContainer.new()
	grid.columns = 6
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	var selected := String(_draft.get("portraitKey", "gate"))
	for key in _face_keys():
		var b := UI.button("", func(): _select_portrait(String(key)), Vector2(66, 66), 12)
		b.icon = _texture(_asset("portraits/%s.png" % String(key)))
		b.expand_icon = true
		b.tooltip_text = "顔を選ぶ"
		b.add_theme_stylebox_override("normal", UI.panel_style(Color("11140dcc"), UI.GOLD if String(key) == selected else Color("3a4326")))
		_claim(b, "face:%s" % String(key))
		# The 顔 step opens the cursor on the face already chosen — the decision this step leads with.
		if String(key) == selected:
			_pending_focus = b
		grid.add_child(b)
	return grid

func _guild_frame_style() -> StyleBoxFlat:
	var s := UI.panel_style(Color("0e120be3"), Color("6a5a31"))
	s.set_content_margin_all(18)
	s.shadow_color = Color("00000088")
	s.shadow_size = 12
	s.shadow_offset = Vector2(0, 5)
	return s

func _display_name() -> String:
	var name := String(_draft.get("name", "")).strip_edges()
	return name if name != "" else I18n.t("party.namePlaceholder")

func _party() -> Array:
	return state().get("party", [])

func _aptitude_line(aptitude: Dictionary) -> String:
	var parts := []
	for key in APTITUDE_KEYS:
		parts.append("%s %d" % [I18n.t("aptitude.%s" % key), int(aptitude.get(key, 0))])
	return "  ".join(PackedStringArray(parts))

func _class_label(id: String) -> String:
	return Draft.label_ja(_data.get("classes", []), id)

func _row_label(row: String) -> String:
	return I18n.t("play.frontRow") if row == "front" else I18n.t("play.backRow")

# --- widgets --------------------------------------------------------------------------------------
func _fact(term: String, value: String) -> Control:
	var row := UI.row()
	row.add_child(_cell(term, 90, UI.DIM))
	row.add_child(UI.grow(UI.label(value, 16, UI.INK)))
	return row

func _promise_fact(term: String, value: String) -> Control:
	var col := UI.col(2)
	col.add_child(UI.label(term, 16, UI.DIM))
	col.add_child(UI.prose(value, 15, UI.INK, 620))
	return col

func _cell(text: String, width: int, col: Color) -> Control:
	var l := UI.label(text, 16, col)
	l.custom_minimum_size = Vector2(width, 0)
	return l

func _chip_row(catalog: Array, selected_id: String, on_pick: Callable, prefix: String, opens_here: bool = false) -> Control:
	var wrap := HFlowContainer.new()
	wrap.add_theme_constant_override("h_separation", 6)
	wrap.add_theme_constant_override("v_separation", 6)
	for entry in catalog:
		var id := String(entry.get("id", ""))
		var b := UI.button(Draft.label_ja(catalog, id), func(): on_pick.call(id), Vector2(120, 34), 15)
		b.add_theme_color_override("font_color", UI.INK if id == selected_id else UI.DIM)
		_claim(b, "%s:%s" % [prefix, id])
		if id == selected_id and opens_here:
			_pending_focus = b
		wrap.add_child(b)
	return wrap

func _text_field(label_text: String, value: String, placeholder: String, on_change: Callable) -> Control:
	var col := UI.col(4)
	col.add_child(UI.label(label_text, 15, UI.DIM))
	var edit := LineEdit.new()
	edit.text = value
	edit.placeholder_text = placeholder
	edit.custom_minimum_size = Vector2(360, 40)
	edit.add_theme_font_size_override("font_size", 18)
	edit.text_changed.connect(func(v: String): on_change.call(v))
	col.add_child(edit)
	return col

## A name/title field with its OWN 見繕う button (#7): the label sits beside a per-field reroll so a player
## can deal a fresh name without losing a title they liked — the bulk 名を見繕う up top still fills all three.
func _identity_field(label_text: String, value: String, placeholder: String, on_change: Callable, field: String) -> Control:
	var col := UI.col(4)
	var head := UI.row()
	head.add_child(UI.grow(UI.label(label_text, 15, UI.DIM)))
	var dice := UI.button(I18n.t("party.rerollField"), func(): _reroll_field(field), Vector2(110, 30), 13)
	_claim(dice, "identity:%s" % field)
	head.add_child(dice)
	col.add_child(head)
	var edit := LineEdit.new()
	edit.text = value
	edit.placeholder_text = placeholder
	edit.custom_minimum_size = Vector2(360, 40)
	edit.add_theme_font_size_override("font_size", 18)
	edit.text_changed.connect(func(v: String): on_change.call(v))
	col.add_child(edit)
	return col

## 戻る / 次へ in the SAME place on every step — the player learns one pair of positions, not five.
func _flow_actions(back_step: String, next_step: String) -> Control:
	var row := UI.row()
	row.add_child(UI.button(I18n.t("party.back"), func(): _goto(back_step), Vector2(160, 44), 18))
	var next_button := UI.button(I18n.t("party.next"), func(): _goto(next_step), Vector2(200, 44), 18)
	next_button.disabled = _step == "bonus" and Draft.remaining(_draft) > 0
	row.add_child(next_button)
	return row

# --- io -------------------------------------------------------------------------------------------
func _asset(sub: String) -> String:
	return WorldResources.world_asset(_run.world_id if _run else _world_id, sub)

func _texture(path: String) -> Texture2D:
	return WorldResources.texture(path)   # export-safe load lives in WorldResources (IMP-053)

# Image import (playtest: "画像取り込みもコンセプトなのにない"). Opens a native file picker, and hands the
# chosen image back to `on_ref` as a data URL — the SAME storage the React build uses (the user's chosen
# format). Re-encoded to a bounded PNG so the data URL, which rides into the save, stays a sane size.
func _import_portrait(on_ref: Callable) -> void:
	var dialog := FileDialog.new()
	dialog.file_mode = FileDialog.FILE_MODE_OPEN_FILE
	dialog.access = FileDialog.ACCESS_FILESYSTEM
	dialog.filters = PackedStringArray(["*.png,*.jpg,*.jpeg,*.webp ; %s" % I18n.t("party.portrait")])
	dialog.use_native_dialog = true
	add_child(dialog)
	dialog.file_selected.connect(func(path: String):
		var data_url := _image_file_to_data_url(path)
		dialog.queue_free()
		if data_url != "":
			on_ref.call(data_url))
	dialog.canceled.connect(func(): dialog.queue_free())
	dialog.popup_centered(Vector2i(920, 640))

func _image_file_to_data_url(path: String) -> String:
	var bytes := FileAccess.get_file_as_bytes(path)
	if bytes.is_empty():
		return ""
	var ext := path.get_extension().to_lower()
	var img := Image.new()
	var err := ERR_FILE_UNRECOGNIZED
	if ext == "png":
		err = img.load_png_from_buffer(bytes)
	elif ext == "jpg" or ext == "jpeg":
		err = img.load_jpg_from_buffer(bytes)
	elif ext == "webp":
		err = img.load_webp_from_buffer(bytes)
	if err != OK:
		return ""
	var max_dim := 512
	var longest: int = max(img.get_width(), img.get_height())
	if longest > max_dim:
		var s := float(max_dim) / float(longest)
		img.resize(int(img.get_width() * s), int(img.get_height() * s), Image.INTERPOLATE_LANCZOS)
	return "data:image/png;base64,%s" % Marshalls.raw_to_base64(img.save_png_to_buffer())

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

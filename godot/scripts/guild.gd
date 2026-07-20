extends Control
## THE GUILD — a faithful port of the registration flow in src/App.tsx (townMode === "guild").
##
## Registration is STAGED: 説明 → 職業 → 来歴 → 能力 → 名前, one decision at a time, with the stepper
## always visible and 戻る/次へ in fixed places. The port had collapsed all five into ONE screen (a class
## list, six aptitude chips and a name cycler side by side) — which is the shape React deliberately moved
## away from (IMP-028: a card wall that scrolled 次へ off the screen), and it left 来歴・気質・持ち点・
## 二つ名・覚え書き with no surface at all. Those are the choices that make the adventurer the player's
## own, which is the whole premise of the game.
##
## What each step owns (and why it is its own step):
##   説明 — the guild master asks who you are before writing anything down; the hall behind him shows the
##          party you already have and the way to the roster.
##   職業 — a bounded LIST beside a stable detail pane: the cursor's calling reads into the pane
##          (signature, formation, aptitude, starting gear NAMED from the catalog — never a raw id).
##   来歴 — origin and impression, with the face the origin brings; the portrait area is reserved so the
##          pane does not reflow when the origin changes.
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
const Draft := preload("res://scripts/guild_draft.gd")
const CharacterCreation := preload("res://scripts/rules/character_creation.gd")

const STEPS := ["briefing", "class", "appearance", "bonus", "name"]
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
var _event_text: String = ""

var _pending_focus: Control = null   # where this step lands the cursor when it opens
var _claimed_focus: Control = null   # the control the LAST action wants the cursor back on
var _focus_key: String = ""
var _host: Control = null

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
		_run.start_guild()
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

	var main := UI.col(10)
	main.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(main)
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
	var background := Draft.find(_data.get("backgrounds", []), String(_draft.get("backgroundId", "")))

	var row := UI.row()
	var portrait := TextureRect.new()
	portrait.custom_minimum_size = Vector2(96, 116)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.texture = _texture(_asset("portraits/%s.png" % String(background.get("portraitKey", "gate"))))
	row.add_child(UI.card(portrait, Color(String(background.get("accentColor", "#c9a765")))))

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
		"appearance": return _appearance_step()
		"bonus": return _bonus_step()
		"name": return _name_step()
		_: return _briefing_step()

func _briefing_step() -> Control:
	var col := UI.col(10)
	var head := UI.row()
	var master := TextureRect.new()
	master.custom_minimum_size = Vector2(120, 140)
	master.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	master.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	master.texture = _texture(_asset("characters/npc-guild-master.png"))
	head.add_child(master)
	var speech := UI.col(6)
	speech.add_child(UI.label(I18n.t("party.guildMaster"), 20, UI.GOLD))
	speech.add_child(UI.prose(I18n.t("party.guildBriefing"), 18, UI.INK, 720))
	head.add_child(UI.grow(speech))
	col.add_child(head)

	var actions := UI.row()
	var start := UI.button(I18n.t("party.startRegistration"), func(): _goto("class"), Vector2(260, 46), 19)
	actions.add_child(start)
	actions.add_child(UI.button(I18n.t("party.skipBriefing"), func(): _goto("class"), Vector2(200, 46), 17))
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

	# The bounded list. Focus IS the cursor: moving onto a calling reads it into the pane beside it, so
	# the player compares by moving rather than by committing.
	var list := UI.col(2)
	for class_def in _data.get("classes", []):
		var id := String(class_def.get("id", ""))
		var b := UI.button("%s   %s" % [_class_label(id), _row_label(String(class_def.get("rowPreference", "front")))], func(): _select_class(id), Vector2(280, 34), 16)
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
	detail.add_child(_fact(I18n.t("party.aptitudeLabel"), _aptitude_line(selected.get("aptitude", {}))))
	# NAMED from the catalog — a raw id ("militia-sabre") in normal play is a gate failure.
	var gear := []
	for entry in selected.get("equipment", []):
		gear.append(Fmt.localized_catalog_name(_world, String(entry.get("id", ""))))
	detail.add_child(_fact(I18n.t("party.equipment"), " / ".join(PackedStringArray(gear))))
	body.add_child(UI.card(detail))

	col.add_child(_flow_actions("briefing", "appearance"))
	return UI.card(col)

func _appearance_step() -> Control:
	var col := UI.col(10)
	col.add_child(UI.label(I18n.t("party.chooseAppearance"), 22, UI.GOLD))

	var body := UI.row()
	col.add_child(body)

	var background := Draft.find(_data.get("backgrounds", []), String(_draft.get("backgroundId", "")))
	# The portrait area is RESERVED at a fixed size, so choosing an origin swaps the face without the
	# pane reflowing under the cursor.
	var face := UI.col(4)
	face.add_child(UI.label(I18n.t("party.portrait"), 15, UI.DIM))
	var portrait := TextureRect.new()
	portrait.custom_minimum_size = Vector2(220, 260)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.texture = _texture(_asset("portraits/%s.png" % String(background.get("portraitKey", "gate"))))
	face.add_child(UI.card(portrait, Color(String(background.get("accentColor", "#c9a765")))))
	body.add_child(face)

	var choices := UI.col(8)
	choices.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	choices.add_child(UI.label(I18n.t("party.background"), 18, UI.GOLD))
	# The cursor opens on the ORIGIN row — the decision this step leads with.
	choices.add_child(_chip_row(_data.get("backgrounds", []), String(_draft.get("backgroundId", "")), func(id: String): _select_background(id), "bg", true))
	# What this origin brings — the line the choice is actually made on.
	choices.add_child(UI.prose(String(background.get("notes", {}).get("ja", "")), 16, UI.DIM, 760))
	choices.add_child(UI.label(I18n.t("party.trait"), 18, UI.GOLD))
	choices.add_child(_chip_row(_data.get("traits", []), String(_draft.get("traitId", "")), func(id: String): _select_trait(id), "trait"))
	var reroll := UI.button(I18n.t("party.rerollOrigin"), func(): _reroll_origin(), Vector2(220, 38), 16)
	_claim(reroll, "origin:reroll")
	choices.add_child(reroll)
	body.add_child(choices)

	col.add_child(_flow_actions("class", "bonus"))
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
	var actions := _flow_actions("appearance", "name")
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
	fields.add_child(_text_field(I18n.t("party.name"), String(_draft.get("name", "")), I18n.t("party.namePlaceholder"), func(v: String): _draft["name"] = v))
	fields.add_child(_text_field(I18n.t("party.editTitle"), String(_draft.get("title", "")), I18n.t("party.titlePlaceholder"), func(v: String): _draft["title"] = v))
	col.add_child(fields)

	var notes := UI.col(4)
	notes.add_child(UI.label(I18n.t("party.notes"), 15, UI.DIM))
	var notes_edit := TextEdit.new()
	notes_edit.text = String(_draft.get("notes", ""))
	notes_edit.placeholder_text = I18n.t("party.notesPlaceholder")
	notes_edit.custom_minimum_size = Vector2(760, 96)
	notes_edit.add_theme_font_size_override("font_size", 16)
	notes_edit.text_changed.connect(func(): _draft["notes"] = notes_edit.text)
	notes.add_child(notes_edit)
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
		col.add_child(UI.label(I18n.t("party.reserveHeading"), 16, UI.GOLD))
		var reserve: Array = state().get("reserve", [])
		if reserve.is_empty():
			col.add_child(UI.label("—", 15, UI.DIM))
		for member in reserve:
			col.add_child(UI.label(String(member.get("name", "?")), 15, UI.INK))
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

func _select_background(id: String) -> void:
	_draft["backgroundId"] = id
	_focus_key = "bg:%s" % id
	_rebuild()

func _select_trait(id: String) -> void:
	_draft["traitId"] = id
	_focus_key = "trait:%s" % id
	_rebuild()

func _reroll_origin() -> void:
	Draft.reroll_origin(_draft, _data)
	_focus_key = "origin:reroll"
	_rebuild()

func _reroll_bonus() -> void:
	Draft.reroll_bonus(_draft)
	_focus_key = "bonus:reroll"
	_rebuild()

func _reroll_identity() -> void:
	Draft.reroll_identity(_draft, _data)
	_focus_key = "identity:reroll"
	_rebuild()

func _adjust(key: String, delta: int) -> void:
	Draft.adjust(_draft, key, delta)
	_focus_key = "bonus:%s:%s" % ["+" if delta > 0 else "-", key]
	_rebuild()

func _set_roster(open: bool) -> void:
	_roster_open = open
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

func _depart() -> void:
	get_tree().change_scene_to_file("res://scenes/town.tscn")

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
	return character

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
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

func _texture(path: String) -> Texture2D:
	if not FileAccess.file_exists(path):
		return null
	var img := Image.load_from_file(path)
	if img == null:
		return null
	return ImageTexture.create_from_image(img)

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

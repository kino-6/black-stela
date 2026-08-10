extends Control
## S4b vertical-slice COMBAT — now DRIVEN BY THE PORTED RULES, not a static mock. The scene loads the
## b1f-combat-victory fixture (Rook the vanguard vs. the Ash Slime — the parity-proven one-round route),
## renders the stage from that live state, and on the player's command runs the SAME GDScript combat
## rules that pass verify_parity (`CombatRound.declare_round`). The rules own game truth (the returned
## state hashes identically to the TS oracle); THIS UI owns presentation — it rebuilds the beat feel
## (damage numbers, condition bar, log) from the resolved-state delta, exactly the split the parity
## harness assumes ("beats are presentation the target UI rebuilds"). Controller-first, no pointer.
##
## Scope note: this route wins in round 1, before any enemy turn — which is all that is ported so far
## (enemy turn / multi-round / room-entry encounters are the next port). The fixture is chosen to stay
## strictly inside proven-ported territory.

const CombatRound := preload("res://scripts/rules/combat_round.gd")
const I18n := preload("res://scripts/i18n.gd")
const UIKit := preload("res://scripts/town/ui_kit.gd")
const CommandMenu := preload("res://scripts/combat/command_menu.gd")
const Techniques := preload("res://scripts/rules/techniques.gd")
const Encounter := preload("res://scripts/encounter.gd")
const ConfigPanel := preload("res://scripts/config_panel.gd")
const WorldResources := preload("res://scripts/world_resources.gd")
const CombatPartyHud := preload("res://scripts/combat/combat_party_hud.gd")
const CombatPlayback := preload("res://scripts/combat/combat_playback.gd")
const CombatStage := preload("res://scripts/combat/combat_stage.gd")
const CombatHelpers := preload("res://scripts/rules/combat_helpers.gd")
const Fmt := preload("res://scripts/town_format.gd")

const BG := Color("0b0d09")
const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const DIM := Color("9a927e")
const BAD := Color("c96a5a")
const HURT := Color("d98a5a")
const OK := Color("9db06a")

var _state: Dictionary = {}
var _world: Dictionary = {}
var _engine: Dictionary = {}

# Live UI handles updated during playback.
var _damage_layer: Control
var _log_label: Label
var _cmd_panel: PanelContainer
var _strip_box: VBoxContainer = null
var _party_slots: Dictionary = {}   # member id -> { "bar": ProgressBar, "label": Label }
var _stage_layer: Control = null
var _enemy_marks: Dictionary = {}   # groupId -> the mark node, so a beat can flash the right creature
var _actor_figure: Node = null       # the hero-scale spotlight figure, swapped to the acting member per beat
var _stage_band: Rect2 = Rect2()     # cached enemy-band layout so one group's mark can be re-rendered mid-playback
var _stage_slot_w: float = 0.0
var _stage_group_total: int = 0
var _stage_group_index: Dictionary = {}  # groupId -> its slot index
var _party_before: Dictionary = {}   # memberId -> HP before the round, for the animated party-damage read (T22)
var _pb_before_groups: Array = []    # deep copy of the enemy groups BEFORE the round — playback re-applies
									 # each beat's damage to THIS via the real damage_group rule (front-first,
									 # overkill wasted), so the drained pack matches the post-round state exactly
									 # instead of a pooled reconstruction that over-counts kills (playtest 2026-08-06:
									 # 敵が2体まで減ってから次ターンで5体に戻る).
const HURT_ALLY := Color("8fb6e0")   # cooler tint for damage numbers landing on a party member (vs HURT on enemies)
var _enemy_stage_rect: Rect2 = Rect2()
var _busy: bool = false
var _resolved: bool = false
var _cmd_box: VBoxContainer = null
var _actor_index: int = 0            # which adventurer is being given orders (front-first)
var _stage: String = "command"       # command | skill | spell | item | target-group | target-ally
var _pending: Dictionary = {}        # the order being assembled for the current actor
var _declared: Array = []            # orders collected so far this round
var _last_round: Array = []          # the last declared round, for リピート
var _auto: bool = false              # オート: keep resolving until the fight ends or danger appears
var _auto_strategy: String = "attack"   # 攻撃オート (attack) vs 守備オート (ward/heal) — set when the loop starts
var _run: Node = null   # the shared-state autoload when in continuous play; null under capture
var _world_id: String = "default"

func _ready() -> void:
	# Wait one frame so full-rect layout has run and `size` is the real 1920x1080 viewport.
	await get_tree().process_frame
	_load_data()
	_build()

# --- data (read directly, so the scene also renders under the headless capture SceneTree where the
#     autoloads are not started; mirrors verify_parity's loader) ------------------------------------
func _load_data() -> void:
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_world = _run.world
		_engine = _run.engine
		_state = _run.state
		# Launched into combat without a live fight (or straight to combat.tscn) — synthesize the slice
		# encounter so the party the dungeon carried in has something to fight.
		if typeof(_state.get("combat", null)) != TYPE_DICTIONARY:
			Encounter.begin(_state, _world, _party_room_id(), Encounter.first_enemy_id(_world_id))
	else:
		# Capture fallback: the 6-member exploration party + the injected slice encounter, no autoload.
		_world = _read_json("res://data/worlds/default.json").get("world", {})
		_engine = _read_json("res://data/engine-data.json")
		_state = (_read_json("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary).duplicate(true)
		Encounter.begin(_state, _world, _party_room_id(), Encounter.first_enemy_id(_world_id))

func _party_room_id() -> String:
	var pos: Variant = _state.get("position", null)
	return pos.get("roomId", "room.b1f.002") if typeof(pos) == TYPE_DICTIONARY else "room.b1f.002"

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("[combat] missing data file: %s" % path)
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

# --- build ----------------------------------------------------------------------------------------
func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var combat: Dictionary = _state.get("combat", {})
	var groups: Array = combat.get("enemyGroups", [])
	var group: Dictionary = groups[0] if groups.size() > 0 else {}

	# --- Enemy stage: ONE MARK PER GROUP, spread across the stage (CombatEnemyStage.tsx) ---
	# Every group is its own creature on the stage with its own name and condition bar; targeting is
	# done BY POINTING AT THE CREATURE (a reticle rides the chosen one), never by picking a list row.
	_stage_layer = Control.new()
	_stage_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_stage_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_stage_layer)
	_enemy_stage_rect = Rect2(0, 60, size.x, 540)
	_rebuild_stage()

	# A layer above the stage for floating damage / defeat flourishes.
	_damage_layer = Control.new()
	_damage_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_damage_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_damage_layer)

	# --- Log ticker (one line, above the formation band) ---
	_log_label = _label("%s がこちらを見ている。" % _enemy_ja(group), 18, INK)
	_log_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_log_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_log_label.offset_top = 578
	add_child(_log_label)

	# --- 3+3 formation band (rendered from the live party) ---
	var strip := PanelContainer.new()
	strip.position = Vector2(0, 640)
	strip.custom_minimum_size = Vector2(size.x, 330)
	strip.add_theme_stylebox_override("panel", _panel_style(Color("11140dcc")))
	add_child(strip)
	_strip_box = VBoxContainer.new()
	strip.add_child(_strip_box)
	_rebuild_party_strip()

	# --- Command window overlay (controller-first) ---
	_cmd_panel = PanelContainer.new()
	_cmd_panel.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	_cmd_panel.offset_top = -620
	_cmd_panel.offset_left = size.x - 520
	_cmd_panel.offset_right = -40
	_cmd_panel.offset_bottom = -40
	_cmd_panel.add_theme_stylebox_override("panel", _panel_style(Color("1b1e14f2"), GOLD))
	add_child(_cmd_panel)
	_cmd_box = VBoxContainer.new()
	_cmd_box.add_theme_constant_override("separation", 8)
	_cmd_panel.add_child(_cmd_box)
	_rebuild_command_menu()

# F = 全員でかかる / All-out (matches the React All-out key). "confirm" needs no handling here — a
# DIRECT target selection (playtest 2026-07-29, asked repeatedly): while aiming at an enemy, ←/→ move the
# reticle straight onto the next creature — no tabbing to a ◀/▶ button and back. Focus stays on 攻撃, so
# Enter fires at whatever the reticle is on. Handled in _input (before GUI focus nav) so the arrows move the
# aim instead of moving focus between buttons.
func _input(event: InputEvent) -> void:
	if _busy or _resolved or _stage != "target-group":
		return
	if event.is_action_pressed("ui_left"):
		_cycle_target(-1)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_right"):
		_cycle_target(1)
		get_viewport().set_input_as_handled()

# focused Button fires its own `pressed` on ui_accept.
func _unhandled_input(event: InputEvent) -> void:
	if _busy or _resolved:
		return
	if event.is_action_pressed("auto"):
		_on_attack_pressed()
	elif event.is_action_pressed("attack_auto"):
		_on_toggle_auto("attack")
	elif event.is_action_pressed("defense_auto"):
		_on_toggle_auto("defense")
	elif event.is_action_pressed("cancel"):
		_menu_back()
		get_viewport().set_input_as_handled()

## Test seam for the UX-parity gate: drive the screen from a specific state (an afflicted, wounded
## party) so the status pips and down-state are asserted rather than assumed.
func set_state_override(patched: Dictionary) -> void:
	_run = null
	var combat: Variant = _state.get("combat", null)
	_state = patched.duplicate(true)
	if typeof(_state.get("combat", null)) != TYPE_DICTIONARY and typeof(combat) == TYPE_DICTIONARY:
		_state["combat"] = combat      # keep the fight the scene was built around
	_state["phase"] = "combat"
	_actor_index = 0
	_stage = "command"
	_pending = {}
	_rebuild_stage()
	_rebuild_party_strip()
	_rebuild_command_menu()

## Test seam for the UX-parity gate: force a menu stage so the target/technique surfaces are asserted.
func set_ui_state(ui: Dictionary) -> void:
	if ui.has("tempo_repeat"):
		_last_round = [{"actorId": "seed", "action": "attack"}]
	if ui.has("tempo_auto"):
		_auto = true
	if ui.has("stage"):
		_stage = String(ui["stage"])
		if _stage == "target-group":
			var actors := _actors()
			if not actors.is_empty():
				_pending = {"actorId": actors[_actor_index].get("id", ""), "action": "attack"}
	# Any ui-state change must repaint — a seam that sets state without rebuilding proves nothing.
	_rebuild_stage()
	_rebuild_command_menu()

# --- per-actor order collection --------------------------------------------------------------------
# The adventurers who can still act, front row first — the order the player gives commands in.
func _actors() -> Array:
	var front := []
	var back := []
	for member in _state.get("party", []):
		if int(member.get("hp", 0)) <= 0 or member.get("injury", null) != null:
			continue
		if (member.get("status", []) as Array).has("sleep"):
			continue
		if String(member.get("row", "front")) == "front":
			front.append(member)
		else:
			back.append(member)
	front.append_array(back)
	return front

func _rebuild_command_menu() -> void:
	if _cmd_box == null:
		return
	for child in _cmd_box.get_children():
		child.queue_free()

	var actors := _actors()
	if actors.is_empty() or _actor_index >= actors.size():
		_cmd_box.add_child(UIKit.label(I18n.t("play.combatCommands"), 20, GOLD))
		var go := _command_button(I18n.t("tempo.allOut"), "F")
		go.pressed.connect(_on_attack_pressed)
		_cmd_box.add_child(go)
		go.call_deferred("grab_focus")
		return

	var actor: Dictionary = actors[_actor_index]
	var built: Dictionary = CommandMenu.build({
		"actor": actor,
		"stage": _stage,
		"loadout": _loadout_for(actor),
		"party": _state.get("party", []),
		"groups": _combat().get("enemyGroups", []),
		"inventory": _state.get("inventory", []),
		"engine": _engine,
		"world": _world,
		"choose": func(kind, payload): _on_menu_choice(kind, payload),
		"back": func(): _menu_back(),
		"target_group_id": _target_group_id(),
		"cycle_target": func(delta): _cycle_target(delta),
		"enemy_name": func(group): return _enemy_ja(group),
		# Inventory items carry their BASE (English) name; every screen localizes via item id (the market
		# does). The 道具 menu used item.name directly and leaked "Healing Draught" into JA combat — resolve
		# it through the same catalog helper so the flask reads 治癒の水薬 here too (playtest 2026-07-31).
		"item_name": func(item_id): return Fmt.localized_catalog_name(_world, item_id)
	})
	_cmd_box.add_child(built["control"])

	# The round-level commands act for the WHOLE PARTY, not the actor whose turn it is — a different scope
	# from the per-actor menu above. A divider plus their own subdued sub-panel keeps the two from reading
	# as one flat list (playtest 2026-07-31 IMP-057), and each button's hint sits UNDER it as a caption
	# rather than between buttons as an equal-weight line.
	_cmd_box.add_child(HSeparator.new())
	var round_box := VBoxContainer.new()
	round_box.add_theme_constant_override("separation", 3)
	# 全員でかかる stays reachable: the one-press round for when there is nothing to decide.
	round_box.add_child(UIKit.label(I18n.t("play.combatCommands"), 13, DIM))
	var allout := _command_button(I18n.t("tempo.allOut"), "F")
	allout.pressed.connect(_on_attack_pressed)
	round_box.add_child(allout)
	round_box.add_child(_caption(I18n.t("tempo.allOutHint")))
	# リピート — repeat the LAST declared round. Unavailable until one has been given, and it says so
	# rather than sitting dead (tempo.repeatRoundUnavailable).
	var repeat := _command_button(I18n.t("tempo.repeatRound") if not _last_round.is_empty() else I18n.t("tempo.repeatRoundUnavailable"))
	repeat.disabled = _last_round.is_empty()
	repeat.pressed.connect(_on_repeat)
	round_box.add_child(repeat)
	if not _last_round.is_empty():
		round_box.add_child(_caption(I18n.t("tempo.repeatRoundHint")))
	# 攻撃オート / 守備オート — two auto-battle loops. Attack presses the front line (stops at danger);
	# guard wards/cures/heals first and pushes through. Pressing a running loop stops it.
	var attack_auto := _command_button(I18n.t("tempo.stop") if (_auto and _auto_strategy == "attack") else I18n.t("tempo.autoAttack"), "R")
	attack_auto.pressed.connect(_on_toggle_auto.bind("attack"))
	round_box.add_child(attack_auto)
	var defense_auto := _command_button(I18n.t("tempo.stop") if (_auto and _auto_strategy == "defense") else I18n.t("tempo.autoDefense"), "G")
	defense_auto.pressed.connect(_on_toggle_auto.bind("defense"))
	round_box.add_child(defense_auto)
	var retreat := _command_button(I18n.t("play.retreat"))
	retreat.pressed.connect(_on_retreat)
	round_box.add_child(retreat)
	var round_panel := PanelContainer.new()
	round_panel.add_theme_stylebox_override("panel", _panel_style(Color("0f120bcc"), Color("32391f")))
	round_panel.add_child(round_box)
	_cmd_box.add_child(round_panel)

	var focus: Variant = built["focus"]
	if focus != null:
		(focus as Control).call_deferred("grab_focus")
	else:
		allout.call_deferred("grab_focus")

## The technique an item performs, or "" for a plain consumable (§9.4c).
func _item_technique_id(item_id: String) -> String:
	for item in _state.get("inventory", []):
		if String((item as Dictionary).get("id", "")) == item_id:
			return String((item as Dictionary).get("useTechnique", ""))
	return ""

func _loadout_for(actor: Dictionary) -> Array:
	var vocation: Variant = actor.get("vocation", null)
	var learned: Array = (vocation as Dictionary).get("loadout", []) if typeof(vocation) == TYPE_DICTIONARY else []
	if learned.is_empty():
		# The class line, world-resolved (a themed world may re-skin it); base worlds get engine.classAbilities.
		for entry in Techniques.class_line(String(actor.get("classId", "")), _engine, _world):
			if int(actor.get("level", 1)) >= int((entry as Dictionary).get("level", 0)):
				learned.append((entry as Dictionary).get("spellId", ""))
	# §9.5: filtered against the exported CATALOG, not a four-entry cost literal. That literal silently
	# removed every technique §9.4 authored from the menu — a Knight had a full line and an empty 特技 list.
	var catalog: Dictionary = Techniques._resolve_technique_catalog(_engine, _world)
	var out := []
	for id in learned:
		if catalog.has(String(id)) and String((catalog[String(id)] as Dictionary).get("kind", "")) != "passive" and not ((catalog[String(id)] as Dictionary).get("tags", []) as Array).has("firearm"):
			out.append(String(id))
	var equipment: Dictionary = actor.get("equipment", {})
	for equipped in equipment.values():
		if typeof(equipped) != TYPE_DICTIONARY:
			continue
		var catalog_item: Variant = _equipment_entry(String((equipped as Dictionary).get("id", "")))
		if typeof(catalog_item) != TYPE_DICTIONARY:
			continue
		for id in (catalog_item as Dictionary).get("grantsTechniques", []):
			var technique := String(id)
			if catalog.has(technique) and String((catalog[technique] as Dictionary).get("kind", "")) != "passive" and not out.has(technique):
				out.append(technique)
	return out

func _equipment_entry(item_id: String) -> Variant:
	for entry in _world.get("equipment", []):
		if typeof(entry) == TYPE_DICTIONARY and String((entry as Dictionary).get("id", "")) == item_id:
			return entry
	return null

func _on_menu_choice(kind: String, payload: Dictionary) -> void:
	if _busy or _resolved:
		return
	var actors := _actors()
	if _actor_index >= actors.size():
		return
	var actor: Dictionary = actors[_actor_index]
	match kind:
		"stage":
			_stage = String(payload["stage"])
		"defend":
			_commit({"actorId": actor.get("id", ""), "action": "defend"})
			return
		"attack":
			_pending = {"actorId": actor.get("id", ""), "action": "attack"}
			_stage = "target-group"
		"technique":
			var spell_id := String(payload["spellId"])
			_pending = {"actorId": actor.get("id", ""), "action": "cast", "spellId": spell_id}
			# §9.5: derived from the technique's declared SCOPE, not from `id == "heal"`. That literal
			# meant every ally-target technique except heal asked for an ENEMY and then healed nobody,
			# and a self/party technique asked a question it never needed.
			var targeting := CommandMenu.technique_targeting(spell_id, _engine, _world)
			if targeting == "none":
				_commit(_pending)
				return
			_stage = "target-ally" if targeting == "ally" else "target-group"
		"item":
			var item_id := String(payload["itemId"])
			_pending = {"actorId": actor.get("id", ""), "action": "use_item", "itemId": item_id}
			# §9.4c: an item may perform a technique, so it follows that technique's scope — a thrown
			# flask asks for an enemy, a charm asks for nobody. Plain consumables stay ally-targeted.
			var item_technique := _item_technique_id(item_id)
			var item_targeting := CommandMenu.technique_targeting(item_technique, _engine, _world) if item_technique != "" else "ally"
			if item_targeting == "none":
				_commit(_pending)
				return
			_stage = "target-ally" if item_targeting == "ally" else "target-group"
		"target-group":
			_pending["targetGroupId"] = String(payload["targetGroupId"])
			_commit(_pending)
			return
		"target-ally":
			_pending["targetCharacterId"] = String(payload["targetCharacterId"])
			_commit(_pending)
			return
	_rebuild_command_menu()

# Move the aim along the stage; the reticle follows because the stage is rebuilt from the same value.
func _cycle_target(delta: int) -> void:
	var living := []
	for group in _combat().get("enemyGroups", []):
		if int(group.get("count", 0)) > 0:
			living.append(String(group.get("id", "")))
	if living.is_empty():
		return
	var index := living.find(_target_group_id())
	if index < 0:
		index = 0
	_pending["targetGroupId"] = living[(index + delta + living.size()) % living.size()]
	_rebuild_stage()
	_rebuild_command_menu()

func _commit(order: Dictionary) -> void:
	_declared.append(order)
	_pending = {}
	_stage = "command"
	_actor_index += 1
	if _actor_index >= _actors().size():
		var orders := _declared.duplicate(true)
		_declared = []
		_actor_index = 0
		_resolve_round_with(orders, true)
		return
	_rebuild_command_menu()

# Esc backs out exactly one stage: target -> command, command -> the previous adventurer.
func _menu_back() -> void:
	if _stage != "command":
		_stage = "command"
		_pending = {}
		_rebuild_command_menu()
		return
	if _actor_index > 0:
		_actor_index -= 1
		_declared.pop_back()
		_rebuild_command_menu()

func _log_line(text: String) -> void:
	if _log_label:
		_log_label.text = text

# リピート: re-issue the last round, dropping orders whose actor can no longer act.
func _on_repeat() -> void:
	if _busy or _resolved or _last_round.is_empty():
		return
	var still_able := {}
	for member in _actors():
		still_able[String(member.get("id", ""))] = true
	var orders := []
	for order in _last_round:
		if still_able.has(String(order.get("actorId", ""))):
			orders.append(order)
	if orders.is_empty():
		return
	_resolve_round_with(orders, true)

# オート stops itself on the conditions the React tempo guards use: the fight ending, or the party
# taking real damage (tempo.autoStoppedDanger) — it never plays a losing fight out on the player.
# Pressing a running auto (or the OTHER auto) stops it; otherwise start the loop in the requested
# strategy. 攻撃オート presses the front line and bails at danger; 守備オート wards/heals and pushes through.
func _on_toggle_auto(strategy: String = "attack") -> void:
	if _auto:
		_auto = false
		_rebuild_command_menu()
		return
	_auto_strategy = strategy
	_auto = true
	_rebuild_command_menu()
	_run_auto()

func _run_auto() -> void:
	while _auto and not _busy and not _resolved and _state.get("phase", "") == "combat":
		var orders := _defense_auto_actions() if _auto_strategy == "defense" else _all_out_actions()
		if orders.is_empty():
			break
		# T15: play the round out ANIMATED even under オート — the damage number lands on the target and the
		# HP bars drain as it resolves. Auto used to skip all of that (animated=false), so the moves happened
		# but "誰が何にどれだけ / HPバー更新" was invisible; the beat-by-beat goal was not actually met.
		await _resolve_round_with(orders, true)
		# 攻撃オート hands control back at danger; 守備オート keeps healing through it (a wipe ends the fight
		# regardless, via the phase check below).
		if _auto_strategy == "attack" and _party_in_danger():
			_auto = false
			_log_line(I18n.t("tempo.autoStoppedDanger"))
			break
	if _state.get("phase", "") != "combat":
		_auto = false
	_rebuild_command_menu()
	# オート kept the command panel HIDDEN during its rounds (playback shows it only when `not _auto`, so the
	# menu never flashes between auto rounds). When オート STOPS on its own — danger detected — and the fight
	# is still going, control returns to the player, but the panel was never re-shown: the turn indicator read
	# "次の行動を選ぶ" over an empty dock (playtest 2026-08-06). Show and focus it here now that _auto is false.
	if _cmd_panel and not _busy and not _resolved and _state.get("phase", "") == "combat":
		_cmd_panel.show()
		var b := _first_command_button()
		if b:
			b.grab_focus()

# "Danger" = anyone below a third of their HP, or already wounded.
func _party_in_danger() -> bool:
	for member in _state.get("party", []):
		if member.get("injury", null) != null:
			return true
		var max_hp := int(member.get("maxHp", 1))
		if max_hp > 0 and float(member.get("hp", 0)) / float(max_hp) < 0.34:
			return true
	return false

func _on_retreat() -> void:
	if _busy or _resolved:
		return
	var SliceRules := preload("res://scripts/rules/slice_rules.gd")
	var result: Dictionary = SliceRules.resolve(_state, {"type": "retreat"}, _world, _engine)
	_state = result.get("state", _state)
	if _run:
		_run.state = _state
	get_tree().change_scene_to_file("res://scenes/dungeon.tscn")

func _on_attack_pressed() -> void:
	if _busy or _resolved:
		return
	_resolve_round(true)

# --- the round: ONE call into the ported rules, then presentation rebuilt from the state delta -----
func _resolve_round_with(orders: Array, animated: bool) -> void:
	if orders.is_empty():
		return
	_busy = true
	if _cmd_panel:
		_cmd_panel.hide()
	var before := _enemy_snapshot()
	_pb_before_groups = _combat().get("enemyGroups", []).duplicate(true)   # real groups, for the playback drain
	_party_before = _snapshot_party()   # HP before the enemy turn, so playback can animate each member's loss (T22)
	_last_round = orders.duplicate(true)
	var result := CombatRound.declare_round(_state, _world, orders, _engine)
	var events: Array = result.get("events", [])
	_state = result.get("state", _state)
	if _run:
		_run.state = _state
	await _playback(before, events, animated)
	_busy = false
	_actor_index = 0
	_stage = "command"
	_declared = []
	_rebuild_command_menu()

func _resolve_round(animated: bool) -> void:
	_busy = true
	if _cmd_panel:
		_cmd_panel.hide()

	var before := _enemy_snapshot()
	_pb_before_groups = _combat().get("enemyGroups", []).duplicate(true)   # real groups, for the playback drain
	_party_before = _snapshot_party()   # HP before the enemy turn, so playback can animate each member's loss (T22)
	var actions := _all_out_actions()
	if actions.is_empty():
		_busy = false
		return

	# The round plays out member-by-member inside _playback (each beat narrates the actor's blow THEN lands
	# its damage), so the fight has weight and the player can read what happened instead of the aggregate
	# one-flash jump to the victory screen (playtest IMP-064: 「一瞬で遷移して知見がたまらない」). The old
	# upfront _narrate_all_out pass fired every "斬りかかる" before any damage, desyncing action from number;
	# the per-beat narration below keeps each verb next to its own popup.
	var result := CombatRound.declare_round(_state, _world, actions, _engine)
	var events: Array = result.get("events", [])
	_state = result.get("state", _state)
	if _run:
		_run.state = _state   # persist the resolved state back to the shared run

	await _playback(before, events, animated)
	_busy = false

# Past-tense action verb for a member's blow, narrated a beat before its damage lands. Stable per actor
# (a hash of the name) so a given adventurer always swings the same way — it reads as their style, not
# random flavour — with a distinct line for a crit. This is presentation copy; the real numbers come from
# the beat, not from here.
const _ATTACK_VERBS := ["切りかかった", "斬り込んだ", "突き進んだ", "打ちかかった"]
func _attack_verb(actor: String, crit: bool) -> String:
	if crit:
		return "会心の一撃を叩き込んだ"
	if actor == "":
		return "攻撃した"
	return _ATTACK_VERBS[abs(actor.hash()) % _ATTACK_VERBS.size()]

# Build one attack per living member at the first living enemy group (the slice's all-out round).
func _all_out_actions() -> Array:
	var group_id := _first_living_group_id()
	if group_id == "":
		return []
	var actions := []
	for member in _state.get("party", []):
		if int(member.get("hp", 0)) > 0:
			actions.append({
				"action": "attack",
				"actorId": member.get("id", ""),
				"targetGroupId": group_id,
			})
	return actions

# 守備オート: the GDScript mirror of tempo.chooseDefensiveRoundActions. Per able member (alive, not
# injured, not asleep), in priority order — ward, cure an ally's affliction, heal the worst-hurt
# (technique or item), a back-row member defends, else attack. Recovery TARGETS are any living ally
# (including a sleeper, who most needs the heal). Emits only engine-resolved actions, so no parity mirror.
func _defense_auto_actions() -> Array:
	var group_id := _first_living_group_id()
	if group_id == "":
		return []
	var catalog: Dictionary = Techniques._resolve_technique_catalog(_engine, _world)
	var actors := []
	var living := []
	for member in _state.get("party", []):
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null:
			living.append(member)
			if not (member.get("status", []) as Array).has("sleep"):
				actors.append(member)
	if actors.is_empty():
		return []

	var has_standing_front := false
	var worst: Dictionary = {}
	var worst_ratio := 2.0
	var someone_hurt := false
	var afflicted: Dictionary = {}
	var warded := {}
	for member in living:
		if String(member.get("row", "")) == "front":
			has_standing_front = true
		var ratio := float(int(member.get("hp", 0))) / maxf(1.0, float(int(member.get("maxHp", 1))))
		if ratio < worst_ratio:
			worst_ratio = ratio
			worst = member
		if int(member.get("hp", 0)) <= ceili(float(int(member.get("maxHp", 0))) * 0.5):
			someone_hurt = true
		for status in member.get("status", []):
			if afflicted.is_empty() and String(status) in ["poison", "fear", "silence", "sleep"]:
				afflicted = member
		if (member.get("status", []) as Array).has("ward"):
			warded[String(member.get("id", ""))] = true

	var actions := []
	for member in actors:
		var mp := int(member.get("mp", 0))
		var ward_id := ""
		var cure_id := ""
		var heal_id := ""
		var heal_amount := -1
		for id in _loadout_for(member):
			var definition: Dictionary = catalog.get(String(id), {})
			if definition.is_empty() or mp < int((definition.get("cost", {}) as Dictionary).get("mp", 0)):
				continue
			for effect in definition.get("effects", []):
				var kind := String((effect as Dictionary).get("kind", ""))
				if kind == "ward" and ward_id == "":
					ward_id = String(id)
				elif kind == "cure" and cure_id == "":
					cure_id = String(id)
				elif kind == "heal" and String(definition.get("target", "")) != "enemyGroup":
					var amount := int((effect as Dictionary).get("amount", 0))
					if amount > heal_amount:
						heal_amount = amount
						heal_id = String(id)
		# 1. Ward.
		if ward_id != "":
			var ward_def: Dictionary = catalog.get(ward_id, {})
			var covers := []
			if String(ward_def.get("target", "")) == "party":
				for m in living:
					covers.append(String(m.get("id", "")))
			else:
				covers.append(String(member.get("id", "")))
			var needs := false
			for cid in covers:
				if not warded.has(cid):
					needs = true
			if needs:
				for cid in covers:
					warded[cid] = true
				actions.append(_cast_order(member, ward_id, member))
				continue
		# 2. Cure.
		if cure_id != "" and not afflicted.is_empty():
			actions.append(_cast_order(member, cure_id, afflicted))
			continue
		# 3. Heal (technique, else item).
		if someone_hurt and not worst.is_empty():
			if heal_id != "":
				actions.append(_cast_order(member, heal_id, worst))
				continue
			var potion := _first_healing_item_id()
			if potion != "":
				actions.append({"action": "use_item", "actorId": member.get("id", ""), "itemId": potion, "targetCharacterId": worst.get("id", "")})
				continue
		# 4. Defend (back-row behind a standing front).
		if String(member.get("row", "")) != "front" and has_standing_front:
			actions.append({"action": "defend", "actorId": member.get("id", "")})
			continue
		# 5. Attack.
		actions.append({"action": "attack", "actorId": member.get("id", ""), "targetGroupId": group_id})
	return actions

# A cast order targeted per the technique's scope (ally → a chosen ally; self/party → no target).
func _cast_order(member: Dictionary, technique_id: String, ally: Dictionary) -> Dictionary:
	var order := {"action": "cast", "actorId": member.get("id", ""), "spellId": technique_id}
	if Techniques.targeting(technique_id, _engine, _world) == "ally":
		order["targetCharacterId"] = ally.get("id", "")
	return order

func _first_healing_item_id() -> String:
	for item in _state.get("inventory", []):
		if String((item as Dictionary).get("kind", "")) == "healing" and int((item as Dictionary).get("quantity", 0)) > 0:
			return String((item as Dictionary).get("id", ""))
	return ""

# Rebuild the beat feel from before/after: HP removed per group, defeats, then the rewards event.
func _playback(before: Dictionary, events: Array, animated: bool) -> void:
	# T15: land a damage number on EACH struck target (not one aggregate on the first group), draining that
	# creature's bar as it lands — reconstructed per-group from the before-snapshot. "誰が" (which member)
	# needs per-hit beats the rules do not emit yet; "何に / どれだけ" + the bars are covered here.
	var struck := []   # [{gid, removed, x_frac, name, wiped}] in stage order
	for gid in before:
		var snap: Dictionary = before[gid]
		var removed := int(snap.get("hp", 0)) - _group_hp_by_id(String(gid))
		if removed > 0:
			struck.append({"gid": String(gid), "removed": removed, "x_frac": float(snap.get("x_frac", 0.5)), "name": String(snap.get("name_ja", snap.get("name", ""))), "before": int(snap.get("hp", 0))})
	struck.sort_custom(func(a, b): return a["x_frac"] < b["x_frac"])

	var played_party_beat := false   # P7: did the beats drain the ally bars per-beat? (then don't re-animate after)
	if animated:
		var beats := _round_beats(events)
		if not beats.is_empty():
			# Per-MEMBER beats (誰が→何に→どれだけ): narrate the actor's completed blow, THEN land the number
			# on the struck creature and drain that group's bar. Two steps, in that order, so the past-tense
			# verb and its damage popup read together (playtest desync feedback).
			# Re-apply each beat's damage to the REAL pre-round groups with the SAME rule the fight used
			# (damage_group: front-first, overkill wasted) so the drained pack matches the post-round state
			# EXACTLY — not a pooled reconstruction that over-counts kills then snaps back at round end
			# (playtest 2026-08-06: 敵が2体まで減って次ターンで5体に戻る).
			var pb_groups: Array = _pb_before_groups.duplicate(true)
			var party_running := {}   # P7: member id -> running HP, so the ally bar drains as the enemy beats land
			for mid0 in _party_before:
				party_running[mid0] = int(_party_before[mid0])
			for beat in beats:
				# P7: enemy→party beats (added in combat_round.gd) drain the STRUCK MEMBER's bar during playback,
				# not in one snap after the round — the ally bars now visibly fall with each blow.
				var member_id := String((beat as Dictionary).get("targetMemberId", ""))
				if member_id != "":
					played_party_beat = true
					var mdmg := int((beat as Dictionary).get("damage", 0))
					var hit_member := _member_by_id(member_id)
					var mname := String(hit_member.get("name", ""))
					var attacker := _enemy_ja(_group_by_id(String((beat as Dictionary).get("attackerGroupId", ""))))
					_set_log("%sの攻撃！" % attacker)
					await get_tree().create_timer(0.2).timeout
					_spawn_member_damage(member_id, mdmg)
					party_running[member_id] = maxi(0, int(party_running.get(member_id, 0)) - mdmg)
					_drain_member_bar(hit_member, int(party_running[member_id]))
					_set_log("%sに%dダメージ！" % [mname, mdmg])
					await get_tree().create_timer(0.32).timeout
					continue
				var gid := String((beat as Dictionary).get("targetGroupId", ""))
				var dmg := int((beat as Dictionary).get("damage", 0))
				var actor := String((beat as Dictionary).get("actorName", ""))
				var live_group := _group_by_id(gid)   # localized name (was English "Spore Gnat")
				var target_name := _enemy_ja(live_group)
				if target_name.is_empty():
					# group already defeated/dropped this round → fall back to the pre-round snapshot's localized name
					target_name = String((before.get(gid, {}) as Dictionary).get("name_ja", ""))
				var crit := bool((beat as Dictionary).get("crit", false))
				# Spotlight the acting member at hero scale so WHO is striking reads during playback (T24).
				var acting := _member_by_name(actor)
				if not acting.is_empty():
					_set_spotlight_member(acting)
				# 1) the action, past tense ("リオが棘虫に切りかかった。") — wording mirrors React's beat.hit
				# A technique/spell beat names no melee verb (the 特技 was already named at the command); a basic
				# swing keeps its verb. Both then land the number and drain the bar below (playtest 2026-08-05).
				var shot_index := int((beat as Dictionary).get("shotIndex", 0))
				var is_gun := bool((beat as Dictionary).get("firearm", false))
				if bool((beat as Dictionary).get("technique", false)):
					_set_log("%sが%sを狙った。" % [actor, target_name])
				elif is_gun:
					# A gun shot reads as fire, not a swing. Only the FIRST round of a burst prints the verb; the
					# follow-up rounds just land their numbers so a spray reads as one action, not a spam of lines.
					if shot_index == 0:
						_set_log("%sが%sを撃った。" % [actor, target_name])
				else:
					_set_log("%sが%sに%s。" % [actor, target_name, _attack_verb(actor, crit)])
				await get_tree().create_timer(0.24 if shot_index == 0 else 0.08).timeout
				# 2) the damage: floating number ON the creature + its bar drains + a popup-style line with ！
				_pop_enemy_damage(gid, dmg, crit)
				pb_groups = CombatHelpers.damage_group(pb_groups, gid, dmg)
				_redraw_enemy_group(pb_groups, gid)
				_set_log("%sに%dダメージ！" % [target_name, dmg])
				await get_tree().create_timer(0.34 if shot_index == 0 else 0.16).timeout
		else:
			# Fallback (no beats): per-GROUP reconstruction from before/after.
			for hit in struck:
				var is_crit: bool = int(hit["removed"]) >= int(hit["before"]) * 0.6
				_spawn_damage_number_at(int(hit["removed"]), float(hit["x_frac"]), is_crit)
				_redraw_enemy_group(_combat().get("enemyGroups", []), String(hit["gid"]))   # drain from the REAL post-round state
				_set_log("%s に %d ダメージ。" % [String(hit["name"]), int(hit["removed"])])
				await get_tree().create_timer(0.32).timeout

	# The bars drain to their post-round HP.
	_rebuild_stage()

	# Defeated groups get the 撃破 flourish + a line each.
	for hit in struck:
		if _group_hp_by_id(String(hit["gid"])) <= 0:
			_set_log("%s を撃破！" % String(hit["name"]))
			if animated:
				_spawn_defeat_flourish()
				await get_tree().create_timer(0.4).timeout
	if struck.is_empty():
		_set_log("%s の攻撃。" % _acting_name())

	var rewards := _find_event(events, "combat_rewards")
	var wiped := _find_event(events, "party_wiped")

	# The enemy turn already ran inside declare_round; reflect its damage on the party strip. A member who
	# lost HP gets a floating number over their card and an ANIMATED bar drain (main fill + trailing red
	# chip), so the party no longer "silently dies" — the blow that hurt them reads (T22). No screen shake.
	var party_hit := false
	if rewards.is_empty():
		for member in _state.get("party", []):
			var mid := String(member.get("id", ""))
			var loss := int(_party_before.get(mid, int(member.get("hp", 0)))) - int(member.get("hp", 0))
			if loss > 0:
				party_hit = true
				break
	# If the enemy→party beats already drained the ally bars per-blow (P7), do NOT re-animate here — just sync
	# each bar to its true post-round value (no second popup, no "敵の反撃" banner). The animated path below is
	# the fallback for when no per-member beats were emitted.
	if party_hit and animated and not played_party_beat:
		_set_log("敵の反撃！")
		await get_tree().create_timer(0.3).timeout
	for member in _state.get("party", []):
		var mid := String(member.get("id", ""))
		var loss := int(_party_before.get(mid, int(member.get("hp", 0)))) - int(member.get("hp", 0))
		_refresh_member(member, animated and not played_party_beat)
		if animated and loss > 0 and not played_party_beat:
			_spawn_member_damage(mid, loss)
	if party_hit and animated and not played_party_beat:
		await get_tree().create_timer(0.5).timeout

	if not rewards.is_empty():
		_show_victory(rewards)
	elif not wiped.is_empty():
		_show_wipe(wiped)
	else:
		# Round survived on both sides — hand the command back for the next round. Under オート the loop
		# immediately plays the next round, so DON'T flash the command menu between auto rounds (T15).
		_rebuild_stage()
		if _cmd_panel and not _auto:
			_cmd_panel.show()
			var b := _first_command_button()
			if b:
				b.grab_focus()


func _first_command_button() -> Button:
	if _cmd_panel == null:
		return null
	for box in _cmd_panel.get_children():
		for child in box.get_children():
			if child is Button and not (child as Button).disabled:
				return child
	return null

# --- defeat / wipe (controller-first) -------------------------------------------------------------
func _show_wipe(wiped: Dictionary) -> void:
	# The rules already set phase=town + docked the rescue fee on _state (persisted to the run); just show it.
	_resolved = true
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(560, 240)
	panel.size = Vector2(560, 240)
	panel.position = Vector2(size.x / 2 - 280, size.y / 2 - 120)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("1a1010f7"), HURT))
	add_child(panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	panel.add_child(box)
	box.add_child(_centered(_label("全滅した…", 32, HURT)))
	box.add_child(_centered(_label("拠点へ運ばれた。救助料 %d G を失った。" % int(wiped.get("rescueFee", 0)), 18, INK)))
	var cont := _command_button("拠点へ戻る  ▶")
	cont.custom_minimum_size = Vector2(280, 44)
	cont.alignment = HORIZONTAL_ALIGNMENT_CENTER
	cont.pressed.connect(_on_wipe_continue)
	box.add_child(_centered(cont))
	cont.grab_focus()

func _on_wipe_continue() -> void:
	get_tree().change_scene_to_file("res://scenes/town.tscn")

# --- victory overlay (controller-first) -----------------------------------------------------------
## ONE victory screen. The combat scene used to raise its OWN spoils panel here (戦闘に勝利した / 撃破 / 続ける)
## and THEN route to the result scene (勝利 / 戦果 / 探索へ戻る) — two screens for one victory, with the same
## rewards shown twice (playtest: "上記の後にさらにResultが出てくる。どうして"). React shows a single
## CombatResultPanel; go straight to the richer result (spoils + growth), no redundant in-combat panel.
func _show_victory(rewards: Dictionary) -> void:
	_resolved = true
	if _run:
		# The RESULT screen is React's CombatResultPanel, whose prop is the whole CombatConclusion — the
		# rewards EVENT carries no levelUps, so stashing it is what left growth off the result screen.
		var conclusion: Variant = _state.get("combatConclusion", null)
		_run.last_rewards = conclusion if typeof(conclusion) == TYPE_DICTIONARY else rewards
		_run.return_to_town()
	get_tree().change_scene_to_file("res://scenes/result.tscn")

# Public entry for the headless capture harness: resolve the round instantly (no timers), so a
# screenshot taken a few frames later shows the victory state. Keeps the rules path identical.
func force_resolve() -> void:
	if _busy or _resolved:
		return
	_resolve_round(false)

# --- party rendering ------------------------------------------------------------------------------
func _party_row(row: String) -> HBoxContainer:
	var box := HBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	for member in _state.get("party", []):
		if member.get("row", "front") == row:
			box.add_child(_party_slot(member))
	while box.get_child_count() < 3:
		var pad := Control.new()
		pad.custom_minimum_size = Vector2(300, 132)
		box.add_child(pad)
	return box

# Port of CombatPartyStrip.tsx. The adventurers are what the player BRINGS — they get a readable
# portrait, their name, HP and MP gauges, the level/HP/MP line, and labelled status pips. Why a member
# acts oddly must be VISIBLE (sleep cannot act, fear misses, silence cannot cast, poison bleeds), not
# implied by a dimmed box.
func _party_slot(member: Dictionary) -> Control:
	# The slot itself is built by the CombatPartyHud collaborator (IMP-052); the scene keeps the live-update
	# refs so _refresh_member can drive the HP bar/label as the round plays.
	var built := CombatPartyHud.slot(member, _acting_member_id(), WorldResources.portrait_texture(String(member.get("portraitRef", "")), _portrait_path(member)), _hp_text(member))
	_party_slots[member.get("id", "")] = {"bar": built["bar"], "ghost": built["ghost"], "label": built["label"], "mp": built["mp"], "card": built["card"], "max": built["max"]}
	return built["control"]

func _rebuild_party_strip() -> void:
	if _strip_box == null:
		return
	for child in _strip_box.get_children():
		child.queue_free()
	_party_slots.clear()
	_strip_box.add_child(_row_label(I18n.t("play.partyFormation")))
	_strip_box.add_child(_row_label(I18n.t("play.frontRow")))
	_strip_box.add_child(_party_row("front"))
	_strip_box.add_child(_row_label(I18n.t("play.backRow")))
	_strip_box.add_child(_party_row("back"))

# _stat_gauge / _pip moved into CombatPartyHud (the party-slot builder) with the slot (IMP-052).

# Whose orders are being given right now — the strip marks them so the menu and the strip agree.
func _acting_member_id() -> String:
	var actors := _actors()
	if actors.is_empty() or _actor_index >= actors.size():
		return ""
	return String(actors[_actor_index].get("id", ""))

func _refresh_member(member: Dictionary, animate: bool = false) -> void:
	var refs: Variant = _party_slots.get(member.get("id", ""), null)
	if typeof(refs) != TYPE_DICTIONARY:
		return
	var main := refs["bar"] as ProgressBar
	var ghost := refs["ghost"] as ProgressBar
	# A downed member (injury) reads empty even though the rules park it at hp:1.
	var hp: int = 0 if member.get("injury", null) != null else int(member.get("hp", 0))
	(refs["label"] as Label).text = _hp_text(member)
	if not animate or main == null:
		if main: main.value = hp
		if ghost: ghost.value = hp
		return
	# Main fill drops fast; the red ghost chip lags behind so the amount just lost stays legible a moment.
	var tw := create_tween()
	tw.tween_property(main, "value", float(hp), 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	if ghost:
		var gt := create_tween()
		gt.tween_interval(0.16)
		gt.tween_property(ghost, "value", float(hp), 0.52).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

# Land a damage number over a party member's card (the enemy-counter read: whose HP just dropped).
func _spawn_member_damage(member_id: String, amount: int) -> void:
	if amount <= 0:
		return
	var refs: Variant = _party_slots.get(member_id, null)
	if typeof(refs) != TYPE_DICTIONARY:
		return
	var card := refs.get("card", null) as Control
	if card == null:
		return
	var r := card.get_global_rect()
	CombatPlayback.damage_number_at(_damage_layer, Vector2(r.position.x + r.size.x * 0.5, r.position.y - 6.0), amount, false, HURT_ALLY)

# --- floating presentation ------------------------------------------------------------------------
# The floating flourishes live in the CombatPlayback collaborator (IMP-052).
func _spawn_damage_number(amount: int) -> void:
	CombatPlayback.damage_number(_damage_layer, _enemy_stage_rect, amount)

# T15: land a number on a SPECIFIC target (x_frac across the stage), with a crit pop for a heavy blow.
func _spawn_damage_number_at(amount: int, x_frac: float, is_crit: bool) -> void:
	CombatPlayback.damage_number(_damage_layer, _enemy_stage_rect, amount, x_frac, is_crit)

func _spawn_defeat_flourish() -> void:
	CombatPlayback.defeat_flourish(_damage_layer, _enemy_stage_rect)

# --- enemy snapshot / lookup helpers --------------------------------------------------------------
# A per-GROUP snapshot of HP + a horizontal position (x_frac), taken BEFORE the round, so _playback can
# reconstruct each target's loss and land its number on the right creature (T15).
func _enemy_snapshot() -> Dictionary:
	var snap := {}
	var groups: Array = _combat().get("enemyGroups", [])
	for i in groups.size():
		var g: Dictionary = groups[i]
		# name_ja captured HERE while the group is alive & still in enemyGroups: playback runs on the POST-round
		# state, where a defeated group is dropped (→ _group_by_id empty → _enemy_ja "") and the log lost its target.
		snap[String(g.get("id", ""))] = {"hp": _group_hp(g), "name": _short_name(g), "name_ja": _enemy_ja(g), "x_frac": (float(i) + 0.5) / maxf(1.0, float(groups.size()))}
	return snap

func _group_hp_by_id(gid: String) -> int:
	for g in _combat().get("enemyGroups", []):
		if String(g.get("id", "")) == gid:
			return _group_hp(g)
	return 0  # a fully-defeated group has been dropped from the array — it lost all its HP

func _group_by_id(gid: String) -> Dictionary:
	for g in _combat().get("enemyGroups", []):
		if String(g.get("id", "")) == gid:
			return g
	return {}

func _member_by_id(id: String) -> Dictionary:
	for member in _state.get("party", []):
		if String(member.get("id", "")) == id:
			return member
	return {}

# P7: drain ONE party member's HP bar to `hp` (the running value as the enemy beats land), mirroring
# _refresh_member's main-fill + lagging-ghost tween. Used per-beat so the ally bars fall during playback.
func _drain_member_bar(member: Dictionary, hp: int) -> void:
	var refs: Variant = _party_slots.get(member.get("id", ""), null)
	if typeof(refs) != TYPE_DICTIONARY:
		return
	var main := refs["bar"] as ProgressBar
	var ghost := refs["ghost"] as ProgressBar
	var shown := maxi(0, hp)
	(refs["label"] as Label).text = "HP %d/%d" % [shown, int(member.get("maxHp", 1))]
	if main:
		create_tween().tween_property(main, "value", float(shown), 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	if ghost:
		var gt := create_tween()
		gt.tween_interval(0.16)
		gt.tween_property(ghost, "value", float(shown), 0.52).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

func _member_by_name(nm: String) -> Dictionary:
	for member in _state.get("party", []):
		if String(member.get("name", "")) == nm:
			return member
	return {}

func _snapshot_party() -> Dictionary:
	var snap := {}
	for member in _state.get("party", []):
		snap[String(member.get("id", ""))] = int(member.get("hp", 0))
	return snap

# A synthetic copy of `group` reduced to a running pooled HP, so a mid-playback rebuild shows the pack's
# bar drained (and the odd unit fallen) in step with its damage number, before the round's end rebuild.
# Land the damage number ON the struck creature (its mark's real screen centre, high on the body) — not at
# a stage fraction that ignored the HUD band (T21: the number floated at top-centre, off the creature).
func _pop_enemy_damage(gid: String, amount: int, is_crit: bool) -> void:
	var mark: Variant = _enemy_marks.get(gid, null)
	if not (mark is Control):
		CombatPlayback.damage_number(_damage_layer, _enemy_stage_rect, amount, 0.5, is_crit)
		return
	var r := (mark as Control).get_global_rect()
	CombatPlayback.damage_number_at(_damage_layer, Vector2(r.position.x + r.size.x * 0.5, r.position.y + r.size.y * 0.26), amount, is_crit)

# Redraw a struck group's mark from a groups array carrying its REAL count/hpEach, so the bodies and the
# front unit's bar drain in step with the beats — and end exactly on the post-round state (no snap-back).
func _redraw_enemy_group(groups: Array, gid: String) -> void:
	var idx := int(_stage_group_index.get(gid, -1))
	if idx < 0:
		return
	for g in groups:
		if String((g as Dictionary).get("id", "")) == gid:
			_place_enemy_mark(idx, g)
			return

# T15: the per-hit beats the round emitted ({actorName, targetGroupId, damage, crit}), so playback can
# name WHO struck each target (誰が) — not just the per-group total.
func _round_beats(events: Array) -> Array:
	for e in events:
		if String((e as Dictionary).get("type", "")) == "combat_round_resolved":
			var b: Variant = (e as Dictionary).get("beats", [])
			return b if typeof(b) == TYPE_ARRAY else []
	return []

# combat is cleared to null on victory — read it null-safe everywhere.
func _combat() -> Dictionary:
	var c: Variant = _state.get("combat", null)
	return c if typeof(c) == TYPE_DICTIONARY else {}

func _first_group() -> Dictionary:
	var groups: Array = _combat().get("enemyGroups", [])
	return groups[0] if groups.size() > 0 else {}

func _first_living_group_id() -> String:
	for g in _combat().get("enemyGroups", []):
		if int(g.get("count", 0)) > 0:
			return g.get("id", "")
	return ""

func _group_hp(group: Dictionary) -> int:
	return int(group.get("count", 0)) * int(group.get("hpEach", 0))

func _group_max_hp(group: Dictionary) -> int:
	return int(group.get("initialCount", group.get("count", 0))) * int(group.get("maxHpEach", group.get("hpEach", 1)))

# The enemy's name is resolved from the WORLD catalog by enemyId, exactly as React's
# localizedEnemyGroupName does. A combat group carries no `locales` (neither runtime puts it there —
# adding it would change the state hash), so reading `group.locales` always missed and fell through to a
# hardcoded default: every scenario's monsters were announced with the ash world's name.
func _enemy_ja(group: Dictionary) -> String:
	for enemy in _world.get("enemies", []):
		if enemy.get("id", "") == group.get("enemyId", ""):
			var locales: Dictionary = enemy.get("locales", {})
			var ja: Dictionary = locales.get("ja", {}) if typeof(locales) == TYPE_DICTIONARY else {}
			return String(ja.get("name", enemy.get("name", group.get("name", ""))))
	return String(group.get("name", ""))

func _short_name(group: Dictionary) -> String:
	return group.get("name", "Enemy")

func _find_event(events: Array, type_name: String) -> Dictionary:
	for e in events:
		if typeof(e) == TYPE_DICTIONARY and e.get("type", "") == type_name:
			return e
	return {}

func _acting_name() -> String:
	for member in _state.get("party", []):
		if int(member.get("hp", 0)) > 0:
			return member.get("name", "?")
	return "?"

var _backgrounds_cache: Array = []
func _backgrounds() -> Array:
	if _backgrounds_cache.is_empty():
		_backgrounds_cache = ((_run.character_data if _run else _read_json("res://data/character-data.json")) as Dictionary).get("backgrounds", [])
	return _backgrounds_cache

# The FACE for a party HUD token / result — a compact avatar. An explicit builtin pick wins, else the
# background's own face; both packs ship all twelve faces through the Default fallback, so a token always
# shows a FACE, never a tall standing figure squeezed into a small frame. (Imported data URLs still ride
# the web-profile path in portrait_texture and fall back here.)
func _portrait_path(member: Dictionary) -> String:
	return WorldResources.face_path(_run.world_id if _run else _world_id, WorldResources.portrait_key(member, _backgrounds()))

# The FULL-BODY spotlight figure — the acting member owning the screen. This world's bodies/<key>.png
# first, then the class figure library (Default's eight), then the face so the panel is never empty.
func _figure_path(member: Dictionary) -> String:
	var body := WorldResources.body_path(_run.world_id if _run else _world_id, WorldResources.portrait_key(member, _backgrounds()))
	if body != "":
		return body
	# Keep the class figure on the canonical class id. The legacy mapping comes from the same exported
	# engine data as the rule port, so an older save gets its current discipline's own figure.
	var class_id := String(member.get("classId", "warrior"))
	var legacy: Dictionary = _engine.get("legacyClassMapping", {})
	class_id = String(legacy.get(class_id, class_id))
	var known := false
	for class_def in _engine.get("classes", []):
		if String((class_def as Dictionary).get("id", "")) == class_id:
			known = true
			break
	if not known:
		class_id = "warrior"
	var sub := "characters/adventurer-%s-base.png" % class_id
	var pack_path := _asset(sub)
	if FileAccess.file_exists(pack_path):
		return pack_path
	var dflt := "res://assets/worlds/default/%s" % sub
	return dflt if FileAccess.file_exists(dflt) else _portrait_path(member)

func _hp_text(member: Dictionary) -> String:
	# A DOWNED member is stored at hp:1 + injury (so they can be revived), but showing "HP 1" read as
	# barely-alive and confused a wipe for a 相打ち (playtest). Show 0 while wounded — the 負傷 pip says why.
	var hp := 0 if member.get("injury", null) != null else int(member.get("hp", 0))
	return "HP %d/%d" % [hp, int(member.get("maxHp", 0))]

# The creature art. Authored art lives under assets/dungeon/; a few were hand-copied into enemies/
# early on, so both are tried before giving up.
func _enemy_texture(group: Dictionary) -> Texture2D:
	var short := _short_id(String(group.get("enemyId", "")))
	for sub in ["dungeon/%s.png" % short, "enemies/%s.png" % short, "dungeon/%s.png" % String(group.get("enemyId", "")).replace(".", "-")]:
		var tex := _texture(_asset(sub))
		if tex:
			return tex
	return null

func _short_id(full_id: String) -> String:
	var parts := full_id.split(".")
	return parts[parts.size() - 1] if parts.size() > 0 else full_id

func _stringify(arr: Array) -> Array:
	var out := []
	for v in arr:
		out.append(str(v))
	return out

# --- widget factories -----------------------------------------------------------------------------
func _centered(control: Control) -> Control:
	var c := CenterContainer.new()
	c.add_child(control)
	return c

func _command_button(text: String, key_hint: String = "") -> Button:
	var b := Button.new()
	# Round-level commands carry a keyboard shortcut (F/R/G) that the React dock shows as a chip on the
	# button — mirror it here so the key is discoverable in play, not just in the manual (playtest 2026-08-05:
	# "オート・全員でかかる のショートカットキーがメニューに表示されない、どれがどれか分からん").
	b.text = "%s  [%s]" % [text, key_hint] if key_hint != "" else text
	b.custom_minimum_size = Vector2(420, 40)
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.add_theme_font_size_override("font_size", 19)
	# Round-level commands used to be BORDERLESS text — indistinguishable from the DIM hint lines beside
	# them (playtest 2026-07-31 IMP-057). Give them real button chrome so they read as buttons, but keep it
	# SUBDUED (thin neutral border, no green fill) so they stay secondary to the turn's primary per-actor
	# menu above; the focus ring still turns gold so the cursor is unambiguous.
	b.add_theme_stylebox_override("normal", _panel_style(Color("14170fd0"), Color("2f381f")))
	b.add_theme_stylebox_override("hover", _panel_style(Color("1c2314e0"), Color("5a6a3a")))
	b.add_theme_stylebox_override("focus", _panel_style(Color("22301aef"), GOLD))
	b.add_theme_stylebox_override("pressed", _panel_style(Color("22301aef"), GOLD))
	b.add_theme_stylebox_override("disabled", _panel_style(Color("101109c0"), Color("241a1a")))
	b.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	return b

func _asset(sub: String) -> String:
	return WorldResources.world_asset(_run.world_id if _run else _world_id, sub)

func _texture(path: String) -> Texture2D:
	return WorldResources.texture(path)   # export-safe load lives in WorldResources (IMP-053)

func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	return l

func _row_label(text: String) -> Label:
	return _label(text, 14, GOLD)

# A caption under a round command — a small, dim, wrapped gloss of what the button does. Wrapped so a long
# hint never runs off the command panel's right edge.
func _caption(text: String) -> Label:
	var l := _label(text, 12, DIM)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(420, 0)
	return l

func _set_log(text: String) -> void:
	if _log_label:
		_log_label.text = text

func _panel_style(bg: Color, border: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.content_margin_left = 12
	s.content_margin_right = 12
	s.content_margin_top = 8
	s.content_margin_bottom = 8
	s.corner_radius_top_left = 4
	s.corner_radius_top_right = 4
	s.corner_radius_bottom_left = 4
	s.corner_radius_bottom_right = 4
	if border.a > 0:
		s.border_color = border
		s.set_border_width_all(1)
	return s


# --- the stage ------------------------------------------------------------------------------------
# Groups are spread evenly across the stage width and anchored on a common floor line, so a pack reads
# as several creatures standing together rather than one sprite with a number beside it.
func _rebuild_stage() -> void:
	if _stage_layer == null:
		return
	for child in _stage_layer.get_children():
		child.queue_free()
	_enemy_marks.clear()

	# Stage building lives in the CombatStage collaborator (IMP-052): backdrop, acting-member figure, and
	# the enemy marks in a HUD-clearing band (IMP-024). The scene owns the layer, the marks cache and the
	# target selection; CombatStage returns pure Controls.
	var palette: Dictionary = _world.get("palette", {}) if typeof(_world.get("palette", null)) == TYPE_DICTIONARY else {}
	for n in CombatStage.backdrop_nodes(_enemy_stage_rect, _texture(_asset("ui/combat-vignette.jpg")), palette):
		_stage_layer.add_child(n)

	# During decisions, show whose turn it is at hero scale (IMP-014). Kept as a node ref so playback can
	# swap it to the ACTING member per beat (T24 — the spotlight used to stay on the first actor all fight).
	_actor_figure = null
	if ConfigPanel.spotlight_actor() and _stage in ["command", "skill", "spell", "item", "target-group", "target-ally"]:
		var actor := _acting_member()
		if not actor.is_empty():
			_set_spotlight_member(actor)

	var groups: Array = _combat().get("enemyGroups", [])
	if groups.is_empty():
		return
	# Cache the layout so a single group's mark can be re-rendered mid-playback as its HP drains (T21).
	_stage_band = CombatStage.enemy_band(_enemy_stage_rect, ConfigPanel.spotlight_actor())
	_stage_slot_w = _stage_band.size.x / float(groups.size())
	_stage_group_total = groups.size()
	_stage_group_index.clear()
	for index in groups.size():
		var group: Dictionary = groups[index]
		_stage_group_index[String(group.get("id", ""))] = index
		_place_enemy_mark(index, group)

# Draw (or redraw) one enemy group's mark at its cached slot, for the given group snapshot. Used both by the
# full rebuild and by playback to drain a single group's HP bar in step with its damage number.
func _place_enemy_mark(index: int, group: Dictionary) -> void:
	var gid := String(group.get("id", ""))
	var old: Variant = _enemy_marks.get(gid, null)
	if old is Node and (old as Node).is_inside_tree():
		(old as Node).queue_free()
	var centre := _stage_band.position.x + _stage_slot_w * (float(index) + 0.5)
	var mark := CombatStage.enemy_mark(self, group, centre, _stage_slot_w, _enemy_stage_rect, gid == _target_group_id(), _enemy_texture(group), _enemy_ja(group), _group_hp(group), _group_max_hp(group), _enemy_size_scale(group))
	_enemy_marks[gid] = mark
	_stage_layer.add_child(mark)

# Swap the hero-scale spotlight figure to `member` (whose turn/blow it is), replacing any prior one.
func _set_spotlight_member(member: Dictionary) -> void:
	if _stage_layer == null or member.is_empty() or not ConfigPanel.spotlight_actor():
		return
	if _actor_figure is Node and (_actor_figure as Node).is_inside_tree():
		(_actor_figure as Node).queue_free()
	_actor_figure = CombatStage.actor_figure(member, _enemy_stage_rect, WorldResources.portrait_texture(String(member.get("portraitRef", "")), _figure_path(member)))
	_stage_layer.add_child(_actor_figure)

# The creature's apparent scale from its DATA size class (small/medium/large) — tuned here, never by
# re-ordering art (combat-ui-drpg: the engine owns size). Unknown/absent → neutral.
func _enemy_size_scale(group: Dictionary) -> float:
	var size_class := ""
	for enemy in _world.get("enemies", []):
		if enemy.get("id", "") == group.get("enemyId", ""):
			size_class = String(enemy.get("size", ""))
			break
	match size_class:
		"large": return 1.5
		"medium": return 1.2
		"small": return 1.0
		_: return 1.05

func _acting_member() -> Dictionary:
	# Commands use the filtered, formation-sorted actor queue (not raw party order).  Keeping the hero
	# panel on that same queue prevents it showing Mira while the command window is asking for Rook.
	var actors := _actors()
	if actors.is_empty():
		return {}
	var index := clampi(_actor_index, 0, actors.size() - 1)
	return actors[index] if typeof(actors[index]) == TYPE_DICTIONARY else {}

# The group the cursor is aimed at. The combat state owns it (as React does), but a state built by the
# legacy encounter helper carries a NULL selection — and an unaimed cursor means the player cannot see
# what they are about to hit. Fall back to the first creature still standing.
func _target_group_id() -> String:
	var pending: Variant = _pending.get("targetGroupId", null)
	if typeof(pending) == TYPE_STRING and String(pending) != "":
		return String(pending)
	var selected: Variant = _combat().get("selectedTargetId", null)
	if typeof(selected) == TYPE_STRING and String(selected) != "":
		return String(selected)
	for group in _combat().get("enemyGroups", []):
		if int(group.get("count", 0)) > 0:
			return String(group.get("id", ""))
	return ""

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
const Encounter := preload("res://scripts/encounter.gd")

const BG := Color("0b0d09")
const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const HURT := Color("d98a5a")
const OK := Color("9db06a")

var _state: Dictionary = {}
var _world: Dictionary = {}
var _engine: Dictionary = {}

# Live UI handles updated during playback.
var _enemy_cond: ProgressBar
var _enemy_name: Label
var _damage_layer: Control
var _log_label: Label
var _cmd_panel: PanelContainer
var _party_slots: Dictionary = {}   # member id -> { "bar": ProgressBar, "label": Label }
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

	# --- Enemy stage (owns the upper frame) ---
	_enemy_name = _label(_enemy_ja(group), 34, GOLD)
	_enemy_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_enemy_name.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_enemy_name.offset_top = 40
	add_child(_enemy_name)

	_enemy_cond = ProgressBar.new()
	_enemy_cond.max_value = maxf(1.0, float(_group_max_hp(group)))
	_enemy_cond.value = float(_group_hp(group))
	_enemy_cond.show_percentage = false
	_enemy_cond.custom_minimum_size = Vector2(280, 10)
	_enemy_cond.position = Vector2(size.x / 2 - 140, 92)
	add_child(_enemy_cond)

	_enemy_stage_rect = Rect2(size.x / 2 - 230, 150, 460, 460)
	var slime := TextureRect.new()
	slime.texture = _enemy_texture(group)
	slime.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	slime.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	slime.position = _enemy_stage_rect.position
	slime.size = _enemy_stage_rect.size
	add_child(slime)

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
	strip.position = Vector2(0, 620)
	strip.custom_minimum_size = Vector2(size.x, 170)
	strip.add_theme_stylebox_override("panel", _panel_style(Color("11140dcc")))
	add_child(strip)
	var strip_box := VBoxContainer.new()
	strip.add_child(strip_box)
	strip_box.add_child(_row_label("前衛  FRONT"))
	strip_box.add_child(_party_row("front"))
	strip_box.add_child(_row_label("後衛  BACK"))
	strip_box.add_child(_party_row("back"))

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
# focused Button fires its own `pressed` on ui_accept.
func _unhandled_input(event: InputEvent) -> void:
	if _busy or _resolved:
		return
	if event.is_action_pressed("auto"):
		_on_attack_pressed()
	elif event.is_action_pressed("cancel"):
		_menu_back()
		get_viewport().set_input_as_handled()

## Test seam for the UX-parity gate: force a menu stage so the target/technique surfaces are asserted.
func set_ui_state(ui: Dictionary) -> void:
	if ui.has("stage"):
		_stage = String(ui["stage"])
		if _stage == "target-group":
			var actors := _actors()
			if not actors.is_empty():
				_pending = {"actorId": actors[_actor_index].get("id", ""), "action": "attack"}
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
		var go := _command_button(I18n.t("tempo.allOut"))
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
		"choose": func(kind, payload): _on_menu_choice(kind, payload),
		"back": func(): _menu_back()
	})
	_cmd_box.add_child(built["control"])

	# 全員でかかる stays reachable: the one-press round for when there is nothing to decide.
	var allout := _command_button(I18n.t("tempo.allOut"))
	allout.pressed.connect(_on_attack_pressed)
	_cmd_box.add_child(allout)
	# リピート — repeat the LAST declared round. Unavailable until one has been given, and it says so
	# rather than sitting dead (tempo.repeatRoundUnavailable).
	var repeat := _command_button(I18n.t("tempo.repeatRound") if not _last_round.is_empty() else I18n.t("tempo.repeatRoundUnavailable"))
	repeat.disabled = _last_round.is_empty()
	repeat.pressed.connect(_on_repeat)
	_cmd_box.add_child(repeat)
	# オート — keep resolving rounds until the fight ends or the party is in danger.
	var auto := _command_button(I18n.t("tempo.stop") if _auto else I18n.t("tempo.auto"))
	auto.pressed.connect(_on_toggle_auto)
	_cmd_box.add_child(auto)
	var retreat := _command_button(I18n.t("play.retreat"))
	retreat.pressed.connect(_on_retreat)
	_cmd_box.add_child(retreat)

	var focus: Variant = built["focus"]
	if focus != null:
		(focus as Control).call_deferred("grab_focus")
	else:
		allout.call_deferred("grab_focus")

func _loadout_for(actor: Dictionary) -> Array:
	var vocation: Variant = actor.get("vocation", null)
	var learned: Array = (vocation as Dictionary).get("loadout", []) if typeof(vocation) == TYPE_DICTIONARY else []
	if learned.is_empty():
		var abilities: Variant = (_engine.get("classAbilities", {}) as Dictionary).get(String(actor.get("classId", "")), [])
		if typeof(abilities) == TYPE_ARRAY:
			for entry in abilities:
				if int(actor.get("level", 1)) >= int(entry.get("level", 0)):
					learned.append(entry.get("spellId", ""))
	var out := []
	for id in learned:
		if CommandMenu.SPELL_COST.has(String(id)):
			out.append(String(id))
	return out

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
			_stage = "target-ally" if spell_id == "heal" else "target-group"
		"item":
			_pending = {"actorId": actor.get("id", ""), "action": "use_item", "itemId": String(payload["itemId"])}
			_stage = "target-ally"
		"target-group":
			_pending["targetGroupId"] = String(payload["targetGroupId"])
			_commit(_pending)
			return
		"target-ally":
			_pending["targetCharacterId"] = String(payload["targetCharacterId"])
			_commit(_pending)
			return
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
func _on_toggle_auto() -> void:
	_auto = not _auto
	_rebuild_command_menu()
	if _auto:
		_run_auto()

func _run_auto() -> void:
	while _auto and not _busy and not _resolved and _state.get("phase", "") == "combat":
		var orders := _all_out_actions()
		if orders.is_empty():
			break
		await _resolve_round_with(orders, false)
		if _party_in_danger():
			_auto = false
			_log_line(I18n.t("tempo.autoStoppedDanger"))
			break
	if _state.get("phase", "") != "combat":
		_auto = false
	_rebuild_command_menu()

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
	var actions := _all_out_actions()
	if actions.is_empty():
		_busy = false
		return

	var result := CombatRound.declare_round(_state, _world, actions, _engine)
	var events: Array = result.get("events", [])
	_state = result.get("state", _state)
	if _run:
		_run.state = _state   # persist the resolved state back to the shared run

	await _playback(before, events, animated)
	_busy = false

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

# Rebuild the beat feel from before/after: HP removed per group, defeats, then the rewards event.
func _playback(before: Dictionary, events: Array, animated: bool) -> void:
	var group := _first_group()
	var enemy_name: String = _enemy_ja(before if before.has("enemyId") else _first_group())
	var removed := int(before.get("hp", 0)) - _group_hp(group)
	var remaining := _group_hp(group)

	if animated:
		_spawn_damage_number(removed)

	_enemy_cond.value = float(remaining)
	_set_log("%s が %s に %d ダメージ。" % [_acting_name(), enemy_name, maxi(removed, 0)])
	if animated:
		await get_tree().create_timer(0.55).timeout

	if remaining <= 0:
		_enemy_name.modulate = Color(1, 1, 1, 0.35)
		_set_log("%s を撃破！" % enemy_name)
		if animated:
			_spawn_defeat_flourish()
			await get_tree().create_timer(0.5).timeout

	var rewards := _find_event(events, "combat_rewards")
	var wiped := _find_event(events, "party_wiped")

	# The enemy turn already ran inside declare_round; reflect its damage on the party strip. If the
	# fight goes on, call it out so the counter-attack reads.
	if rewards.is_empty() and not _party_all_full():
		if animated:
			_set_log("敵の反撃！")
			await get_tree().create_timer(0.4).timeout
	for member in _state.get("party", []):
		_refresh_member(member)

	if not rewards.is_empty():
		_show_victory(rewards)
	elif not wiped.is_empty():
		_show_wipe(wiped)
	else:
		# Round survived on both sides — hand the command back for the next round.
		_enemy_cond.value = float(_group_hp(_first_group()))
		if _cmd_panel:
			_cmd_panel.show()
			var b := _first_command_button()
			if b:
				b.grab_focus()

func _party_all_full() -> bool:
	for member in _state.get("party", []):
		if int(member.get("hp", 0)) < int(member.get("maxHp", 0)):
			return false
	return true

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
func _show_victory(rewards: Dictionary) -> void:
	_resolved = true
	if _run:
		_run.last_rewards = rewards
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(560, 260)
	panel.size = Vector2(560, 260)
	panel.position = Vector2(size.x / 2 - 280, size.y / 2 - 130)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("14180ff7"), GOLD))
	add_child(panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(box)
	box.add_child(_centered(_label("戦闘に勝利した", 32, GOLD)))
	var names: Array = rewards.get("enemyNames", [])
	box.add_child(_centered(_label("撃破: %s" % ", ".join(_stringify(names)), 18, INK)))
	box.add_child(_centered(_label("獲得 経験値 %d ・ %d G" % [int(rewards.get("xp", 0)), int(rewards.get("gold", 0))], 22, OK)))
	var cont := _command_button("続ける  ▶")
	cont.custom_minimum_size = Vector2(240, 44)
	cont.alignment = HORIZONTAL_ALIGNMENT_CENTER
	cont.pressed.connect(_on_continue)
	box.add_child(_centered(cont))
	cont.grab_focus()

func _on_continue() -> void:
	if _run:
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
		pad.custom_minimum_size = Vector2(196, 68)
		box.add_child(pad)
	return box

func _party_slot(member: Dictionary) -> Control:
	var slot := PanelContainer.new()
	slot.custom_minimum_size = Vector2(196, 68)
	slot.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	slot.clip_contents = true
	slot.add_theme_stylebox_override("panel", _panel_style(Color("1c2013e6"), Color("3a4326")))
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 8)
	slot.add_child(h)
	var frame := Control.new()
	frame.custom_minimum_size = Vector2(52, 60)
	frame.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	frame.clip_contents = true
	var portrait := TextureRect.new()
	portrait.texture = _texture("res://assets/characters/adventurer-%s-base.png" % _portrait_class(member))
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	frame.add_child(portrait)
	h.add_child(frame)
	var v := VBoxContainer.new()
	h.add_child(v)
	v.add_child(_label(member.get("name", "?"), 18, INK))
	var hp := ProgressBar.new()
	hp.max_value = maxf(1.0, float(member.get("maxHp", 1)))
	hp.value = float(member.get("hp", 0))
	hp.show_percentage = false
	hp.custom_minimum_size = Vector2(84, 8)
	v.add_child(hp)
	var hp_label := _label(_hp_text(member), 13, OK)
	v.add_child(hp_label)
	_party_slots[member.get("id", "")] = {"bar": hp, "label": hp_label}
	return slot

func _refresh_member(member: Dictionary) -> void:
	var refs: Variant = _party_slots.get(member.get("id", ""), null)
	if typeof(refs) != TYPE_DICTIONARY:
		return
	(refs["bar"] as ProgressBar).value = float(member.get("hp", 0))
	(refs["label"] as Label).text = _hp_text(member)

# --- floating presentation ------------------------------------------------------------------------
func _spawn_damage_number(amount: int) -> void:
	if amount <= 0:
		return
	var dmg := _label(str(amount), 56, HURT)
	dmg.position = _enemy_stage_rect.position + Vector2(_enemy_stage_rect.size.x / 2 - 20, 120)
	_damage_layer.add_child(dmg)
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(dmg, "position:y", dmg.position.y - 80, 0.6)
	tw.tween_property(dmg, "modulate:a", 0.0, 0.6).set_delay(0.2)
	tw.chain().tween_callback(dmg.queue_free)

func _spawn_defeat_flourish() -> void:
	var mark := _label("撃破", 44, GOLD)
	mark.position = _enemy_stage_rect.position + Vector2(_enemy_stage_rect.size.x / 2 - 44, 200)
	_damage_layer.add_child(mark)
	var tw := create_tween()
	tw.tween_property(mark, "modulate:a", 0.0, 0.9).set_delay(0.4)
	tw.tween_callback(mark.queue_free)

# --- enemy snapshot / lookup helpers --------------------------------------------------------------
func _enemy_snapshot() -> Dictionary:
	var g := _first_group()
	return {"hp": _group_hp(g), "name": _short_name(g)}

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

func _portrait_class(member: Dictionary) -> String:
	var cls: String = member.get("classId", "vanguard")
	# The slice ships three base portraits; map anything else to the nearest archetype.
	if cls in ["vanguard", "mender", "arcanist"]:
		return cls
	if cls in ["occultist", "sage", "cleric"]:
		return "arcanist"
	return "vanguard"

func _hp_text(member: Dictionary) -> String:
	return "HP %d/%d" % [int(member.get("hp", 0)), int(member.get("maxHp", 0))]

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

func _command_button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(420, 44)
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.add_theme_font_size_override("font_size", 22)
	return b

func _asset(sub: String) -> String:
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

func _texture(path: String) -> Texture2D:
	if not FileAccess.file_exists(path):
		return null
	var img := Image.load_from_file(path)
	if img == null:
		return null
	return ImageTexture.create_from_image(img)

func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	return l

func _row_label(text: String) -> Label:
	return _label(text, 14, GOLD)

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

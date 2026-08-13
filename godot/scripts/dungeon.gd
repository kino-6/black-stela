extends Control
## S4 DUNGEON — a first-person grid crawl driven by the PORTED rules. The party walks the b1f maze;
## every turn and step goes through SliceRules.resolve (turn_left/right + the newly-ported move_forward
## room entry), which mutates the shared run state. A real 3D corridor (built from the cell edges) is
## the view; a Wizardry automap (visited cells + facing) and a compact current-cell command dock float
## over it — controller-first (arrows walk/turn, the dock owns Search/Listen/Return, per IMP-026).
## Stepping into the authored ash-slime room flips the run state to combat → we hand off to combat.tscn
## with the SAME party. Reads the Run autoload in play, or the exploration fixture under capture.

const SliceRules := preload("res://scripts/rules/slice_rules.gd")
const I18n := preload("res://scripts/i18n.gd")
const UIKit := preload("res://scripts/town/ui_kit.gd")
const ChestPanel := preload("res://scripts/dungeon/chest_panel.gd")
const WorldResources := preload("res://scripts/world_resources.gd")
const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")
const DungeonHud := preload("res://scripts/dungeon/dungeon_hud.gd")
const DungeonInput := preload("res://scripts/dungeon/dungeon_input.gd")
const PartyPanel := preload("res://scripts/town/party_panel.gd")
const ConfigPanel := preload("res://scripts/config_panel.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const Chests := preload("res://scripts/rules/chests.gd")
const Fmt := preload("res://scripts/town_format.gd")
const FloorMap := preload("res://scripts/dungeon/floor_map.gd")
const DungeonEntry := preload("res://scripts/rules/dungeon_entry.gd")

const CELL := 3.0
const WALL_H := 3.2
const EYE := 1.6
const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const DIM := Color("9a927e")
const BAD := Color("c96a5a")
const OK := Color("9db06a")

var _state: Dictionary = {}
var _world: Dictionary = {}
var _run: Node = null

var _camera: Camera3D
var _torch: OmniLight3D
var _minimap: Control
var _party_hud: HBoxContainer = null
var _log_label: Label
var _header: Label
var _busy: bool = false
# The risky chest operation currently awaiting a party member (investigate / disarm / unlock).
var _chest_pending_action: String = ""
var _engine: Dictionary = {}
var _dock_host: PanelContainer = null
var _full_map: Control = null
var _party_menu: Control = null
var _config_overlay: Control = null
var _chest_overlay: Control = null
# The opened chest stays in canonical state/map history. This transient value only holds its result on
# screen until the player has read the acquired item.
var _chest_result: Dictionary = {}
var _party_member_id: String = ""
# A roster move rebuilds the sheet; remember its target for that one rebuild so focus stays on the member
# being inspected instead of jumping to an unrelated command.
var _party_focus_member_id: String = ""
var _party_page: String = "status"
var _party_item: String = ""
var _party_item_target_id: String = ""
var _party_technique_id: String = ""
var _party_equipment_slot: String = "weapon"
var _party_equipment_candidate: String = ""

func _ready() -> void:
	await get_tree().process_frame
	_acquire_state()
	_enter_at_landing()
	_build_3d()
	_build_overlays()
	_update_view(false)

func _acquire_state() -> void:
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world = _run.world
		_engine = _run.engine
		_state = _run.state
	else:
		_world = _read_json("res://data/worlds/default.json").get("world", {})
		_engine = _read_json("res://data/engine-data.json")
		_state = (_read_json("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary).duplicate(true)

# Place the party at the floor's stair landing (world.startRoom) facing its first open way — data-driven,
# so the same code drops into b1f (→ the authored ash-slime one step south) or verdant's g1f threshold.
func _enter_at_landing() -> void:
	# Placement is decided by DungeonEntry.plan so the played-build gate can assert it: a victory RESUMES
	# on the fight cell (position intact), a town re-descend lands at the stair but KEEPS the explored
	# automap, and only a brand-new expedition seeds fresh. Overwriting the map on every entry was the
	# #12 "map resets on return" bug.
	_state["phase"] = "dungeon"
	_state["combat"] = null
	# T30/U5: honour the town portal chosen for a fresh landing (default = the world's start room), then
	# clear it so a later re-descend does not reuse a stale choice.
	var entrance_room := String(_run.get("pending_entrance_room")) if _run else ""
	if _run:
		_run.set("pending_entrance_room", "")
	var plan: Dictionary = DungeonEntry.plan(_state, _world, entrance_room)
	_state["position"] = plan["position"]
	_state["map"] = plan["map"]

func _cell_for_room(room_id: String) -> Dictionary:
	for dungeon in _world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell.get("roomId", "") == room_id:
				return cell
	return {}

func _open_dirs(cell: Dictionary) -> Array:
	var out := []
	for dir in ["north", "east", "south", "west"]:
		if _is_passage(cell.get("edges", {}).get(dir, null)):
			out.append(dir)
	return out

# --- 3D corridor ----------------------------------------------------------------------------------
var _view3d: SubViewportContainer = null   # the 3D view; rebuilt when the party changes floor
var _rendered_floor: String = ""           # the floor id _build_geometry last drew
var _cam_pullback: float = 0.55             # eye slid back from cell-centre (palette cameraPullback) so a faced wall isn't the whole view

func _build_3d() -> void:
	# The 3D renderer is a collaborator (IMP-051): it builds the SubViewport + geometry and hands back the
	# nodes; this scene keeps positioning the camera/torch per party cell and freeing the view on a floor change.
	var built := DungeonRenderer.build(_world, _state, _run, size)
	_view3d = built["container"]
	_camera = built["camera"]
	_torch = built["torch"]
	_cam_pullback = float(built.get("pullback", 0.55))
	_rendered_floor = String(built["rendered_floor"])
	add_child(_view3d)
	move_child(_view3d, 0)   # keep the 3D view UNDER the HUD overlays

# The world's own art root, so a second scenario textures its maze from its own pack.
# NOTE: the art directory is keyed by the REGISTRY id ("default"), not the world's internal id
# ("world.default") — using the latter silently produced a path that does not exist, so every texture
# came back null and the maze rendered as flat colour.
func _asset(sub: String) -> String:
	var world_id := "default"
	if _run:
		world_id = String(_run.world_id)
	else:
		world_id = String(_world.get("id", "default")).trim_prefix("world.")
	return WorldResources.world_asset(world_id, sub)

func _texture(path: String) -> Texture2D:
	return WorldResources.texture(path)   # export-safe load lives in WorldResources (IMP-053)

# --- overlays -------------------------------------------------------------------------------------
func _build_overlays() -> void:
	var top_scrim := ColorRect.new()
	top_scrim.color = Color(0, 0, 0, 0.35)
	top_scrim.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_scrim.offset_bottom = 110
	add_child(top_scrim)

	_header = _label("", 30, GOLD)
	_header.position = Vector2(48, 36)
	add_child(_header)

	# minimap (top-right), under the heading React's navigation board carries — a map with no name is a
	# decoration; the player has to know they are looking at 周辺.
	var map_heading := _label(I18n.t("map.heading"), 16, GOLD)
	map_heading.position = Vector2(size.x - 292, 8)
	add_child(map_heading)
	_minimap = preload("res://scripts/minimap.gd").new()
	_minimap.custom_minimum_size = Vector2(260, 260)
	_minimap.size = Vector2(260, 260)
	_minimap.position = Vector2(size.x - 292, 32)
	# The rail: 周辺 map above, PARTY STATUS below. A crawl where the player cannot see their party's
	# state is not the screen React ships — the adventurers are the whole concept.
	_party_hud = HBoxContainer.new()
	_party_hud.add_theme_constant_override("separation", 8)
	_party_hud.position = Vector2(48, size.y - 246)
	_party_hud.custom_minimum_size = Vector2(size.x - 390, 154)
	_party_hud.size = Vector2(size.x - 390, 154)
	add_child(_party_hud)
	add_child(_minimap)
	_minimap.setup(_world, _state)

	# log WINDOW — a framed panel, not a faint line: search results / trap notes / openings must actually
	# read (playtest T7: ログが目立たなすぎ). Sits above the party formation, left of the right-hand dock.
	var log_panel := PanelContainer.new()
	log_panel.position = Vector2(40, size.y - 316)
	log_panel.custom_minimum_size = Vector2(size.x - 420, 52)
	log_panel.size = Vector2(size.x - 420, 52)
	log_panel.add_theme_stylebox_override("panel", _panel_style(Color("11140deb"), GOLD))
	_log_label = _label(_descent_line(), 20, INK)
	_log_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	log_panel.add_child(_log_label)
	add_child(log_panel)

	# The command region is a FIXED area (AGENTS.md: logs and messages must never push commands around).
	# It is rebuilt in place, because a chest on this cell takes the region over.
	_dock_host = PanelContainer.new()
	_dock_host.position = Vector2(size.x - 292, 308)
	_dock_host.custom_minimum_size = Vector2(260, 370)
	_dock_host.size = Vector2(260, 370)
	_dock_host.add_theme_stylebox_override("panel", _panel_style(Color("11140deb"), GOLD))
	add_child(_dock_host)

	var legend := _label("%s · %s M" % [I18n.t("play.moveHint"), I18n.t("play.fullMap")], 16, DIM)
	legend.position = Vector2(48, size.y - 44)
	add_child(legend)
	_rebuild_dock()
	_rebuild_party_hud()

# --- input: arrows OWN movement (consume them so they don't move dock focus); dock owns confirm ----
# The action → rules-command map, and the hold-to-repeat timings. move_back/sidesteps were promised by
# the on-screen legend; all six now step AND auto-repeat while held.
const MOVE_COMMANDS := {
	"turn_left": "turn_left", "turn_right": "turn_right",
	"move_forward": "move_forward", "move_back": "move_backward",
	"sidestep_left": "strafe_left", "sidestep_right": "strafe_right",
}
var _hold := DungeonInput.new()   # held-key auto-repeat collaborator (IMP-051)

func _input(event: InputEvent) -> void:
	if _busy:
		return
	# 設定 overlay (メニュー→設定) is modal on top of the party menu: Cancel closes it back, everything else
	# is swallowed so nothing leaks to the menu or the maze beneath.
	if _config_overlay and is_instance_valid(_config_overlay):
		if event.is_action_pressed("cancel"):
			_close_config_overlay()
			get_viewport().set_input_as_handled()
		return
	# The full-floor map is a MODAL overlay: Cancel (Esc) or M closes it, and it swallows every other key
	# so the party never walks while the player is reading the map. Esc did nothing here before —
	# `_close_overlays_or` was defined but never wired, so the map could only be dismissed by its button.
	if _full_map and is_instance_valid(_full_map):
		if event.is_action_pressed("cancel") or event.is_action_pressed("full_map"):
			_toggle_full_map()
		get_viewport().set_input_as_handled()
		return
	# The 隊列 menu is a MODAL overlay too: Esc/Cancel closes it (it could only be dismissed by its 閉じる
	# button before — playtest), and the dungeon must not walk the party while it is open. The menu owns its
	# own arrows/Confirm for navigation, so only Cancel is consumed here; everything else falls through to it.
	if _party_menu and is_instance_valid(_party_menu):
		if event.is_action_pressed("cancel"):
			if _party_page == "spells" and _party_technique_id != "":
				_party_technique_id = ""
				_refresh_party_menu()
			elif (_party_page == "items" or _party_page == "valuables") and _party_item_target_id != "":
				_party_item_target_id = ""
				_refresh_party_menu()
			elif _party_page == "equipment" and _party_equipment_candidate != "":
				_party_equipment_candidate = ""
				_refresh_party_menu()
			else:
				_toggle_party_menu()
			get_viewport().set_input_as_handled()
		return
	# The opening result remains modal: Confirm reaches its focused 「探索へ戻る」 command, Cancel accepts
	# it too, and no maze input leaks past the central result surface.
	if not _chest_result.is_empty():
		if event.is_action_pressed("cancel"):
			_dismiss_chest_result()
			get_viewport().set_input_as_handled()
		return
	# A chest HOLDS the cell (Wizardry prompt): while its panel is up the party can neither walk NOR turn.
	# The arrows navigate the chest's own 調べる/罠を外す/開ける/立ち去る buttons, 決定 fires the focused one
	# (both handled by the panel's focus ring — we consume nothing, so the keys fall through to it), and
	# キャンセル leaves. Playtest 2026-07-30: you could rotate to face a wall mid-open — the still + the
	# decision should hold the party's attention, not let them wander off the chest.
	if not current_chest().is_empty():
		if event.is_action_pressed("cancel"):
			if _chest_pending_action != "":
				_chest_pending_action = ""
				_rebuild_dock()
			else:
				_leave_chest()
			get_viewport().set_input_as_handled()
		return
	# The legend promises 移動 ↑↓ · 旋回 ←→ · 横歩き Q/E — every one MOVES the party, and every one
	# auto-repeats while HELD (see _process), so walking a corridor is one press-and-hold, not a tap per cell.
	for action in MOVE_COMMANDS:
		if event.is_action_pressed(action):
			_begin_move(action)
			get_viewport().set_input_as_handled()
			return
	# DIRECT dungeon controls (playtest 2026-07-29 redesign — no DQ1 command panel, no Tab dance):
	#   決定 = the CONTEXT action for this cell (探索, or 階段/帰還/罠 when the cell offers one);
	#   キャンセル = open the メニュー (camp); M = full map. There is no focus ring — the scene owns the
	#   keys, and the right panel is only a hint of what they do.
	# Mark the event handled BEFORE dispatching: a context command (階段/帰還) can change scene, which pulls this
	# node out of the tree and makes get_viewport() null on the next line — it crashed with "Cannot call method
	# 'set_input_as_handled' on a null value" (playtest 2026-08-03). Consume first, then act.
	if event.is_action_pressed("confirm"):
		if current_chest().is_empty():
			get_viewport().set_input_as_handled()
			_on_command(_context_command())
		return
	if event.is_action_pressed("cancel"):
		get_viewport().set_input_as_handled()
		_toggle_party_menu()
		return
	if event.is_action_pressed("full_map"):
		get_viewport().set_input_as_handled()
		_toggle_full_map()

# Held-movement auto-repeat is driven by the DungeonInput collaborator (IMP-051): the scene supplies the
# stop condition (a fight / chest / open overlay ends the repeat) and the move callback; it stays the sole
# command dispatcher.
func _process(delta: float) -> void:
	var blocked: bool = _busy or not _chest_result.is_empty() or (_full_map and is_instance_valid(_full_map)) or (_party_menu and is_instance_valid(_party_menu)) \
			or String(_state.get("phase", "")) != "dungeon" or not current_chest().is_empty()
	_hold.tick(delta, blocked, _do_move)

# Thin seam kept for the controller gate (it drives movement through _begin_move).
func _begin_move(action: String) -> void:
	_hold.begin(action, _do_move)

func _do_move(action: String) -> void:
	_apply(SliceRules.resolve(_state, {"type": String(MOVE_COMMANDS[action])}, _world, _engine))

# Public entry for the headless flow-capture harness: take one step forward through the ported rules
# (which, at the landing, walks into the authored ash-slime room and hands off to combat).
func step_forward() -> void:
	if not _busy:
		await _apply(SliceRules.resolve(_state, {"type": "move_forward"}, _world))

## Test seam: drive the crawl from a specific state, so what the party CARRIES (a way-out charm, a key)
## reaches the contextual dock.
func set_state_override(patched: Dictionary) -> void:
	var position: Variant = _state.get("position", null)
	var map: Variant = _state.get("map", null)
	_state = patched.duplicate(true)
	_state["phase"] = "dungeon"
	# Keep where the party is standing: the fixture describes what they HAVE, not where they are.
	if typeof(position) == TYPE_DICTIONARY:
		_state["position"] = position
	if typeof(map) == TYPE_DICTIONARY:
		_state["map"] = map
	_rebuild_dock()
	_rebuild_party_hud()

## Test seam for the UX-parity gate: force a surface (a chest on this cell, the full-floor map) so the
## conditional screens are actually asserted rather than only the empty corridor.
func set_ui_state(ui: Dictionary) -> void:
	if bool(ui.get("chest", false)) and _state.get("position", null) != null:
		var cell_id: Variant = (_state["position"] as Dictionary).get("cellId", null)
		if typeof(cell_id) == TYPE_STRING:
			# A chest prompt only exists before opening. The opened state is still fed through the test seam
			# so the controller gate can prove it immediately gives the cell back to exploration.
			var result: Variant = ui.get("chest_result", null)
			var opened := bool(ui.get("chest_opened", false))
			_state["chests"] = [{
				"cellId": cell_id, "roomId": _state["position"]["roomId"], "treasureTable": null,
				"trap": {"kind": "needle", "difficulty": 12, "damage": 4},
				"phase": "opened" if opened else "closed",
				"investigated": result != null, "investigateResult": result, "disarmAttempted": false,
				"disarmed": false, "sprung": false,
				"lock": {"difficulty": 8} if bool(ui.get("chest_locked", false)) else null,
				"unlockAttempted": false, "unlocked": not bool(ui.get("chest_locked", false))
			}]
			_chest_result = {}
			if opened:
				_chest_result = {
					"chest": (_state["chests"] as Array)[0],
					"events": [{"type": "inventory_item_gained", "itemName": "灰木の杖", "quantity": 1, "source": "treasure"}, {"type": "chest_opened"}]
				}
			_chest_pending_action = String(ui.get("chest_pending_action", ""))
			_left_chest_cell = ""
			_rebuild_dock()
			if opened:
				_show_chest_result(_chest_result.get("events", []))
	# The dock is contextual, so its states are PLACES. Each of these stands the party in a real room of
	# the authored floor — a stair, a gated stair, a way home — rather than faking a button into the row.
	if bool(ui.get("at_stairs", false)):
		_stand_at(func(room, _cells): return _room_has_stairs(room) and _gate_blocking(room) == null)
	if bool(ui.get("stair_locked", false)):
		_stand_at(func(room, _cells): return _room_has_stairs(room) and _gate_blocking(room) != null)
	if bool(ui.get("at_return", false)):
		_stand_at(func(room, _cells): return bool(room.get("stairsToTown", false)))
	if bool(ui.get("at_rest", false)):
		# A rest point is left by the PARTY, not built into the floor — the way home there is the marker
		# they planted, and it says so. Stand where that marker is the ACTUAL context action: a rest room
		# that is not itself a staircase (a stair here would win 決定 and hide the marker — the reason this
		# state exists is to show 帰還標を使う, so it must land somewhere the marker answers).
		_stand_at(func(room, _cells): return bool(room.get("restPoint", false)) and not bool(room.get("stairsToTown", false)) and not _room_has_stairs(room))
	if ui.has("auto"):
		_auto_running = bool(ui["auto"])
		_rebuild_dock()
	if bool(ui.get("at_dark", false)):
		# The one place the map cannot help: a dark zone, where the floor is walked by counting steps.
		_stand_at(func(room, _cells):
			for gate in room.get("gates", []):
				if typeof(gate) == TYPE_DICTIONARY and String(gate.get("kind", "")) == "dark_zone":
					return true
			return false)
	if bool(ui.get("fullMap", false)):
		_toggle_full_map()

## Move the party to the first room the predicate accepts, and rebuild what depends on where they stand.
func _stand_at(accepts: Callable) -> void:
	for dungeon in _world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if not accepts.call(room, dungeon):
				continue
			for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
				if String(cell.get("roomId", "")) != String(room.get("id", "")):
					continue
				var facing := _stairs_facing(cell)
				_state["position"] = {"roomId": room["id"], "cellId": cell["id"], "facing": facing}
				# Standing somewhere means the MAP knows it: the automap is what the party has walked, so
				# a seam that moved the body without the record would leave the two disagreeing.
				var map: Dictionary = _state.get("map", {})
				map["floorId"] = dungeon.get("id", map.get("floorId", null))
				map["currentRoomId"] = room["id"]
				map["currentCellId"] = cell["id"]
				map["currentFacing"] = facing
				map["visitedCells"] = [cell["id"]]
				map["visitedRooms"] = [room["id"]]
				_state["map"] = map
				_rebuild_dock()
				_update_view(false)
				return
	push_error("[dungeon] no room in this world matches the requested state")

func _stairs_facing(cell: Dictionary) -> String:
	for dir in (cell.get("edges", {}) as Dictionary):
		var edge: Variant = (cell["edges"] as Dictionary)[dir]
		if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
			return String(dir)
	return String(_position().get("facing", "north"))

func _room_has_stairs(room: Dictionary) -> bool:
	for dungeon in _world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if String(cell.get("roomId", "")) != String(room.get("id", "")):
				continue
			for dir in (cell.get("edges", {}) as Dictionary):
				var edge: Variant = (cell["edges"] as Dictionary)[dir]
				if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
					return true
	return false

func _gate_blocking(room: Dictionary) -> Variant:
	for gate in room.get("gates", []):
		if typeof(gate) == TYPE_DICTIONARY and not _is_gate_open(gate):
			return gate
	return null

# The unresolved chest sitting on the party's cell, or {}. A closed chest owns the command region;
# an opened chest is history and must never make the player dismiss a second event.
func current_chest() -> Dictionary:
	# 探索へ戻る steps off the prompt WITHOUT consuming the chest — so while the party has chosen to leave the
	# chest on THIS cell it is not "current" (or the dock would re-raise the panel and the move-guard would
	# keep input frozen — playtest). Moving to another cell clears that, so walking back faces it again.
	var here := String(_position().get("cellId", ""))
	if _left_chest_cell != "" and here != _left_chest_cell:
		_left_chest_cell = ""
	if _left_chest_cell != "" and here == _left_chest_cell:
		return {}
	var chest: Variant = Chests.current_chest(_state)
	if typeof(chest) != TYPE_DICTIONARY or String((chest as Dictionary).get("phase", "")) == "opened":
		return {}
	return chest

# Port of DungeonCockpit's party-hud: front/back rows, each adventurer with portrait, name, level,
# HP/MP with gauges, and the combat numbers the player judges an encounter by.
func _rebuild_party_hud() -> void:
	if _party_hud == null:
		return
	for child in _party_hud.get_children():
		child.queue_free()
	var heading := VBoxContainer.new()
	heading.custom_minimum_size = Vector2(76, 128)
	heading.add_child(UIKit.label(I18n.t("play.partyStatus"), 14, GOLD))
	heading.add_child(UIKit.label("前衛 / 後衛", 12, DIM))
	_party_hud.add_child(heading)
	var members := []
	for row in ["front", "back"]:
		for member in _state.get("party", []):
			if String(member.get("row", "front")) == row:
				members.append(member)
	for member in members:
		_party_hud.add_child(DungeonHud.party_token(member, _world, WorldResources.portrait_texture(String(member.get("portraitRef", "")), _portrait_path(member))))

var _backgrounds_cache: Array = []
func _backgrounds() -> Array:
	if _backgrounds_cache.is_empty():
		_backgrounds_cache = ((_run.character_data if _run else WorldResources.read_json("res://data/character-data.json")) as Dictionary).get("backgrounds", [])
	return _backgrounds_cache

func _portrait_path(member: Dictionary) -> String:
	# The FACE the crawl token shows: an explicit builtin pick, else the background's own face (both packs
	# ship all twelve via the Default fallback). Resolved through face_path so a body-only figure (a
	# world.portraits key like chara-13, no square face) top-crops its standing art instead of blanking
	# (playtest 2026-08-05). face_path folds face → world body → default gate.
	var world_id := String(_run.world_id) if _run else String(_world.get("id", "default")).trim_prefix("world.")
	return WorldResources.face_path(world_id, WorldResources.portrait_key(member, _backgrounds()))

func _rebuild_dock() -> void:
	if _dock_host == null:
		return
	for child in _dock_host.get_children():
		child.queue_free()

	# A chest HOLDS the cell and the party's attention — it is a decision, so it opens CENTRED on the stage
	# (playtest 2026-07-30: 端っこではなく真ん中に置いて選択させるべき), not tucked into the right dock. The
	# right dock keeps showing the key hints beneath it.
	var chest: Dictionary = current_chest()
	if not chest.is_empty():
		_show_chest_overlay(chest)
	elif _chest_result.is_empty():
		_hide_chest_overlay()

	# A NON-INTERACTIVE key hint (playtest 2026-07-29): the dungeon is driven by direct keys, not a command
	# panel you Tab into. 決定 does the CONTEXT action for this cell, キャンセル opens the メニュー, M the map.
	var root: VBoxContainer = UIKit.col(6)
	root.add_child(UIKit.label(I18n.t("play.dungeonCommands"), 16, GOLD))
	root.add_child(_hint_row(I18n.t("play.keyConfirm"), _context_label()))
	root.add_child(_hint_row(I18n.t("play.keyCancel"), I18n.t("partyMenu.title")))
	root.add_child(_hint_row(I18n.t("play.keyMap"), I18n.t("play.fullMap")))

	# The reason a way down will not open, in the player's own language. React hides it in a tooltip; a
	# controller player has no pointer to hover with.
	var clue := _stair_gate_clue()
	if clue != "":
		# Wrap to the dock width — a plain label ran the clue off the panel's right edge (playtest 2026-07-31:
		# "竪坑の落とし戸は閂で塞がれている。それ…" was clipped). The dock is 260px with ~16px content margins.
		root.add_child(UIKit.prose(clue, 15, DIM, 228))

	_dock_host.add_child(root)

# One key-hint line: the key on the left (gold), what it does now on the right (ink). Non-interactive.
func _hint_row(key: String, action: String) -> Control:
	var row := UIKit.row()
	var k := UIKit.label(key, 15, GOLD)
	k.custom_minimum_size = Vector2(96, 0)
	row.add_child(k)
	row.add_child(UIKit.grow(UIKit.label(action, 15, INK)))
	return row

# What 決定 (confirm) DOES on this cell, in priority: use the way down/home if the party stands on it,
# disarm a room trap that is armed, otherwise 探索 (search — the default, and the hook the scenario AI
# reacts to). Charm/return-marker and the rest live in the メニュー; this is the one press-to-act.
func _context_command() -> String:
	var room: Variant = _current_room()
	if _has_stairs_here() and typeof(_blocking_stair_gate()) != TYPE_DICTIONARY:
		return "stairs"
	if typeof(room) == TYPE_DICTIONARY and (bool(room.get("stairsToTown", false)) or bool(room.get("restPoint", false))):
		return "return"
	if typeof(room) == TYPE_DICTIONARY and typeof(room.get("trap", null)) == TYPE_DICTIONARY and not (_state.get("resolvedTraps", []) as Array).has(room["trap"].get("id", "")):
		return "disarm"
	return "search"

# The label 決定 carries right now — mirrors _context_command so the hint reads what pressing it will do.
func _context_label() -> String:
	match _context_command():
		"stairs":
			# 下り(次の階へ) と 上り(前の階へ戻る) は両方 stairs だが向きが逆 — 同じ「階段」表示だと降り口が
			# 探せない(playtest 2026-08-03「階段が消えている」)。目的階の順序で降下/上昇を出し分ける。
			return I18n.t("play.descendStairs" if _stairs_is_descent(_stairs_target_floor_id()) else "play.ascendStairs")
		"return":
			var room: Variant = _current_room()
			var via_stairs := typeof(room) == TYPE_DICTIONARY and bool(room.get("stairsToTown", false))
			return I18n.t("play.useReturnStairs" if via_stairs else "play.useReturnMarker")
		"disarm":
			return I18n.t("play.chestDisarm")
		_:
			return I18n.t("play.search")

# The dock is CONTEXTUAL: stairs and the way home only appear where they actually answer.
func _dock_commands() -> Array:
	var out: Array = [{"kind": "search", "label": I18n.t("play.search")}, {"kind": "listen", "label": I18n.t("play.listen")}]
	var room: Variant = _current_room()
	var gate: Variant = _blocking_stair_gate()
	if _has_stairs_here() and typeof(gate) != TYPE_DICTIONARY:
		out.append({"kind": "stairs", "label": I18n.t("play.descendStairs" if _stairs_is_descent(_stairs_target_floor_id()) else "play.ascendStairs")})
	elif typeof(gate) == TYPE_DICTIONARY:
		# #68: a DISABLED command with the same footprint, never a variable-width clue tile — the dock
		# must not reflow. React hides the reason in a tooltip; a controller player never hovers, so the
		# clue is shown as its own line under the commands instead.
		out.append({"kind": "locked", "label": I18n.t("play.descentLockedShort"), "disabled": true})
	if typeof(room) == TYPE_DICTIONARY and (bool(room.get("stairsToTown", false)) or bool(room.get("restPoint", false))):
		# The way home reads differently depending on what it IS: a staircase back up, or the marker the
		# party planted at a rest point.
		var via_stairs := bool(room.get("stairsToTown", false))
		out.append({"kind": "return", "label": I18n.t("play.useReturnStairs" if via_stairs else "play.useReturnMarker")})
	if _escape_item() != "":
		out.append({"kind": "charm", "label": I18n.t("play.useReturnCharm")})
	if typeof(room) == TYPE_DICTIONARY and typeof(room.get("trap", null)) == TYPE_DICTIONARY and not (_state.get("resolvedTraps", []) as Array).has(room["trap"].get("id", "")):
		out.append({"kind": "disarm", "label": I18n.t("play.chestDisarm")})
	out.append({"kind": "map", "label": I18n.t("play.fullMap")})
	out.append({"kind": "party", "label": I18n.t("partyMenu.title")})
	return out

## The gate on the stair the party is facing, when it will not open yet (port of stairGateAhead) — the
## crank not turned, the floor not mapped. Returns {} when the way down is clear.
func _blocking_stair_gate() -> Variant:
	var room: Variant = _current_room()
	if typeof(room) != TYPE_DICTIONARY or not _has_stairs_here():
		return null
	for gate in room.get("gates", []):
		if typeof(gate) != TYPE_DICTIONARY:
			continue
		if _is_gate_open(gate):
			continue
		return gate
	return null

func _is_gate_open(gate: Dictionary) -> bool:
	var key_id: Variant = gate.get("requiredKeyId", null)
	if typeof(key_id) == TYPE_STRING and key_id != "":
		var held := false
		for item in _state.get("inventory", []):
			if String(item.get("id", "")) == key_id and int(item.get("quantity", 0)) > 0:
				held = true
				break
		if not held:
			return false
	var flag: Variant = gate.get("requiredFlag", null)
	if typeof(flag) == TYPE_STRING and flag != "" and not (_state.get("discoveredSecrets", []) as Array).has(flag):
		return false
	return true

## The clue the gate carries, in the player's language — shown as a line rather than a tooltip.
func _stair_gate_clue() -> String:
	var gate: Variant = _blocking_stair_gate()
	if typeof(gate) != TYPE_DICTIONARY:
		return ""
	var locales: Variant = gate.get("locales", {})
	var ja: Dictionary = (locales as Dictionary).get("ja", {}) if typeof(locales) == TYPE_DICTIONARY else {}
	var clue: String = String(ja.get("clue", gate.get("clue", "")))
	return clue if clue != "" else I18n.t("play.descentLocked")

## A charm that carries the party out — only while in the dungeon, and never on a boss floor (React's
## canUseEscapeItem). Returns the item id, or "".
func _escape_item() -> String:
	for item in _state.get("inventory", []):
		if String(item.get("kind", "")) == "escape" and int(item.get("quantity", 0)) > 0:
			return String(item.get("id", ""))
	return ""

# The opening log line: the WORLD's own descent copy (town.firstDescend), not a hardcoded fantasy line.
# The log used to read "松明の灯が石を照らす" (torchlight on stone) even in a tiled subway station
# (playtest 2026-08-06). Falls back to the base i18n line (world-agnostic) when a world omits its own.
func _descent_line() -> String:
	var copy: Dictionary = (_world.get("copy", {}) as Dictionary).get(I18n.locale(), {})
	var line := String(copy.get("town.firstDescend", ""))
	return line if line.strip_edges() != "" else I18n.t("town.firstDescend")

func _current_room() -> Variant:
	if _state.get("position", null) == null:
		return null
	var room_id: String = _state["position"]["roomId"]
	for dungeon in _world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == room_id:
				return room
	return null

func _has_stairs_here() -> bool:
	if _state.get("position", null) == null:
		return false
	var room_id: String = _state["position"]["roomId"]
	for dungeon in _world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell.get("roomId", "") == room_id:
				for dir in (cell.get("edges", {}) as Dictionary):
					var edge: Variant = (cell["edges"] as Dictionary)[dir]
					if typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") == "stairs":
						return true
	return false

# The targetFloorId of the stairs edge on the current cell ("" if none) — so the prompt can say WHICH WAY the
# stair leads. Up (return) and down (descend) both read as "stairs"; without this they showed one label.
func _stairs_target_floor_id() -> String:
	if _state.get("position", null) == null:
		return ""
	var room_id: String = _state["position"]["roomId"]
	for dungeon in _world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell.get("roomId", "") == room_id:
				for dir in (cell.get("edges", {}) as Dictionary):
					var edge: Variant = (cell["edges"] as Dictionary)[dir]
					if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
						return String(edge.get("targetFloorId", ""))
	return ""

# Descent = the target floor sits LATER in the world's dungeon order (authored deepest-last, the order
# descentSim walks). Unknown/ambiguous defaults to descent, the common case.
func _stairs_is_descent(target_floor_id: String) -> bool:
	if target_floor_id == "" or _state.get("position", null) == null:
		return true
	var room_id: String = _state["position"]["roomId"]
	var dungeons: Array = _world.get("dungeons", [])
	var cur_idx := -1
	var tgt_idx := -1
	for i in dungeons.size():
		var d: Dictionary = dungeons[i]
		if String(d.get("id", "")) == target_floor_id:
			tgt_idx = i
		for room in d.get("rooms", []):
			if String(room.get("id", "")) == room_id:
				cur_idx = i
	if cur_idx < 0 or tgt_idx < 0:
		return true
	return tgt_idx > cur_idx

# Leaving a chest does NOT consume it — the party simply stops standing on the prompt.
func _leave_chest() -> void:
	_chest_pending_action = ""
	_left_chest_cell = String(_state["position"].get("cellId", "")) if _state.get("position", null) != null else ""
	_rebuild_dock()

var _left_chest_cell: String = ""

func _on_command(kind: String) -> void:
	if _busy:
		return
	match kind:
		"search":
			_apply(SliceRules.resolve(_state, {"type": "search"}, _world, _engine))
		"listen":
			_apply(SliceRules.resolve(_state, {"type": "listen"}, _world, _engine))
		"stairs":
			_apply(SliceRules.resolve(_state, {"type": "use_stairs"}, _world, _engine))
			# Autosave 2 — on stairs up/down (playtest). Only when we stayed in the dungeon (a floor change);
			# a stair that returns to town saves via the town's own autosave.
			if _run and String(_state.get("phase", "")) == "dungeon":
				_run.save_autosave()
		"disarm":
			_apply(SliceRules.resolve(_state, {"type": "disarm_trap"}, _world, _engine))
		"map":
			_toggle_full_map()
		"party":
			_toggle_party_menu()
		"return":
			_apply(SliceRules.resolve(_state, {"type": "return_to_town"}, _world, _engine))
			if _state.get("phase", "") == "town":
				get_tree().change_scene_to_file("res://scenes/town.tscn")
		"charm":
			var charm := _escape_item()
			if charm != "":
				var target: String = String((_state.get("party", []) as Array)[0].get("id", "")) if not (_state.get("party", []) as Array).is_empty() else ""
				_apply(SliceRules.resolve(_state, {"type": "use_item", "itemId": charm, "targetCharacterId": target}, _world, _engine))
				if _state.get("phase", "") == "town":
					get_tree().change_scene_to_file("res://scenes/town.tscn")

# --- auto-explore ---------------------------------------------------------------------------------
## Walk the party forward on a timer until something asks for a decision — an encounter, a chest, or a
## wall. It is a STATUS with an interrupt, not an autopilot: the same button stops it, and anything that
## takes the command region (combat, a chest) stops it too, so the player is never carried past a choice.
func _toggle_auto() -> void:
	_auto_running = not _auto_running
	_rebuild_dock()
	if _auto_running:
		_auto_loop()

func _auto_loop() -> void:
	while _auto_running and is_inside_tree():
		if _busy or not current_chest().is_empty() or String(_state.get("phase", "")) != "dungeon":
			break
		var before := String((_state.get("position", {}) as Dictionary).get("cellId", ""))
		await step_forward()
		if String(_state.get("phase", "")) != "dungeon" or not current_chest().is_empty():
			break   # a fight or a chest owns the screen now
		if String((_state.get("position", {}) as Dictionary).get("cellId", "")) == before:
			break   # a wall: walking again would just repeat the same refusal
		await get_tree().create_timer(0.35).timeout
	_auto_running = false
	if is_inside_tree():
		_rebuild_dock()

var _auto_running: bool = false

# Apply a rules result: persist to the run, log it, and either descend into combat or refresh the view.
func _apply(result: Dictionary) -> void:
	_state = result.get("state", _state)
	if _run:
		_run.state = _state
	var events: Array = result.get("events", [])
	_log_events(events)
	if _state.get("phase", "") == "combat":
		_busy = true
		# A dark fade carries the encounter line into the battle scene. There is no bright flash and no
		# unexplained empty frame between the dungeon and the first combat command.
		# Resolve the autoload at runtime.  A direct `SceneManager` global made this scene fail to compile when
		# a gate instantiated it outside the normal autoload tree, which in turn disabled the core-loop gate.
		var scene_manager := get_node_or_null("/root/SceneManager")
		if scene_manager:
			await scene_manager.fade_to_dark("res://scenes/combat.tscn")
		elif is_inside_tree():
			get_tree().change_scene_to_file("res://scenes/combat.tscn")
		return
	# A return-to-town command nulls the position; its caller changes scene to the town right after this.
	# Do NOT rebuild the dungeon we are leaving — _update_view reads the now-null position and crashed
	# _current_cell ("Invalid call ... 'get' in base 'Nil'", IMP-044).
	if _state.get("phase", "") != "dungeon":
		return
	_update_view(true)
	if _has_chest_opened(events):
		_show_chest_result(events)
	_rebuild_dock()
	_rebuild_party_hud()

# Commands dispatched from the party MENU (メニュー). Most just mutate state in place, but using an escape
# charm ends the descent — _apply returns early once phase leaves "dungeon" (it must not rebuild the maze
# it is leaving), so the menu is the one that carries the party out to the town, exactly as the old dock
# 'charm'/'return' handlers did.
func _menu_dispatch(command: Dictionary) -> void:
	var result := SliceRules.resolve(_state, command, _world, _engine)
	var events: Array = result.get("events", [])
	for event in events:
		if String((event as Dictionary).get("type", "")) == "equipment_changed":
			_party_equipment_candidate = ""
		if String((event as Dictionary).get("type", "")) == "item_used":
			_party_item_target_id = ""
	_apply(result)
	if String(_state.get("phase", "")) == "town":
		get_tree().change_scene_to_file("res://scenes/town.tscn")
	elif _party_menu and is_instance_valid(_party_menu):
		# Menu commands mutate the shared run state. Rebuild this overlay too so a successful equip visibly
		# changes the slot and derived stats instead of looking like a button with no effect.
		_refresh_party_menu()

# 設定 opened from INSIDE the camp menu (メニュー→設定) — the classic "adjust options while you rest" slot,
# reusing the shared ConfigPanel the title/town use. Rebuild-safe: a toggle's on_change re-opens it so the
# flipped setting shows. Cancel (handled in _input) closes it back to the party menu beneath.
func _open_config_overlay() -> void:
	if _config_overlay and is_instance_valid(_config_overlay):
		_config_overlay.queue_free()
	var layer := Control.new()
	layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.85)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(scrim)
	var panel := PanelContainer.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(560, 0)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("14180df9"), GOLD))
	layer.add_child(panel)
	var col := UIKit.col(14)
	col.add_child(UIKit.label(I18n.t("partyMenu.config"), 24, GOLD))
	var built := ConfigPanel.build(ConfigPanel.load_settings(), func(): _open_config_overlay())
	col.add_child(built["control"])
	col.add_child(UIKit.button(I18n.t("partyMenu.close"), func(): _close_config_overlay(), Vector2(260, 44), 16))
	panel.add_child(col)
	add_child(layer)
	_config_overlay = layer
	var focus: Variant = built.get("first", null)
	if focus != null and is_instance_valid(focus):
		call_deferred("_grab_focus_safe", focus)

func _close_config_overlay() -> void:
	if _config_overlay and is_instance_valid(_config_overlay):
		_config_overlay.queue_free()
	_config_overlay = null
	if _party_menu and is_instance_valid(_party_menu):
		call_deferred("_ensure_focus_in", _party_menu)

# The unresolved chest prompt, CENTRED on the stage over a dimming scrim — a decision the party stops
# for, not a corner widget. A successful disarm/unlock resolves directly into the opened result instead
# of asking for a redundant 開ける confirmation.
func _show_chest_overlay(chest: Dictionary) -> void:
	if _chest_overlay and is_instance_valid(_chest_overlay):
		_chest_overlay.queue_free()
	var layer := Control.new()
	layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.5)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(scrim)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(center)
	var built: Dictionary = ChestPanel.build(
		chest, _state.get("party", []), _state.get("inventory", []), _world, _engine, _chest_pending_action,
		func(action): _chest_pending_action = String(action); _show_chest_overlay(chest),
		func(cmd): _chest_pending_action = ""; _apply(SliceRules.resolve(_state, cmd, _world, _engine)),
		func(): _chest_pending_action = ""; _rebuild_dock(),
		func(): _leave_chest(), _texture(_asset("dungeon/treasure-chest-closed.png"))
	)
	center.add_child(built["control"])
	add_child(layer)
	_chest_overlay = layer
	if built["focus"] != null:
		call_deferred("_grab_focus_safe", built["focus"])

func _hide_chest_overlay() -> void:
	if _chest_overlay and is_instance_valid(_chest_overlay):
		_chest_overlay.queue_free()
	_chest_overlay = null
	_chest_pending_action = ""

func _has_chest_opened(events: Array) -> bool:
	for event in events:
		if typeof(event) == TYPE_DICTIONARY and String((event as Dictionary).get("type", "")) == "chest_opened":
			return true
	return false

func _show_chest_result(events: Array) -> void:
	var opened: Dictionary = {}
	var cell_id := String(_position().get("cellId", ""))
	for chest in _state.get("chests", []):
		if typeof(chest) == TYPE_DICTIONARY and String((chest as Dictionary).get("cellId", "")) == cell_id and String((chest as Dictionary).get("phase", "")) == "opened":
			opened = chest
			break
	if opened.is_empty():
		return
	_chest_result = {"chest": opened, "events": events.duplicate(true)}
	if _chest_overlay and is_instance_valid(_chest_overlay):
		_chest_overlay.queue_free()
	var layer := Control.new()
	layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.5)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(scrim)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(center)
	var built: Dictionary = ChestPanel.build_opened_result(
		# A reward tableau communicates that the contents have been taken; the text below remains the
		# canonical, exact list of what entered the inventory.  Do not reuse this for the unopened prompt.
		opened, events, func(): _dismiss_chest_result(), _texture(_asset("dungeon/treasure-reward-still.png")), _world
	)
	center.add_child(built["control"])
	add_child(layer)
	_chest_overlay = layer
	call_deferred("_grab_focus_safe", built["focus"])

func _dismiss_chest_result() -> void:
	_chest_result = {}
	_hide_chest_overlay()
	_rebuild_dock()

# 隊列 opens the party menu OVER the dungeon — it must never leave the maze. (It used to change scene to
# the town, and the town forces phase=town on entry, so pressing it silently ENDED the expedition and
# yanked the party out of the dungeon.) Camp equipment changes stay in this overlay and never end a run.
func _toggle_party_menu() -> void:
	if _party_menu and is_instance_valid(_party_menu):
		_party_menu.queue_free()
		_party_menu = null
		_rebuild_dock()
		return
	var layer := Control.new()
	layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.82)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(scrim)
	var panel := PanelContainer.new()
	panel.position = Vector2(120, 70)
	panel.custom_minimum_size = Vector2(1680, 940)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("14180df9"), GOLD))
	layer.add_child(panel)

	# Lambda assignments to a local Control do not survive the callback boundary in GDScript. Keep this in a
	# mutable container so PartyPanel can hand the actual roster/button focus back to the modal host.
	var focus_target := {"control": null}
	var ctx := {
		"state": _state, "world": _world, "engine": _engine, "event_text": "",
		"dispatch": func(command): _menu_dispatch(command),
		"close": func(): _toggle_party_menu(),
		"open_config": func(): _open_config_overlay(),
		"selected_member": func(): return _party_selected(),
		# Character selection always remains on the roster. Other menu actions may choose their own return
		# focus, but inspecting a different party member must never reset the player to the menu's first tab.
		"select_party_member": func(id): _select_party_member(String(id), true),
		"focus_selected": func(id): _select_party_member(String(id), true),
		"party_focus_member_id": _party_focus_member_id,
		"focus_hint": func(control): focus_target["control"] = control,
		"party_page": _party_page,
		"set_party_page": func(page): _party_page = String(page); _party_technique_id = ""; _party_item_target_id = ""; _refresh_party_menu(),
		"party_technique_id": _party_technique_id,
		"set_party_technique": func(id): _party_technique_id = String(id); _refresh_party_menu(),
		"party_item": _party_item,
		"set_party_item": func(key): _party_item = String(key); _party_item_target_id = ""; _refresh_party_menu(),
		"party_item_target_id": _party_item_target_id,
		"set_party_item_target": func(id): _party_item_target_id = String(id); _refresh_party_menu(),
		"party_equipment_slot": _party_equipment_slot,
		"set_party_equipment_slot": func(slot): _party_equipment_slot = String(slot); _party_equipment_candidate = ""; _refresh_party_menu(),
		"party_equipment_candidate": _party_equipment_candidate,
		"set_party_equipment_candidate": func(key): _party_equipment_candidate = String(key); _refresh_party_menu(),
		"open_equipment_item": func(item): _party_page = "equipment"; _party_equipment_slot = String(item.get("slot", "weapon")); _party_equipment_candidate = Fmt.equipment_selection_key(item); _refresh_party_menu(),
		"party_discard_pending": false,
		"set_party_discard": func(_p): pass
	}
	panel.add_child(PartyPanel.build(ctx))
	_party_focus_member_id = ""
	add_child(layer)
	_party_menu = layer
	# Focus safety net (playtest 2026-07-29): a tab switch rebuilds the panel, and if the new page's hint
	# ever fails to land, the controller is left with nothing focused — a soft-lock. After the frame settles,
	# give the requested roster member priority, then guarantee SOME focusable control in the panel holds the
	# cursor. Combining those deferred operations prevents the generic fallback from stealing roster focus.
	call_deferred("_ensure_focus_in", panel, focus_target.get("control", null))

# Guarantee the cursor is on a usable control inside `root` — if nothing focusable already holds it, grab
# the first enabled, visible button. The backstop that keeps a rebuilt menu (a tab switch) operable.
# Deferred grab_focus target may be freed or pulled out of the tree before the deferred call runs (overlay
# closed in the same frame) — grab_focus() then spams "Condition !is_inside_tree() is true" (playtest
# 2026-08-03). Route every deferred focus through this guard instead of calling grab_focus directly.
func _grab_focus_safe(control: Variant) -> void:
	if control is Control and is_instance_valid(control) and (control as Control).is_inside_tree():
		(control as Control).grab_focus()

func _ensure_focus_in(root: Node, preferred: Control = null) -> void:
	if not is_instance_valid(root) or not root.is_inside_tree():
		return
	if preferred != null and is_instance_valid(preferred) and preferred.is_inside_tree() and root.is_ancestor_of(preferred):
		preferred.grab_focus()
		return
	var vp := get_viewport()
	if vp == null:
		return
	var owner: Control = vp.gui_get_focus_owner()
	if owner != null and is_instance_valid(owner) and root.is_ancestor_of(owner):
		return
	var first := _first_focusable(root)
	if first != null and first.is_inside_tree():
		first.grab_focus()

func _first_focusable(node: Node) -> Control:
	for c in node.get_children():
		if c is Button and (c as Button).focus_mode != Control.FOCUS_NONE and not (c as Button).disabled and (c as Control).is_visible_in_tree():
			return c
		var deeper := _first_focusable(c)
		if deeper != null:
			return deeper
	return null

func _refresh_party_menu() -> void:
	if _party_menu and is_instance_valid(_party_menu):
		_party_menu.queue_free()
		_party_menu = null
		_toggle_party_menu()

func _party_selected() -> Dictionary:
	var party: Array = _state.get("party", [])
	if party.is_empty():
		return {}
	for member in party:
		if String(member.get("id", "")) == _party_member_id:
			return member
	_party_member_id = String(party[0].get("id", ""))
	return party[0]

func _select_party_member(id: String, preserve_roster_focus: bool) -> void:
	if id == "" or id == _party_member_id:
		return
	_party_member_id = id
	_party_focus_member_id = id if preserve_roster_focus else ""
	_refresh_party_menu()

# The full-floor map (play.fullMap) — a Wizardry overlay, Cancel closes it.
func _close_overlays_or(fallback: Callable) -> void:
	if _party_menu and is_instance_valid(_party_menu):
		_toggle_party_menu()
		return
	fallback.call()

func _toggle_full_map() -> void:
	if _full_map and is_instance_valid(_full_map):
		_full_map.queue_free()
		_full_map = null
		_rebuild_dock()
		return
	var layer := Control.new()
	layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.82)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(scrim)
	# CENTER the map panel and size it to its content. It used to be a fixed 1600×900 box pinned at (160,90),
	# so the map+legend sat in its top-left and the whole thing drifted with how much of the floor was explored
	# (playtest: "妙に左に寄っている"). A CenterContainer keeps it balanced at any map size.
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(center)
	var margin := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_%s" % side, 32)
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _panel_style(Color("11140df7"), GOLD))
	center.add_child(panel)
	panel.add_child(margin)
	var body: VBoxContainer = UIKit.col(8)
	margin.add_child(body)
	body.add_child(FloorMap.build(_state, _world))
	body.add_child(UIKit.label(I18n.t("map.coverage", {"percent": _coverage_percent()}), 17, INK))
	var close: Button = UIKit.button(I18n.t("play.closeMap"), func(): _toggle_full_map(), Vector2(180, 44), 17)
	var foot: HBoxContainer = UIKit.row()
	foot.add_child(close)
	body.add_child(foot)
	add_child(layer)
	_full_map = layer
	call_deferred("_grab_focus_safe", close)

# Visited cells only — the map is the party's RECORD, never the floor's truth.
func _full_map_grid() -> Control:
	var visited: Array = (_state.get("map", {}) as Dictionary).get("visitedCells", [])
	var current: Variant = (_state.get("map", {}) as Dictionary).get("currentCellId", null)
	var text: Label = UIKit.label("", 14, INK)
	var lines: Array = []
	var floor_id: Variant = (_state.get("map", {}) as Dictionary).get("floorId", null)
	for dungeon in _world.get("dungeons", []):
		if dungeon.get("id", "") != floor_id:
			continue
		var rows: Dictionary = {}
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if not visited.has(cell.get("id", "")):
				continue
			var y: int = int(cell.get("y", 0))
			if not rows.has(y):
				rows[y] = {}
			rows[y][int(cell.get("x", 0))] = "@" if cell.get("id", "") == current else "."
		var keys: Array = rows.keys()
		keys.sort()
		for y in keys:
			var xs: Array = rows[y].keys()
			xs.sort()
			var line: String = ""
			var prev: int = -1
			for x in xs:
				if prev >= 0:
					line += " ".repeat(maxi(0, x - prev - 1))
				line += String(rows[y][x])
				prev = x
			lines.append(line)
	text.text = "\n".join(PackedStringArray(lines)) if not lines.is_empty() else I18n.t("map.unseen")
	text.add_theme_font_size_override("font_size", 18)
	return text

# The floor's authored NAME — "dungeon.verdant.g1f" is an implementation identifier and must never
# reach the player (AGENTS.md).
func _floor_name(floor_id: Variant) -> String:
	if floor_id == null:
		return I18n.t("map.noFloor")
	for dungeon in _world.get("dungeons", []):
		if dungeon.get("id", "") == floor_id:
			var ja: Dictionary = (dungeon.get("locales", {}) as Dictionary).get("ja", {})
			return String(ja.get("name", dungeon.get("name", I18n.t("map.noFloor"))))
	return I18n.t("map.noFloor")

func _coverage_percent() -> int:
	var floor_id: Variant = (_state.get("map", {}) as Dictionary).get("floorId", null)
	var visited: Array = (_state.get("map", {}) as Dictionary).get("visitedCells", [])
	for dungeon in _world.get("dungeons", []):
		if dungeon.get("id", "") == floor_id:
			var total: int = ((dungeon.get("grid", {}) as Dictionary).get("cells", []) as Array).size()
			if total <= 0:
				return 0
			var seen: int = 0
			for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
				if visited.has(cell.get("id", "")):
					seen += 1
			return int(round(float(seen) * 100.0 / float(total)))
	return 0

func _update_view(animate: bool) -> void:
	_ensure_floor()   # a stair / debug jump to another floor rebuilds the geometry before we re-aim the camera
	var cell := _current_cell()
	if cell.is_empty():
		return
	var base := Vector3(int(cell.get("x", 0)) * CELL, EYE, int(cell.get("y", 0)) * CELL)
	var facing: String = _state.get("position", {}).get("facing", "north")
	var look := base + _facing_vec(facing)
	# Stairs are part of the current cell, so looking at one should use the same natural glance a person makes:
	# lower the gaze into a descent and raise it toward a climb. A permanent horizontal camera hid the downshaft
	# behind the party HUD and made the up ladder look as if it grew out of a wall.
	var floor_id := String((_state.get("map", {}) as Dictionary).get("floorId", ""))
	var stair := DungeonRenderer._stairs_info(cell, floor_id)
	if String(stair.get("direction", "")) == facing:
		match String(stair.get("kind", "")):
			# Stand at the lip and look INTO the well.  The previous shallow glance left all real treads below
			# the party HUD, exposing only the black recess and making an otherwise physical stair look empty.
			"down": look.y -= 1.10
			"up": look.y += 0.42
	if _camera:
		# Slide the eye back from cell-centre (opposite facing) so a faced wall/door sits at a natural
		# distance with its frame and the room around it in view — not pressed flat against the lens. The
		# look target stays ahead, so only the standing distance changes. Pull-back is palette-tunable.
		_camera.position = base - _facing_vec(facing) * _cam_pullback
		_camera.look_at(look, Vector3.UP)
	if _torch:
		_torch.position = base + _facing_vec(facing) * 0.4
	if _minimap:
		_minimap.refresh(_state)
	_header.text = _room_name()

# --- helpers --------------------------------------------------------------------------------------
# position is a Dictionary while exploring but NULL once a return-to-town command fires. Dictionary.get
# returns its default only for a MISSING key, not a null VALUE, so `_state.get("position", {})` yields
# null there and any `.get(...)` on it crashes (IMP-044). This is the one safe accessor.
func _position() -> Dictionary:
	var p: Variant = _state.get("position", null)
	return p if typeof(p) == TYPE_DICTIONARY else {}

# The floor the party is on right now (map.floorId), falling back to the world's first floor.
func _current_floor_id() -> String:
	var fid: Variant = (_state.get("map", {}) as Dictionary).get("floorId", null)
	return String(fid) if typeof(fid) == TYPE_STRING and fid != "" else String(_world.get("startDungeon", "dungeon.b1f"))

# Rebuild the 3D view when the party has moved to a different floor than the one currently drawn, so the
# geometry follows stairs / a debug floor jump instead of showing the first floor forever (#29).
func _ensure_floor() -> void:
	if _current_floor_id() == _rendered_floor:
		return
	if _view3d and is_instance_valid(_view3d):
		_view3d.queue_free()
	_build_3d()

func _current_cell() -> Dictionary:
	var cid: String = _position().get("cellId", "")
	for dungeon in _world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell.get("id", "") == cid:
				return cell
	return {}

# True when the CURRENT cell has a secret edge whose passage is already discovered — so a fresh 探索 that
# finds nothing should say "already open here", not "nothing found" (T7). Mirrors the rules' flag key
# `secret:<room>:<dir>` (exploration_commands.search).
func _has_opened_secret_here() -> bool:
	var cell := _current_cell()
	if cell.is_empty():
		return false
	var room_id := String(cell.get("roomId", ""))
	var discovered: Array = _state.get("discoveredSecrets", [])
	for dir in ["north", "east", "south", "west"]:
		var edge: Variant = (cell.get("edges", {}) as Dictionary).get(dir, null)
		if typeof(edge) == TYPE_DICTIONARY and String((edge as Dictionary).get("kind", "")) == "secret" and discovered.has("secret:%s:%s" % [room_id, dir]):
			return true
	return false

func _room_name() -> String:
	var rid: String = _position().get("roomId", "")
	for dungeon in _world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == rid:
				var ja: Dictionary = room.get("locales", {}).get("ja", {}) if typeof(room.get("locales", {})) == TYPE_DICTIONARY else {}
				return ja.get("name", room.get("name", rid))
	return rid

func _facing_vec(facing: String) -> Vector3:
	return {
		"north": Vector3(0, 0, -1), "south": Vector3(0, 0, 1),
		"east": Vector3(1, 0, 0), "west": Vector3(-1, 0, 0),
	}.get(facing, Vector3(0, 0, -1))

func _is_passage(edge: Variant) -> bool:
	return typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") in ["open", "door", "one_way"]

func _log_events(events: Array) -> void:
	for e in events:
		var line := _event_line(e)
		if line != "":
			_log_label.text = line

func _event_line(e: Dictionary) -> String:
	match e.get("type", ""):
		"room_event_triggered":
			# Authored room flavour AND the #32 random dungeon events ride this same log line.
			return String(e.get("text", ""))
		"party_turned":
			return "%sを向く。" % _dir_ja(e.get("facing", ""))
		"room_entered":
			return "%s に踏み込んだ。" % _room_name_for(e.get("roomId", ""))
		"encounter_started":
			return "敵と遭遇した！"
		"movement_blocked":
			match e.get("reason", ""):
				"wall": return "壁だ。先へは進めない。"
				"stairs":
					# Narrate the stair by its ACTUAL direction — a down-stair was wrongly called "上れば町へ戻る"
					# (playtest 2026-08-03「大嘘、これは2Fへの階段」). down → next floor; up → town (no target
					# floor = exits the dungeon) or the previous, shallower floor.
					var scell := _current_cell()
					var sfloor := String((_state.get("map", {}) as Dictionary).get("floorId", ""))
					var sinfo := DungeonRenderer._stairs_info(scell, sfloor)
					match String(sinfo.get("kind", "")):
						"down": return "下り階段だ。下れば次の階へ。"
						"up": return "階段だ。上れば町へ戻る。" if String(sinfo.get("target", "")) == "" else "上り階段だ。上れば前の階へ戻る。"
					return "階段だ。"
				"locked": return "固く閉ざされている。"
				"door": return "扉が閉ざされている。「開く」で開けねば先へは進めない。"
		"door_opened":
			return "扉を開けた。奥に部屋が開ける。"
		"inspection_made":
			return "耳をすます……乾いた風の音だけだ。"
		"search_completed":
			# "何も見つからない" is misleading on a cell whose hidden passage is ALREADY open (playtest T7).
			return "この場所の隠し通路はもう開いている。" if _has_opened_secret_here() else "あたりを探ったが、何も見つからない。"
		"secret_found":
			return "隠された継ぎ目を見つけた！"
		"chest_investigated":
			var investigate_key := "events.chestInvestigated%s" % ({"clear": "Clear", "trapped": "Trapped", "uncertain": "Uncertain"}.get(String(e.get("result", "")), "Uncertain"))
			return I18n.t(investigate_key, {"name": String(e.get("handlerName", "隊列"))})
		"chest_disarmed":
			return I18n.t("events.chestDisarmed%s" % ("Success" if bool(e.get("success", false)) else "Fail"), {"name": String(e.get("handlerName", "隊列"))})
		"chest_unlocked":
			return I18n.t("events.chestUnlocked%s" % ("Success" if bool(e.get("success", false)) else "Fail"), {"name": String(e.get("handlerName", "隊列"))})
		"chest_trap_sprung":
			var trap_status := String(e.get("status", ""))
			if trap_status != "":
				return I18n.t("events.chestTrapSprungAiled", {"trap": ChestPanel._trap_name(String(e.get("trapKind", ""))), "damage": int(e.get("damage", 0)), "ailment": I18n.t("partyMenu.status.%s" % trap_status)})
			return I18n.t("events.chestTrapSprung", {"trap": ChestPanel._trap_name(String(e.get("trapKind", ""))), "damage": int(e.get("damage", 0))})
		"command_blocked_chest":
			if String(e.get("reason", "")) == "locked": return I18n.t("play.chestLockedNote")
		"inventory_item_gained":
			# The loot from a chest / reward — logged so the player SEES what they got (playtest: opening a
			# chest said only "宝箱は開いた。"). Mirrors React's events.inventoryItemGained line.
			var item_name := Fmt.localized_catalog_name(_world, String(e.get("itemId", "")))
			if item_name == "" or item_name == String(e.get("itemId", "")):
				item_name = String(e.get("itemName", ""))
			if e.get("affix", null) != null:
				item_name = "%s %s" % [Fmt.localized_affix_label(_world, String(e.get("affix", ""))), item_name]
			if e.get("plus", null) != null:
				item_name = "%s +%d" % [item_name, int(e.get("plus", 0))]
			return I18n.t("events.inventoryItemGained", {"item": item_name, "quantity": int(e.get("quantity", 1))})
	return ""

func _room_name_for(rid: String) -> String:
	for dungeon in _world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == rid:
				var ja: Dictionary = room.get("locales", {}).get("ja", {}) if typeof(room.get("locales", {})) == TYPE_DICTIONARY else {}
				return ja.get("name", room.get("name", rid))
	return rid

func _dir_ja(facing: String) -> String:
	return {"north": "北", "south": "南", "east": "東", "west": "西"}.get(facing, facing)

func _command_button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(180, 46)
	b.add_theme_font_size_override("font_size", 20)
	return b

func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _panel_style(bg: Color, border: Color) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_content_margin_all(12)
	s.set_corner_radius_all(4)
	s.border_color = border
	s.set_border_width_all(1)
	return s

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

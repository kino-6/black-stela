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
const PartyPanel := preload("res://scripts/town/party_panel.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const Chests := preload("res://scripts/rules/chests.gd")

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
var _party_hud: VBoxContainer = null
var _log_label: Label
var _header: Label
var _busy: bool = false
var _engine: Dictionary = {}
var _dock_host: PanelContainer = null
var _full_map: Control = null
var _party_menu: Control = null
var _party_member_id: String = ""
var _party_page: String = "status"
var _party_item: String = ""

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
	var start_room: String = _world.get("startRoom", "room.b1f.001")
	var cell := _cell_for_room(start_room)
	var cell_id: String = cell.get("id", "") if not cell.is_empty() else ""
	var open_dirs := _open_dirs(cell)
	var facing: String = open_dirs[0] if not open_dirs.is_empty() else "south"

	_state["phase"] = "dungeon"
	_state["combat"] = null
	_state["position"] = {"cellId": cell_id, "roomId": start_room, "facing": facing}
	var map: Dictionary = _state.get("map", {})
	map["floorId"] = _world.get("startDungeon", "dungeon.b1f")
	map["currentCellId"] = cell_id
	map["currentRoomId"] = start_room
	map["currentFacing"] = facing
	map["visitedCells"] = [cell_id]
	map["visitedRooms"] = [start_room]
	map["knownExits"] = {start_room: open_dirs}
	_state["map"] = map

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
func _build_3d() -> void:
	var container := SubViewportContainer.new()
	container.stretch = true
	container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(container)
	var vp := SubViewport.new()
	vp.own_world_3d = true
	vp.size = Vector2i(int(size.x), int(size.y))
	container.add_child(vp)

	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("06070500")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("2a2620")
	e.ambient_light_energy = 0.55
	e.fog_enabled = true
	e.fog_light_color = Color("0a0b07")
	e.fog_density = 0.10
	env.environment = e
	vp.add_child(env)

	_camera = Camera3D.new()
	_camera.fov = 72.0
	_camera.near = 0.05
	vp.add_child(_camera)

	_torch = OmniLight3D.new()
	_torch.light_color = Color("ffd9a0")
	_torch.light_energy = 3.2
	_torch.omni_range = 8.5
	_torch.omni_attenuation = 1.4
	vp.add_child(_torch)

	_build_geometry(vp)

func _build_geometry(parent: Node) -> void:
	# The authored block textures, chosen by DEPTH the way React's getDungeonBlockTextureUrls does, and
	# TINTED rather than replaced so each world keeps its own colour. Untextured flat planes are what
	# made the maze read as a placeholder.
	var block := _block_textures()
	var wall_mat := _textured_mat(block["wall"], Color("8a8074"))
	var floor_mat := _textured_mat(block["floor"], Color("6e675c"))
	var ceil_mat := _textured_mat(block["wall"], Color("3a352c"))

	var start_dungeon: String = _world.get("startDungeon", "dungeon.b1f")
	for dungeon in _world.get("dungeons", []):
		if dungeon.get("id", "") != start_dungeon:
			continue
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			var cx := int(cell.get("x", 0))
			var cy := int(cell.get("y", 0))
			var base := Vector3(cx * CELL, 0, cy * CELL)
			_add_plane(parent, floor_mat, base, Vector3(0, 0, 0))
			_add_plane(parent, ceil_mat, base + Vector3(0, WALL_H, 0), Vector3(PI, 0, 0))
			var edges: Dictionary = cell.get("edges", {})
			for dir in ["north", "south", "east", "west"]:
				if not _is_passage(edges.get(dir, null)):
					_add_wall(parent, wall_mat, base, dir)

func _add_plane(parent: Node, mat: Material, pos: Vector3, rot: Vector3) -> void:
	var m := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(CELL, CELL)
	m.mesh = plane
	m.material_override = mat
	m.position = pos
	m.rotation = rot
	parent.add_child(m)

func _add_wall(parent: Node, mat: Material, base: Vector3, dir: String) -> void:
	var m := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(CELL, WALL_H)
	m.mesh = quad
	m.material_override = mat
	var off: Vector3 = {
		"north": Vector3(0, WALL_H / 2, -CELL / 2),
		"south": Vector3(0, WALL_H / 2, CELL / 2),
		"east": Vector3(CELL / 2, WALL_H / 2, 0),
		"west": Vector3(-CELL / 2, WALL_H / 2, 0),
	}[dir]
	m.position = base + off
	# QuadMesh faces +Z; rotate so it faces the cell interior.
	match dir:
		"north": m.rotation.y = 0
		"south": m.rotation.y = PI
		"east": m.rotation.y = -PI / 2
		"west": m.rotation.y = PI / 2
	parent.add_child(m)

# Deeper floors use a heavier block set (React: depth >= 7 -> block3, >= 4 -> block2, >= 1 -> block1).
func _block_textures() -> Dictionary:
	var floor_id: Variant = (_state.get("map", {}) as Dictionary).get("floorId", null)
	var depth := 0
	if typeof(floor_id) == TYPE_STRING:
		var re := RegEx.new()
		re.compile("[a-zA-Z](\\d+)f")
		var m := re.search(String(floor_id))
		if m:
			depth = int(m.get_string(1))
	# Every world ships the block variants; the un-suffixed base is NOT universal (verdant has none), so
	# an unparsed floor must land on block1 rather than a file that may not exist.
	var suffix := "-block1"
	if depth >= 7:
		suffix = "-block3"
	elif depth >= 4:
		suffix = "-block2"
	return {
		"wall": _asset("dungeon/stone-wall%s.jpg" % suffix),
		"floor": _asset("dungeon/stone-floor%s.jpg" % suffix)
	}

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
	return "res://assets/worlds/%s/%s" % [world_id, sub]

func _texture(path: String) -> Texture2D:
	if not FileAccess.file_exists(path):
		return null
	var img := Image.load_from_file(path)
	return ImageTexture.create_from_image(img) if img != null else null

func _textured_mat(path: String, tint: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	var tex := _texture(path)
	if tex:
		mat.albedo_texture = tex
		mat.uv1_scale = Vector3(1.0, 1.0, 1.0)
	mat.albedo_color = tint
	mat.roughness = 0.95
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

func _mat(col: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.95
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

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

	# minimap (top-right)
	_minimap = preload("res://scripts/minimap.gd").new()
	_minimap.custom_minimum_size = Vector2(260, 260)
	_minimap.size = Vector2(260, 260)
	_minimap.position = Vector2(size.x - 292, 32)
	# The rail: 周辺 map above, PARTY STATUS below. A crawl where the player cannot see their party's
	# state is not the screen React ships — the adventurers are the whole concept.
	_party_hud = VBoxContainer.new()
	_party_hud.add_theme_constant_override("separation", 3)
	_party_hud.position = Vector2(size.x - 292, 308)
	_party_hud.custom_minimum_size = Vector2(260, 0)
	add_child(_party_hud)
	add_child(_minimap)
	_minimap.setup(_world, _state)

	# log ticker
	_log_label = _label("地下に踏み入った。松明の灯が石を照らす。", 20, INK)
	_log_label.position = Vector2(48, size.y - 268)   # message band, ABOVE the fixed command dock
	add_child(_log_label)

	# The command region is a FIXED area (AGENTS.md: logs and messages must never push commands around).
	# It is rebuilt in place, because a chest on this cell takes the region over.
	_dock_host = PanelContainer.new()
	_dock_host.position = Vector2(48, size.y - 228)
	_dock_host.custom_minimum_size = Vector2(900, 160)
	_dock_host.add_theme_stylebox_override("panel", _panel_style(Color("11140deb"), GOLD))
	add_child(_dock_host)

	var legend := _label("%s · %s M" % [I18n.t("play.moveHint"), I18n.t("play.fullMap")], 16, DIM)
	legend.position = Vector2(48, size.y - 44)
	add_child(legend)
	_rebuild_dock()
	_rebuild_party_hud()

# --- input: arrows OWN movement (consume them so they don't move dock focus); dock owns confirm ----
func _input(event: InputEvent) -> void:
	if _busy:
		return
	if event.is_action_pressed("turn_left"):
		_apply(SliceRules.resolve(_state, {"type": "turn_left"}, _world, _engine))
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("turn_right"):
		_apply(SliceRules.resolve(_state, {"type": "turn_right"}, _world, _engine))
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("move_forward"):
		_apply(SliceRules.resolve(_state, {"type": "move_forward"}, _world, _engine))
		get_viewport().set_input_as_handled()
	# The legend promises 移動 ↑↓ · 旋回 ←→ · 横歩き Q/E — all four must actually MOVE the party. Only
	# forward and the turns were ever wired, so S/↓ and Q/E did nothing while the screen said they would.
	elif event.is_action_pressed("move_back"):
		_apply(SliceRules.resolve(_state, {"type": "move_backward"}, _world, _engine))
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("sidestep_left"):
		_apply(SliceRules.resolve(_state, {"type": "strafe_left"}, _world, _engine))
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("full_map"):
		_toggle_full_map()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("sidestep_right"):
		_apply(SliceRules.resolve(_state, {"type": "strafe_right"}, _world, _engine))
		get_viewport().set_input_as_handled()

# Public entry for the headless flow-capture harness: take one step forward through the ported rules
# (which, at the landing, walks into the authored ash-slime room and hands off to combat).
func step_forward() -> void:
	if not _busy:
		await _apply(SliceRules.resolve(_state, {"type": "move_forward"}, _world))

## Test seam for the UX-parity gate: force a surface (a chest on this cell, the full-floor map) so the
## conditional screens are actually asserted rather than only the empty corridor.
func set_ui_state(ui: Dictionary) -> void:
	if bool(ui.get("chest", false)) and _state.get("position", null) != null:
		var cell_id: Variant = (_state["position"] as Dictionary).get("cellId", null)
		if typeof(cell_id) == TYPE_STRING:
			_state["chests"] = [{
				"cellId": cell_id, "roomId": _state["position"]["roomId"], "treasureTable": null,
				"trap": {"kind": "needle", "difficulty": 12, "damage": 4}, "phase": "closed",
				"investigated": false, "investigateResult": null, "disarmAttempted": false,
				"disarmed": false, "sprung": false
			}]
			_left_chest_cell = ""
			_rebuild_dock()
	if bool(ui.get("fullMap", false)):
		_toggle_full_map()

# The chest sitting on the party's cell, or {} — while one is here it OWNS the command region.
func current_chest() -> Dictionary:
	var chest: Variant = Chests.current_chest(_state)
	return chest if typeof(chest) == TYPE_DICTIONARY else {}

# Port of DungeonCockpit's party-hud: front/back rows, each adventurer with portrait, name, level,
# HP/MP with gauges, and the combat numbers the player judges an encounter by.
func _rebuild_party_hud() -> void:
	if _party_hud == null:
		return
	for child in _party_hud.get_children():
		child.queue_free()
	_party_hud.add_child(UIKit.label(I18n.t("play.partyStatus"), 15, GOLD))
	for row in ["front", "back"]:
		var members := []
		for member in _state.get("party", []):
			if String(member.get("row", "front")) == row:
				members.append(member)
		if members.is_empty():
			continue
		_party_hud.add_child(UIKit.label(I18n.t("play.frontRow" if row == "front" else "play.backRow"), 13, DIM))
		for member in members:
			_party_hud.add_child(_party_token(member))

func _party_token(member: Dictionary) -> Control:
	var stats: Dictionary = CharacterStats.effective(member, _world)
	var max_hp: int = maxi(1, int(stats.get("maxHp", member.get("maxHp", 1))))
	var hp: int = int(member.get("hp", 0))
	var down: bool = member.get("injury", null) != null or hp <= 0
	var danger: bool = hp <= int(ceil(float(max_hp) * 0.35))

	var body := UIKit.col(1)
	var head := UIKit.row()
	var portrait := TextureRect.new()
	portrait.texture = _texture("res://assets/characters/adventurer-%s-base.png" % _portrait_class(member))
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.custom_minimum_size = Vector2(32, 36)
	head.add_child(portrait)
	head.add_child(UIKit.grow(UIKit.label(String(member.get("name", "?")), 14, BAD if down else INK)))
	head.add_child(UIKit.label("Lv %d" % int(member.get("level", 1)), 12, DIM))
	body.add_child(head)

	var vitals := UIKit.row()
	vitals.add_child(UIKit.label("HP %d/%d" % [hp, max_hp], 12, BAD if danger else INK))
	var max_mp := int(stats.get("maxMp", member.get("maxMp", 0)))
	if max_mp > 0:
		vitals.add_child(UIKit.label("%s %d/%d" % [I18n.t("play.mpShort"), int(member.get("mp", 0)), max_mp], 12, INK))
	body.add_child(vitals)
	body.add_child(_gauge(float(hp) / float(max_hp), BAD if danger else OK))
	if max_mp > 0:
		body.add_child(_gauge(float(int(member.get("mp", 0))) / float(max_mp), Color("6a86b0")))

	var numbers := UIKit.row()
	numbers.add_child(UIKit.label("%s %d-%d" % [I18n.t("party.damage"), int(stats.get("damageMin", 0)), int(stats.get("damageMax", 0))], 12, DIM))
	numbers.add_child(UIKit.label("%s %d" % [I18n.t("party.armor"), int(stats.get("armor", 0))], 12, DIM))
	numbers.add_child(UIKit.label("%s %d" % [I18n.t("party.speed"), int(stats.get("speed", 0))], 12, DIM))
	body.add_child(numbers)

	# Conditions the player must act on (ward is a self-buff, not a warning).
	var pips := []
	for status in member.get("status", []):
		if String(status) != "ward":
			pips.append(I18n.t("partyMenu.status.%s" % String(status)) if I18n.has("partyMenu.status.%s" % String(status)) else String(status))
	if member.get("injury", null) != null:
		pips.append(I18n.t("partyMenu.wounded"))
	if not pips.is_empty():
		body.add_child(UIKit.label(" · ".join(PackedStringArray(pips)), 12, BAD))

	var card := PanelContainer.new()
	var style := UIKit.panel_style(UIKit.ROW_BG, BAD if down else (GOLD if danger else Color("3a4326")))
	style.set_content_margin_all(6)
	card.add_theme_stylebox_override("panel", style)
	card.add_child(body)
	return card

func _gauge(ratio: float, col: Color) -> Control:
	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(0, 4)
	bar.show_percentage = false
	bar.max_value = 100
	bar.value = clampf(ratio, 0.0, 1.0) * 100.0
	var fill := StyleBoxFlat.new()
	fill.bg_color = col
	fill.set_corner_radius_all(2)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.12, 0.12, 0.10, 0.9)
	bg.set_corner_radius_all(2)
	bar.add_theme_stylebox_override("fill", fill)
	bar.add_theme_stylebox_override("background", bg)
	return bar

func _portrait_class(member: Dictionary) -> String:
	var cls: String = member.get("classId", "vanguard")
	if cls in ["vanguard", "mender", "arcanist"]:
		return cls
	if cls in ["occultist", "sage", "cleric", "chanter", "wayfinder"]:
		return "arcanist"
	if cls in ["seeker", "scout", "cutpurse", "duelist"]:
		return "mender"
	return "vanguard"

func _rebuild_dock() -> void:
	if _dock_host == null:
		return
	for child in _dock_host.get_children():
		child.queue_free()

	var chest: Dictionary = current_chest()
	if not chest.is_empty():
		# IMP-029: a chest HOLDS the cell — its actions replace the walk commands rather than sitting
		# beside them, so Confirm can never walk the party off the chest by accident.
		var built: Dictionary = ChestPanel.build(chest, func(cmd): _apply(SliceRules.resolve(_state, cmd, _world, _engine)), func(): _leave_chest())
		_dock_host.add_child(built["control"])
		if built["focus"] != null:
			(built["focus"] as Control).call_deferred("grab_focus")
		return

	var root: VBoxContainer = UIKit.col(6)
	root.add_child(UIKit.label(I18n.t("play.dungeonCommands"), 16, GOLD))
	var row: HBoxContainer = UIKit.row()
	var first: Button = null
	for entry in _dock_commands():
		var b: Button = _command_button(String(entry["label"]))
		var kind: String = String(entry["kind"])
		b.pressed.connect(func(): _on_command(kind))
		row.add_child(b)
		if first == null:
			first = b
	root.add_child(row)
	_dock_host.add_child(root)
	if first:
		first.call_deferred("grab_focus")

# The dock is CONTEXTUAL: stairs and the way home only appear where they actually answer.
func _dock_commands() -> Array:
	var out: Array = [{"kind": "search", "label": I18n.t("play.search")}, {"kind": "listen", "label": I18n.t("play.listen")}]
	var room: Variant = _current_room()
	if _has_stairs_here():
		out.append({"kind": "stairs", "label": I18n.t("play.useStairs")})
	if typeof(room) == TYPE_DICTIONARY and (bool(room.get("stairsToTown", false)) or bool(room.get("restPoint", false))):
		out.append({"kind": "return", "label": I18n.t("play.useReturnStairs")})
	if typeof(room) == TYPE_DICTIONARY and typeof(room.get("trap", null)) == TYPE_DICTIONARY and not (_state.get("resolvedTraps", []) as Array).has(room["trap"].get("id", "")):
		out.append({"kind": "disarm", "label": I18n.t("play.chestDisarm")})
	out.append({"kind": "map", "label": I18n.t("play.fullMap")})
	out.append({"kind": "party", "label": I18n.t("partyMenu.title")})
	return out

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

# Leaving a chest does NOT consume it — the party simply stops standing on the prompt.
func _leave_chest() -> void:
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

# Apply a rules result: persist to the run, log it, and either descend into combat or refresh the view.
func _apply(result: Dictionary) -> void:
	_state = result.get("state", _state)
	if _run:
		_run.state = _state
	var events: Array = result.get("events", [])
	_log_events(events)

	if _state.get("phase", "") == "combat":
		_busy = true
		await get_tree().create_timer(0.35).timeout   # let the encounter line read before the cut
		get_tree().change_scene_to_file("res://scenes/combat.tscn")
		return
	_update_view(true)
	_rebuild_dock()
	_rebuild_party_hud()

# 隊列 opens the party menu OVER the dungeon — it must never leave the maze. (It used to change scene to
# the town, and the town forces phase=town on entry, so pressing it silently ENDED the expedition and
# yanked the party out of the dungeon.) In the dungeon the menu is read-only for equipment, which the
# panel states outright (partyMenu.equipmentDungeon).
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

	var focus_target: Control = null
	var ctx := {
		"state": _state, "world": _world, "engine": _engine, "event_text": "",
		"dispatch": func(command): _apply(SliceRules.resolve(_state, command, _world, _engine)),
		"close": func(): _toggle_party_menu(),
		"selected_member": func(): return _party_selected(),
		"set_selected": func(id): _party_member_id = String(id); _refresh_party_menu(),
		"focus_hint": func(control): focus_target = control,
		"party_page": _party_page,
		"set_party_page": func(page): _party_page = String(page); _refresh_party_menu(),
		"party_item": _party_item,
		"set_party_item": func(key): _party_item = String(key); _refresh_party_menu(),
		"party_discard_pending": false,
		"set_party_discard": func(_p): pass
	}
	panel.add_child(PartyPanel.build(ctx))
	add_child(layer)
	_party_menu = layer
	if focus_target:
		focus_target.call_deferred("grab_focus")

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
	var panel := PanelContainer.new()
	panel.position = Vector2(160, 90)
	panel.custom_minimum_size = Vector2(1600, 900)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("11140df7"), GOLD))
	layer.add_child(panel)
	var body: VBoxContainer = UIKit.col(8)
	panel.add_child(body)
	body.add_child(UIKit.label(I18n.t("play.fullMapTitle"), 26, GOLD))
	var floor_id: Variant = (_state.get("map", {}) as Dictionary).get("floorId", null)
	body.add_child(UIKit.label(I18n.t("map.coverage", {"percent": _coverage_percent()}), 17, INK))
	body.add_child(UIKit.label(_floor_name(floor_id), 15, DIM))
	var grid: Control = _full_map_grid()
	body.add_child(grid)
	var close: Button = UIKit.button(I18n.t("play.chestLeave"), func(): _toggle_full_map(), Vector2(180, 44), 17)
	var foot: HBoxContainer = UIKit.row()
	foot.add_child(close)
	body.add_child(foot)
	add_child(layer)
	_full_map = layer
	close.call_deferred("grab_focus")

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
	var cell := _current_cell()
	if cell.is_empty():
		return
	var base := Vector3(int(cell.get("x", 0)) * CELL, EYE, int(cell.get("y", 0)) * CELL)
	var facing: String = _state.get("position", {}).get("facing", "north")
	var look := base + _facing_vec(facing)
	if _camera:
		_camera.position = base
		_camera.look_at(look, Vector3.UP)
	if _torch:
		_torch.position = base + _facing_vec(facing) * 0.4
	if _minimap:
		_minimap.refresh(_state)
	_header.text = _room_name()

# --- helpers --------------------------------------------------------------------------------------
func _current_cell() -> Dictionary:
	var cid: String = _state.get("position", {}).get("cellId", "")
	for dungeon in _world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell.get("id", "") == cid:
				return cell
	return {}

func _room_name() -> String:
	var rid: String = _state.get("position", {}).get("roomId", "")
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
		"party_turned":
			return "%sを向く。" % _dir_ja(e.get("facing", ""))
		"room_entered":
			return "%s に踏み込んだ。" % _room_name_for(e.get("roomId", ""))
		"encounter_started":
			return "敵と遭遇した！"
		"movement_blocked":
			match e.get("reason", ""):
				"wall": return "壁だ。先へは進めない。"
				"stairs": return "階段だ。上れば町へ戻る。"
				"locked": return "固く閉ざされている。"
		"inspection_made":
			return "耳をすます……乾いた風の音だけだ。"
		"search_completed":
			return "あたりを探ったが、何も見つからない。"
		"secret_found":
			return "隠された継ぎ目を見つけた！"
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

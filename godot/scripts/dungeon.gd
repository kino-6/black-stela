extends Control
## S4 DUNGEON — a first-person grid crawl driven by the PORTED rules. The party walks the b1f maze;
## every turn and step goes through SliceRules.resolve (turn_left/right + the newly-ported move_forward
## room entry), which mutates the shared run state. A real 3D corridor (built from the cell edges) is
## the view; a Wizardry automap (visited cells + facing) and a compact current-cell command dock float
## over it — controller-first (arrows walk/turn, the dock owns Search/Listen/Return, per IMP-026).
## Stepping into the authored ash-slime room flips the run state to combat → we hand off to combat.tscn
## with the SAME party. Reads the Run autoload in play, or the exploration fixture under capture.

const SliceRules := preload("res://scripts/rules/slice_rules.gd")

const CELL := 3.0
const WALL_H := 3.2
const EYE := 1.6
const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const DIM := Color("9a927e")

var _state: Dictionary = {}
var _world: Dictionary = {}
var _run: Node = null

var _camera: Camera3D
var _torch: OmniLight3D
var _minimap: Control
var _log_label: Label
var _header: Label
var _busy: bool = false

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
		_state = _run.state
	else:
		_world = _read_json("res://data/worlds/default.json").get("world", {})
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
	var wall_mat := _mat(Color("2b271f"))
	var floor_mat := _mat(Color("1d1a14"))
	var ceil_mat := _mat(Color("120f0b"))

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
	add_child(_minimap)
	_minimap.setup(_world, _state)

	# log ticker
	_log_label = _label("地下に踏み入った。松明の灯が石を照らす。", 20, INK)
	_log_label.position = Vector2(48, size.y - 210)
	add_child(_log_label)

	# command dock (bottom-left) + movement legend
	var dock := PanelContainer.new()
	dock.position = Vector2(48, size.y - 168)
	dock.add_theme_stylebox_override("panel", _panel_style(Color("11140deb"), GOLD))
	add_child(dock)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	dock.add_child(row)
	var first: Button = null
	for entry in [["search", "探索"], ["listen", "耳をすます"], ["return", "帰還する"]]:
		var b := _command_button(entry[1])
		b.pressed.connect(_on_command.bind(entry[0]))
		row.add_child(b)
		if first == null:
			first = b

	var legend := _label("↑ 前進     ← → 旋回", 16, DIM)
	legend.position = Vector2(48, size.y - 56)
	add_child(legend)
	if first:
		first.grab_focus()

# --- input: arrows OWN movement (consume them so they don't move dock focus); dock owns confirm ----
func _input(event: InputEvent) -> void:
	if _busy:
		return
	if event.is_action_pressed("turn_left"):
		_apply(SliceRules.resolve(_state, {"type": "turn_left"}, _world))
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("turn_right"):
		_apply(SliceRules.resolve(_state, {"type": "turn_right"}, _world))
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("move_forward"):
		_apply(SliceRules.resolve(_state, {"type": "move_forward"}, _world))
		get_viewport().set_input_as_handled()

# Public entry for the headless flow-capture harness: take one step forward through the ported rules
# (which, at the landing, walks into the authored ash-slime room and hands off to combat).
func step_forward() -> void:
	if not _busy:
		await _apply(SliceRules.resolve(_state, {"type": "move_forward"}, _world))

func _on_command(kind: String) -> void:
	if _busy:
		return
	match kind:
		"search":
			_apply(SliceRules.resolve(_state, {"type": "search"}, _world))
		"listen":
			_apply(SliceRules.resolve(_state, {"type": "listen"}, _world))
		"return":
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

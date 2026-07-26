extends RefCounted
## IMP-051 slice 1 — the dungeon's first-person 3D RENDERER, extracted from dungeon.gd. It builds the
## SubViewport, environment (palette-driven light/fog, #18), camera, torch, and the floor geometry from the
## current floor's cell edges. It has NO authority over game state: `build()` returns the nodes it made and
## the scene keeps positioning the camera/torch per party cell. Textures resolve through WorldResources.

const WorldResources := preload("res://scripts/world_resources.gd")

const CELL := 3.0
const WALL_H := 3.2

## Build the 3D view for the floor the party is on. Returns { container, camera, torch, rendered_floor };
## the caller adds `container` to the scene (keeping it under the HUD) and drives the camera each step.
static func build(world: Dictionary, state: Dictionary, run: Object, view_size: Vector2) -> Dictionary:
	var container := SubViewportContainer.new()
	container.stretch = true
	container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var vp := SubViewport.new()
	vp.own_world_3d = true
	vp.size = Vector2i(int(view_size.x), int(view_size.y))
	container.add_child(vp)

	var pal: Dictionary = world.get("palette", {}) if typeof(world.get("palette", null)) == TYPE_DICTIONARY else {}
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("06070500")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(String(pal.get("ambient", "2a2620")))
	e.ambient_light_energy = float(pal.get("ambientEnergy", 0.55))
	e.fog_enabled = true
	e.fog_light_color = Color(String(pal.get("fog", "0a0b07")))
	e.fog_density = float(pal.get("fogDensity", 0.10))
	env.environment = e
	vp.add_child(env)

	var camera := Camera3D.new()
	camera.fov = 72.0
	camera.near = 0.05
	vp.add_child(camera)

	var torch := OmniLight3D.new()
	torch.light_color = Color(String(pal.get("torch", "ffd9a0")))
	torch.light_energy = 3.2
	torch.omni_range = float(pal.get("torchRange", 8.5))
	torch.omni_attenuation = 1.4
	vp.add_child(torch)

	_build_geometry(vp, world, state, run)
	return {"container": container, "camera": camera, "torch": torch, "rendered_floor": _current_floor_id(state, world)}

static func _build_geometry(parent: Node, world: Dictionary, state: Dictionary, run: Object) -> void:
	var block := _block_textures(state, world, run)
	var pal: Dictionary = world.get("palette", {}) if typeof(world.get("palette", null)) == TYPE_DICTIONARY else {}
	var wall_mat := _textured_mat(block["wall"], Color(String(pal.get("wall", "8a8074"))))
	var floor_mat := _textured_mat(block["floor"], Color(String(pal.get("floor", "6e675c"))))
	var ceil_mat := _textured_mat(block["wall"], Color("3a352c"))
	var chamber_floor_mat := _textured_mat(block["floor"], Color(String(pal.get("chamberFloor", "9a8050"))))
	var chamber_wall_mat := _textured_mat(block["wall"], Color(String(pal.get("chamberWall", "a18e62"))))
	var chamber_accent := Color(String(pal.get("chamberAccent", "c9a765")))

	var floor_dungeon := _current_floor_id(state, world)
	for dungeon in world.get("dungeons", []):
		if dungeon.get("id", "") != floor_dungeon:
			continue
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			var cx := int(cell.get("x", 0))
			var cy := int(cell.get("y", 0))
			var base := Vector3(cx * CELL, 0, cy * CELL)
			var edges: Dictionary = cell.get("edges", {})
			var chamber := _is_chamber(edges)
			var wall_height := WALL_H * 1.65 if chamber else WALL_H
			_add_plane(parent, chamber_floor_mat if chamber else floor_mat, base, Vector3(0, 0, 0))
			_add_plane(parent, ceil_mat, base + Vector3(0, wall_height, 0), Vector3(PI, 0, 0))
			for dir in ["north", "south", "east", "west"]:
				if not _is_passage(edges.get(dir, null)):
					_add_wall(parent, chamber_wall_mat if chamber else wall_mat, base, dir, wall_height)
			if chamber:
				_add_chamber_landmarks(parent, base, chamber_accent, wall_height)
			# The pack ships stair-up/stair-down art; draw it so a stair cell is VISIBLE in the first-person
			# view instead of a plain dead-end the 階段を使う command only hints at (playtest: asset delivered,
			# never rendered).
			var stair_kind := _stairs_kind(cell, floor_dungeon)
			if stair_kind != "":
				_add_stairs(parent, base, _asset(world, run, "dungeon/stair-%s.png" % stair_kind))

static func _is_chamber(edges: Dictionary) -> bool:
	var openings := 0
	for dir in ["north", "south", "east", "west"]:
		if _is_passage(edges.get(dir, null)):
			openings += 1
	return openings >= 3

# "" / "down" / "up" — a cell carries stairs when one of its edges is a `stairs` edge. A deeper target is
# a descent (stair-down art); anything else (shallower, or off-floor to town) is an ascent (stair-up).
static func _stairs_kind(cell: Dictionary, floor_id: String) -> String:
	var depth := _floor_depth(floor_id)
	for dir in ["north", "south", "east", "west"]:
		var edge: Variant = cell.get("edges", {}).get(dir, null)
		if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
			var target := String(edge.get("targetFloorId", ""))
			return "down" if target != "" and _floor_depth(target) > depth else "up"
	return ""

static func _floor_depth(floor_id: String) -> int:
	var re := RegEx.new()
	re.compile("[a-zA-Z](\\d+)f")
	var m := re.search(floor_id)
	return int(m.get_string(1)) if m else 0

# A flat decal on the floor showing the stairs, lifted a hair to avoid z-fighting with the floor plane.
static func _add_stairs(parent: Node, base: Vector3, tex_path: String) -> void:
	if not ResourceLoader.exists(tex_path):
		return
	var tex: Texture2D = load(tex_path)
	if tex == null:
		return
	var m := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(CELL * 0.82, CELL * 0.82)
	m.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_texture = tex
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.material_override = mat
	m.position = base + Vector3(0, 0.04, 0)
	parent.add_child(m)

static func _add_plane(parent: Node, mat: Material, pos: Vector3, rot: Vector3) -> void:
	var m := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(CELL, CELL)
	m.mesh = plane
	m.material_override = mat
	m.position = pos
	m.rotation = rot
	parent.add_child(m)

static func _add_wall(parent: Node, mat: Material, base: Vector3, dir: String, height: float = WALL_H) -> void:
	var m := MeshInstance3D.new()
	var quad := QuadMesh.new()
	quad.size = Vector2(CELL, height)
	m.mesh = quad
	m.material_override = mat
	var off: Vector3 = {
		"north": Vector3(0, height / 2, -CELL / 2),
		"south": Vector3(0, height / 2, CELL / 2),
		"east": Vector3(CELL / 2, height / 2, 0),
		"west": Vector3(-CELL / 2, height / 2, 0),
	}[dir]
	m.position = base + off
	match dir:
		"north": m.rotation.y = 0
		"south": m.rotation.y = PI
		"east": m.rotation.y = -PI / 2
		"west": m.rotation.y = PI / 2
	parent.add_child(m)

static func _add_chamber_landmarks(parent: Node, base: Vector3, accent: Color, height: float) -> void:
	var inlay := MeshInstance3D.new()
	var disk := CylinderMesh.new()
	disk.top_radius = 0.62
	disk.bottom_radius = 0.62
	disk.height = 0.025
	inlay.mesh = disk
	inlay.material_override = _mat(Color(accent, 0.72))
	inlay.position = base + Vector3(0, 0.018, 0)
	parent.add_child(inlay)
	for offset in [Vector3(-0.88, 0, -0.88), Vector3(0.88, 0, -0.88), Vector3(-0.88, 0, 0.88), Vector3(0.88, 0, 0.88)]:
		var pillar := MeshInstance3D.new()
		var column := CylinderMesh.new()
		column.top_radius = 0.12
		column.bottom_radius = 0.18
		column.height = height * 0.72
		pillar.mesh = column
		pillar.material_override = _mat(accent.darkened(0.38))
		pillar.position = base + offset + Vector3(0, column.height / 2.0, 0)
		parent.add_child(pillar)

# Deeper floors use a heavier block set (React: depth >= 7 -> block3, >= 4 -> block2, >= 1 -> block1).
static func _block_textures(state: Dictionary, world: Dictionary, run: Object) -> Dictionary:
	var floor_id: Variant = (state.get("map", {}) as Dictionary).get("floorId", null)
	var depth := 0
	if typeof(floor_id) == TYPE_STRING:
		var re := RegEx.new()
		re.compile("[a-zA-Z](\\d+)f")
		var m := re.search(String(floor_id))
		if m:
			depth = int(m.get_string(1))
	var suffix := "-block1"
	if depth >= 7:
		suffix = "-block3"
	elif depth >= 4:
		suffix = "-block2"
	return {
		"wall": _asset(world, run, "dungeon/stone-wall%s.jpg" % suffix),
		"floor": _asset(world, run, "dungeon/stone-floor%s.jpg" % suffix)
	}

# The art root is keyed by the REGISTRY id ("default"), not the internal id ("world.default").
static func _asset(world: Dictionary, run: Object, sub: String) -> String:
	var world_id := "default"
	if run:
		world_id = String(run.world_id)
	else:
		world_id = String(world.get("id", "default")).trim_prefix("world.")
	return WorldResources.world_asset(world_id, sub)

static func _texture(path: String) -> Texture2D:
	return WorldResources.texture(path)

static func _textured_mat(path: String, tint: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	var tex := _texture(path)
	if tex:
		mat.albedo_texture = tex
		mat.uv1_scale = Vector3(1.0, 1.0, 1.0)
	mat.albedo_color = tint
	mat.roughness = 0.95
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

static func _mat(col: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.95
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

static func _is_passage(edge: Variant) -> bool:
	return typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") in ["open", "door", "one_way"]

static func _current_floor_id(state: Dictionary, world: Dictionary) -> String:
	var fid: Variant = (state.get("map", {}) as Dictionary).get("floorId", null)
	return String(fid) if typeof(fid) == TYPE_STRING and fid != "" else String(world.get("startDungeon", "dungeon.b1f"))

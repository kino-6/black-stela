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
	# `door` remains a walkable edge in the rules. Its visual is a rooted, opened threshold: enough to
	# announce a room boundary without pretending that the player is blocked by a collision the rules do
	# not have. The scenario pack owns the texture; the shared renderer only places it.
	var door_mat := _textured_mat(_asset(world, run, "dungeon/wood-door.jpg"), Color("d2b184"))
	var rendered_doors := {}

	var floor_dungeon := _current_floor_id(state, world)
	for dungeon in world.get("dungeons", []):
		if dungeon.get("id", "") != floor_dungeon:
			continue
		var rooms_by_id := {}
		for room in dungeon.get("rooms", []):
			rooms_by_id[String((room as Dictionary).get("id", ""))] = room
		# 玄室 read as a whole 2×2 ROOM, not a single decorated tile (playtest: "マスではなく2x2の部屋"). A
		# chamberGuardian cell is the ANCHOR (encounter + chest + the one central landmark); its 2×2 walkable
		# block (chosen from the four squares the anchor can corner) is decorated as chamber floor/walls too, so
		# the entire room reads as the 玄室. The map already carves the 2×2 — this makes the render honour it.
		var walkable := {}
		var all_cells: Array = (dungeon.get("grid", {}) as Dictionary).get("cells", [])
		for cell in all_cells:
			walkable["%d,%d" % [int(cell.get("x", 0)), int(cell.get("y", 0))]] = true
		var chamber_block := {}
		var chamber_anchor := {}
		for cell in all_cells:
			var r: Dictionary = rooms_by_id.get(String(cell.get("roomId", "")), {})
			if not bool(r.get("chamberGuardian", false)):
				continue
			var ax := int(cell.get("x", 0))
			var ay := int(cell.get("y", 0))
			chamber_anchor["%d,%d" % [ax, ay]] = true
			chamber_block["%d,%d" % [ax, ay]] = true  # the anchor is always decorated, 2×2 or not
			for q in [[1, 1], [-1, 1], [1, -1], [-1, -1]]:
				var square := [[ax, ay], [ax + q[0], ay], [ax, ay + q[1]], [ax + q[0], ay + q[1]]]
				var square_open := true
				for p in square:
					if not walkable.has("%d,%d" % [p[0], p[1]]):
						square_open = false
						break
				if square_open:
					for p in square:
						chamber_block["%d,%d" % [p[0], p[1]]] = true
					break
		for cell in all_cells:
			var cx := int(cell.get("x", 0))
			var cy := int(cell.get("y", 0))
			var base := Vector3(cx * CELL, 0, cy * CELL)
			var edges: Dictionary = cell.get("edges", {})
			var coord_key := "%d,%d" % [cx, cy]
			# Authored worlds (Verdant marks its 玄室 in data) decorate the ANCHOR's whole 2×2 block and put the
			# single landmark on the anchor; legacy worlds without a chamber palette keep the old shape-derived
			# treatment (a 3-way+ junction), so a dense maze's junctions are not all lit as guardian rooms.
			var use_authored_chambers := pal.has("chamberFloor") or pal.has("chamberWall") or pal.has("chamberAccent")
			var shape_chamber := _is_chamber(edges)
			var chamber_deco := chamber_block.has(coord_key) if use_authored_chambers else shape_chamber
			var landmark_chamber := chamber_anchor.has(coord_key) if use_authored_chambers else shape_chamber
			var wall_height := WALL_H * 1.65 if chamber_deco else WALL_H
			_add_plane(parent, chamber_floor_mat if chamber_deco else floor_mat, base, Vector3(0, 0, 0))
			_add_plane(parent, ceil_mat, base + Vector3(0, wall_height, 0), Vector3(PI, 0, 0))
			for dir in ["north", "south", "east", "west"]:
				var edge: Variant = edges.get(dir, null)
				if not _is_passage(edge):
					_add_wall(parent, chamber_wall_mat if chamber_deco else wall_mat, base, dir, wall_height)
				elif _is_door(edge):
					var door_key := _door_key(cx, cy, dir)
					if not rendered_doors.has(door_key):
						rendered_doors[door_key] = true
						# CLOSED until opened this floor visit (bump-to-open) — a closed door hides the room.
						var opened := (state.get("openedDoors", []) as Array).has("door:%s:%s" % [String(cell.get("roomId", "")), dir])
						_add_door(parent, door_mat, chamber_wall_mat, chamber_accent, base, dir, opened)
			if landmark_chamber:
				# A CLEARED 玄室 (its guarded chest is out, or already claimed) calms its landmark so victory reads
				# at a glance (playtest: the room looked unchanged after the fight).
				var rid := String(cell.get("roomId", ""))
				var cleared := (state.get("floorClaimedTreasures", []) as Array).has(rid)
				if not cleared:
					for ch in state.get("chests", []):
						if String((ch as Dictionary).get("roomId", "")) == rid:
							cleared = true
							break
				_add_chamber_landmarks(parent, base, chamber_floor_mat, chamber_wall_mat, chamber_accent, wall_height, cleared)
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

# A standing BILLBOARD sprite of the stairs, facing the camera. A flat floor decal read as a squashed
# smear from the first-person angle (playtest); an upright sprite shows the art un-distorted.
static func _add_stairs(parent: Node, base: Vector3, tex_path: String) -> void:
	if not ResourceLoader.exists(tex_path):
		return
	var tex: Texture2D = load(tex_path)
	if tex == null:
		return
	var m := MeshInstance3D.new()
	var quad := QuadMesh.new()
	var h := CELL * 0.8
	quad.size = Vector2(h, h)
	m.mesh = quad
	var mat := StandardMaterial3D.new()
	mat.albedo_texture = tex
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.material_override = mat
	m.position = base + Vector3(0, h / 2.0, 0)   # standing on the floor, centred in the cell
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

static func _add_chamber_landmarks(parent: Node, base: Vector3, floor_mat: Material, wall_mat: Material, accent: Color, height: float, cleared: bool = false) -> void:
	# A CLEARED 玄室 dims to a spent grey — the sap-amber ring goes cold once its guardian is beaten, so a
	# room already dealt with reads differently from one still holding a fight (playtest #10A).
	if cleared:
		accent = accent.darkened(0.55)
	# The old treatment was a thin coloured coin plus four full-height columns. Because geometry for every
	# room is visible through open hallways, it read as a forest of green props rather than one special
	# place. A low, constructed floor treatment keeps sightlines open and says "arena / reward room" before
	# the guardian or chest ever appears (the chest itself must remain a post-victory state).
	var foundation := CylinderMesh.new()
	foundation.top_radius = 1.14
	foundation.bottom_radius = 1.18
	foundation.height = 0.055
	_add_mesh(parent, foundation, wall_mat, base + Vector3(0, 0.028, 0))

	# Two flat layers make the accent a SET-IN ring, not a freestanding green disc. A little emission keeps
	# the sap-amber readable under Verdant's canopy light without becoming a glowing pickup or a treasure.
	var inlay := CylinderMesh.new()
	inlay.top_radius = 0.93
	inlay.bottom_radius = 0.93
	inlay.height = 0.024
	_add_mesh(parent, inlay, _emissive_mat(accent, 0.0 if cleared else 0.06), base + Vector3(0, 0.068, 0))
	var centre := CylinderMesh.new()
	centre.top_radius = 0.72
	centre.bottom_radius = 0.72
	centre.height = 0.028
	_add_mesh(parent, centre, floor_mat, base + Vector3(0, 0.083, 0))
	# (No central emissive seal — it read as a "謎の黄色の点" floating in the room, playtest.)
	# The raised ceiling is part of the room's promise, not empty vertical space. Its subdued root-crown
	# echoes the floor seal overhead, so an approaching player reads the chamber before the floor mark is
	# underfoot. It is architectural (flat to the ceiling), never a floating treasure prop.
	var crown := CylinderMesh.new()
	crown.top_radius = 0.98
	crown.bottom_radius = 0.98
	crown.height = 0.035
	_add_mesh(parent, crown, wall_mat, base + Vector3(0, height - 0.035, 0))
	var crown_inlay := CylinderMesh.new()
	crown_inlay.top_radius = 0.68
	crown_inlay.bottom_radius = 0.68
	crown_inlay.height = 0.02
	_add_mesh(parent, crown_inlay, _emissive_mat(accent.darkened(0.20), 0.04), base + Vector3(0, height - 0.063, 0))

	# Root-bound boundary stones replace the sight-blocking columns. They frame the raised ceiling and the
	# battle floor, but stay below a standing character's waist when looked at from the approach corridor.
	for offset in [Vector3(-1.03, 0, -1.03), Vector3(1.03, 0, -1.03), Vector3(-1.03, 0, 1.03), Vector3(1.03, 0, 1.03)]:
		var cairn := CylinderMesh.new()
		cairn.top_radius = 0.13
		cairn.bottom_radius = 0.21
		cairn.height = 0.58
		_add_mesh(parent, cairn, wall_mat, base + offset + Vector3(0, cairn.height / 2.0, 0))
		var cap := CylinderMesh.new()
		cap.top_radius = 0.09
		cap.bottom_radius = 0.13
		cap.height = 0.035
		_add_mesh(parent, cap, _emissive_mat(accent.darkened(0.18), 0.04), base + offset + Vector3(0, cairn.height + cap.height / 2.0, 0))

static func _add_door(parent: Node, door_mat: Material, frame_mat: Material, _accent: Color, base: Vector3, dir: String, opened: bool = true) -> void:
	# A door edge is still traversable by the rules, so draw the two living leaves already pushed aside.
	# The player sees an intentional threshold and can pass through its centre; no state or collision rule is
	# changed here. This is the Godot counterpart of the Web renderer's wood-door material and frame.
	var root := Node3D.new()
	var offset: Vector3 = {
		"north": Vector3(0, 0, -CELL / 2),
		"south": Vector3(0, 0, CELL / 2),
		"east": Vector3(CELL / 2, 0, 0),
		"west": Vector3(-CELL / 2, 0, 0),
	}[dir]
	root.position = base + offset
	match dir:
		"north": root.rotation.y = 0
		"south": root.rotation.y = PI
		"east": root.rotation.y = -PI / 2
		"west": root.rotation.y = PI / 2
	parent.add_child(root)

	# Threshold frame: intentionally broad but not a wall. It makes the entrance read from a distance even
	# when the door texture is dark, while its colour follows the chamber/world palette rather than a UI gold.
	for spec in [
		{"size": Vector3(0.16, 2.58, 0.18), "pos": Vector3(-1.08, 1.29, 0)},
		{"size": Vector3(0.16, 2.58, 0.18), "pos": Vector3(1.08, 1.29, 0)},
		{"size": Vector3(2.32, 0.16, 0.18), "pos": Vector3(0, 2.50, 0)},
	]:
		_add_box(root, spec["size"], frame_mat, spec["pos"])

	# CLOSED (玄室 not yet opened): the two leaves MEET in the centre and fill the threshold, hiding the room
	# beyond — the Wiz "what's behind the door?" beat (bump-to-open swings them aside). OPENED: the leaves are
	# pushed ajar so the cleared room reads as entered and passable.
	for side in [-1.0, 1.0]:
		var leaf := MeshInstance3D.new()
		var slab := BoxMesh.new()
		if opened:
			slab.size = Vector3(0.58, 2.28, 0.09)
			leaf.mesh = slab
			leaf.material_override = door_mat
			leaf.position = Vector3(side * 0.76, 1.14, -0.16)
			leaf.rotation.y = -side * 0.48
		else:
			slab.size = Vector3(1.06, 2.36, 0.12)
			leaf.mesh = slab
			leaf.material_override = door_mat
			leaf.position = Vector3(side * 0.54, 1.18, 0.0)
		root.add_child(leaf)
	# (No centre latch: the emissive amber knob read as a floating yellow orb on the door from the
	#  close first-person camera — removed per playtest. The frame + leaves carry the door read.)

static func _door_key(cx: int, cy: int, dir: String) -> String:
	# Mirror edges describe the same physical threshold. Canonicalising its boundary prevents a doubled
	# texture/frame while still rendering data that marks only one side as `door`.
	match dir:
		"north": return "h:%d:%d" % [cx, cy]
		"south": return "h:%d:%d" % [cx, cy + 1]
		"west": return "v:%d:%d" % [cx, cy]
		_: return "v:%d:%d" % [cx + 1, cy]

static func _is_door(edge: Variant) -> bool:
	return typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "door"

static func _add_mesh(parent: Node, mesh: Mesh, material: Material, pos: Vector3, rot: Vector3 = Vector3.ZERO) -> void:
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	instance.position = pos
	instance.rotation = rot
	parent.add_child(instance)

static func _add_box(parent: Node, dimensions: Vector3, material: Material, pos: Vector3) -> void:
	var box := BoxMesh.new()
	box.size = dimensions
	_add_mesh(parent, box, material, pos)

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

static func _emissive_mat(col: Color, energy: float) -> StandardMaterial3D:
	var mat := _mat(col)
	mat.emission_enabled = true
	mat.emission = col
	mat.emission_energy_multiplier = energy
	return mat

static func _is_passage(edge: Variant) -> bool:
	return typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") in ["open", "door", "one_way"]

static func _current_floor_id(state: Dictionary, world: Dictionary) -> String:
	var fid: Variant = (state.get("map", {}) as Dictionary).get("floorId", null)
	return String(fid) if typeof(fid) == TYPE_STRING and fid != "" else String(world.get("startDungeon", "dungeon.b1f"))

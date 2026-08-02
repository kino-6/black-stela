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

	var pal: Dictionary = _floor_palette(world, state)
	var intro_ash := _current_floor_id(state, world) == "dungeon.b1f" and String(world.get("id", "")).trim_prefix("world.") == "default"
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("15120d") if intro_ash else Color("06070500")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("554834") if intro_ash else Color(String(pal.get("ambient", "2a2620")))
	e.ambient_light_energy = maxf(0.82, float(pal.get("ambientEnergy", 0.55))) if intro_ash else float(pal.get("ambientEnergy", 0.55))
	e.fog_enabled = true
	e.fog_light_color = Color("201a11") if intro_ash else Color(String(pal.get("fog", "0a0b07")))
	e.fog_density = minf(0.035, float(pal.get("fogDensity", 0.10))) if intro_ash else float(pal.get("fogDensity", 0.10))
	env.environment = e
	vp.add_child(env)

	var camera := Camera3D.new()
	camera.fov = 72.0
	camera.near = 0.05
	vp.add_child(camera)

	var torch := OmniLight3D.new()
	torch.light_color = Color(String(pal.get("torch", "ffd9a0")))
	torch.light_energy = 4.4 if intro_ash else 3.2
	torch.omni_range = maxf(11.0, float(pal.get("torchRange", 8.5))) if intro_ash else float(pal.get("torchRange", 8.5))
	torch.omni_attenuation = 1.4
	vp.add_child(torch)

	_build_geometry(vp, world, state, run)
	return {"container": container, "camera": camera, "torch": torch, "rendered_floor": _current_floor_id(state, world)}

static func _build_geometry(parent: Node, world: Dictionary, state: Dictionary, run: Object) -> void:
	var block := _block_textures(state, world, run)
	var pal: Dictionary = _floor_palette(world, state)
	var wall_mat := _textured_mat(block["wall"], Color(String(pal.get("wall", "8a8074"))))
	var floor_mat := _textured_mat(block["floor"], Color(String(pal.get("floor", "6e675c"))))
	# The ceiling is part of the world-owned readability composition, not a fixed near-black mass: a scenario
	# that authors a `ceiling` tone lifts the overhead plane off pure black so depth and corners read from the
	# first-person frame (IMP-055). Falls back to the old dark tint for worlds that omit it.
	var ceil_col := Color(String(pal.get("ceiling", "3a352c")))
	var ceil_mat := _textured_mat(block["wall"], ceil_col)
	# A faint self-lit ceiling reads as an overhead plane even where the floor-level torch doesn't reach — the
	# depth/corner cue — without brightening the walls or floor. Only a scenario that authors `ceiling` opts in;
	# the default keeps its old unlit dark ceiling.
	if pal.has("ceiling"):
		ceil_mat.emission_enabled = true
		ceil_mat.emission = ceil_col
		ceil_mat.emission_energy_multiplier = 0.2
	var chamber_wall_mat := _textured_mat(block["wall"], Color(String(pal.get("chamberWall", "a18e62"))))
	var chamber_accent := Color(String(pal.get("chamberAccent", "c9a765")))
	var chamber_seal_path := _asset(world, run, "dungeon/chamber-floor-seal.png")
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
		# A stairs edge belongs to one physical boundary, even when the reciprocal cell still describes that
		# boundary as a wall.  Rendering cell-local walls independently was what sealed the 3D stair well from
		# the opposite side and made the prop appear pasted onto a wall.
		var stair_boundaries := {}
		for cell in all_cells:
			walkable["%d,%d" % [int(cell.get("x", 0)), int(cell.get("y", 0))]] = true
			var edge_map: Dictionary = cell.get("edges", {})
			for dir in ["north", "south", "east", "west"]:
				if _is_stairs(edge_map.get(dir, null)):
					stair_boundaries[_door_key(int(cell.get("x", 0)), int(cell.get("y", 0)), dir)] = true
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
			# A 玄室 is told apart by its SEALED DOOR and its taller walls — NOT by a recoloured floor. The old
			# chamber floor tint read as a low-quality patch (playtest 2026-07-30: 玄室の床マテリアルは要らない,
			# 閉扉で封じよ), so the floor stays the ordinary stone; the closed entrance carries the "a room to
			# breach" read on its own.
			_add_plane(parent, floor_mat, base, Vector3(0, 0, 0))
			_add_plane(parent, ceil_mat, base + Vector3(0, wall_height, 0), Vector3(PI, 0, 0))
			for dir in ["north", "south", "east", "west"]:
				var edge: Variant = edges.get(dir, null)
				var stair_edge := stair_boundaries.has(_door_key(cx, cy, dir))
				# A DISCOVERED secret reads as an OPENING, not a wall — otherwise a found passage still looked
				# solid and the player kept re-searching it (playtest 2026-07-29: "一度開通した隠し通路は再調査不要").
				# A stair is neither an ordinary passage nor an ordinary wall.  Its renderer builds the narrow
				# well, side masonry, and the actual climb/descent; retaining a full wall here made the stair
				# illustration look like it had grown out of stone.
				if not _is_passage(edge) and not stair_edge and not _is_open_secret(edge, state, String(cell.get("roomId", "")), dir):
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
				_add_chamber_landmarks(parent, base, chamber_wall_mat, chamber_accent, wall_height, cleared, chamber_seal_path)
			# The pack ships stair-up/stair-down art; draw it so a stair cell is VISIBLE in the first-person
			# view instead of a plain dead-end the 階段を使う command only hints at (playtest: asset delivered,
			# never rendered).
			var stair := _stairs_info(cell, floor_dungeon)
			if not stair.is_empty():
				_add_stairs(
					parent,
					base,
					_asset(world, run, "dungeon/stair-%s.png" % String(stair.get("kind", ""))),
					String(stair.get("kind", "")),
					String(stair.get("direction", "north")),
					chamber_wall_mat if chamber_deco else wall_mat,
				)

static func _is_chamber(edges: Dictionary) -> bool:
	var openings := 0
	for dir in ["north", "south", "east", "west"]:
		if _is_passage(edges.get(dir, null)):
			openings += 1
	return openings >= 3

# A cell carries stairs when one of its edges is a `stairs` edge.  Keep the edge direction with the art:
# stairs are a current-cell action in the rules, but visually they must lead to the traversable edge rather
# than sit under the party at the centre of the tile.
static func _stairs_info(cell: Dictionary, floor_id: String) -> Dictionary:
	var depth := _floor_depth(floor_id)
	for dir in ["north", "south", "east", "west"]:
		var edge: Variant = cell.get("edges", {}).get(dir, null)
		if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
			var target := String(edge.get("targetFloorId", ""))
			return {
				"kind": "down" if target != "" and _floor_depth(target) > depth else "up",
				"direction": dir,
			}
	return {}

# Kept as a small compatibility helper for any focused renderer tests or tools that only need the artwork
# choice. New rendering code must use _stairs_info so it does not discard the physical stair direction.
static func _stairs_kind(cell: Dictionary, floor_id: String) -> String:
	return String(_stairs_info(cell, floor_id).get("kind", ""))

static func _floor_depth(floor_id: String) -> int:
	var re := RegEx.new()
	re.compile("[a-zA-Z](\\d+)f")
	var m := re.search(floor_id)
	return int(m.get_string(1)) if m else 0

# The stairs art follows the edge it uses. The rules keep a stair edge as a current-cell action rather than a
# walkable neighbour, so the world still needs its wall plane. Embed both artworks just inside that wall:
# the wall becomes the dark/recessed backing for a downshaft or ladder instead of leaving a black void beyond
# the authored grid. They are fixed to the edge — never billboards — and remain visible when the party stands
# on the stair cell and faces it.
static func _add_stairs(parent: Node, base: Vector3, tex_path: String, kind: String, direction: String, wall_material: Material) -> void:
	# The artwork is deliberately set *inside* a physical opening, rather than nailed onto the end wall. The
	# first-person camera can then look into a descent or up a shaft while the picture supplies the fine root
	# and ladder detail that primitive cylinders cannot.
	var art_material := _stair_art_mat(tex_path)
	var root := Node3D.new()
	root.name = "Stair_%s_%s" % [kind, direction]
	root.set_meta("stair_kind", kind)
	root.set_meta("stair_direction", direction)
	root.set_meta("stair_geometry", "descending_steps" if kind == "down" else "ladder_well")
	var forward := _direction_vector(direction)
	root.position = base + forward * (CELL / 2.0)
	root.rotation.y = _edge_rotation(direction)
	parent.add_child(root)
	_add_stair_well(root, wall_material)
	if kind == "down":
		_add_descending_steps(root, wall_material)
		_add_downshaft_art(root, art_material)
	else:
		_add_ladder_shaft_art(root, art_material)

static func _add_stair_well(root: Node3D, wall_material: Material) -> void:
	# Local -Z goes through the active stair edge for every `_edge_rotation` direction. The outer wall strips,
	# jambs, lintel and dark rear face turn the opening into a shallow, readable shaft instead of a black void.
	var opening := CELL * 0.46
	var depth := CELL * 0.46
	var strip := (CELL - opening) / 2.0
	for side in [-1.0, 1.0]:
		_add_box(root, Vector3(strip, WALL_H, 0.16), wall_material, Vector3(side * (opening / 2.0 + strip / 2.0), WALL_H / 2.0, 0))
		_add_box(root, Vector3(0.18, WALL_H, depth), wall_material, Vector3(side * (opening / 2.0 + 0.09), WALL_H / 2.0, -depth / 2.0))
	_add_box(root, Vector3(opening, 0.18, depth), wall_material, Vector3(0, WALL_H - 0.09, -depth / 2.0))
	_add_box(root, Vector3(opening, WALL_H, 0.14), _mat(Color("11150d")), Vector3(0, WALL_H / 2.0, -depth))

static func _add_descending_steps(root: Node3D, wall_material: Material) -> void:
	# Five shallow, physical treads run away from the party and below the floor line. The resulting parallax is
	# the cue the old vertical billboard could never supply: this route goes DOWN through the edge.
	var tread_depth := 0.26
	var tread_height := 0.19
	for i in 5:
		var top := -0.10 - float(i) * 0.18
		var tread := MeshInstance3D.new()
		tread.name = "StairStep_%d" % i
		var block := BoxMesh.new()
		block.size = Vector3(CELL * 0.42, tread_height, tread_depth)
		tread.mesh = block
		tread.material_override = wall_material
		tread.position = Vector3(0, top - tread_height / 2.0, -0.13 - float(i) * tread_depth)
		root.add_child(tread)

static func _add_downshaft_art(root: Node3D, material: Material) -> void:
	# A descent is seen from above: lay the supplied shaft art across the lowered landing. The picture is not a
	# decal on the front wall; the real treads continue underneath its transparent foliage and give the mouth
	# depth when the player looks down.
	var art := MeshInstance3D.new()
	art.name = "StairArtwork_Downshaft"
	var plane := PlaneMesh.new()
	plane.size = Vector2(CELL * 0.47, CELL * 0.47)
	art.mesh = plane
	art.material_override = material
	art.position = Vector3(0, -0.055, -CELL * 0.30)
	root.add_child(art)

static func _add_ladder_shaft_art(root: Node3D, material: Material) -> void:
	# Looking up is inherently a vertical view. Place the detailed root ladder at the far face of the recessed
	# shaft, framed by real jambs and a lintel, so it reads as a route through the ceiling instead of a poster
	# placed over a solid wall.
	var art := MeshInstance3D.new()
	art.name = "StairArtwork_Ladder"
	var quad := QuadMesh.new()
	quad.size = Vector2(CELL * 0.48, WALL_H * 0.88)
	art.mesh = quad
	art.material_override = material
	# Keep the transparent ladder card in FRONT of the dark backer. At the same depth it was z-fighting with
	# the back wall, which made the shaft appear empty on some Compatibility renderers.
	# Its crown meets the lintel/ceiling instead of floating halfway down the back wall. This establishes the
	# correct direction at a glance: the party climbs up through this root-bound hatch.
	art.position = Vector3(0, WALL_H * 0.58, -CELL * 0.39)
	root.add_child(art)

static func _stair_art_mat(tex_path: String) -> Material:
	var material := StandardMaterial3D.new()
	var tex := _texture(tex_path)
	if tex:
		material.albedo_texture = tex
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	material.roughness = 1.0
	return material

static func _direction_vector(direction: String) -> Vector3:
	return {
		"north": Vector3(0, 0, -1),
		"south": Vector3(0, 0, 1),
		"east": Vector3(1, 0, 0),
		"west": Vector3(-1, 0, 0),
	}.get(direction, Vector3(0, 0, -1))

static func _edge_rotation(direction: String) -> float:
	return {
		"north": 0.0,
		"south": PI,
		"east": -PI / 2.0,
		"west": PI / 2.0,
	}.get(direction, 0.0)

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

static func _add_chamber_landmarks(parent: Node, base: Vector3, wall_mat: Material, accent: Color, height: float, cleared: bool = false, seal_path: String = "") -> void:
	# The old three-cylinder treatment made an oversized, luminous "magic circle" that floated at the bottom
	# of the first-person view. A chamber now has one small, textured stone seal set into its floor: material
	# detail and shallow relief sell an authored architectural place without a portal-like glow.
	_add_chamber_floor_seal(parent, base, seal_path, cleared)
	# The raised ceiling is part of the room's promise, not empty vertical space. Its subdued root-crown
	# echoes the chamber's stonework overhead, so an approaching player reads the room before the floor mark
	# is underfoot. It is architectural (flat to the ceiling), never a floating treasure prop.
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

static func _add_chamber_floor_seal(parent: Node, base: Vector3, seal_path: String, cleared: bool) -> void:
	if seal_path == "":
		return
	# Use the shared loader: an exported build has an imported Texture2D, while a local freshly staged
	# asset may still need the raw-PNG fallback. Checking ResourceLoader here made the seal disappear locally.
	var seal: Texture2D = _texture(seal_path)
	if seal == null:
		return
	var mat := StandardMaterial3D.new()
	mat.albedo_texture = seal
	mat.albedo_color = Color(0.62, 0.62, 0.62, 0.60 if cleared else 0.88)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.roughness = 1.0
	var decal := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	# Stay inside one cell and almost flush with the ordinary floor: this is an inlaid construction detail,
	# not a raised ritual platform or a floor-sized portal.
	plane.size = Vector2(CELL * 0.72, CELL * 0.72)
	decal.mesh = plane
	decal.material_override = mat
	decal.position = base + Vector3(0, 0.012, 0)
	parent.add_child(decal)

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

	# Embed the door in the surrounding WALL so it does not read as a free-standing frame edge-on: fill the
	# header (lintel → ceiling) and the two jamb strips (frame post → cell edge) with wall material, spanning
	# the full cell so it meets the neighbouring walls. Without this the door edge is see-through above and
	# beside the frame from an adjacent cell (playtest 2026-07-29).
	var header_bottom := 2.42 # lintel underside
	_add_box(root, Vector3(CELL, WALL_H - header_bottom, 0.16), frame_mat, Vector3(0, (header_bottom + WALL_H) / 2.0, 0))
	for side in [-1.0, 1.0]:
		_add_box(root, Vector3(CELL / 2.0 - 1.16, header_bottom, 0.16), frame_mat, Vector3(side * (1.16 + CELL / 2.0) / 2.0, header_bottom / 2.0, 0))

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

static func _is_stairs(edge: Variant) -> bool:
	return typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs"

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

# A secret edge that the party has already SEARCHED OUT — it is traversable in the rules
# (rulesEngine.secretRevealed) and so must read as an opening, not a wall.
static func _is_open_secret(edge: Variant, state: Dictionary, room_id: String, dir: String) -> bool:
	if typeof(edge) != TYPE_DICTIONARY or String(edge.get("kind", "")) != "secret":
		return false
	return (state.get("discoveredSecrets", []) as Array).has("secret:%s:%s" % [room_id, dir])

static func _current_floor_id(state: Dictionary, world: Dictionary) -> String:
	var fid: Variant = (state.get("map", {}) as Dictionary).get("floorId", null)
	return String(fid) if typeof(fid) == TYPE_STRING and fid != "" else String(world.get("startDungeon", "dungeon.b1f"))

## The palette to render the CURRENT floor with: the world palette with the current floor's own `palette`
## override merged ON TOP (IMP-063 descent arc). A floor that authors no palette renders exactly as before.
static func _floor_palette(world: Dictionary, state: Dictionary) -> Dictionary:
	var pal: Dictionary = (world.get("palette", {}) as Dictionary).duplicate() if typeof(world.get("palette", null)) == TYPE_DICTIONARY else {}
	var floor_id := _current_floor_id(state, world)
	for dungeon in world.get("dungeons", []):
		if String((dungeon as Dictionary).get("id", "")) != floor_id:
			continue
		var override: Variant = (dungeon as Dictionary).get("palette", null)
		if typeof(override) == TYPE_DICTIONARY:
			for key in (override as Dictionary):
				pal[key] = (override as Dictionary)[key]
		break
	return pal

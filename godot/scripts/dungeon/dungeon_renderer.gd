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

	# Camera framing is tunable per world (palette). Standing in a 3m cell, a wall/door is only 1.5m off
	# and fills the frame; `cameraPullback` slides the eye back toward the cell's rear so the wall, its
	# door frame and the surrounding room read as context instead of a flat plane, and `cameraFov` widens
	# the lens. Both live in data so a scenario can dial its own sense of space without a code change.
	var camera := Camera3D.new()
	camera.fov = float(pal.get("cameraFov", 75.0))
	camera.near = 0.05
	vp.add_child(camera)

	var torch := OmniLight3D.new()
	torch.light_color = Color(String(pal.get("torch", "ffd9a0")))
	torch.light_energy = 4.4 if intro_ash else 3.2
	torch.omni_range = maxf(11.0, float(pal.get("torchRange", 8.5))) if intro_ash else float(pal.get("torchRange", 8.5))
	torch.omni_attenuation = 1.4
	vp.add_child(torch)

	_build_geometry(vp, world, state, run)
	# Keep the pull-back inside the cell (rear wall is CELL/2 = 1.5m back; clamp to 1.2 so the eye never
	# clips through it) and hand it to the scene, which positions the camera per step.
	var pullback: float = clampf(float(pal.get("cameraPullback", 0.55)), 0.0, 1.2)
	return {"container": container, "camera": camera, "torch": torch, "pullback": pullback, "rendered_floor": _current_floor_id(state, world)}

static func _build_geometry(parent: Node, world: Dictionary, state: Dictionary, run: Object) -> void:
	var block := _block_textures(state, world, run)
	var pal: Dictionary = _floor_palette(world, state)
	var wall_mat := _textured_mat(block["wall"], Color(String(pal.get("wall", "8a8074"))))
	var floor_mat := _textured_mat(block["floor"], Color(String(pal.get("floor", "6e675c"))))
	# A flooded floor is authored in the scenario palette rather than inferred from its name.  It remains a
	# walkable grid cell — this local geometry is the visible, shallow water and never changes rules or costs.
	var standing_water: Dictionary = pal.get("standingWater", {}) as Dictionary
	var has_standing_water := not standing_water.is_empty() and float(standing_water.get("depth", 0.0)) > 0.0
	var water_mat: Material = _standing_water_mat(standing_water) if has_standing_water else null
	var water_reflection_mat: Material = _standing_water_reflection_mat(standing_water) if has_standing_water else null
	var waterline_mat: Material = _standing_waterline_mat(standing_water) if has_standing_water else null
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
	# The DOOR FRAME is TEXTURED dark WOOD, not a flat pale stone (a solid colour read as a glowing
	# untextured fallback in-build — playtest 2026-08-03). A darker tint on the same wood texture so the
	# structural surround reads distinct from the lighter leaves, natural, and NEVER glowing; still a broad
	# framed threshold so a closed 玄室 announces a room. A scenario can override the tint via `chamberFrame`.
	var chamber_frame_mat := _textured_mat(_asset(world, run, "dungeon/wood-door.jpg"), Color(String(pal.get("chamberFrame", "8f6f45"))))
	# A sealed GATE (a key/flag-locked way that stays kind "open" in the rules) needs a visible barrier in
	# the first-person view — otherwise the corridor reads as walkable while the party is blocked (#39g; the
	# minimap and the centred message already flag it, the main view must agree). Terminal Line ships a
	# `sealed-door.jpg` (its 退避シャッター); a world without one falls back to a flat metal tint.
	var barrier_mat := _textured_mat(_asset(world, run, "dungeon/sealed-door.jpg"), Color(String(pal.get("barrier", "6b6f74"))))
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
			var room: Dictionary = rooms_by_id.get(String(cell.get("roomId", "")), {})
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
			if has_standing_water:
				_add_standing_water(parent, water_mat, water_reflection_mat, base, cx, cy, standing_water)
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
					if has_standing_water:
						_add_standing_waterline(parent, waterline_mat, base, dir, float(standing_water.get("waterline", 0.18)))
				elif _is_door(edge):
					var door_key := _door_key(cx, cy, dir)
					if not rendered_doors.has(door_key):
						rendered_doors[door_key] = true
						# CLOSED until opened this floor visit (bump-to-open) — a closed door hides the room.
						var opened := (state.get("openedDoors", []) as Array).has("door:%s:%s" % [String(cell.get("roomId", "")), dir])
						# A door that opens INTO a 玄室 (this cell or the cell beyond is chamber-decorated) is drawn
						# as a GRAND portal — near full-height, a bolder architrave — so a sealed guardian room reads
						# as one from the corridor head-on, not the HUD-hidden floor seal (Codex 2026-08-03 玄室 NG).
						var ndelta: Vector2i = {"north": Vector2i(0, -1), "south": Vector2i(0, 1), "east": Vector2i(1, 0), "west": Vector2i(-1, 0)}[dir]
						var neighbor_key := "%d,%d" % [cx + ndelta.x, cy + ndelta.y]
						var grand_door := use_authored_chambers and (chamber_block.has(coord_key) or chamber_block.has(neighbor_key))
						_add_door(parent, door_mat, chamber_frame_mat, chamber_wall_mat, chamber_accent, base, dir, opened, grand_door)
				# Close the clerestory over a chamber's OPEN boundaries: the raised ceiling leaves an unroofed
				# strip above a normal-height neighbour that rendered as black void (playtest 2026-08-14「天井が
				# 真っ黒」). A bulkhead from the neighbour height up to the chamber's seals it; the passage below
				# stays open. Skip boundaries to ANOTHER chamber cell (same height — a bulkhead there would wall
				# the room's interior in two).
				if chamber_deco and wall_height > WALL_H:
					var passable := _is_passage(edge) or stair_edge or _is_open_secret(edge, state, String(cell.get("roomId", "")), dir)
					if passable:
						var bd: Vector2i = {"north": Vector2i(0, -1), "south": Vector2i(0, 1), "east": Vector2i(1, 0), "west": Vector2i(-1, 0)}[dir]
						if not chamber_block.has("%d,%d" % [cx + bd.x, cy + bd.y]):
							_add_wall_band(parent, chamber_wall_mat if chamber_deco else wall_mat, base, dir, WALL_H, wall_height)
				# A sealed gate on a walkable edge draws a barrier across the opening so the 3D view stops
				# reading as an open corridor (#39g「開いて見えるのに固く閉ざされている」).
				if _is_passage(edge) and _gate_closed(room, dir, state):
					_add_barrier(parent, barrier_mat, base, dir, wall_height)
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
			var stair := _stairs_info(cell, floor_dungeon, room)
			if not stair.is_empty():
				_add_stairs(
					parent,
					base,
					_asset(world, run, "dungeon/stair-%s.png" % String(stair.get("kind", ""))),
					String(stair.get("kind", "")),
					String(stair.get("direction", "north")),
					chamber_wall_mat if chamber_deco else wall_mat,
				)
			# A marker-style return is deliberately not an up-stair: Terminal Line uses an emergency phone/call
			# point as its authored way home.  It still needs a visible object in the first-person world.  Leaving
			# it to the minimap made the approach read as an unexplained ordinary dead-end (playtest 2026-08-11).
			var return_marker := _return_marker_info(cell, room)
			if not return_marker.is_empty():
				_add_return_marker(
					parent,
					base,
					_asset(world, run, "dungeon/return-marker.png"),
					String(return_marker.get("direction", "north")),
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
static func _stairs_info(cell: Dictionary, floor_id: String, room: Dictionary = {}) -> Dictionary:
	var depth := _floor_depth(floor_id)
	for dir in ["north", "south", "east", "west"]:
		var edge: Variant = cell.get("edges", {}).get(dir, null)
		if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
			var target := String(edge.get("targetFloorId", ""))
			return {
				"kind": "down" if target != "" and _floor_depth(target) > depth else "up",
				"direction": dir,
				"target": target,  # "" = an up-stair that exits to TOWN (vs a shallower floor)
			}
	# A room whose way home is a STAIRCASE (stairsToTown + returnStyle "stairs" — every floor's entrance)
	# carries no stairs EDGE, only the flag. Draw the up-stair art anyway so the return is VISIBLE in the
	# first-person view, not merely offered by the 帰還 command (playtest 2026-08-05: 1F の街へ帰還する階段が画面
	# から消えている). A returnStyle "marker" (a planted rest-point marker) is NOT a staircase — no stair art.
	if bool(room.get("stairsToTown", false)) and String(room.get("returnStyle", "stairs")) != "marker":
		return {"kind": "up", "direction": _first_wall_dir(cell), "target": ""}
	return {}

# `returnStyle: marker` is an authored object such as Terminal Line's emergency phone, rather than a stair.
# Mount it on the wall opposite the approach corridor whenever possible.  That gives the player a clear
# destination after entering the one-cell cul-de-sac, while preserving the rules distinction from a staircase.
static func _return_marker_info(cell: Dictionary, room: Dictionary = {}) -> Dictionary:
	if not bool(room.get("stairsToTown", false)) or String(room.get("returnStyle", "stairs")) != "marker":
		return {}
	var edges: Dictionary = cell.get("edges", {})
	for direction in ["north", "south", "east", "west"]:
		if not _is_passage(edges.get(direction, null)):
			continue
		var facing := _opposite_direction(direction)
		if not _is_passage(edges.get(facing, null)):
			return {"direction": facing}
	return {"direction": _first_wall_dir(cell)}

static func _opposite_direction(direction: String) -> String:
	return {
		"north": "south",
		"south": "north",
		"east": "west",
		"west": "east",
	}.get(direction, "south")

# The wall an edgeless town-return staircase embeds into: the first solid (non-passage) side, preferring the
# SOUTH wall (entrances face south by convention, so the way home reads as behind the party). The shaft is
# deliberately an edge structure: no centre-cell placard may detach the staircase from this opening.
static func _first_wall_dir(cell: Dictionary) -> String:
	var edges: Dictionary = cell.get("edges", {})
	for dir in ["south", "north", "east", "west"]:
		if not _is_passage(edges.get(dir, null)):
			return dir
	return "south"

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
	# A lamp INSIDE the well (both descent and ascent): without it the recess sits beyond torch reach and the
	# opening renders as a flat black rectangle at any distance (the recurring「黒い板」). Lighting it turns the
	# void into a visibly-lit passage — the treads/ladder and the stair art read as stairs from down the corridor.
	var glow := OmniLight3D.new()
	glow.name = "StairWellLight"
	glow.position = Vector3(0, WALL_H * (0.28 if kind == "down" else 0.5), -CELL * 0.28)
	glow.omni_range = CELL * 1.35
	glow.omni_attenuation = 1.4
	glow.light_energy = 1.6
	glow.light_color = Color("ffe9c2")
	root.add_child(glow)
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
	# The rear wall is deliberately a dim continuation of the dungeon material. Pure black made an ordinary
	# stair landing read as a missing render surface, especially in Terminal Line's light tile corridors.
	var rear_material := wall_material.duplicate() as StandardMaterial3D
	rear_material.albedo_color *= Color("565a58")
	_add_box(root, Vector3(opening, WALL_H, 0.14), rear_material, Vector3(0, WALL_H / 2.0, -depth))

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
	# The supplied descent art is a view down a stairwell.  It is an inset at the opening's floor level: the
	# threshold and physical treads give it a real frame, while the artwork supplies the close, readable depth.
	# A tilted version was still occluded by the lip from the normal first-person eye level.
	var art := MeshInstance3D.new()
	art.name = "StairArtwork_Downshaft"
	var plane := PlaneMesh.new()
	plane.size = Vector2(CELL * 0.42, CELL * 0.48)
	art.mesh = plane
	art.material_override = material
	# This local depth is measured in metres, not cells.  Multiplying by CELL placed the inset beyond the
	# rear wall — the precise cause of the apparent empty black shaft in Terminal Line.
	art.position = Vector3(0, 0.025, -0.62)
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

# Build a shallow, wall-mounted call point instead of a 2D card in the centre of the cell.  The terminal-line
# source art has a chroma-green generation backdrop; the dedicated material keys only that backdrop while
# retaining clean-alpha source assets used by the other worlds.
static func _add_return_marker(parent: Node, base: Vector3, tex_path: String, direction: String, _wall_material: Material) -> void:
	var root := Node3D.new()
	root.name = "ReturnMarker_%s" % direction
	root.set_meta("return_marker", true)
	root.set_meta("return_marker_direction", direction)
	var forward := _direction_vector(direction)
	root.position = base + forward * (CELL / 2.0 - 0.035)
	root.rotation.y = _edge_rotation(direction)
	parent.add_child(root)

	var artwork := MeshInstance3D.new()
	artwork.name = "ReturnMarkerArtwork"
	var quad := QuadMesh.new()
	quad.size = Vector2(CELL * 0.56, WALL_H * 0.82)
	artwork.mesh = quad
	artwork.material_override = _return_marker_art_mat(tex_path)
	# The supplied object already includes a bolted mounting plate and a floor base.  Do not add a full dark
	# rectangle behind it: in bright Terminal Line corridors that read as a new black panel, not installed gear.
	# Local +Z faces the party; local -Z sits against the end wall.
	artwork.position = Vector3(0, WALL_H * 0.41, 0.012)
	root.add_child(artwork)

static func _return_marker_art_mat(tex_path: String) -> Material:
	var texture := _texture(tex_path)
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode unshaded, cull_disabled, depth_prepass_alpha;
uniform sampler2D marker_texture : source_color;
void fragment() {
	vec4 sampled = texture(marker_texture, UV);
	// Only remove the saturated green chroma backdrop present in the Terminal Line source image.  Existing
	// transparent PNGs retain their original alpha because their dark/neutral pixels do not satisfy this key.
	float chroma_green = step(sampled.r * 1.25 + 0.08, sampled.g) * step(sampled.b * 1.25 + 0.08, sampled.g);
	ALBEDO = sampled.rgb;
	ALPHA = sampled.a * (1.0 - chroma_green);
}
"""
	var material := ShaderMaterial.new()
	material.shader = shader
	if texture:
		material.set_shader_parameter("marker_texture", texture)
	return material

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

# `standingWater` is deliberately static, local geometry: a subdued sheet over an authored floor, a few
# dim lamp streaks, and a wall-base stain.  It is not a simulation, never ticks, and never creates a bright
# fullscreen effect.  That keeps a flooded platform legible without turning its ambience into a CPU cost.
static func _standing_water_mat(water: Dictionary) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(String(water.get("tint", "183942")), 0.78)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.metallic = 0.34
	mat.roughness = 0.22
	mat.emission_enabled = true
	mat.emission = Color(String(water.get("tint", "183942")))
	mat.emission_energy_multiplier = 0.05
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

static func _standing_water_reflection_mat(water: Dictionary) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(String(water.get("reflection", "9db8b2")), 0.13)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.emission_enabled = true
	mat.emission = Color(String(water.get("reflection", "9db8b2")))
	mat.emission_energy_multiplier = 0.12
	mat.roughness = 0.16
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

static func _standing_waterline_mat(water: Dictionary) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	var base := Color(String(water.get("tint", "183942")))
	mat.albedo_color = Color(base.r * 0.72, base.g * 0.82, base.b * 0.86, 0.56)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.roughness = 0.9
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	return mat

static func _add_standing_water(parent: Node, material: Material, reflection_material: Material, base: Vector3, cx: int, cy: int, water: Dictionary) -> void:
	var depth := clampf(float(water.get("depth", 0.035)), 0.01, 0.12)
	var surface := MeshInstance3D.new()
	surface.name = "FloodSurface_%d_%d" % [cx, cy]
	var plane := PlaneMesh.new()
	# Leave a hairline at the tile joints.  The player still reads construction beneath the water rather than
	# an opaque coloured slab pasted across the maze.
	plane.size = Vector2(CELL * 0.985, CELL * 0.985)
	surface.mesh = plane
	surface.material_override = material
	surface.position = base + Vector3(0, depth, 0)
	parent.add_child(surface)

	# A single, low-luminance broken reflection per second tile makes the extinguished platform lamps read on
	# water without a moving shader, a broad HUD-crossing beam, or hundreds of particles.  Offset by cell
	# parity so it does not form a marching regular grid.
	if posmod(cx * 3 + cy * 5, 2) == 0:
		var reflection := MeshInstance3D.new()
		reflection.name = "FloodReflection_%d_%d" % [cx, cy]
		var streak := PlaneMesh.new()
		streak.size = Vector2(0.10, CELL * (0.54 if posmod(cx + cy, 3) == 0 else 0.36))
		reflection.mesh = streak
		reflection.material_override = reflection_material
		reflection.position = base + Vector3((0.46 if posmod(cx, 2) == 0 else -0.36), depth + 0.003, 0.06)
		reflection.rotation.y = 0.09 if posmod(cy, 2) == 0 else -0.06
		parent.add_child(reflection)

static func _add_standing_waterline(parent: Node, material: Material, base: Vector3, dir: String, height: float) -> void:
	var line_height := clampf(height, 0.05, 0.5)
	var m := MeshInstance3D.new()
	m.name = "FloodWaterline_%d_%d_%s" % [int(base.x / CELL), int(base.z / CELL), dir]
	var quad := QuadMesh.new()
	quad.size = Vector2(CELL, line_height)
	m.mesh = quad
	m.material_override = material
	var off: Vector3 = {
		"north": Vector3(0, line_height / 2.0 + 0.008, -CELL / 2.0 - 0.006),
		"south": Vector3(0, line_height / 2.0 + 0.008, CELL / 2.0 + 0.006),
		"east": Vector3(CELL / 2.0 + 0.006, line_height / 2.0 + 0.008, 0),
		"west": Vector3(-CELL / 2.0 - 0.006, line_height / 2.0 + 0.008, 0),
	}[dir]
	m.position = base + off
	match dir:
		"north": m.rotation.y = 0
		"south": m.rotation.y = PI
		"east": m.rotation.y = -PI / 2.0
		"west": m.rotation.y = PI / 2.0
	parent.add_child(m)

## A CLERESTORY bulkhead — a wall segment spanning only y_from→y_to, used to close the vertical gap a
## raised 玄室 ceiling opens over a normal-height neighbour (the floor-level passage stays open below it).
## Without it the strip above the neighbour's ceiling rendered as a black void overhead (playtest 2026-08-14).
static func _add_wall_band(parent: Node, mat: Material, base: Vector3, dir: String, y_from: float, y_to: float) -> void:
	var band := y_to - y_from
	if band <= 0.001:
		return
	var m := MeshInstance3D.new()
	m.name = "ClerestoryBulkhead_%s" % dir
	var quad := QuadMesh.new()
	quad.size = Vector2(CELL, band)
	m.mesh = quad
	m.material_override = mat
	var mid := (y_from + y_to) / 2.0
	var off: Vector3 = {
		"north": Vector3(0, mid, -CELL / 2),
		"south": Vector3(0, mid, CELL / 2),
		"east": Vector3(CELL / 2, mid, 0),
		"west": Vector3(-CELL / 2, mid, 0),
	}[dir]
	m.position = base + off
	match dir:
		"north": m.rotation.y = 0
		"south": m.rotation.y = PI
		"east": m.rotation.y = -PI / 2
		"west": m.rotation.y = PI / 2
	parent.add_child(m)

## A barrier across a sealed gate's opening — a wall-height panel set slightly INTO the cell so it never
## z-fights a reciprocal gate's panel on the shared boundary. Named so a gate can prove the way is drawn shut.
static func _add_barrier(parent: Node, mat: Material, base: Vector3, dir: String, height: float = WALL_H) -> void:
	var m := MeshInstance3D.new()
	m.name = "SealedBarrier_%s" % dir
	var quad := QuadMesh.new()
	quad.size = Vector2(CELL, height)
	m.mesh = quad
	m.material_override = mat
	var inset := 0.06
	var off: Vector3 = {
		"north": Vector3(0, height / 2, -CELL / 2 + inset),
		"south": Vector3(0, height / 2, CELL / 2 - inset),
		"east": Vector3(CELL / 2 - inset, height / 2, 0),
		"west": Vector3(-CELL / 2 + inset, height / 2, 0),
	}[dir]
	m.position = base + off
	match dir:
		"north": m.rotation.y = 0
		"south": m.rotation.y = PI
		"east": m.rotation.y = -PI / 2
		"west": m.rotation.y = PI / 2
	parent.add_child(m)

## A sealed gate on `dir` (a key/flag not yet met) — the same predicate the rules block on
## (exploration_commands._find_gate / _is_gate_open) and the minimap draws its lock bar from.
static func _gate_closed(room: Dictionary, dir: String, state: Dictionary) -> bool:
	for gate in room.get("gates", []):
		if typeof(gate) != TYPE_DICTIONARY or String(gate.get("direction", "")) != dir:
			continue
		if String(gate.get("kind", "")) == "shortcut":
			continue
		var key_id: Variant = gate.get("requiredKeyId", null)
		if typeof(key_id) == TYPE_STRING and key_id != "":
			var held := false
			for item in state.get("inventory", []):
				if String(item.get("id", "")) == key_id and int(item.get("quantity", 0)) > 0:
					held = true
					break
			if not held:
				return true
		var flag: Variant = gate.get("requiredFlag", null)
		if typeof(flag) == TYPE_STRING and flag != "" and not (state.get("discoveredSecrets", []) as Array).has(flag):
			return true
	return false

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

static func _add_chamber_landmarks(parent: Node, base: Vector3, wall_mat: Material, _accent: Color, height: float, cleared: bool = false, seal_path: String = "") -> void:
	# A chamber reads as a room from its STRUCTURE — a raised stone ceiling crown and low boundary cairns of
	# the same chamber stone, plus a muted floor seal — not from any coloured/emissive accent. Every accent
	# inlay and overhead glow that used to sit here read as an "unexplained green object" (Codex NG #2/#3
	# 2026-08-03), so the accent is no longer drawn at all; only neutral stonework remains.
	_add_chamber_floor_seal(parent, base, seal_path, cleared)
	# The raised ceiling is part of the room's promise, not empty vertical space. Its subdued root-crown
	# echoes the chamber's stonework overhead, so an approaching player reads the room before the floor mark
	# is underfoot. It is architectural (flat to the ceiling), never a floating treasure prop.
	# The overhead crown is plain chamber STONE, flat to the ceiling — no emissive inlay. The pale green
	# glowing disk that used to sit here read as an "unexplained green object" growing from under the HUD
	# (Codex NG #3 2026-08-03); it is removed entirely. The room reads from its structure (raised ceiling,
	# stone frame), not an overhead light.
	var crown := CylinderMesh.new()
	crown.top_radius = 0.98
	crown.bottom_radius = 0.98
	crown.height = 0.035
	_add_mesh(parent, crown, wall_mat, base + Vector3(0, height - 0.035, 0))

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
		# Dark neutral STONE cap, not an emissive accent — the glow read as a coloured prop (Codex NG #3).
		_add_mesh(parent, cap, wall_mat, base + offset + Vector3(0, cairn.height + cap.height / 2.0, 0))

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
	# Subtler still (playtest "green object"): a touch more transparent so it reads as an inlaid detail flush
	# with the floor, not a placed disk. Codex art-lane owns the final visual sign-off on the real build.
	mat.albedo_color = Color(0.62, 0.62, 0.62, 0.52 if cleared else 0.74)
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

static func _add_door(parent: Node, door_mat: Material, frame_mat: Material, wall_mat: Material, _accent: Color, base: Vector3, dir: String, opened: bool = true, grand: bool = false) -> void:
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
	# A broad WOODEN door surround (jambs + lintel) standing slightly proud of the wall (z = -0.05) so the
	# threshold reads as a framed doorway head-on — enough to announce a room, without the stone keystone that
	# read as odd/glowing on a wood frame (playtest 2026-08-03).
	#
	# A 玄室 threshold is a STURDIER, slightly taller door (~1.1–1.2× a normal one) — a heftier wood-and-stone
	# frame that says "a built room" without becoming a boss castle-gate. An earlier pass reached the corridor
	# ceiling and read as a face/monument (Codex NG #3 2026-08-03); this keeps the lintel well below the ceiling
	# so it stays a repeatable door, not staging. Still WOOD, no glow.
	var jamb_t := 0.26 if grand else 0.22   # jamb thickness (across the opening)
	var jamb_h := 2.86 if grand else 2.62   # jamb height (~1.09×)
	var jamb_d := 0.28 if grand else 0.24   # jamb depth (proud of the wall)
	var jamb_x := 1.08 if grand else 1.06   # jamb centre off the opening centreline
	var lintel_w := 2.52 if grand else 2.40
	var lintel_h := 0.30 if grand else 0.26
	var lintel_d := 0.30 if grand else 0.26
	var lintel_y := 2.80 if grand else 2.55  # lintel top (2.95) sits clear below the 3.2m ceiling — not a gate
	for spec in [
		{"size": Vector3(jamb_t, jamb_h, jamb_d), "pos": Vector3(-jamb_x, jamb_h / 2.0, -0.05)},   # left jamb
		{"size": Vector3(jamb_t, jamb_h, jamb_d), "pos": Vector3(jamb_x, jamb_h / 2.0, -0.05)},     # right jamb
		{"size": Vector3(lintel_w, lintel_h, lintel_d), "pos": Vector3(0, lintel_y, -0.05)},        # lintel beam
	]:
		_add_box(root, spec["size"], frame_mat, spec["pos"])

	# Embed the door in the surrounding WALL so it does not read as a free-standing frame edge-on: fill the
	# header (lintel → ceiling) and the two jamb strips (frame post → cell edge) with WALL material (not the
	# pale frame stone — otherwise a pale patch floats in the vine wall). Spans the full cell so it meets the
	# neighbouring walls (playtest 2026-07-29: door edge was see-through above/beside the frame).
	var header_bottom := lintel_y - lintel_h / 2.0 # lintel underside
	_add_box(root, Vector3(CELL, WALL_H - header_bottom, 0.16), wall_mat, Vector3(0, (header_bottom + WALL_H) / 2.0, 0))
	var jamb_outer := jamb_x + jamb_t / 2.0
	for side in [-1.0, 1.0]:
		_add_box(root, Vector3(CELL / 2.0 - jamb_outer, header_bottom, 0.16), wall_mat, Vector3(side * (jamb_outer + CELL / 2.0) / 2.0, header_bottom / 2.0, 0))

	# CLOSED (玄室 not yet opened): the two leaves MEET in the centre and fill the threshold, hiding the room
	# beyond — the Wiz "what's behind the door?" beat (bump-to-open swings them aside). OPENED: the leaves are
	# pushed ajar so the cleared room reads as entered and passable.
	# Grand leaves rise with the taller opening so a sealed 玄室 door fills its imposing frame.
	var leaf_h := 2.58 if grand else 2.36
	var leaf_y := leaf_h / 2.0 + 0.02
	for side in [-1.0, 1.0]:
		var leaf := MeshInstance3D.new()
		var slab := BoxMesh.new()
		if opened:
			slab.size = Vector3(0.58, leaf_h - 0.08, 0.09)
			leaf.mesh = slab
			leaf.material_override = door_mat
			leaf.position = Vector3(side * (0.80 if grand else 0.76), leaf_y - 0.02, -0.16)
			leaf.rotation.y = -side * 0.48
		else:
			slab.size = Vector3(1.04 if grand else 1.06, leaf_h, 0.12)
			leaf.mesh = slab
			leaf.material_override = door_mat
			leaf.position = Vector3(side * (0.52 if grand else 0.54), leaf_y, 0.0)
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

# Floor 10 is the true-clear layer; it owns block4 rather than reusing the Act III block3 set.
# React uses the same depth map: >=10 -> block4, >=7 -> block3, >=4 -> block2, >=1 -> block1.
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
	if depth >= 10:
		suffix = "-block4"
	elif depth >= 7:
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

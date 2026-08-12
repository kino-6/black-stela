extends SceneTree
## D10 regression gate: a floor authored as shallow standing water must render that water in first person.
## Names/prose alone previously called Terminal Line F2 flooded while the visible dungeon remained dry tile.
## Usage: godot --headless --path godot/ --script res://tests/verify_flooded_platform_render.gd

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")

func _initialize() -> void:
	var failures := 0
	var terminal := _read_world("terminal-line")
	var f2 := _floor(terminal, "dungeon.tl2f")
	var water: Dictionary = (f2.get("palette", {}) as Dictionary).get("standingWater", {})
	if water.is_empty() or float(water.get("depth", 0.0)) <= 0.0:
		print("[flood-render] terminal-line F2 must author standingWater with a positive shallow depth")
		failures += 1
	else:
		failures += _verify_flooded_floor(terminal, f2)
	# Flooding is authored per floor, not silently inferred from a world name or copied into every scene.
	for sample in [{"world": "terminal-line", "floor": "dungeon.tl1f"}, {"world": "default", "floor": "dungeon.b1f"}, {"world": "verdant", "floor": "dungeon.g1f"}]:
		var world := _read_world(String(sample["world"]))
		var floor := _floor(world, String(sample["floor"]))
		if not floor.is_empty():
			failures += _verify_dry_floor(world, floor)
	print("")
	if failures == 0:
		print("[flood-render] PASS — F2 has local shallow water, reflections, and wall-base waterlines; dry floors stay dry")
		quit(0)
	else:
		print("[flood-render] FAIL — %d problem(s)" % failures)
		quit(1)

func _verify_flooded_floor(world: Dictionary, floor: Dictionary) -> int:
	var state := _state_for(floor)
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(1280, 720))
	var container: Node = built.get("container", null)
	if container == null:
		print("[flood-render] F2 renderer returned no container")
		return 1
	var expected := ((floor.get("grid", {}) as Dictionary).get("cells", []) as Array).size()
	var surfaces := _count_prefixed(container, "FloodSurface_")
	var reflections := _count_prefixed(container, "FloodReflection_")
	var waterlines := _count_prefixed(container, "FloodWaterline_")
	var first_surface := _find_prefixed(container, "FloodSurface_") as MeshInstance3D
	container.queue_free()
	var errors := 0
	if surfaces != expected:
		print("[flood-render] F2 expected %d water surfaces, got %d" % [expected, surfaces]); errors += 1
	if reflections == 0 or waterlines == 0:
		print("[flood-render] F2 needs subdued reflections and wall-base waterlines (reflections=%d waterlines=%d)" % [reflections, waterlines]); errors += 1
	var material := first_surface.material_override as StandardMaterial3D if first_surface else null
	if material == null or material.transparency != BaseMaterial3D.TRANSPARENCY_ALPHA or material.albedo_color.a >= 0.95:
		print("[flood-render] F2 water surface must be a transparent shallow overlay, not an opaque floor replacement"); errors += 1
	return errors

func _verify_dry_floor(world: Dictionary, floor: Dictionary) -> int:
	var built: Dictionary = DungeonRenderer.build(world, _state_for(floor), null, Vector2(1280, 720))
	var container: Node = built.get("container", null)
	if container == null:
		return 1
	var wet := _count_prefixed(container, "FloodSurface_") + _count_prefixed(container, "FloodReflection_") + _count_prefixed(container, "FloodWaterline_")
	container.queue_free()
	if wet != 0:
		print("[flood-render] dry %s unexpectedly rendered %d water node(s)" % [floor.get("id", ""), wet])
		return 1
	return 0

func _state_for(floor: Dictionary) -> Dictionary:
	var cells: Array = (floor.get("grid", {}) as Dictionary).get("cells", [])
	var first: Dictionary = cells[0] if not cells.is_empty() else {}
	return {
		"phase": "dungeon", "combat": null,
		"position": {"cellId": String(first.get("id", "")), "roomId": String(first.get("roomId", "")), "facing": "north"},
		"map": {"floorId": String(floor.get("id", ""))}, "party": [], "chests": [],
	}

func _floor(world: Dictionary, floor_id: String) -> Dictionary:
	for floor in world.get("dungeons", []):
		if String((floor as Dictionary).get("id", "")) == floor_id:
			return floor
	return {}

func _read_world(world_id: String) -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/%s.json" % world_id))
	return parsed.get("world", {}) if typeof(parsed) == TYPE_DICTIONARY else {}

func _count_prefixed(node: Node, prefix: String) -> int:
	var total := 1 if String(node.name).begins_with(prefix) else 0
	for child in node.get_children():
		total += _count_prefixed(child, prefix)
	return total

func _find_prefixed(node: Node, prefix: String) -> Node:
	if String(node.name).begins_with(prefix):
		return node
	for child in node.get_children():
		var found := _find_prefixed(child, prefix)
		if found != null:
			return found
	return null

extends SceneTree
## U6 regression gate: a stair cell must render a stairhead marker at the CELL CENTRE, so the stairs are
## visible in the first-person view from ANY facing (the old edge-only geometry vanished when the party
## stood on the cell facing away from the stair edge — playtest bug). Headless: inspects the built node
## tree, no render needed. Runs for every world so the fix stays world-independent.
##   godot --headless --path godot/ --script res://tests/verify_stairs_render.gd

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")

func _initialize() -> void:
	var failures := 0
	for world_id in ["default", "verdant", "terminal-line"]:
		var world: Dictionary = _read_json("res://data/worlds/%s.json" % world_id).get("world", {})
		if world.is_empty():
			print("[stairs-render] %s: world not found" % world_id); failures += 1; continue
		var found := false
		# Find the first stairs cell on any floor and build the geometry standing on it.
		for dungeon in world.get("dungeons", []):
			for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
				if not _has_stairs(cell):
					continue
				found = true
				if not _cell_renders_marker(world, world_id, dungeon, cell):
					failures += 1
				break
			if found:
				break
		if not found:
			print("[stairs-render] %s: no stairs cell to test" % world_id)
	print("")
	if failures == 0:
		print("[stairs-render] PASS — every world renders a centre stairhead on a stair cell (visible any facing)")
		quit(0)
	else:
		print("[stairs-render] FAIL — %d problem(s)" % failures)
		quit(1)

func _cell_renders_marker(world: Dictionary, world_id: String, dungeon: Dictionary, cell: Dictionary) -> bool:
	var state := {
		"phase": "dungeon",
		"combat": null,
		"position": {"cellId": String(cell.get("id", "")), "roomId": String(cell.get("roomId", "")), "facing": "north"},
		"map": {"floorId": String(dungeon.get("id", ""))},
		"party": [],
		"chests": [],
	}
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(1280, 720))
	var container: Node = built.get("container", null)
	if container == null:
		print("[stairs-render] %s: build returned no container" % world_id)
		return false
	var marker := _find_node_prefixed(container, "StairFloor_")
	container.queue_free()
	if marker == null:
		print("[stairs-render] %s: stair cell %s rendered NO centre stairhead (only-when-facing-edge regression)" % [world_id, cell.get("id", "")])
		return false
	print("[stairs-render] %s: stair cell renders %s at centre" % [world_id, marker.name])
	return true

func _has_stairs(cell: Dictionary) -> bool:
	for dir in ["north", "south", "east", "west"]:
		var edge: Variant = (cell.get("edges", {}) as Dictionary).get(dir, null)
		if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
			return true
	return false

func _find_node_prefixed(node: Node, prefix: String) -> Node:
	if String(node.name).begins_with(prefix):
		return node
	for child in node.get_children():
		var hit := _find_node_prefixed(child, prefix)
		if hit != null:
			return hit
	return null

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var p: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return p if typeof(p) == TYPE_DICTIONARY else {}

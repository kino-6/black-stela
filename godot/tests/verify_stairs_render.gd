extends SceneTree
## D5 regression gate: stairs must be embedded in their authored edge.  The previous cure for an
## edge-only stair added a tall centre-cell cage with two crossed art cards; it rendered as floating black
## rectangles, not a staircase. Headless: inspect the built node tree in every world.
##   godot --headless --path godot/ --script res://tests/verify_stairs_render.gd

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")

func _initialize() -> void:
	var failures := 0
	for world_id in ["default", "verdant", "terminal-line"]:
		var world: Dictionary = _read_json("res://data/worlds/%s.json" % world_id).get("world", {})
		if world.is_empty():
			print("[stairs-render] %s: world not found" % world_id); failures += 1; continue
		var found := 0
		# Every authored stair and return landmark matters. The old gate stopped after the first F1 stair in each
		# world, so an F2+ staircase could regress into an ordinary wall while the suite remained green. Include
		# room-only town-return stairs and marker-style returns: they carry no `stairs` edge but must still have a
		# visible physical reason for the player to use them.
		for dungeon in world.get("dungeons", []):
			for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
				var room := _room(world, String(cell.get("roomId", "")))
				var stair := DungeonRenderer._stairs_info(cell, String(dungeon.get("id", "")), room)
				var return_marker := DungeonRenderer._return_marker_info(cell, room)
				if stair.is_empty() and return_marker.is_empty():
					continue
				found += 1
				if not _cell_renders_landmark(world, world_id, dungeon, cell, stair, return_marker):
					failures += 1
		if found == 0:
			print("[stairs-render] %s: no stairs cell to test" % world_id)
		else:
			print("[stairs-render] %s: checked %d stair/return cell(s)" % [world_id, found])
	print("")
	if failures == 0:
		print("[stairs-render] PASS — every authored stair/return stays physical, with no floating centre card")
		quit(0)
	else:
		print("[stairs-render] FAIL — %d problem(s)" % failures)
		quit(1)

func _cell_renders_landmark(world: Dictionary, world_id: String, dungeon: Dictionary, cell: Dictionary, stair: Dictionary, return_marker: Dictionary) -> bool:
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
	var landmark_name := "Stair_%s_%s" % [String(stair.get("kind", "")), String(stair.get("direction", ""))]
	var expected_art := ""
	if stair.is_empty():
		landmark_name = "ReturnMarker_%s" % String(return_marker.get("direction", ""))
		expected_art = "ReturnMarkerArtwork"
	var edge_landmark := _find_node_named(container, landmark_name)
	var landmark_art := _find_node_named(container, expected_art) if expected_art != "" else null
	container.queue_free()
	if marker != null:
		print("[stairs-render] %s: stair cell %s rendered forbidden floating centre marker %s" % [world_id, cell.get("id", ""), marker.name])
		return false
	if edge_landmark == null:
		print("[stairs-render] %s: landmark cell %s rendered no edge landmark %s" % [world_id, cell.get("id", ""), landmark_name])
		return false
	if expected_art != "" and landmark_art == null:
		print("[stairs-render] %s: marker cell %s rendered no visible marker art" % [world_id, cell.get("id", "")])
		return false
	if expected_art != "":
		var art_material := landmark_art.material_override as ShaderMaterial
		if art_material == null or art_material.get_shader_parameter("marker_texture") == null:
			print("[stairs-render] %s: marker cell %s has no bound return-marker texture" % [world_id, cell.get("id", "")])
			return false
	print("[stairs-render] %s: landmark cell renders %s at its authored edge" % [world_id, landmark_name])
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

func _find_node_named(node: Node, wanted: String) -> Node:
	if String(node.name) == wanted:
		return node
	for child in node.get_children():
		var hit := _find_node_named(child, wanted)
		if hit != null:
			return hit
	return null

func _room(world: Dictionary, room_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		for room in (dungeon as Dictionary).get("rooms", []):
			if String((room as Dictionary).get("id", "")) == room_id:
				return room
	return {}

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var p: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return p if typeof(p) == TYPE_DICTIONARY else {}

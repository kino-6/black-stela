extends SceneTree
## D9 visual proof — map a real contiguous F1 path from the entrance to the reported service hatch.
## The capture intentionally uses adjacent grid edges only: no stairs, shortcut, or teleport is permitted.
## Usage: godot --path godot/ --script res://tests/capture_terminal_line_f1_walk.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture_terminal_line_f1_walk] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var world: Dictionary = run.world
	var path := _path(world, "cell.tl1f.entrance", "cell.tl1f.service-hatch")
	if path.size() < 2:
		push_error("[capture_terminal_line_f1_walk] no adjacent F1 entrance-to-service-hatch path")
		quit(1)
		return
	var rooms := _room_ids(world, path)
	var last_id := String(path.back())
	var last_cell := _cell(world, last_id)
	var state: Dictionary = run.state.duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": last_id, "roomId": last_cell["roomId"], "facing": "west"}
	state["map"] = {
		"floorId": "dungeon.tl1f", "currentCellId": last_id, "currentRoomId": last_cell["roomId"], "currentFacing": "west",
		"visitedCells": path, "visitedRooms": rooms, "knownExits": {}, "blockedExits": {}, "secretCandidates": {},
	}
	run.state = state
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 10:
		await process_frame
	dungeon._toggle_full_map()
	for i in 4:
		await process_frame
	get_root().get_texture().get_image().save_png("res://tests/_terminal_line_f1_contiguous_walk.png")
	print("[capture_terminal_line_f1_walk] PASS -> res://tests/_terminal_line_f1_contiguous_walk.png")
	quit(0)

func _path(world: Dictionary, from_id: String, to_id: String) -> Array:
	var cells := {}
	for floor in world.get("dungeons", []):
		if String(floor.get("id", "")) == "dungeon.tl1f":
			for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
				cells[String(cell.get("id", ""))] = cell
	var queue: Array = [from_id]
	var parent := {from_id: ""}
	while not queue.is_empty():
		var current := String(queue.pop_front())
		if current == to_id:
			break
		for edge in (cells[current].get("edges", {}) as Dictionary).values():
			if typeof(edge) != TYPE_DICTIONARY or String(edge.get("kind", "")) not in ["open", "door", "one_way"]:
				continue
			var next_id := String(edge.get("targetCellId", ""))
			if cells.has(next_id) and not parent.has(next_id):
				parent[next_id] = current
				queue.append(next_id)
	if not parent.has(to_id):
		return []
	var out: Array = []
	var cursor := to_id
	while cursor != "":
		out.push_front(cursor)
		cursor = String(parent.get(cursor, ""))
	return out

func _cell(world: Dictionary, cell_id: String) -> Dictionary:
	for floor in world.get("dungeons", []):
		for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
			if String(cell.get("id", "")) == cell_id:
				return cell
	return {}

func _room_ids(world: Dictionary, cell_ids: Array) -> Array:
	var out := []
	for cell_id in cell_ids:
		var room_id := String(_cell(world, String(cell_id)).get("roomId", ""))
		if room_id != "" and not out.has(room_id):
			out.append(room_id)
	return out

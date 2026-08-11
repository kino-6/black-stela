extends SceneTree
## D8 visual proof — use Terminal Line's real F2 emergency-phone return point, re-enter from town,
## use the real F1→F2 stair rule, then capture F2's full map.  The pre-return F2 cells must remain
## visible; the active floor changes what is DRAWN, never what the player has learned.
## Usage: godot --path godot/ --script res://tests/capture_return_map_persistence.gd

const DungeonEntry := preload("res://scripts/rules/dungeon_entry.gd")
const SliceRules := preload("res://scripts/rules/slice_rules.gd")

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture_return_map_persistence] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var world: Dictionary = run.world
	var f1_stair := _cell_for_room(world, "room.tl1f.down-stair")
	var f2_phone := _cell_for_room(world, "room.tl2f.return-marker")
	var f2_stair := _cell_for_room(world, "room.tl2f.up-stair")
	if f1_stair.is_empty() or f2_phone.is_empty() or f2_stair.is_empty():
		push_error("[capture_return_map_persistence] required Terminal Line stair/return cells are missing")
		quit(1)
		return
	var f2_path := _cell_path(world, "cell.tl2f.platform-landing", String(f2_phone["id"]))
	if f2_path.is_empty():
		push_error("[capture_return_map_persistence] F2 platform-to-phone path is missing")
		quit(1)
		return

	# This is the real return command from the F2 emergency phone, with a small but non-trivial F2 record.
	# `SliceRules` is the exact command path the dock calls; no synthetic mutation follows it.
	var departed: Dictionary = run.state.duplicate(true)
	departed["phase"] = "dungeon"
	departed["combat"] = null
	departed["position"] = {"cellId": f2_phone["id"], "roomId": "room.tl2f.return-marker", "facing": "east"}
	departed["map"] = {
		"floorId": "dungeon.tl2f", "currentCellId": f2_phone["id"], "currentRoomId": "room.tl2f.return-marker", "currentFacing": "east",
		"visitedCells": [f1_stair["id"], f2_stair["id"]] + f2_path,
		"visitedRooms": ["room.tl1f.down-stair", "room.tl2f.up-stair"] + _room_ids_for_cells(world, f2_path),
		"knownExits": {"room.tl2f.return-marker": ["west"]}, "blockedExits": {}, "secretCandidates": {},
	}
	var returned: Dictionary = SliceRules.resolve(departed, {"type": "return_to_town"}, world, run.engine).get("state", {})
	if String(returned.get("phase", "")) != "town":
		push_error("[capture_return_map_persistence] emergency phone did not return to town")
		quit(1)
		return

	# Town re-entry plans F1.  Stand at its authored down-stair and use the same rule the dungeon command
	# dispatches; this returns to F2 where the overlay below proves the earlier F2 record survived.
	var reentry: Dictionary = DungeonEntry.plan(returned, world)
	reentry["phase"] = "dungeon"
	reentry["position"] = {"cellId": f1_stair["id"], "roomId": "room.tl1f.down-stair", "facing": "east"}
	reentry["map"]["currentCellId"] = f1_stair["id"]
	reentry["map"]["currentRoomId"] = "room.tl1f.down-stair"
	reentry["map"]["currentFacing"] = "east"
	var revisited: Dictionary = SliceRules.resolve(reentry, {"type": "use_stairs"}, world, run.engine).get("state", {})
	if String((revisited.get("position", {}) as Dictionary).get("roomId", "")) != "room.tl2f.platform-landing":
		push_error("[capture_return_map_persistence] F1 down stair did not re-enter F2")
		quit(1)
		return
	if not (revisited.get("map", {}) as Dictionary).get("visitedCells", []).has(f2_phone["id"]):
		push_error("[capture_return_map_persistence] F2 phone cell was lost after town re-entry")
		quit(1)
		return

	run.state = revisited.duplicate(true)
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 10:
		await process_frame
	dungeon._toggle_full_map()
	for i in 4:
		await process_frame
	var image := get_root().get_texture().get_image()
	image.save_png("res://tests/_terminal_line_return_map_persist.png")
	print("[capture_return_map_persistence] PASS -> res://tests/_terminal_line_return_map_persist.png")
	quit(0)

func _cell_for_room(world: Dictionary, room_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if String(cell.get("roomId", "")) == room_id:
				return cell
	return {}

func _cell_path(world: Dictionary, from_id: String, to_id: String) -> Array:
	var by_id := {}
	for dungeon in world.get("dungeons", []):
		if String(dungeon.get("id", "")) != "dungeon.tl2f":
			continue
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			by_id[String(cell.get("id", ""))] = cell
	var queue: Array = [from_id]
	var parent := {from_id: ""}
	while not queue.is_empty():
		var current := String(queue.pop_front())
		if current == to_id:
			break
		var cell: Dictionary = by_id.get(current, {})
		for edge in (cell.get("edges", {}) as Dictionary).values():
			var next_id := String((edge as Dictionary).get("targetCellId", "")) if typeof(edge) == TYPE_DICTIONARY else ""
			if next_id != "" and by_id.has(next_id) and not parent.has(next_id):
				parent[next_id] = current
				queue.append(next_id)
	if not parent.has(to_id):
		return []
	var path: Array = []
	var cursor := to_id
	while cursor != "":
		path.push_front(cursor)
		cursor = String(parent.get(cursor, ""))
	return path

func _room_ids_for_cells(world: Dictionary, cell_ids: Array) -> Array:
	var ids := {}
	for dungeon in world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell_ids.has(String(cell.get("id", ""))):
				ids[String(cell.get("roomId", ""))] = true
	return ids.keys()

extends SceneTree
## D10 visual proof: capture the actual F2 first-person surface, under the normal HUD.
## Usage: godot --path godot/ --script res://tests/capture_terminal_line_flooded_platform.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture_flooded_platform] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 10:
		await process_frame
	# Use the centre of the ordinary platform route, not the return-phone alcove: this proof is about standing
	# water under normal traversal, rather than the separate D5 landmark.
	var cell := _cell_for_room(run.world, "room.tl2f.c8_8")
	if cell.is_empty():
		# Corridors are generated room IDs; fall back to the authored platform bay if a future seed changes it.
		cell = _cell_for_room(run.world, "room.tl2f.platform-bay")
	var room_id := String(cell.get("roomId", ""))
	var state: Dictionary = run.state.duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": String(cell.get("id", "")), "roomId": room_id, "facing": "north"}
	state["map"] = {"floorId": "dungeon.tl2f", "currentCellId": String(cell.get("id", "")), "currentRoomId": room_id, "currentFacing": "north", "visitedCells": [String(cell.get("id", ""))], "visitedRooms": [room_id], "knownExits": {}, "secretCandidates": {}, "blockedExits": {}}
	run.state = state.duplicate(true)
	dungeon._state = state
	dungeon._rendered_floor = ""
	dungeon._rebuild_dock()
	dungeon._update_view(false)
	for i in 5:
		await process_frame
	var image := get_root().get_texture().get_image()
	image.save_png("res://tests/_terminal_line_f2_flooded_platform.png")
	print("[capture_flooded_platform] %s -> res://tests/_terminal_line_f2_flooded_platform.png (%dx%d)" % [room_id, image.get_width(), image.get_height()])
	quit(0)

func _cell_for_room(world: Dictionary, room_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		for cell in ((dungeon as Dictionary).get("grid", {}) as Dictionary).get("cells", []):
			if String((cell as Dictionary).get("roomId", "")) == room_id:
				return cell
	return {}

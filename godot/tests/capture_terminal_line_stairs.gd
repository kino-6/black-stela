extends SceneTree
## D5 visual proof: face Terminal Line's real F1/F2 stair edges. The stairs must be recessed openings
## in their authored walls, with no centre-cell placard/cage/cards.
## Usage: godot --path godot/ --script res://tests/capture_terminal_line_stairs.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture_terminal_line_stairs] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 10:
		await process_frame
	await _capture(dungeon, run, "dungeon.tl1f", "room.tl1f.down-stair", "east", "Downshaft", "_terminal_line_f1_stairs.png")
	await _capture(dungeon, run, "dungeon.tl2f", "room.tl2f.up-stair", "east", "Ladder", "_terminal_line_f2_up_stairs.png")
	await _capture(dungeon, run, "dungeon.tl2f", "room.tl2f.down-stair", "north", "Downshaft", "_terminal_line_f2_down_stairs.png")
	# The reported F2 screen faces east from this corridor into the one-cell return alcove.  Capture that exact
	# approach, rather than only standing on ordinary stair cells: a return marker must have a visible phone/call
	# point in the first-person world, not just a minimap dot.
	await _capture(dungeon, run, "dungeon.tl2f", "room.tl2f.c16_17", "east", "ReturnMarkerArtwork", "_terminal_line_f2_return_marker.png")
	quit(0)

func _capture(dungeon: Node, run: Node, floor_id: String, room_id: String, facing: String, art_kind: String, output: String) -> void:
	var cell := _cell_for_room(run.world, room_id)
	if cell.is_empty():
		push_error("[capture_terminal_line_stairs] %s cell is missing" % room_id)
		return
	var state: Dictionary = run.state.duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": String(cell.get("id", "")), "roomId": room_id, "facing": facing}
	state["map"] = {
		"floorId": floor_id, "currentCellId": String(cell.get("id", "")), "currentRoomId": room_id, "currentFacing": facing,
		"visitedCells": [String(cell.get("id", ""))], "visitedRooms": [room_id], "knownExits": {}, "secretCandidates": {}, "blockedExits": {},
	}
	# Keep the scene and the shared run on exactly the same fixture. `Node.call()` deferred this update in an
	# earlier harness revision, so a later F2 capture occasionally wrote the previous stair camera under the
	# return-marker filename.
	run.state = state.duplicate(true)
	dungeon._state = state
	dungeon._rendered_floor = ""
	dungeon._rebuild_dock()
	dungeon._update_view(false)
	for i in 4:
		await process_frame
	var art_name := "StairArtwork_%s" % art_kind
	if art_kind == "ReturnMarkerArtwork":
		art_name = art_kind
	var art := dungeon.find_child(art_name, true, false) as MeshInstance3D
	if art:
		print("[capture_terminal_line_stairs] %s art=%s pos=%s local=%s parent=%s" % [room_id, art_name, art.global_position, art.position, art.get_parent().global_position])
	else:
		push_error("[capture_terminal_line_stairs] %s is missing for %s" % [art_name, room_id])
	var image := get_root().get_texture().get_image()
	image.save_png("res://tests/%s" % output)
	print("[capture_terminal_line_stairs] -> res://tests/%s (%dx%d)" % [output, image.get_width(), image.get_height()])

func _cell_for_room(world: Dictionary, room_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		for cell in ((dungeon as Dictionary).get("grid", {}) as Dictionary).get("cells", []):
			if String((cell as Dictionary).get("roomId", "")) == room_id:
				return cell
	return {}

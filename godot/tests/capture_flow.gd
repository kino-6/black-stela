extends SceneTree
## End-to-end VISUAL proof of the loop's spine: load the dungeon, step forward through the ported rules
## into the authored ash-slime room, and screenshot AFTER the scene hands off — the shot should show the
## combat stage with the same six-member party. Under this SceneTree the autoloads aren't started, so the
## combat scene rebuilds the encounter from the fixture (the same Encounter.begin path the dungeon fires).
## Usage: godot --path godot/ --script res://tests/capture_flow.gd

func _initialize() -> void:
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 8:
		await process_frame
	# The exploration trace begins after the tutorial encounter, so make this
	# visual harness explicitly stand on the real stair landing.  A capture that
	# calls one move from the trace position walks to the gate instead of combat,
	# then falsely saves a dungeon screenshot as `_flow_combat.png`.
	var state: Dictionary = dungeon.get("_state")
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": "cell.b1f.001", "roomId": "room.b1f.001", "facing": "south"}
	state["map"] = {
		"floorId": "dungeon.b1f", "currentCellId": "cell.b1f.001", "currentRoomId": "room.b1f.001",
		"currentFacing": "south", "visitedCells": ["cell.b1f.001"], "visitedRooms": ["room.b1f.001"],
		"knownExits": {}, "secretCandidates": {}, "blockedExits": {},
	}
	dungeon.set("_state", state)
	dungeon.call("_update_view", false)
	for i in 4:
		await process_frame
	_shot("res://tests/_flow_dungeon.png")

	if not dungeon.has_method("step_forward"):
		push_error("[capture_flow] dungeon has no step_forward()")
		quit(1)
		return
	await dungeon.step_forward() # room.001 -> room.002 -> authored ash-slime -> combat scene
	for i in 12:
		await process_frame
	var current: Node = current_scene
	if current == null or not String(current.scene_file_path).ends_with("combat.tscn"):
		push_error("[capture_flow] expected the live combat scene after the tutorial step, got %s" % ("none" if current == null else current.scene_file_path))
		quit(1)
		return
	_shot("res://tests/_flow_combat.png")
	quit(0)

func _shot(out_path: String) -> void:
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[capture_flow] -> %s (%dx%d)" % [out_path, img.get_width(), img.get_height()])

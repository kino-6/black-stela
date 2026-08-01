extends SceneTree
## Player-visible stair review in the real dungeon scene. Each capture stands ON the authored Verdant stair
## cell, faces its stairs edge, and proves that the landmark remains in front of the player rather than
## disappearing below the first-person camera. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_stairs.gd
##
## Writes tests/_ux_stairs-down.png and tests/_ux_stairs-up.png. These are ignored review artifacts.

const WORLD_PATH := "res://data/worlds/verdant.json"

func _initialize() -> void:
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 8:
		await process_frame

	var world := _read_world()
	if world.is_empty():
		push_error("[stairs] cannot load Verdant world")
		quit(1)
		return
	# The scene was first instantiated from the Default run; align the run-owned asset root with the world
	# override as normal scenario selection does, so this capture uses Verdant's ladder-and-roots artwork.
	var run: Node = dungeon.get("_run")
	if run:
		run.set("world_id", "verdant")
	dungeon.set("_world", world)

	# G1F's west edge descends to G2F; G2F's matching west edge climbs back. Both use the real runtime HUD,
	# camera, assets and floor palette, not a synthetic 3D-only composition.
	await _capture(dungeon, "dungeon.verdant.g1f", "cell.verdant.g1f.exit", "room.verdant.g1f.exit", "_ux_stairs-down.png")
	await _capture(dungeon, "dungeon.verdant.g2f", "cell.verdant.g2f.001", "room.verdant.g2f.001", "_ux_stairs-up.png")
	dungeon.queue_free()
	quit(0)

func _capture(dungeon: Node, floor_id: String, cell_id: String, room_id: String, output: String) -> void:
	var state: Dictionary = (dungeon.get("_state") as Dictionary).duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": cell_id, "roomId": room_id, "facing": "west"}
	state["map"] = {
		"floorId": floor_id, "currentCellId": cell_id, "currentRoomId": room_id, "currentFacing": "west",
		"visitedCells": [cell_id], "visitedRooms": [room_id], "knownExits": {}, "secretCandidates": {}, "blockedExits": {},
	}
	dungeon.set("_state", state)
	dungeon.set("_rendered_floor", "")
	dungeon.call("_update_view", false)
	for i in 8:
		await process_frame
	var img := get_root().get_texture().get_image()
	if img == null:
		push_error("[stairs] NULL image — re-run WITHOUT --headless")
		return
	img.save_png("res://tests/" + output)
	print("[stairs] wrote tests/%s (%dx%d)" % [output, img.get_width(), img.get_height()])

func _read_world() -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(WORLD_PATH))
	return (parsed as Dictionary).get("world", {}) if typeof(parsed) == TYPE_DICTIONARY else {}

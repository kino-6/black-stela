extends SceneTree
## Native visual-review capture for the Verdant chamber art lane. It stands the party one cell south of
## G1F's central guardian room and faces into it, so the room treatment is judged at the actual approach
## distance rather than from an editor camera. Usage:
##   godot --path godot/ --script res://tests/capture_verdant_chamber_visual.gd -- /absolute/output.png [g1f|g2f|g3f]

const RunScript := preload("res://scripts/run_state.gd")

func _initialize() -> void:
	var out := "res://tests/_verdant_chamber_visual.png"
	var args := OS.get_cmdline_user_args()
	if not args.is_empty():
		out = String(args[0])
	var floor_suffix := String(args[1]) if args.size() > 1 else "g1f"

	var run := get_root().get_node_or_null("Run")
	if run == null:
		run = RunScript.new()
		run.name = "Run"
		get_root().add_child(run)
	run.world_id = "verdant"
	run.reset()

	var floor_id := "dungeon.verdant.%s" % floor_suffix
	# G1F's centre guardian chamber is fixed to preserve the committed before/after framing. Other floors
	# choose a real guardian room and stand one walkable cell outside it, facing through its threshold.
	var position := _approach_for(run.world, floor_id)
	if position.is_empty():
		push_error("[verdant-chamber-visual] no guardian-room approach for %s" % floor_id)
		quit(1)
		return
	run.state["phase"] = "dungeon"
	run.state["combat"] = null
	run.state["position"] = position
	run.state["map"] = {
		"floorId": floor_id,
		"currentCellId": position["cellId"],
		"currentRoomId": position["roomId"],
		"currentFacing": position["facing"],
		"visitedCells": [position["cellId"]],
		"visitedRooms": [position["roomId"]],
		"knownExits": {},
	}

	var scene := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(scene)
	for _frame in 18:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[verdant-chamber-visual] null image; run without --headless")
		quit(1)
		return
	var error := image.save_png(out)
	if error != OK:
		push_error("[verdant-chamber-visual] could not save %s (%s)" % [out, error_string(error)])
		quit(1)
		return
	print("[verdant-chamber-visual] %s (%dx%d)" % [out, image.get_width(), image.get_height()])
	quit(0)

func _approach_for(world: Dictionary, floor_id: String) -> Dictionary:
	if floor_id == "dungeon.verdant.g1f":
		return {"cellId": "cell.verdant.g1f.c9_10", "roomId": "room.verdant.g1f.c9_10", "facing": "north"}
	var dungeon: Dictionary = {}
	for candidate in world.get("dungeons", []):
		if String((candidate as Dictionary).get("id", "")) == floor_id:
			dungeon = candidate
			break
	if dungeon.is_empty():
		return {}
	var rooms := {}
	var cells := {}
	for room in dungeon.get("rooms", []):
		rooms[String((room as Dictionary).get("id", ""))] = room
	for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
		cells[String((cell as Dictionary).get("id", ""))] = cell
	for cell in cells.values():
		var room: Dictionary = rooms.get(String((cell as Dictionary).get("roomId", "")), {})
		if not bool(room.get("chamberGuardian", false)):
			continue
		var edges: Dictionary = cell.get("edges", {})
		for direction in ["south", "north", "east", "west"]:
			var edge: Variant = edges.get(direction, null)
			if typeof(edge) != TYPE_DICTIONARY or not (String(edge.get("kind", "")) in ["open", "door", "one_way"]):
				continue
			var approach: Dictionary = cells.get(String(edge.get("targetCellId", "")), {})
			if approach.is_empty():
				continue
			return {
				"cellId": String(approach.get("id", "")),
				"roomId": String(approach.get("roomId", "")),
				"facing": {"south": "north", "north": "south", "east": "west", "west": "east"}[direction],
			}
	return {}

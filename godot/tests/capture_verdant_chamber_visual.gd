extends SceneTree
## Native visual-review capture for the Verdant 玄室 (guardian chamber) art lane. Codex 2026-08-03: the old
## G1F FIXED point looked at an OPEN edge, so it never proved T2 "fought at the door". This harness now finds
## a real DOOR/SECRET-choked chamber DYNAMICALLY and shoots the two frames a reviewer needs:
##   1) CLOSED door seen head-on from one cell outside (does it read as a SEALED battle room?)
##   2) one step INSIDE after the door opens (does the interior read as a room, guardian included?)
## Both are dungeon renders at the true approach distance. Usage (writes <out>-closed.png and <out>-inside.png):
##   godot --path godot/ --script res://tests/capture_verdant_chamber_visual.gd -- /absolute/out.png [g1f|g2f|g3f]

const RunScript := preload("res://scripts/run_state.gd")
const OPP := {"south": "north", "north": "south", "east": "west", "west": "east"}

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out := String(args[0]) if not args.is_empty() else "res://tests/_verdant_chamber_visual.png"
	var floor_suffix := String(args[1]) if args.size() > 1 else "g1f"

	var run := get_root().get_node_or_null("Run")
	if run == null:
		run = RunScript.new()
		run.name = "Run"
		get_root().add_child(run)
	run.world_id = "verdant"
	run.reset()

	var floor_id := "dungeon.verdant.%s" % floor_suffix
	var app := _door_approach(run.world, floor_id)
	if app.is_empty():
		push_error("[verdant-chamber-visual] no DOOR-choked guardian chamber on %s" % floor_id)
		quit(1)
		return

	# Shot 1: outside the chamber, facing the CLOSED door (nothing opened yet).
	if not await _capture(run, floor_id, app["approachCellId"], app["approachRoomId"], app["facing"], [], _suffix(out, "closed")):
		return
	# Shot 2: one step INSIDE the guardian cell, the door now opened behind, facing into the room.
	var opened := ["door:%s:%s" % [app["chamberRoomId"], app["doorDir"]]]
	if not await _capture(run, floor_id, app["chamberCellId"], app["chamberRoomId"], app["facing"], opened, _suffix(out, "inside")):
		return
	quit(0)

func _suffix(path: String, tag: String) -> String:
	var dot := path.rfind(".")
	return (path.substr(0, dot) + "-" + tag + path.substr(dot)) if dot > 0 else (path + "-" + tag + ".png")

func _capture(run: Node, floor_id: String, cell_id: String, room_id: String, facing: String, opened_doors: Array, out: String) -> bool:
	run.state["phase"] = "dungeon"
	run.state["combat"] = null
	run.state["openedDoors"] = opened_doors
	run.state["position"] = {"cellId": cell_id, "roomId": room_id, "facing": facing}
	run.state["map"] = {
		"floorId": floor_id, "currentCellId": cell_id, "currentRoomId": room_id, "currentFacing": facing,
		"visitedCells": [cell_id], "visitedRooms": [room_id], "knownExits": {},
	}
	var scene := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(scene)
	for _frame in 20:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[verdant-chamber-visual] null image; run without --headless")
		quit(1)
		return false
	var err := image.save_png(out)
	scene.queue_free()
	for _frame in 2:
		await process_frame
	if err != OK:
		push_error("[verdant-chamber-visual] could not save %s (%s)" % [out, error_string(err)])
		quit(1)
		return false
	print("[verdant-chamber-visual] %s (%dx%d)" % [out, image.get_width(), image.get_height()])
	return true

# Find a guardian chamber whose NAMED cell is entered through a DOOR/SECRET (the T2 choke), and the corridor
# cell one step outside it — so the capture looks straight at the sealed threshold, never an open flank.
func _door_approach(world: Dictionary, floor_id: String) -> Dictionary:
	var dungeon: Dictionary = {}
	for candidate in world.get("dungeons", []):
		if String((candidate as Dictionary).get("id", "")) == floor_id:
			dungeon = candidate
			break
	if dungeon.is_empty():
		return {}
	var cells := {}
	var rooms := {}
	for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
		cells[String((cell as Dictionary).get("id", ""))] = cell
	for room in dungeon.get("rooms", []):
		rooms[String((room as Dictionary).get("id", ""))] = room
	for cell in cells.values():
		var room: Dictionary = rooms.get(String((cell as Dictionary).get("roomId", "")), {})
		if not bool(room.get("chamberGuardian", false)):
			continue
		var edges: Dictionary = cell.get("edges", {})
		for direction in ["south", "north", "east", "west"]:
			var edge: Variant = edges.get(direction, null)
			if typeof(edge) != TYPE_DICTIONARY or not (String(edge.get("kind", "")) in ["door", "secret"]):
				continue
			var approach: Dictionary = cells.get(String(edge.get("targetCellId", "")), {})
			if approach.is_empty():
				continue
			return {
				"chamberCellId": String(cell.get("id", "")),
				"chamberRoomId": String(cell.get("roomId", "")),
				"approachCellId": String(approach.get("id", "")),
				"approachRoomId": String(approach.get("roomId", "")),
				"doorDir": direction,
				"facing": OPP[direction],  # from the corridor, look back through the door toward the chamber
			}
	return {}

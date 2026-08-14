extends SceneTree
## DETECTION (2026-08-15, user「階段が見えない/消失」#29/#41/#43, 4x): verify_stairs_render only proved a
## stair/return NODE is BUILT — not that the party can SEE it. A landmark placed on a wall the party never
## faces (or rendered invisibly) passed every gate while「階段がないよ」in play. This boots the REAL
## first-person view at each landmark cell, faces the landmark, and asserts its node projects ON-SCREEN in
## front of the camera. The played build finally has a gate for "can you actually see the way up/down".
## Usage: godot --path godot/ --script res://tests/verify_landmark_visibility.gd   (NO --headless: needs a real viewport)

const DR := preload("res://scripts/dungeon/dungeon_renderer.gd")

var _fail := 0
var _checked := 0

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	for world_id in ["terminal-line", "verdant"]:
		await _check_world(world_id)
	print("[landmark-vis] %s — %d landmark(s) checked, %d not visible" % ["PASS" if _fail == 0 else "FAIL", _checked, _fail])
	quit(1 if _fail > 0 else 0)

func _check_world(world_id: String) -> void:
	var run := get_root().get_node_or_null("Run")
	run.world_id = world_id
	run.reset()
	var world: Dictionary = run.world
	for dungeon in world.get("dungeons", []):
		var rooms := {}
		for r in dungeon.get("rooms", []):
			rooms[String(r.get("id", ""))] = r
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			var room: Dictionary = rooms.get(String(cell.get("roomId", "")), {})
			var facing := _landmark_facing(cell, String(dungeon.get("id", "")), room)
			if facing == "":
				continue
			await _check_landmark(run, world_id, dungeon, cell, room, facing)

# The direction the party looks to SEE the way up/down/home: a stairs edge's own direction, or the
# renderer's placement dir for an edgeless town-return stair / marker.
func _landmark_facing(cell: Dictionary, floor_id: String, room: Dictionary) -> String:
	var stair: Dictionary = DR._stairs_info(cell, floor_id, room)
	if not stair.is_empty():
		return String(stair.get("direction", ""))
	var marker: Dictionary = DR._return_marker_info(cell, room)
	if not marker.is_empty():
		return String(marker.get("direction", ""))
	return ""

func _check_landmark(run: Node, world_id: String, dungeon: Dictionary, cell: Dictionary, room: Dictionary, facing: String) -> void:
	var cid := String(cell.get("id", ""))
	var state: Dictionary = run.state.duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": cid, "roomId": String(cell.get("roomId", "")), "facing": facing}
	state["map"] = {"floorId": String(dungeon.get("id", "")), "visitedCells": [cid], "visitedRooms": [String(cell.get("roomId", ""))], "knownExits": {}, "blockedExits": {}, "secretCandidates": {}}
	run.state = state
	var d := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(d)
	for _i in 10:
		await process_frame
	_checked += 1
	var cam: Camera3D = d._camera
	# The landmark node FOR THIS CELL — a floor can hold several (entrance + return + down-stair), so match
	# the one nearest the party's cell, not just the first in the tree.
	var base := Vector3(int(cell.get("x", 0)) * 3.0, 0.0, int(cell.get("y", 0)) * 3.0)
	var node: Node3D = _landmark_node(d, base)
	var label := "%s %s facing %s" % [world_id, cid, facing]
	if node == null:
		_fail += 1
		push_error("[landmark-vis] NO landmark node built: %s" % label)
	elif cam == null:
		_fail += 1
		push_error("[landmark-vis] no camera: %s" % label)
	else:
		# Project the VISIBLE mid-height of the landmark (its art sits ~half a wall up), not the node root at
		# floor level — the root always projects at/below the frame bottom and is not what the player sees.
		var pos: Vector3 = node.global_position + Vector3(0, 1.6, 0)
		var vp: Vector2 = cam.get_viewport().get_visible_rect().size
		if cam.is_position_behind(pos):
			_fail += 1
			push_error("[landmark-vis] landmark is BEHIND the camera even when faced: %s" % label)
		else:
			var sp: Vector2 = cam.unproject_position(pos)
			# Must land in the central band, not a sliver at the extreme edge (which reads as "no stair").
			if sp.x < vp.x * 0.12 or sp.x > vp.x * 0.88 or sp.y < 0.0 or sp.y > vp.y:
				_fail += 1
				push_error("[landmark-vis] landmark projects OFF-SCREEN (%.0f,%.0f in %.0fx%.0f): %s" % [sp.x, sp.y, vp.x, vp.y, label])
	d.queue_free()
	for _i in 3:
		await process_frame

# The landmark node closest to `near` (the party cell), within one cell — so multi-landmark floors match
# the right one instead of the first in the tree.
func _landmark_node(root: Node, near: Vector3) -> Node3D:
	var best: Node3D = null
	var best_d := 3.0   # within one cell (CELL=3)
	var stack: Array = [root]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		if n is Node3D and (String(n.name).begins_with("Stair_") or String(n.name).begins_with("ReturnMarker_")):
			var d := Vector2((n as Node3D).global_position.x - near.x, (n as Node3D).global_position.z - near.z).length()
			if d < best_d:
				best_d = d
				best = n
		for c in n.get_children():
			stack.append(c)
	return best

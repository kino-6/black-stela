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
var _pixel_checked := 0

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	for world_id in ["default", "terminal-line", "verdant"]:
		await _check_world(world_id)
	print("[landmark-vis] %s — %d landmark(s) projected, %d pixel-checked, %d not visible" % ["PASS" if _fail == 0 else "FAIL", _checked, _pixel_checked, _fail])
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
			else:
				# Projection catches a node placed behind/away from the camera, but not a fully dark or transparent
				# landmark. Render the same first-person frame once with the landmark, once without it, and require
				# visible pixels to change in the projected neighbourhood. This is a delta, not a brightness rule:
				# a dark steel stair may be correct, but it must still be distinguishable from its own absence.
				await _check_pixel_presence(cam, node, sp, label)
	d.queue_free()
	for _i in 3:
		await process_frame

func _check_pixel_presence(cam: Camera3D, node: Node3D, logical_point: Vector2, label: String) -> void:
	var viewport := cam.get_viewport()
	# get_image can share the render texture's backing storage on Compatibility. Snapshot it before hiding
	# the node, otherwise both variables may observe the later frame and every real landmark compares equal.
	var shown_image := viewport.get_texture().get_image()
	var shown := shown_image.duplicate() if shown_image != null else null
	if shown == null:
		_fail += 1
		push_error("[landmark-vis] no rendered viewport image: %s" % label)
		return
	# The SubViewport may be supersampled independently of the logical control canvas.
	var logical_size := viewport.get_visible_rect().size
	var point := Vector2(
		logical_point.x * float(shown.get_width()) / maxf(1.0, logical_size.x),
		logical_point.y * float(shown.get_height()) / maxf(1.0, logical_size.y)
	)
	node.visible = false
	for _i in 3:
		await process_frame
	var hidden_image := viewport.get_texture().get_image()
	var hidden := hidden_image.duplicate() if hidden_image != null else null
	node.visible = true
	for _i in 2:
		await process_frame
	if hidden == null:
		_fail += 1
		push_error("[landmark-vis] no hidden comparison image: %s" % label)
		return
	var changed := _changed_pixels(shown, hidden, point, 180)
	_pixel_checked += 1
	# 80 pixels is far above temporal antialias/noise yet well below the smallest physical return marker.
	if changed < 80:
		_fail += 1
		push_error("[landmark-vis] landmark has no readable pixel presence (%d changed px): %s" % [changed, label])

func _changed_pixels(shown: Image, hidden: Image, centre: Vector2, radius: int) -> int:
	var changed := 0
	var x0 := maxi(0, int(centre.x) - radius)
	var x1 := mini(shown.get_width(), int(centre.x) + radius)
	var y0 := maxi(0, int(centre.y) - radius)
	var y1 := mini(shown.get_height(), int(centre.y) + radius)
	for y in range(y0, y1, 2):
		for x in range(x0, x1, 2):
			var a := shown.get_pixel(x, y)
			var b := hidden.get_pixel(x, y)
			if absf(a.r - b.r) + absf(a.g - b.g) + absf(a.b - b.b) > 0.08:
				changed += 4 # sampled at 2×2 density; report approximate physical pixels
	return changed

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

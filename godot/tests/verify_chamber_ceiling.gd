extends SceneTree
## #39g — a raised 玄室 ceiling must NOT leave a black void overhead. The chamber's walls rise to
## 1.65×WALL_H while its normal-height neighbours cap at WALL_H, so every OPEN boundary between the two
## needs a clerestory BULKHEAD to close the gap (playtest 2026-08-14「天井が真っ黒」). This asserts the
## renderer builds those bulkheads for a floor with an authored chamber, and that they sit in the gap band.
## Usage: godot --headless --path godot/ --script res://tests/verify_chamber_ceiling.gd

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")
const WALL_H := 3.2

var _fail := 0

func _initialize() -> void:
	# Terminal Line tl1f authors a chamberGuardian room (stationmaster-hall) with open boundaries.
	var world: Dictionary = _read_json("res://data/worlds/terminal-line.json").get("world", {})
	var chamber_cell := _chamber_cell(world, "dungeon.tl1f")
	_check(not chamber_cell.is_empty(), "tl1f has an authored chamber cell to test")
	if chamber_cell.is_empty():
		_finish(); return

	var state := {
		"phase": "dungeon", "combat": null,
		"position": {"cellId": String(chamber_cell.get("id", "")), "roomId": String(chamber_cell.get("roomId", "")), "facing": "north"},
		"map": {"floorId": "dungeon.tl1f"}, "party": [], "chests": [],
	}
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(1280, 720))
	var container: Node = built.get("container", null)
	var bulkheads := _find_prefixed(container, "ClerestoryBulkhead_")

	_check(bulkheads.size() > 0, "a raised chamber's open boundaries build clerestory bulkheads (found %d)" % bulkheads.size())
	# Every bulkhead must sit ABOVE the normal ceiling (WALL_H) — that is the gap it closes; a bulkhead at
	# floor level would wall off the passage instead.
	var all_in_gap := true
	for b in bulkheads:
		if (b as Node3D).position.y <= WALL_H:
			all_in_gap = false
	_check(all_in_gap, "every bulkhead sits in the clerestory band above WALL_H (closes the void, not the passage)")

	_finish()

func _chamber_cell(world: Dictionary, floor_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		if String(dungeon.get("id", "")) != floor_id:
			continue
		var rooms := {}
		for r in dungeon.get("rooms", []):
			rooms[String((r as Dictionary).get("id", ""))] = r
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			var room: Dictionary = rooms.get(String(cell.get("roomId", "")), {})
			if bool(room.get("chamberGuardian", false)):
				return cell
	return {}

func _find_prefixed(node: Node, prefix: String) -> Array:
	var out: Array = []
	if node == null:
		return out
	if String(node.name).begins_with(prefix):
		out.append(node)
	for child in node.get_children():
		out.append_array(_find_prefixed(child, prefix))
	return out

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[chamber-ceiling] ok: %s" % label)
	else:
		_fail += 1
		push_error("[chamber-ceiling] FAIL: %s" % label)
		print("[chamber-ceiling] FAIL: %s" % label)

func _finish() -> void:
	print("[chamber-ceiling] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(1 if _fail > 0 else 0)

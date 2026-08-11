extends SceneTree
## D9 — ordinary grid movement is spatial, never an unexplained warp.  The source scenario loader
## checks this in TypeScript; this Godot gate locks the exported packs AND the ported move resolver.
## Usage: godot --headless --path godot/ --script res://tests/verify_grid_transit.gd

const SliceRules := preload("res://scripts/rules/slice_rules.gd")

const ORDINARY_KINDS := ["open", "door", "one_way"]
var _fail := 0

func _initialize() -> void:
	var engine := _read("res://data/engine-data.json")
	for world_id in _world_ids():
		var world: Dictionary = _read("res://data/worlds/%s.json" % world_id).get("world", {})
		_check(not world.is_empty(), "%s: world pack loads" % world_id)
		_check_ordinary_edges(world_id, world)
		if world_id == "terminal-line":
			_check_terminal_line_has_no_implicit_transit(world)
			_check_terminal_line_moves_are_contiguous(world, engine)
	print("[grid-transit] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _check_ordinary_edges(world_id: String, world: Dictionary) -> void:
	for floor in world.get("dungeons", []):
		var cells: Array = (floor.get("grid", {}) as Dictionary).get("cells", [])
		var by_id := {}
		for cell in cells:
			by_id[String(cell.get("id", ""))] = cell
		for cell in cells:
			for direction in (cell.get("edges", {}) as Dictionary):
				var edge: Variant = (cell.get("edges", {}) as Dictionary).get(direction, null)
				if typeof(edge) != TYPE_DICTIONARY or not ORDINARY_KINDS.has(String(edge.get("kind", ""))):
					continue
				var target_id := String(edge.get("targetCellId", ""))
				var target: Dictionary = by_id.get(target_id, {})
				_check(not target.is_empty(), "%s/%s: %s %s has an on-floor target cell" % [world_id, floor.get("id", "?"), cell.get("id", "?"), direction])
				if target.is_empty():
					continue
				var distance := absi(int(cell.get("x", 0)) - int(target.get("x", 0))) + absi(int(cell.get("y", 0)) - int(target.get("y", 0)))
				_check(distance == 1, "%s/%s: ordinary %s edge is adjacent (%s → %s)" % [world_id, floor.get("id", "?"), direction, cell.get("id", "?"), target_id])

func _check_terminal_line_has_no_implicit_transit(world: Dictionary) -> void:
	for floor in world.get("dungeons", []):
		for room in floor.get("rooms", []):
			_check(not room.has("teleportTo"), "terminal-line/%s: %s has no implicit teleportTo" % [floor.get("id", "?"), room.get("id", "?")])
		for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
			for direction in (cell.get("edges", {}) as Dictionary):
				var edge: Variant = (cell.get("edges", {}) as Dictionary).get(direction, null)
				_check(typeof(edge) != TYPE_DICTIONARY or String(edge.get("kind", "")) != "shortcut", "terminal-line/%s: %s %s is not an implicit shortcut warp" % [floor.get("id", "?"), cell.get("id", "?"), direction])

func _check_terminal_line_moves_are_contiguous(world: Dictionary, engine: Dictionary) -> void:
	for floor in world.get("dungeons", []):
		for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
			for direction in (cell.get("edges", {}) as Dictionary):
				var edge: Variant = (cell.get("edges", {}) as Dictionary).get(direction, null)
				if typeof(edge) != TYPE_DICTIONARY or String(edge.get("kind", "")) != "open":
					continue
				var from_id := String(cell.get("id", ""))
				var from_room := String(cell.get("roomId", ""))
				var target_id := String(edge.get("targetCellId", ""))
				var state := {
					"phase": "dungeon", "combat": null, "turn": 0,
					"party": [{"id": "grid-transit-gate", "hp": 99, "maxHp": 99, "mp": 0, "maxMp": 0, "row": "front"}],
					"inventory": [], "discoveredSecrets": [], "resolvedTraps": [], "openedDoors": [], "floorClaimedTreasures": [], "chests": [],
					"position": {"cellId": from_id, "roomId": from_room, "facing": direction},
					"map": {"floorId": floor.get("id", ""), "currentCellId": from_id, "currentRoomId": from_room, "currentFacing": direction,
						"visitedCells": [from_id], "visitedRooms": [from_room], "knownExits": {}, "blockedExits": {}, "secretCandidates": {}},
				}
				var result: Dictionary = SliceRules.resolve(state, {"type": "move_forward"}, world, engine)
				var after: Dictionary = result.get("state", {})
				var position: Dictionary = after.get("position", {})
				var map: Dictionary = after.get("map", {})
				_check(String(position.get("cellId", "")) == target_id, "terminal-line: normal move reaches its adjacent authored target (%s → %s)" % [from_id, target_id])
				_check((map.get("visitedCells", []) as Array).has(from_id) and (map.get("visitedCells", []) as Array).has(target_id), "terminal-line: normal move records both ends (%s → %s)" % [from_id, target_id])
				_check(not _has_event(result.get("events", []), "teleported"), "terminal-line: normal move never emits a teleport event (%s → %s)" % [from_id, target_id])

func _has_event(events: Array, kind: String) -> bool:
	for event in events:
		if typeof(event) == TYPE_DICTIONARY and String(event.get("type", "")) == kind:
			return true
	return false

func _world_ids() -> Array:
	var manifest := _read("res://data/worlds/index.json")
	var out := []
	for entry in manifest.get("worlds", []):
		var world_id := String(entry) if typeof(entry) == TYPE_STRING else String((entry as Dictionary).get("id", ""))
		if world_id != "":
			out.append(world_id)
	return out

func _check(ok: bool, label: String) -> void:
	if ok:
		return
	push_error("[grid-transit] FAIL: %s" % label)
	_fail += 1

func _read(path: String) -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

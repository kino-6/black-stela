extends SceneTree
## Every authored stair and return landmark must be usable from its OWN cell. Structural map validation
## catches missing edges, but it does not prove the command layer accepts the cell, resolves its target, or
## leaves the party in a coherent town/floor state. This drives the real rules with every authored key and
## flag granted: intentional locks stay authored, while a broken destination can never hide behind one.

const SliceRules := preload("res://scripts/rules/slice_rules.gd")

var _failures := 0

func _initialize() -> void:
	var engine := _read("res://data/engine-data.json")
	for world_id in _world_ids():
		var world: Dictionary = _read("res://data/worlds/%s.json" % world_id).get("world", {})
		_check(not world.is_empty(), "%s: world pack loads" % world_id)
		if world.is_empty():
			continue
		var unlocks := _all_unlocks(world)
		_check_stairs(world_id, world, engine, unlocks)
		_check_returns(world_id, world, engine, unlocks)
	print("[landmark-exit-context] %s (%d failures)" % ["PASS" if _failures == 0 else "FAIL", _failures])
	quit(_failures)

func _check_stairs(world_id: String, world: Dictionary, engine: Dictionary, unlocks: Dictionary) -> void:
	for floor in world.get("dungeons", []):
		var floor_id := String(floor.get("id", ""))
		for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
			for direction in (cell.get("edges", {}) as Dictionary):
				var edge: Variant = (cell.get("edges", {}) as Dictionary).get(direction, null)
				if typeof(edge) != TYPE_DICTIONARY or String((edge as Dictionary).get("kind", "")) != "stairs":
					continue
				var target_room := String((edge as Dictionary).get("targetRoomId", ""))
				var state := _state_for_cell(cell, floor_id, String(direction), unlocks)
				var result: Dictionary = SliceRules.resolve(state, {"type": "use_stairs"}, world, engine)
				var after: Dictionary = result.get("state", {})
				_check(_has_event(result.get("events", []), "stairs_used"), "%s/%s: stairs at %s (%s) are usable when unlocked" % [world_id, floor_id, cell.get("id", "?"), direction])
				_check(String((after.get("position", {}) as Dictionary).get("roomId", "")) == target_room, "%s/%s: stairs at %s reach %s" % [world_id, floor_id, cell.get("id", "?"), target_room])
				var target_floor := String((edge as Dictionary).get("targetFloorId", ""))
				if target_floor != "":
					_check(String((after.get("map", {}) as Dictionary).get("floorId", "")) == target_floor, "%s/%s: stairs at %s update current floor to %s" % [world_id, floor_id, cell.get("id", "?"), target_floor])

func _check_returns(world_id: String, world: Dictionary, engine: Dictionary, unlocks: Dictionary) -> void:
	for floor in world.get("dungeons", []):
		var floor_id := String(floor.get("id", ""))
		var cells_by_room := {}
		for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
			cells_by_room[String(cell.get("roomId", ""))] = cell
		for room in floor.get("rooms", []):
			if not bool(room.get("stairsToTown", false)) and not bool(room.get("restPoint", false)):
				continue
			var cell: Dictionary = cells_by_room.get(String(room.get("id", "")), {})
			_check(not cell.is_empty(), "%s/%s: return room %s has a current cell" % [world_id, floor_id, room.get("id", "?")])
			if cell.is_empty():
				continue
			var result: Dictionary = SliceRules.resolve(_state_for_cell(cell, floor_id, "north", unlocks), {"type": "return_to_town"}, world, engine)
			var after: Dictionary = result.get("state", {})
			_check(_has_event(result.get("events", []), "returned_to_town"), "%s/%s: return point %s is usable" % [world_id, floor_id, room.get("id", "?")])
			_check(String(after.get("phase", "")) == "town" and after.get("position", null) == null, "%s/%s: return point %s lands on the town loop" % [world_id, floor_id, room.get("id", "?")])

func _state_for_cell(cell: Dictionary, floor_id: String, facing: String, unlocks: Dictionary) -> Dictionary:
	var cell_id := String(cell.get("id", ""))
	var room_id := String(cell.get("roomId", ""))
	return {
		"phase": "dungeon", "combat": null, "turn": 0,
		"party": [], "inventory": unlocks["inventory"], "discoveredSecrets": unlocks["flags"],
		"resolvedTraps": [], "openedDoors": [], "floorClaimedTreasures": [], "chests": [],
		"position": {"cellId": cell_id, "roomId": room_id, "facing": facing},
		"map": {"floorId": floor_id, "currentCellId": cell_id, "currentRoomId": room_id, "currentFacing": facing,
			"visitedCells": [cell_id], "visitedRooms": [room_id], "knownExits": {}, "blockedExits": {}, "secretCandidates": {}}
	}

func _all_unlocks(world: Dictionary) -> Dictionary:
	var flags := []
	var inventory := []
	for floor in world.get("dungeons", []):
		for room in floor.get("rooms", []):
			for gate in room.get("gates", []):
				var flag := String((gate as Dictionary).get("requiredFlag", ""))
				if flag != "" and not flags.has(flag):
					flags.append(flag)
				var key_id := String((gate as Dictionary).get("requiredKeyId", ""))
				if key_id != "" and not inventory.any(func(item): return String(item.get("id", "")) == key_id):
					inventory.append({"id": key_id, "quantity": 1})
	return {"flags": flags, "inventory": inventory}

func _has_event(events: Array, kind: String) -> bool:
	for event in events:
		if typeof(event) == TYPE_DICTIONARY and String(event.get("type", "")) == kind:
			return true
	return false

func _world_ids() -> Array:
	var out := []
	for entry in _read("res://data/worlds/index.json").get("worlds", []):
		var world_id := String(entry) if typeof(entry) == TYPE_STRING else String((entry as Dictionary).get("id", ""))
		if world_id != "":
			out.append(world_id)
	return out

func _read(path: String) -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func _check(ok: bool, label: String) -> void:
	if ok:
		return
	_failures += 1
	push_error("[landmark-exit-context] FAIL: %s" % label)

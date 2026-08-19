extends SceneTree
## IMP-069: regression floor for the five decisions a first ten-minute expedition must offer.
## This is deliberately data-level: it protects authored routes in every world pack without treating one
## scripted walk as proof that the other two worlds still have tactical choices.

const WORLD_IDS := ["default", "terminal-line", "verdant"]
var failures := 0

func _initialize() -> void:
	for world_id in WORLD_IDS:
		_check_world(world_id)
	if failures == 0:
		print("[first-floor-density] PASS — every first floor retains route choice, information, exchange, pressure, and a landmark")
		quit(0)
	else:
		print("[first-floor-density] FAIL — %d problem(s)" % failures)
		quit(1)

func _check_world(world_id: String) -> void:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/%s.json" % world_id))
	var world: Dictionary = (parsed as Dictionary).get("world", {}) if typeof(parsed) == TYPE_DICTIONARY else {}
	var floor := _first_floor(world)
	if floor.is_empty():
		_fail("%s: start floor is absent" % world_id)
		return
	var cells: Array = (floor.get("grid", {}) as Dictionary).get("cells", [])
	var rooms: Array = floor.get("rooms", [])
	var start := _cell_for_room(cells, String(world.get("startRoom", "")))
	if start.is_empty():
		_fail("%s: start room has no grid cell" % world_id)
		return
	var reachable := _reachable_cells(cells, String(start.get("id", "")))
	var reachable_rooms := _reachable_room_ids(cells, reachable)
	var route_choice := _first_route_choice(cells, reachable)
	var information := _first_information_node(cells, rooms, reachable, reachable_rooms)
	var exchange := _first_exchange_room(rooms, reachable_rooms)
	var pressure := _first_pressure_room(rooms, reachable_rooms)
	var landmark := _first_landmark_room(rooms, reachable_rooms)
	_check(not route_choice.is_empty(), "%s: visible route choice at %s" % [world_id, route_choice.get("id", "?")])
	_check(not information.is_empty(), "%s: information action at %s" % [world_id, information.get("id", "?")])
	_check(not exchange.is_empty(), "%s: resource exchange at %s" % [world_id, exchange.get("id", "?")])
	_check(not pressure.is_empty(), "%s: combat/avoid pressure at %s" % [world_id, pressure.get("id", "?")])
	_check(not landmark.is_empty(), "%s: memorable return/descent landmark at %s" % [world_id, landmark.get("id", "?")])

func _first_floor(world: Dictionary) -> Dictionary:
	var wanted := String(world.get("startDungeon", ""))
	for dungeon in world.get("dungeons", []):
		if String((dungeon as Dictionary).get("id", "")) == wanted:
			return dungeon as Dictionary
	return {}

func _cell_for_room(cells: Array, room_id: String) -> Dictionary:
	for cell in cells:
		if String((cell as Dictionary).get("roomId", "")) == room_id:
			return cell as Dictionary
	return {}

func _reachable_cells(cells: Array, start_id: String) -> Dictionary:
	var by_id := {}
	for cell in cells:
		by_id[String((cell as Dictionary).get("id", ""))] = cell
	var seen := {start_id: true}
	var queue := [start_id]
	while not queue.is_empty():
		var current := String(queue.pop_front())
		var cell: Dictionary = by_id.get(current, {})
		for edge in (cell.get("edges", {}) as Dictionary).values():
			var target := String((edge as Dictionary).get("targetCellId", ""))
			if target != "" and not seen.has(target):
				seen[target] = true
				queue.append(target)
	return seen

func _reachable_room_ids(cells: Array, reachable: Dictionary) -> Dictionary:
	var ids := {}
	for cell in cells:
		var entry := cell as Dictionary
		if reachable.has(String(entry.get("id", ""))):
			ids[String(entry.get("roomId", ""))] = true
	return ids

func _first_route_choice(cells: Array, reachable: Dictionary) -> Dictionary:
	for cell in cells:
		var entry := cell as Dictionary
		if reachable.has(String(entry.get("id", ""))) and (entry.get("edges", {}) as Dictionary).size() >= 3:
			return entry
	return {}

func _first_information_node(cells: Array, rooms: Array, reachable_cells: Dictionary, reachable_rooms: Dictionary) -> Dictionary:
	for room in rooms:
		var entry := room as Dictionary
		var event_text := String(entry.get("event", ""))
		var gates: Array = entry.get("gates", []) as Array
		if reachable_rooms.has(String(entry.get("id", ""))) and (event_text != "" or not gates.is_empty()):
			return entry
	# Verdant's hollow wall is authored as a secret map edge rather than a room-local gate. A secret is
	# still an information action: the player searches the suspicious wall and changes the known route.
	for cell in cells:
		var entry := cell as Dictionary
		if not reachable_cells.has(String(entry.get("id", ""))):
			continue
		for edge in (entry.get("edges", {}) as Dictionary).values():
			if String((edge as Dictionary).get("kind", "")) == "secret":
				return {"id": String(entry.get("id", ""))}
	return {}

func _first_exchange_room(rooms: Array, reachable: Dictionary) -> Dictionary:
	for room in rooms:
		var entry := room as Dictionary
		if reachable.has(String(entry.get("id", ""))) and (entry.has("treasureTable") or entry.has("chest") or entry.has("gatherTable")):
			return entry
	return {}

func _first_pressure_room(rooms: Array, reachable: Dictionary) -> Dictionary:
	for room in rooms:
		var entry := room as Dictionary
		if reachable.has(String(entry.get("id", ""))) and (entry.has("encounter") or entry.has("encounterTable")):
			return entry
	return {}

func _first_landmark_room(rooms: Array, reachable: Dictionary) -> Dictionary:
	for room in rooms:
		var entry := room as Dictionary
		if reachable.has(String(entry.get("id", ""))) and (bool(entry.get("stairsToTown", false)) or String(entry.get("returnStyle", "")) != ""):
			return entry
	return {}

func _check(ok: bool, message: String) -> void:
	if ok:
		print("[first-floor-density] OK: %s" % message)
	else:
		_fail(message)

func _fail(message: String) -> void:
	failures += 1
	push_error("[first-floor-density] FAIL: %s" % message)

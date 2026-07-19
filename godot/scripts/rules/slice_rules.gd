class_name SliceRules
## The GDScript port of the vertical slice's command rules (mirrors src/domain/rulesEngine.ts). It
## operates directly on the JSON-shaped state Dictionary so the result hashes identically to the TS
## oracle. Ported so far: turn_left / turn_right / listen / search. Movement and combat follow.
##
## resolve() returns { "state": Dictionary, "events": Array } — the same CommandResult shape as TS.
## `world` is the normalized world dict (the "world" field of a pack) — needed by search/movement.

const LEFT_OF := {"north": "west", "west": "south", "south": "east", "east": "north"}
const RIGHT_OF := {"north": "east", "east": "south", "south": "west", "west": "north"}

const CombatRound := preload("res://scripts/rules/combat_round.gd")

static func resolve(state: Dictionary, command: Dictionary, world: Dictionary = {}, engine: Dictionary = {}) -> Dictionary:
	match command.get("type", ""):
		"turn_left":
			return _turn(state, "left")
		"turn_right":
			return _turn(state, "right")
		"listen":
			return _log_only(state, {"type": "inspection_made", "mode": "listen"})
		"search":
			return _search(state, world)
		"move_forward":
			return _move_forward(state, world)
		"declare_round":
			return CombatRound.declare_round(state, world, command.get("actions", []), engine)
		_:
			# Not yet ported — a no-op keeps the replay honest (the harness will flag the hash mismatch).
			return {"state": state, "events": []}

# turn(state, side): rotate facing, update position + map.currentFacing, +1 turn, party_turned event.
static func _turn(state: Dictionary, side: String) -> Dictionary:
	if state.get("position", null) == null or state.get("phase", "") != "dungeon":
		return {"state": state, "events": []}
	var facing: String = (LEFT_OF if side == "left" else RIGHT_OF)[state["position"]["facing"]]
	var next: Dictionary = state.duplicate(true)
	next["position"]["facing"] = facing
	if not next.has("map"):
		next["map"] = {}
	next["map"]["currentFacing"] = facing
	next["turn"] = int(next["turn"]) + 1
	return {"state": next, "events": [{"type": "party_turned", "side": side, "facing": facing}]}

# logOnly(state, event): +1 turn, emit the one event (no other state change).
static func _log_only(state: Dictionary, event: Dictionary) -> Dictionary:
	var next: Dictionary = state.duplicate(true)
	next["turn"] = int(next["turn"]) + 1
	return {"state": next, "events": [event]}

# search(state, world): reveal secret grid edges of this cell, else gather, else detect a trap, else
# nothing. Mirrors the TS search() branch order exactly.
static func _search(state: Dictionary, world: Dictionary) -> Dictionary:
	if state.get("position", null) == null:
		return {"state": state, "events": []}
	var room_id: String = state["position"]["roomId"]
	var discovered: Array = state.get("discoveredSecrets", [])

	# 1. Hidden passage: undiscovered secret edges of this cell (iterated in edge key order).
	var cell: Variant = _grid_cell(world, room_id)
	var secret_dirs := []
	if typeof(cell) == TYPE_DICTIONARY:
		var edges: Dictionary = cell.get("edges", {})
		for dir in edges:
			var edge: Variant = edges[dir]
			if typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") == "secret" and not discovered.has("secret:%s:%s" % [room_id, dir]):
				secret_dirs.append(dir)
	if secret_dirs.size() > 0:
		var next: Dictionary = state.duplicate(true)
		for dir in secret_dirs:
			(next["discoveredSecrets"] as Array).append("secret:%s:%s" % [room_id, dir])
		next["turn"] = int(next["turn"]) + 1
		return {"state": next, "events": [{"type": "secret_found"}]}

	var room: Variant = _room(world, room_id)

	# 2. Gather point (a searchable node yielding its item once).
	var gather_key := "gather:" + room_id
	if typeof(room) == TYPE_DICTIONARY and room.get("gatherItem", null) != null and not discovered.has(gather_key):
		push_error("[slice_rules] gather branch not yet ported (createInventoryItemFromCatalog)")
		return {"state": state, "events": []}

	# 3. Trap detection, else nothing found.
	var trap: Variant = room.get("trap", null) if typeof(room) == TYPE_DICTIONARY else null
	var resolved: Array = state.get("resolvedTraps", [])
	if typeof(trap) != TYPE_DICTIONARY or resolved.has(trap.get("id", "")):
		return _log_only(state, {"type": "search_completed", "result": "none"})

	var trapped: Dictionary = state.duplicate(true)
	(trapped["discoveredSecrets"] as Array).append(trap["id"])
	trapped["turn"] = int(trapped["turn"]) + 1
	return {"state": trapped, "events": [{"type": "trap_detected", "trapId": trap["id"], "trapName": trap.get("name", "")}]}

# move_forward: the BLOCKED branches (stairs / locked gate / wall) are ported here. Entering a room and
# triggering an encounter (visitRoom, treasure, beginRoomEncounter, createCombatState) is the larger
# remaining move_forward work — a valid exit currently errors rather than guessing.
const TRAVERSABLE_EDGE_KINDS := ["open", "door", "one_way", "shortcut", "stairs"]

static func _move_forward(state: Dictionary, world: Dictionary) -> Dictionary:
	if state.get("position", null) == null or state.get("phase", "") != "dungeon":
		return {"state": state, "events": []}
	var room_id: String = state["position"]["roomId"]
	var move_dir: String = state["position"]["facing"]

	var forward_edge: Variant = _grid_edge(world, room_id, move_dir)

	# Stairs are not walked through by a step — they need the Use-stairs action.
	if typeof(forward_edge) == TYPE_DICTIONARY and forward_edge.get("kind", "") == "stairs":
		var s: Dictionary = state.duplicate(true)
		s["turn"] = int(s["turn"]) + 1
		return {"state": s, "events": [{"type": "movement_blocked", "reason": "stairs", "roomId": room_id, "facing": move_dir}]}

	var room: Variant = _room(world, room_id)
	var gate: Variant = _find_gate(room, move_dir)
	if typeof(gate) == TYPE_DICTIONARY and not _is_gate_open(gate, state):
		var s: Dictionary = state.duplicate(true)
		s["turn"] = int(s["turn"]) + 1
		return {"state": s, "events": [{"type": "movement_blocked", "reason": "locked", "roomId": room_id, "facing": move_dir}]}

	var discovered: Array = state.get("discoveredSecrets", [])
	var secret_revealed: bool = (
		typeof(forward_edge) == TYPE_DICTIONARY
		and forward_edge.get("kind", "") == "secret"
		and forward_edge.get("targetRoomId", null) != null
		and discovered.has("secret:%s:%s" % [room_id, move_dir])
	)
	var exit: Variant = null
	if (typeof(gate) == TYPE_DICTIONARY and typeof(forward_edge) == TYPE_DICTIONARY and forward_edge.get("targetRoomId", null) != null) or secret_revealed:
		exit = forward_edge.get("targetRoomId", null)
	else:
		exit = _get_exit(world, room_id, move_dir)

	if exit == null:
		var s: Dictionary = state.duplicate(true)
		var floor_id: Variant = s["map"].get("floorId", null)
		s["map"]["blockedExits"] = _append_direction(s["map"].get("blockedExits", {}), room_id, move_dir)
		s["turn"] = int(s["turn"]) + 1
		return {"state": s, "events": [
			{"type": "movement_blocked", "reason": "wall", "roomId": room_id, "facing": move_dir},
			{"type": "map_exit_blocked", "floorId": floor_id, "roomId": room_id, "direction": move_dir}
		]}

	# ROOM ENTRY (ported): move into `exit`, update position + the automap via visitRoom, +1 turn, and
	# fire the room's AUTHORED encounter if the party can still fight. Faithful to moveForward's core;
	# treasure / trap / room-event / cell-effects (spinner/teleport) and the wandering-RNG encounter
	# branch are the Phase-3 remainder (the slice's b1f entry path steps into plain corridors + the
	# authored room.002 ash-slime, so none of the deferred branches change its outcome).
	var target_room_id: String = exit
	var facing: String = state["position"]["facing"]
	var target_cell: Variant = _grid_cell(world, target_room_id)
	var visit := _visit_room(state, world, target_room_id, facing)

	var next: Dictionary = state.duplicate(true)
	next["position"]["roomId"] = target_room_id
	next["position"]["cellId"] = target_cell.get("id", null) if typeof(target_cell) == TYPE_DICTIONARY else null
	next["map"] = visit["map"]
	next["stepsSinceEncounter"] = int(next.get("stepsSinceEncounter", 0)) + 1
	next["turn"] = int(next["turn"]) + 1

	var target_room: Variant = _room(world, target_room_id)
	var room_name: String = target_room.get("name", target_room_id) if typeof(target_room) == TYPE_DICTIONARY else target_room_id
	var events: Array = [{"type": "room_entered", "roomId": target_room_id, "roomName": room_name}]
	events.append_array(visit["events"])

	var enc_enemy_id: String = Encounter.room_encounter_enemy_id(target_room) if typeof(target_room) == TYPE_DICTIONARY else ""
	if enc_enemy_id != "" and _party_can_fight(next):
		Encounter.begin(next, world, target_room_id, enc_enemy_id)
		next["stepsSinceEncounter"] = 0
		events.append({"type": "encounter_started", "roomId": target_room_id, "enemyId": enc_enemy_id})

	return {"state": next, "events": events}

const Encounter := preload("res://scripts/encounter.gd")

# Port of visitRoom: append the room/cell to the automap, record known exits, set current + facing.
static func _visit_room(state: Dictionary, world: Dictionary, room_id: String, facing: String) -> Dictionary:
	var cell: Variant = _grid_cell(world, room_id)
	var map: Dictionary = (state.get("map", {}) as Dictionary).duplicate(true)
	var floor_id: Variant = map.get("floorId", world.get("startDungeon", null))
	var exits := _known_grid_directions(world, room_id)

	map["floorId"] = floor_id
	map["currentRoomId"] = room_id
	map["currentCellId"] = cell.get("id", null) if typeof(cell) == TYPE_DICTIONARY else null
	map["currentFacing"] = facing
	map["visitedRooms"] = _append_unique(map.get("visitedRooms", []), room_id)
	if typeof(cell) == TYPE_DICTIONARY:
		map["visitedCells"] = _append_unique(map.get("visitedCells", []), cell["id"])
	var known: Dictionary = (map.get("knownExits", {}) as Dictionary).duplicate(true)
	known[room_id] = exits
	map["knownExits"] = known

	return {"map": map, "events": [
		{"type": "map_room_visited", "floorId": floor_id, "roomId": room_id},
		{"type": "map_exits_known", "floorId": floor_id, "roomId": room_id, "exits": exits},
	]}

# Port of getKnownGridDirections: the room's non-wall edge directions (else its room.exits keys).
static func _known_grid_directions(world: Dictionary, room_id: String) -> Array:
	var cell: Variant = _grid_cell(world, room_id)
	if typeof(cell) != TYPE_DICTIONARY:
		var room: Variant = _room(world, room_id)
		return (room.get("exits", {}) as Dictionary).keys() if typeof(room) == TYPE_DICTIONARY else []
	var out := []
	var edges: Dictionary = cell.get("edges", {})
	for dir in edges:
		var edge: Variant = edges[dir]
		if typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") != "wall":
			out.append(dir)
	return out

static func _append_unique(items: Array, item: Variant) -> Array:
	var out: Array = items.duplicate()
	if not out.has(item):
		out.append(item)
	return out

static func _party_can_fight(state: Dictionary) -> bool:
	for member in state.get("party", []):
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null:
			return true
	return false

static func _grid_edge(world: Dictionary, room_id: String, direction: String) -> Variant:
	var cell: Variant = _grid_cell(world, room_id)
	if typeof(cell) != TYPE_DICTIONARY:
		return null
	return (cell.get("edges", {}) as Dictionary).get(direction, null)

static func _get_exit(world: Dictionary, room_id: String, direction: String) -> Variant:
	var edge: Variant = _grid_edge(world, room_id, direction)
	if typeof(edge) == TYPE_DICTIONARY:
		if TRAVERSABLE_EDGE_KINDS.has(edge.get("kind", "")) and edge.get("targetRoomId", null) != null:
			return edge["targetRoomId"]
		return null
	var room: Variant = _room(world, room_id)
	if typeof(room) == TYPE_DICTIONARY:
		return (room.get("exits", {}) as Dictionary).get(direction, null)
	return null

static func _find_gate(room: Variant, direction: String) -> Variant:
	if typeof(room) != TYPE_DICTIONARY:
		return null
	for gate in room.get("gates", []):
		if typeof(gate) == TYPE_DICTIONARY and gate.get("direction", "") == direction:
			return gate
	return null

static func _is_gate_open(gate: Dictionary, state: Dictionary) -> bool:
	var key_id: Variant = gate.get("requiredKeyId", null)
	if key_id != null:
		var has_key := false
		for item in state.get("inventory", []):
			if item.get("id", "") == key_id and int(item.get("quantity", 0)) > 0:
				has_key = true
				break
		if not has_key:
			return false
	var flag: Variant = gate.get("requiredFlag", null)
	if flag != null and not (state.get("discoveredSecrets", []) as Array).has(flag):
		return false
	return true

static func _append_direction(blocked: Dictionary, room_id: String, direction: String) -> Dictionary:
	var out: Dictionary = blocked.duplicate(true)
	var dirs: Array = (out.get(room_id, []) as Array).duplicate()
	if not dirs.has(direction):
		dirs.append(direction)
		out[room_id] = dirs
	return out

# --- world lookup (mirrors getRoom / getGridCellForRoom) ---------------------------------------------

static func _room(world: Dictionary, room_id: String) -> Variant:
	for dungeon in world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == room_id:
				return room
	return null

static func _grid_cell(world: Dictionary, room_id: String) -> Variant:
	for dungeon in world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell.get("roomId", "") == room_id:
				return cell
	return null

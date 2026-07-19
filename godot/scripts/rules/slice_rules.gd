class_name SliceRules
## The GDScript port of the vertical slice's command rules (mirrors src/domain/rulesEngine.ts). It
## operates directly on the JSON-shaped state Dictionary so the result hashes identically to the TS
## oracle. Ported so far: turn_left / turn_right / listen / search. Movement and combat follow.
##
## resolve() returns { "state": Dictionary, "events": Array } — the same CommandResult shape as TS.
## `world` is the normalized world dict (the "world" field of a pack) — needed by search/movement.

const LEFT_OF := {"north": "west", "west": "south", "south": "east", "east": "north"}
const RIGHT_OF := {"north": "east", "east": "south", "south": "west", "west": "north"}
const OPPOSITE_OF := {"north": "south", "south": "north", "east": "west", "west": "east"}
const SPIN_ORDER := ["north", "east", "south", "west"]
# A cell's `edges` are read by the rules in their AUTHORED insertion order (TS uses Object.keys), and
# that order is game truth — it decides the order of map_exits_known and of secret discovery. The
# exported pack is canonicalized, which re-sorts object keys, so the export now ships each cell's
# `edgeOrder` alongside them. Never guess the order from a fixed compass list: authored floors do not
# follow one. (Same class of bug as the class-equipment ordering.)
const EDGE_ORDER_FALLBACK := ["north", "east", "south", "west"]

static func _ordered_edge_dirs(cell: Dictionary) -> Array:
	var edges: Dictionary = cell.get("edges", {})
	var out := []
	for dir in cell.get("edgeOrder", EDGE_ORDER_FALLBACK):
		if edges.has(dir) and not out.has(dir):
			out.append(dir)
	for dir in edges:
		if not out.has(dir):
			out.append(dir)
	return out

# The direction a backward/strafe step actually travels, relative to the party's facing.
static func _facing_of(state: Dictionary, table: Dictionary) -> Variant:
	if state.get("position", null) == null:
		return null
	return table.get(state["position"]["facing"], null)

const CombatRound := preload("res://scripts/rules/combat_round.gd")
const Economy := preload("res://scripts/rules/economy.gd")
const Quests := preload("res://scripts/rules/quests.gd")
const Loot := preload("res://scripts/rules/loot.gd")
const Vocations := preload("res://scripts/rules/vocations.gd")
const CharacterCreation := preload("res://scripts/rules/character_creation.gd")
const Encounters := preload("res://scripts/rules/encounters.gd")
const Chests := preload("res://scripts/rules/chests.gd")
const Leveling := preload("res://scripts/rules/leveling.gd")

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
		"move_backward":
			return _move_forward(state, world, _facing_of(state, OPPOSITE_OF), "backward")
		"strafe_left":
			return _move_forward(state, world, _facing_of(state, LEFT_OF), "left")
		"strafe_right":
			return _move_forward(state, world, _facing_of(state, RIGHT_OF), "right")
		"inspect_wall":
			return _log_only(state, {"type": "inspection_made", "mode": "inspect_wall"})
		"open_door":
			return _log_only(state, {"type": "inspection_made", "mode": "open_door"})
		"use_stairs":
			return _use_stairs(state, world)
		"return_to_town":
			return _return_to_town(state, world)
		"disarm_trap":
			return _disarm_trap(state, world)
		"investigate_chest":
			return Chests.investigate(state)
		"disarm_chest":
			return Chests.disarm(state)
		"open_chest":
			return Chests.open_chest(state, world, engine)
		"enter_dungeon":
			return _enter_dungeon(state, world)
		"resume_at_checkpoint":
			return _resume_at_checkpoint(state, world, command.get("roomId", ""))
		"use_item":
			return _use_item(state, world, command.get("itemId", ""), command.get("targetCharacterId", ""))
		"attack":
			return _attack(state, world, engine)
		"defend":
			return _defend(state)
		"import_member":
			return _import_member(state, world, engine, command.get("adventurer", {}))
		"debug_revive_party":
			return _debug_revive_party(state)
		"debug_force_victory":
			return CombatRound.debug_force_victory(state, world, engine)
		"retreat":
			return _retreat(state)
		"continue_after_combat":
			return _continue_after_combat(state)
		"declare_round":
			return CombatRound.declare_round(state, world, command.get("actions", []), engine)
		"set_member_row":
			return _set_member_row(state, command.get("characterId", ""), command.get("row", "front"))
		"swap_member_rows":
			return _swap_member_rows(state, command.get("characterId", ""), command.get("targetCharacterId", ""))
		"bench_member":
			return _bench_member(state, command.get("characterId", ""))
		"recall_member":
			return _recall_member(state, command.get("characterId", ""))
		"retire_member":
			return _retire_member(state, command.get("characterId", ""))
		"unretire_member":
			return _unretire_member(state, command.get("characterId", ""))
		"erase_member":
			return _erase_member(state, command.get("characterId", ""))
		"edit_member_identity":
			return _edit_member_identity(state, command)
		"reclass_member":
			return _reclass_member(state, world, engine, command.get("characterId", ""), command.get("classId", ""))
		"buy_item":
			return Economy.buy(state, world, command.get("shopId", ""), command.get("itemId", ""))
		"sell_item":
			return Economy.sell(state, world, command.get("itemId", ""), command.get("plus", null), command.get("affix", null))
		"equip_item":
			return Economy.equip(state, world, command.get("characterId", ""), command.get("equipmentId", ""), command.get("plus", null), command.get("affix", null))
		"discard_item":
			return Economy.discard(state, command.get("itemId", ""), command.get("plus", null), command.get("affix", null))
		"recover_party":
			return Economy.recover(state, world)
		"accept_quest":
			return Quests.accept(state, world, command.get("questId", ""))
		"claim_quest":
			return Quests.claim(state, world, command.get("questId", ""))
		"appraise_item":
			return Loot.appraise(state, command.get("instanceId", ""))
		"toggle_item_lock":
			return Loot.toggle_flag(state, command.get("instanceId", ""), "locked")
		"toggle_item_favorite":
			return Loot.toggle_flag(state, command.get("instanceId", ""), "favorite")
		"reinforce_equipment":
			return Loot.reinforce(state, world, command.get("characterId", ""), command.get("slot", ""))
		"bulk_convert":
			return Loot.bulk_convert(state, command.get("mode", ""), command.get("rarities", null))
		"change_vocation":
			return Vocations.change_vocation(state, world, engine, command.get("characterId", ""), command.get("vocationId", ""))
		"set_loadout":
			return Vocations.set_loadout_command(state, engine, command.get("characterId", ""), command.get("loadout", []))
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
		for dir in _ordered_edge_dirs(cell):
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
	if typeof(room) == TYPE_DICTIONARY and typeof(room.get("gatherItem", null)) == TYPE_STRING and not discovered.has(gather_key):
		var gathered: Variant = Economy.create_inventory_item(world, String(room["gatherItem"]), 1)
		if typeof(gathered) == TYPE_DICTIONARY:
			var picked: Dictionary = state.duplicate(true)
			picked["inventory"] = Economy.add_inventory_item(picked.get("inventory", []), gathered)
			(picked["discoveredSecrets"] as Array).append(gather_key)
			picked["turn"] = int(picked.get("turn", 0)) + 1
			return {"state": picked, "events": [{"type": "inventory_item_gained", "itemId": gathered.get("id", ""), "itemName": gathered.get("name", ""), "quantity": 1, "source": "reward"}]}

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

static func _move_forward(state: Dictionary, world: Dictionary, requested_direction: Variant = null, motion: Variant = null) -> Dictionary:
	if state.get("position", null) == null or state.get("phase", "") != "dungeon":
		return {"state": state, "events": []}
	var room_id: String = state["position"]["roomId"]
	var move_dir: String = String(requested_direction) if requested_direction != null else String(state["position"]["facing"])

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
	var room_entered := {"type": "room_entered", "roomId": target_room_id, "roomName": room_name}
	if motion != null:
		room_entered["motion"] = motion
	var events: Array = [room_entered]
	events.append_array(visit["events"])

	# IMP-029 — no auto-collect. A plain reward room leaves a CLOSED chest on entry; a CHAMBER (a room
	# with a fixed encounter) leaves its chest only after the fight is won.
	if typeof(target_room) == TYPE_DICTIONARY and not _room_has_encounter(target_room):
		var chest_result := _ensure_chest_for_room(next, target_room, next["position"].get("cellId", null))
		next = chest_result["state"]
		events.append_array(chest_result["events"])

	# markDeepestFloor: every member remembers the deepest floor they have stood on.
	next["party"] = _mark_deepest_floor(next.get("party", []), visit["map"].get("floorId", state.get("map", {}).get("floorId", null)))

	# A one-shot room TRAP bleeds the party (never kills — floor at 1 HP) and is then spent.
	if typeof(target_room) == TYPE_DICTIONARY and typeof(target_room.get("trap", null)) == TYPE_DICTIONARY and not (state.get("resolvedTraps", []) as Array).has(target_room["trap"].get("id", "")):
		var trap: Dictionary = target_room["trap"]
		var damage := int(trap.get("damage", 0))
		var hurt := []
		for member in next.get("party", []):
			var m: Dictionary = member.duplicate(true)
			m["hp"] = maxi(1, int(m.get("hp", 0)) - damage)
			hurt.append(m)
		next["party"] = hurt
		(next["resolvedTraps"] as Array).append(trap.get("id", ""))
		events.append({"type": "trap_triggered", "trapId": trap.get("id", ""), "trapName": trap.get("name", ""), "damage": damage})

	if typeof(target_room) == TYPE_DICTIONARY and typeof(target_room.get("event", null)) == TYPE_STRING:
		events.append({"type": "room_event_triggered", "roomId": target_room_id, "text": target_room["event"]})

	# A gate can GRANT a flag on entry — that is how a shortcut opens permanently.
	if typeof(target_room) == TYPE_DICTIONARY:
		var granted := []
		for gate2 in target_room.get("gates", []):
			var flag: Variant = gate2.get("grantsFlag", null)
			if typeof(flag) == TYPE_STRING and not (next.get("discoveredSecrets", []) as Array).has(flag) and not granted.has(flag):
				granted.append(flag)
		if not granted.is_empty():
			for flag2 in granted:
				(next["discoveredSecrets"] as Array).append(flag2)
			for gate3 in target_room.get("gates", []):
				if gate3.get("kind", "") == "shortcut" and typeof(gate3.get("grantsFlag", null)) == TYPE_STRING and granted.has(gate3["grantsFlag"]):
					events.append({"type": "shortcut_opened"})
					break

	var effects := _apply_cell_effects(next, world, target_room, events)
	next = effects["state"]

	# A room with an AUTHORED encounter fires it; otherwise the corridor itself can ambush you (the
	# WANDERING roll). A party with nobody left standing must NOT be dragged into a fight it cannot act
	# in — that combat can never reach a round-end, so the wipe check never fires and the run soft-locks.
	# A teleport is transit only: the destination does not also ambush on arrival.
	var can_fight := false
	for member in next.get("party", []):
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null:
			can_fight = true
			break
	var started: Variant = null
	if not bool(effects.get("teleported", false)) and can_fight:
		started = Encounters.begin_room_encounter(world, target_room, next)
		if started == null:
			started = Encounters.begin_wandering_encounter(world, target_room, next)
	if typeof(started) == TYPE_DICTIONARY:
		var encountered_ids := []
		for group in (started["combat"] as Dictionary).get("enemyGroups", []):
			var gid: Variant = group.get("enemyId", "")
			if not encountered_ids.has(gid):
				encountered_ids.append(gid)
		next["phase"] = "combat"
		next["combat"] = started["combat"]
		next["stepsSinceEncounter"] = 0
		next["enemyRecord"] = Encounters.record_encounters(next.get("enemyRecord", null), encountered_ids)
		events.append(started["event"])

	return {"state": next, "events": events}

const Encounter := preload("res://scripts/encounter.gd")

# Port of visitRoom: append the room/cell to the automap, record known exits, set current + facing.
static func _visit_room(state: Dictionary, world: Dictionary, room_id: String, facing: String) -> Dictionary:
	var cell: Variant = _grid_cell(world, room_id)
	var map: Dictionary = (state.get("map", {}) as Dictionary).duplicate(true)
	# The floor is resolved from the ROOM being entered, never carried over from the map we came from —
	# otherwise crossing a stair keeps reporting the floor we left (latent until a route used stairs).
	var floor_id: Variant = _floor_id_for_room(world, room_id)
	if floor_id == null:
		floor_id = world.get("startDungeon", null)
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

# The dungeon floor a room belongs to.
static func _floor_id_for_room(world: Dictionary, room_id: String) -> Variant:
	for dungeon in world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == room_id:
				return dungeon.get("id", null)
	return null

# Port of getKnownGridDirections: the room's non-wall edge directions (else its room.exits keys).
static func _known_grid_directions(world: Dictionary, room_id: String) -> Array:
	var cell: Variant = _grid_cell(world, room_id)
	if typeof(cell) != TYPE_DICTIONARY:
		var room: Variant = _room(world, room_id)
		return (room.get("exits", {}) as Dictionary).keys() if typeof(room) == TYPE_DICTIONARY else []
	var out := []
	var edges: Dictionary = cell.get("edges", {})
	for dir in _ordered_edge_dirs(cell):
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

# --- roster commands (port of the bench/recall/row/retire set in rulesEngine.ts) ---------------------
const PARTY_SIZE_LIMIT := 6

static func _set_member_row(state: Dictionary, char_id: String, row: String) -> Dictionary:
	if state.get("phase", "") == "combat":
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("party", []), char_id)
	if member.is_empty() or member.get("row", "") == row:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	for m in next["party"]:
		if String(m.get("id", "")) == char_id:
			m["row"] = row
	return {"state": next, "events": [{"type": "party_member_reformed", "characterName": member.get("name", ""), "row": row}]}

static func _swap_member_rows(state: Dictionary, char_id: String, target_id: String) -> Dictionary:
	if state.get("phase", "") == "combat":
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("party", []), char_id)
	var target := _find_by_id(state.get("party", []), target_id)
	if member.is_empty() or target.is_empty() or member.get("row", "") == target.get("row", ""):
		return {"state": state, "events": []}
	var member_row: String = member.get("row", "front")
	var target_row: String = target.get("row", "front")
	var next: Dictionary = state.duplicate(true)
	for m in next["party"]:
		if String(m.get("id", "")) == char_id:
			m["row"] = target_row
		elif String(m.get("id", "")) == target_id:
			m["row"] = member_row
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [
		{"type": "party_member_reformed", "characterName": member.get("name", ""), "row": target_row},
		{"type": "party_member_reformed", "characterName": target.get("name", ""), "row": member_row},
	]}

static func _bench_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = _without_id(next.get("party", []), char_id)
	next["reserve"] = (next.get("reserve", []) as Array) + [member]
	return {"state": next, "events": [{"type": "party_member_benched", "characterName": member.get("name", "")}]}

static func _recall_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town" or (state.get("party", []) as Array).size() >= PARTY_SIZE_LIMIT:
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("reserve", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = (next.get("party", []) as Array) + [member]
	next["reserve"] = _without_id(next.get("reserve", []), char_id)
	return {"state": next, "events": [{"type": "party_member_recalled", "characterName": member.get("name", "")}]}

static func _retire_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		member = _find_by_id(state.get("reserve", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = _without_id(next.get("party", []), char_id)
	next["reserve"] = _without_id(next.get("reserve", []), char_id)
	next["retired"] = (next.get("retired", []) as Array) + [member]
	return {"state": next, "events": [{"type": "party_member_retired", "characterName": member.get("name", "")}]}

static func _unretire_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("retired", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["retired"] = _without_id(next.get("retired", []), char_id)
	next["reserve"] = (next.get("reserve", []) as Array) + [member]
	return {"state": next, "events": [{"type": "party_member_unretired", "characterName": member.get("name", "")}]}

static func _erase_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		member = _find_by_id(state.get("reserve", []), char_id)
	if member.is_empty():
		member = _find_by_id(state.get("retired", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = _without_id(next.get("party", []), char_id)
	next["reserve"] = _without_id(next.get("reserve", []), char_id)
	next["retired"] = _without_id(next.get("retired", []), char_id)
	return {"state": next, "events": [{"type": "party_member_erased", "characterName": member.get("name", "")}]}

# Revise name/title/notes/accent across every roster (town-only; name required).
static func _edit_member_identity(state: Dictionary, cmd: Dictionary) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var char_id: String = cmd.get("characterId", "")
	var name: String = String(cmd.get("name", "")).strip_edges()
	if name == "":
		return {"state": state, "events": []}
	var edited := false
	var next: Dictionary = state.duplicate(true)
	for roster in ["party", "reserve", "retired"]:
		for m in next.get(roster, []):
			if String(m.get("id", "")) == char_id:
				m["name"] = name
				m["title"] = String(cmd.get("title", "")).strip_edges()
				m["notes"] = String(cmd.get("notes", "")).strip_edges()
				m["accentColor"] = cmd.get("accentColor", "")
				edited = true
	if not edited:
		return {"state": state, "events": []}
	return {"state": next, "events": [{"type": "party_member_edited", "characterName": name}]}

# Reclass an active or benched adventurer to a basic class (reclassCharacter re-derives the base at the
# retained level). Town-only; no-op if already that class. No turn cost (a roster edit, not an action).
static func _reclass_member(state: Dictionary, world: Dictionary, engine: Dictionary, char_id: String, class_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := _find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		member = _find_by_id(state.get("reserve", []), char_id)
	if member.is_empty() or String(member.get("classId", "")) == class_id:
		return {"state": state, "events": []}
	var reclassed := CharacterCreation.reclass_character(member, class_id, world, engine)
	var next: Dictionary = state.duplicate(true)
	var party := []
	for c in next.get("party", []):
		party.append(reclassed if String(c.get("id", "")) == char_id else c)
	next["party"] = party
	var reserve := []
	for c in next.get("reserve", []):
		reserve.append(reclassed if String(c.get("id", "")) == char_id else c)
	next["reserve"] = reserve
	var cls_name := char_id
	for def in engine.get("classes", []):
		if def.get("id", "") == class_id:
			cls_name = String((def.get("label", {}) as Dictionary).get("en", class_id))
			break
	return {"state": next, "events": [{"type": "party_member_reclassed", "characterName": reclassed.get("name", ""), "className": cls_name}]}


# --- on-cell floor effects (one fixed order from every call site: spinner -> hazard -> teleport) -----
static func _apply_cell_effects(state: Dictionary, world: Dictionary, room: Variant, events: Array) -> Dictionary:
	var next := _apply_spinner(state, room, events)
	next = _apply_hazard(next, room, events)
	return _apply_teleport(next, world, room, events)

# Wizardry-style spinner floor: standing on it turns the party. Deterministic on the turn counter, so
# it is disorienting but replayable.
static func _apply_spinner(state: Dictionary, room: Variant, events: Array) -> Dictionary:
	if typeof(room) != TYPE_DICTIONARY or not bool(room.get("spinner", false)) or state.get("position", null) == null:
		return state
	var facing: String = SPIN_ORDER[int(state.get("turn", 0)) % SPIN_ORDER.size()]
	events.append({"type": "spinner_triggered", "facing": facing})
	var next: Dictionary = state.duplicate(true)
	next["position"]["facing"] = facing
	next["map"]["currentFacing"] = facing
	return next

# Etrian-style damage floor: bleeds every member each time it is crossed (repeatable attrition, unlike
# a one-shot trap). Never kills.
static func _apply_hazard(state: Dictionary, room: Variant, events: Array) -> Dictionary:
	if typeof(room) != TYPE_DICTIONARY or room.get("damageTile", null) == null or (state.get("party", []) as Array).is_empty():
		return state
	var damage := int(room["damageTile"])
	events.append({"type": "hazard_damage", "damage": damage})
	var next: Dictionary = state.duplicate(true)
	var hurt := []
	for member in next.get("party", []):
		var m: Dictionary = member.duplicate(true)
		m["hp"] = maxi(1, int(m.get("hp", 0)) - damage)
		hurt.append(m)
	next["party"] = hurt
	return next

# Wizardry-style teleporter: transit only — the source room's content is skipped, and the caller must
# not then start an encounter here (that is why `teleported` is reported back).
static func _apply_teleport(state: Dictionary, world: Dictionary, room: Variant, events: Array) -> Dictionary:
	if typeof(room) != TYPE_DICTIONARY or typeof(room.get("teleportTo", null)) != TYPE_STRING or state.get("position", null) == null:
		return {"state": state, "teleported": false}
	var target_id: String = room["teleportTo"]
	var target_room: Variant = _room(world, target_id)
	var visit := _visit_room(state, world, target_id, String(state["position"]["facing"]))
	var target_cell: Variant = _grid_cell(world, target_id)
	events.append({"type": "teleported", "toRoomId": target_id, "toRoomName": target_room.get("name", target_id) if typeof(target_room) == TYPE_DICTIONARY else target_id})
	events.append_array(visit["events"])
	var next: Dictionary = state.duplicate(true)
	next["position"]["roomId"] = target_id
	next["position"]["cellId"] = target_cell.get("id", null) if typeof(target_cell) == TYPE_DICTIONARY else null
	next["map"] = visit["map"]
	return {"state": next, "teleported": true}

# b3f ranks deeper than b1f; a floor id with no rank never overwrites one that has it.
static func _floor_rank(floor_id: String) -> int:
	var re := RegEx.new()
	re.compile("[a-zA-Z](\\d+)f")
	var m := re.search(floor_id)
	return int(m.get_string(1)) if m else 0

static func _mark_deepest_floor(party: Array, floor_id: Variant) -> Array:
	if typeof(floor_id) != TYPE_STRING or floor_id == "":
		return party
	var out := []
	for member in party:
		var m: Dictionary = member.duplicate(true)
		var memory: Dictionary = (m.get("memory", {}) as Dictionary).duplicate(true)
		var current: Variant = memory.get("deepestFloorId", null)
		if typeof(current) != TYPE_STRING or current == "" or _floor_rank(String(floor_id)) > _floor_rank(String(current)):
			memory["deepestFloorId"] = floor_id
		m["memory"] = memory
		out.append(m)
	return out


# --- IMP-029 chests -------------------------------------------------------------------------------
static func _room_has_encounter(room: Dictionary) -> bool:
	return room.get("encounter", null) != null or room.get("encounterSquad", null) != null or room.get("encounterTable", null) != null

# The chest a room authors: an explicit `chest`, else a bare `treasureTable` (back-compat) as an
# untrapped one. Null when the room holds no reward.
static func _room_chest(room: Dictionary) -> Variant:
	if typeof(room.get("chest", null)) == TYPE_DICTIONARY:
		return room["chest"]
	if typeof(room.get("treasureTable", null)) == TYPE_STRING:
		return {"treasureTable": room["treasureTable"]}
	return null

# Leave a closed chest on the cell. Safe transit rooms — the town-stair landing and rest points — never
# gate the way with a chest, so descending or resting stays a clean walk-through.
static func _ensure_chest_for_room(state: Dictionary, room: Dictionary, cell_id: Variant) -> Dictionary:
	if bool(room.get("stairsToTown", false)) or bool(room.get("restPoint", false)):
		return {"state": state, "events": []}
	var authored: Variant = _room_chest(room)
	if typeof(authored) != TYPE_DICTIONARY or typeof(cell_id) != TYPE_STRING:
		return {"state": state, "events": []}
	var room_id := String(room.get("id", ""))
	var chests: Array = state.get("chests", [])
	for chest in chests:
		if chest.get("cellId", "") == cell_id:
			return {"state": state, "events": []}
	if (state.get("floorClaimedTreasures", []) as Array).has(room_id):
		return {"state": state, "events": []}

	var made := {
		"cellId": cell_id,
		"roomId": room_id,
		"treasureTable": authored.get("treasureTable", null),
		"trap": (authored["trap"] as Dictionary).duplicate(true) if typeof(authored.get("trap", null)) == TYPE_DICTIONARY else null,
		"phase": "closed",
		"investigated": false,
		"investigateResult": null,
		"disarmAttempted": false,
		"disarmed": false,
		"sprung": false
	}
	var next: Dictionary = state.duplicate(true)
	var list: Array = (next.get("chests", []) as Array).duplicate(true)
	list.append(made)
	next["chests"] = list
	return {"state": next, "events": [{"type": "chest_appeared", "cellId": cell_id, "roomId": room_id}]}


# --- stairs / town return / disarm ------------------------------------------------------------------
const STAIR_DIRECTIONS := ["north", "east", "south", "west"]

# The stair edge this cell offers: the one the party faces, else any stair edge on the cell (descending
# is a CURRENT-CELL action, not a facing-dependent one).
static func _room_stairs_edge(world: Dictionary, room_id: String, facing: String) -> Variant:
	var faced: Variant = _grid_edge(world, room_id, facing)
	if typeof(faced) == TYPE_DICTIONARY and faced.get("kind", "") == "stairs":
		return {"edge": faced, "direction": facing}
	for direction in STAIR_DIRECTIONS:
		var edge: Variant = _grid_edge(world, room_id, direction)
		if typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") == "stairs":
			return {"edge": edge, "direction": direction}
	return null

static func _use_stairs(state: Dictionary, world: Dictionary) -> Dictionary:
	if state.get("position", null) == null or state.get("phase", "") != "dungeon":
		return {"state": state, "events": []}
	var room_id: String = state["position"]["roomId"]
	var facing: String = state["position"]["facing"]
	var stair: Variant = _room_stairs_edge(world, room_id, facing)
	if typeof(stair) != TYPE_DICTIONARY or typeof((stair["edge"] as Dictionary).get("targetRoomId", null)) != TYPE_STRING:
		return _log_only(state, {"type": "command_blocked", "reason": "stairs_unavailable", "command": "use_stairs"})
	var edge: Dictionary = stair["edge"]

	# A locked gate on the STAIR's direction bars the descent until it is opened.
	var room: Variant = _room(world, room_id)
	var stair_gate: Variant = _find_gate(room, String(stair["direction"]))
	if typeof(stair_gate) == TYPE_DICTIONARY and not _is_gate_open(stair_gate, state):
		var blocked: Dictionary = state.duplicate(true)
		blocked["turn"] = int(blocked.get("turn", 0)) + 1
		return {"state": blocked, "events": [{"type": "movement_blocked", "reason": "locked", "roomId": room_id, "facing": facing}]}

	var target_id: String = edge["targetRoomId"]
	var target_room: Variant = _room(world, target_id)
	var visit := _visit_room(state, world, target_id, facing)
	var target_cell: Variant = _grid_cell(world, target_id)
	var to_floor: Variant = edge.get("targetFloorId", null)
	if to_floor == null:
		to_floor = visit["map"].get("floorId", null)
	var events: Array = [{"type": "stairs_used", "fromRoomId": room_id, "toRoomId": target_id, "toFloorId": to_floor}]
	events.append_array(visit["events"])

	var next: Dictionary = state.duplicate(true)
	next["position"]["roomId"] = target_id
	next["position"]["cellId"] = target_cell.get("id", null) if typeof(target_cell) == TYPE_DICTIONARY else null
	next["party"] = _mark_deepest_floor(next.get("party", []), visit["map"].get("floorId", state.get("map", {}).get("floorId", null)))
	next["map"] = visit["map"]
	# Changing floors REPOPULATES the one you arrive on: the floor-scoped clear state resets, so its
	# chambers hold enemies and treasure again.
	next["floorClearedEnemies"] = []
	next["floorClaimedTreasures"] = []
	next["chests"] = []
	next["turn"] = int(next.get("turn", 0)) + 1

	if typeof(target_room) == TYPE_DICTIONARY and not _room_has_encounter(target_room):
		var chest_result := _ensure_chest_for_room(next, target_room, next["position"].get("cellId", null))
		next = chest_result["state"]
		events.append_array(chest_result["events"])

	if typeof(target_room) == TYPE_DICTIONARY and typeof(target_room.get("event", null)) == TYPE_STRING:
		events.append({"type": "room_event_triggered", "roomId": target_id, "text": target_room["event"]})

	var effects := _apply_cell_effects(next, world, target_room, events)
	next = effects["state"]
	# Arriving on a floor by stairs is SAFE — monsters are met by walking the floor, never on the landing.
	return {"state": next, "events": events}

static func _return_to_town(state: Dictionary, world: Dictionary) -> Dictionary:
	if state.get("phase", "") != "dungeon" or state.get("position", null) == null:
		return {"state": state, "events": []}
	var room: Variant = _room(world, String(state["position"]["roomId"]))
	if typeof(room) != TYPE_DICTIONARY or (not bool(room.get("stairsToTown", false)) and not bool(room.get("restPoint", false))):
		return _log_only(state, {"type": "command_blocked", "reason": "town_return_unavailable", "command": "return_to_town"})
	var next: Dictionary = state.duplicate(true)
	next["phase"] = "town"
	next["position"] = null
	next["combat"] = null
	next["map"]["currentRoomId"] = null
	next["map"]["currentCellId"] = null
	next["map"]["currentFacing"] = null
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "returned_to_town"}]}

static func _disarm_trap(state: Dictionary, world: Dictionary) -> Dictionary:
	if state.get("position", null) == null:
		return {"state": state, "events": []}
	var room: Variant = _room(world, String(state["position"]["roomId"]))
	var trap: Variant = room.get("trap", null) if typeof(room) == TYPE_DICTIONARY else null
	if typeof(trap) != TYPE_DICTIONARY or (state.get("resolvedTraps", []) as Array).has(trap.get("id", "")):
		return _log_only(state, {"type": "trap_disarm_failed", "reason": "none_active"})
	var next: Dictionary = state.duplicate(true)
	(next["resolvedTraps"] as Array).append(trap.get("id", ""))
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "trap_disarmed", "trapId": trap.get("id", ""), "trapName": trap.get("name", "")}]}


# --- combat exits -----------------------------------------------------------------------------------
# Retreat: the fight is abandoned; every member remembers it (memory.retreats is part of who they are).
static func _retreat(state: Dictionary) -> Dictionary:
	if state.get("phase", "") != "combat":
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["phase"] = "dungeon"
	next["combat"] = null
	var party := []
	for member in next.get("party", []):
		var m: Dictionary = member.duplicate(true)
		var memory: Dictionary = (m.get("memory", {}) as Dictionary).duplicate(true)
		memory["retreats"] = int(memory.get("retreats", 0)) + 1
		m["memory"] = memory
		party.append(m)
	next["party"] = party
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "party_retreated"}]}

# The victory RESULT screen is a state: until it is dismissed, resolveCommand answers nothing else.
# Continuing clears it and puts the party back where the fight interrupted them.
static func _continue_after_combat(state: Dictionary) -> Dictionary:
	var conclusion: Variant = state.get("combatConclusion", null)
	if typeof(conclusion) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["phase"] = "dungeon"
	next["combatConclusion"] = null
	var resume: Variant = conclusion.get("resumePosition", null)
	if typeof(resume) == TYPE_DICTIONARY:
		next["position"] = (resume as Dictionary).duplicate(true)
		next["map"]["currentRoomId"] = resume.get("roomId", null)
		var cell: Variant = resume.get("cellId", null)
		next["map"]["currentCellId"] = cell if cell != null else next["map"].get("currentCellId", null)
		next["map"]["currentFacing"] = resume.get("facing", null)
	return {"state": next, "events": []}


# --- expedition start / checkpoint / item use -------------------------------------------------------
static func _mark_expedition_started(party: Array, floor_id: Variant, turn: int) -> Array:
	var marked := []
	for member in party:
		var m: Dictionary = member.duplicate(true)
		var memory: Dictionary = (m.get("memory", {}) as Dictionary).duplicate(true)
		if memory.get("firstExpeditionTurn", null) == null:
			memory["firstExpeditionTurn"] = turn
		m["memory"] = memory
		marked.append(m)
	return _mark_deepest_floor(marked, floor_id)

# Face the party into the dungeon toward the entrance's ACTUAL open exit, preferring east so floors
# built around an eastward trunk read unchanged.
static func _enter_dungeon(state: Dictionary, world: Dictionary) -> Dictionary:
	if (state.get("party", []) as Array).is_empty():
		return _log_only(state, {"type": "command_blocked", "reason": "party_required", "command": "enter_dungeon"})
	var start_room_id := String(world.get("startRoom", ""))
	var start_room: Variant = _room(world, start_room_id)
	var exits: Dictionary = start_room.get("exits", {}) if typeof(start_room) == TYPE_DICTIONARY else {}
	var facing := "east"
	if not exits.has("east"):
		var keys: Array = exits.keys()
		facing = String(keys[0]) if not keys.is_empty() else "east"

	var visit := _visit_room(state, world, start_room_id, facing)
	var start_cell: Variant = _grid_cell(world, start_room_id)
	var next: Dictionary = state.duplicate(true)
	next["phase"] = "dungeon"
	next["position"] = {"roomId": start_room_id, "cellId": start_cell.get("id", null) if typeof(start_cell) == TYPE_DICTIONARY else null, "facing": facing}
	next["combat"] = null
	next["party"] = _mark_expedition_started(next.get("party", []), visit["map"].get("floorId", world.get("startDungeon", null)), int(state.get("turn", 0)) + 1)
	next["map"] = visit["map"]
	next["floorClearedEnemies"] = []
	next["floorClaimedTreasures"] = []
	next["chests"] = []
	# The town greets a party differently once it has been below. Count the descents.
	next["expeditions"] = int(next.get("expeditions", 0)) + 1
	next["turn"] = int(next.get("turn", 0)) + 1

	var events: Array = [{"type": "dungeon_entered", "roomId": start_room_id, "facing": facing}]
	events.append_array(visit["events"])
	if typeof(start_room) == TYPE_DICTIONARY and not _room_has_encounter(start_room):
		var chest_result := _ensure_chest_for_room(next, start_room, next["position"].get("cellId", null))
		next = chest_result["state"]
		events.append_array(chest_result["events"])
	return {"state": next, "events": events}

# Resume at a REST POINT the party has already reached — the long walk back is not the challenge.
static func _resume_at_checkpoint(state: Dictionary, world: Dictionary, room_id: String) -> Dictionary:
	if (state.get("party", []) as Array).is_empty():
		return _log_only(state, {"type": "command_blocked", "reason": "party_required", "command": "enter_dungeon"})
	var room: Variant = _room(world, room_id)
	var visited: Array = (state.get("map", {}) as Dictionary).get("visitedRooms", [])
	if typeof(room) != TYPE_DICTIONARY or not bool(room.get("restPoint", false)) or not visited.has(room_id):
		return {"state": state, "events": []}

	var visit := _visit_room(state, world, room_id, "east")
	var start_cell: Variant = _grid_cell(world, room_id)
	var next: Dictionary = state.duplicate(true)
	next["phase"] = "dungeon"
	next["position"] = {"roomId": room_id, "cellId": start_cell.get("id", null) if typeof(start_cell) == TYPE_DICTIONARY else null, "facing": "east"}
	next["combat"] = null
	next["party"] = _mark_expedition_started(next.get("party", []), visit["map"].get("floorId", world.get("startDungeon", null)), int(state.get("turn", 0)) + 1)
	next["map"] = visit["map"]
	next["floorClearedEnemies"] = []
	next["floorClaimedTreasures"] = []
	next["chests"] = []
	next["turn"] = int(next.get("turn", 0)) + 1
	var events: Array = [{"type": "room_entered", "roomId": room_id, "roomName": room.get("name", room_id)}]
	events.append_array(visit["events"])
	return {"state": next, "events": events}

static func _find_inventory_item(state: Dictionary, item_id: String) -> Variant:
	for candidate in state.get("inventory", []):
		if candidate.get("id", "") == item_id and int(candidate.get("quantity", 0)) > 0:
			return candidate
	return null

static func _spend_one(inventory: Array, item_id: String) -> Array:
	var out := []
	for candidate in inventory:
		if candidate.get("id", "") == item_id:
			var c: Dictionary = candidate.duplicate(true)
			c["quantity"] = maxi(0, int(c.get("quantity", 0)) - 1)
			out.append(c)
		else:
			out.append(candidate)
	return out

static func _is_boss_floor(world: Dictionary, floor_id: Variant) -> bool:
	for dungeon in world.get("dungeons", []):
		if dungeon.get("id", "") == floor_id:
			return (dungeon.get("tags", []) as Array).has("boss")
	return false

# use_item outside combat: an ESCAPE charm goes home, a GROWTH item permanently raises an adventurer,
# a consumable heals. The escape charm is barred on the boss floor — the finale is a commitment.
static func _use_item(state: Dictionary, world: Dictionary, item_id: String, target_id: String) -> Dictionary:
	var item: Variant = _find_inventory_item(state, item_id)
	if typeof(item) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var kind := String(item.get("kind", ""))

	if kind == "escape":
		if state.get("phase", "") != "dungeon" or state.get("position", null) == null:
			return {"state": state, "events": []}
		if _is_boss_floor(world, (state.get("map", {}) as Dictionary).get("floorId", null)):
			return _log_only(state, {"type": "command_blocked", "reason": "town_return_unavailable", "command": "return_to_town"})
		var escaped: Dictionary = state.duplicate(true)
		escaped["phase"] = "town"
		escaped["position"] = null
		escaped["combat"] = null
		escaped["map"]["currentRoomId"] = null
		escaped["map"]["currentCellId"] = null
		escaped["map"]["currentFacing"] = null
		escaped["inventory"] = _spend_one(escaped.get("inventory", []), item_id)
		escaped["turn"] = int(escaped.get("turn", 0)) + 1
		return {"state": escaped, "events": [{"type": "returned_to_town"}]}

	if kind == "growth" and typeof(item.get("grants", null)) == TYPE_DICTIONARY:
		return _use_growth_item(state, item, target_id)

	var target := _find_by_id(state.get("party", []), target_id)
	if target.is_empty() or not (kind == "healing" or kind == "cure" or kind == "focus"):
		return {"state": state, "events": []}
	var applied := CombatRound._apply_healing_item(state.get("party", []), state.get("inventory", []), item_id, target_id, world)
	var next: Dictionary = state.duplicate(true)
	next["party"] = applied["party"]
	next["inventory"] = applied["inventory"]
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "item_used", "itemId": item.get("id", ""), "itemName": item.get("name", ""), "targetCharacterId": target_id, "targetName": target.get("name", ""), "healAmount": int(item.get("healAmount", 0))}]}

# A GROWTH item raises aptitudes/stats permanently; granted xp goes through the level curve.
static func _use_growth_item(state: Dictionary, item: Dictionary, target_id: String) -> Dictionary:
	if state.get("phase", "") == "combat":
		return {"state": state, "events": []}
	var target := _find_by_id(state.get("party", []), target_id)
	var grants: Dictionary = item.get("grants", {})
	if target.is_empty():
		return {"state": state, "events": []}
	var level_before := int(target.get("level", 1))

	var grown := []
	var grown_target := {}
	for member in state.get("party", []):
		if String(member.get("id", "")) != target_id:
			grown.append(member)
			continue
		var m: Dictionary = member.duplicate(true)
		var apt: Dictionary = (m.get("aptitude", {}) as Dictionary).duplicate(true)
		for key in ["might", "agility", "spirit", "wit", "luck"]:
			apt[key] = int(apt.get(key, 0)) + int(grants.get(key, 0))
		m["aptitude"] = apt
		m["maxHp"] = int(m.get("maxHp", 0)) + int(grants.get("maxHp", 0))
		m["hp"] = int(m.get("hp", 0)) + int(grants.get("maxHp", 0))   # the new HP is usable immediately
		m["maxMp"] = int(m.get("maxMp", 0)) + int(grants.get("maxMp", 0))
		m["mp"] = int(m.get("mp", 0)) + int(grants.get("maxMp", 0))
		m["attack"] = int(m.get("attack", 0)) + int(grants.get("attack", 0))
		m["damageMin"] = int(m.get("damageMin", 0)) + int(grants.get("attack", 0))
		m["damageMax"] = int(m.get("damageMax", 0)) + int(grants.get("attack", 0))
		m["xp"] = int(m.get("xp", 0)) + int(grants.get("xp", 0))
		if int(grants.get("xp", 0)) != 0:
			m = Leveling.apply_level_ups(m)["character"]
		grown_target = m
		grown.append(m)

	var next: Dictionary = state.duplicate(true)
	next["party"] = grown
	next["inventory"] = _spend_one(next.get("inventory", []), String(item.get("id", "")))
	next["turn"] = int(next.get("turn", 0)) + 1
	var events: Array = [{"type": "item_used", "itemId": item.get("id", ""), "itemName": item.get("name", ""), "targetCharacterId": target_id, "targetName": target.get("name", ""), "healAmount": 0}]
	if int(grown_target.get("level", 1)) > level_before:
		events.append({"type": "character_leveled_up", "characterId": target_id, "characterName": grown_target.get("name", ""), "level": int(grown_target.get("level", 1))})
	return {"state": next, "events": events}


# --- legacy single-action combat verbs + roster import + debug --------------------------------------
# attack: the one-button melee. Lands on the front line first; the back line only once it is exposed.
static func _attack(state: Dictionary, world: Dictionary, engine: Dictionary) -> Dictionary:
	if state.get("phase", "") != "combat" or typeof(state.get("combat", null)) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var combat: Dictionary = state["combat"]
	var groups: Array = combat.get("enemyGroups", [])
	var actor: Variant = null
	for member in state.get("party", []):
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null and String(member.get("row", "front")) == "front":
			actor = member
			break
	if actor == null and not (state.get("party", []) as Array).is_empty():
		actor = state["party"][0]
	var target: Variant = null
	for group in groups:
		if Encounters._melee_targetable(group, groups):
			target = group
			break
	if target == null:
		for group in groups:
			if int(group.get("count", 0)) > 0:
				target = group
				break
	if typeof(actor) != TYPE_DICTIONARY or typeof(target) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	return CombatRound.declare_round(state, world, [{"actorId": actor.get("id", ""), "action": "attack", "targetGroupId": target.get("id", "")}], engine)

# defend: the legacy whole-party brace — the enemy's blow lands softened on everyone.
static func _defend(state: Dictionary) -> Dictionary:
	if state.get("phase", "") != "combat" or typeof(state.get("combat", null)) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var enemy: Dictionary = (state["combat"] as Dictionary).get("enemy", {})
	var damage := maxi(0, int(enemy.get("attack", 0)) - 2)
	var next: Dictionary = state.duplicate(true)
	var party := []
	for member in next.get("party", []):
		var m: Dictionary = member.duplicate(true)
		m["hp"] = maxi(1, int(m.get("hp", 0)) - damage)
		party.append(m)
	next["party"] = party
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "party_defended", "enemyId": enemy.get("id", ""), "enemyName": enemy.get("name", ""), "damage": damage}]}

# import_member: a PORTABLE adventurer joins the bench, re-derived under this scenario's import policy.
static func _import_member(state: Dictionary, world: Dictionary, engine: Dictionary, adventurer: Dictionary) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var imported := CharacterCreation.import_adventurer(adventurer, world, engine)
	if imported.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	var reserve: Array = (next.get("reserve", []) as Array).duplicate(true)
	reserve.append(imported["character"])
	next["reserve"] = reserve
	return {"state": next, "events": [{"type": "party_member_imported", "characterName": (imported["character"] as Dictionary).get("name", ""), "adjustments": imported["adjustments"]}]}

# DEBUG ONLY — never surfaced in normal play (AGENTS.md); ported so the command set is complete.
static func _debug_revive_party(state: Dictionary) -> Dictionary:
	var next: Dictionary = state.duplicate(true)
	var party := []
	for member in next.get("party", []):
		var m: Dictionary = member.duplicate(true)
		m["hp"] = int(m.get("maxHp", 0))
		m["mp"] = int(m.get("maxMp", 0))
		m.erase("injury")
		m["status"] = []
		party.append(m)
	next["party"] = party
	return {"state": next, "events": [{"type": "debug_started", "text": "Debug: party fully revived and restored."}]}

static func _find_by_id(list: Variant, id: String) -> Dictionary:
	if typeof(list) == TYPE_ARRAY:
		for m in list:
			if typeof(m) == TYPE_DICTIONARY and String(m.get("id", "")) == id:
				return m
	return {}

static func _without_id(list: Variant, id: String) -> Array:
	var out := []
	if typeof(list) == TYPE_ARRAY:
		for m in list:
			if String(m.get("id", "")) != id:
				out.append(m)
	return out

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

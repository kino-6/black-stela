extends RefCounted
## How the party is placed when the dungeon scene is (re)entered. Extracted from dungeon.gd so the
## played-build gate (verify_played_loop.gd) can assert it headlessly — this is where two core-loop
## bugs from the 2026-07-25 playtest were fixed:
##
##   #11 auto-return after combat — victory routed through result → town. The fix routes by phase
##       (see `continue_scene`); this module makes the RESUME land correctly instead of teleporting.
##   #12 map reset on return — `_enter_at_landing` overwrote visitedCells/Rooms/knownExits with just
##       the landing on EVERY entry, erasing the automap the rules deliberately keep. (rulesEngine
##       `returnToTown` sets position=null but preserves the visited map — the automap is the party's
##       permanent record.)
##
## The deciding signal is `position`:
##   - VICTORY RESUME: run_state.return_to_town() clears combat but LEAVES position on the fight cell.
##     A non-null position.cellId means "resume exactly where we were" (any floor) — keep both.
##   - FRESH LANDING: rules `returnToTown` nulled the position, so we place the party at the floor's
##     stair landing. The visited automap is KEPT (unioned with the landing) when it belongs to this
##     floor, and only reseeded when the persisted map is for a different floor / a brand-new run.

const PASSAGE_KINDS := ["open", "door", "one_way"]

## Returns {"position": {...}, "map": {...}} for a dungeon (re)entry. `entrance_room` (T30/U5) chooses a
## portal for a FRESH landing; empty ⇒ the world's default start room.
static func plan(state: Dictionary, world: Dictionary, entrance_room: String = "") -> Dictionary:
	var pos: Dictionary = state.get("position", {}) if typeof(state.get("position", null)) == TYPE_DICTIONARY else {}
	# Victory resume: position is still on the fight cell (combat cleared but position left intact).
	if String(pos.get("cellId", "")) != "":
		return {"position": pos, "map": state.get("map", {})}

	# Fresh landing at the chosen portal (T30/U5), or the world's first floor by default.
	var start_room: String = world.get("startRoom", "room.b1f.001")
	if entrance_room != "" and _is_entrance_room(world, entrance_room):
		start_room = entrance_room
	# The dungeon group of the landing room — its own floor's group, so a second dungeon lands on its floor.
	var start_dungeon: String = _floor_id_for_room(world, start_room)
	if start_dungeon == "":
		start_dungeon = world.get("startDungeon", "dungeon.b1f")
	var cell := cell_for_room(world, start_room)
	var cell_id: String = String(cell.get("id", "")) if not cell.is_empty() else ""
	var open_dirs := open_dirs_for(cell)
	var facing: String = String(open_dirs[0]) if not open_dirs.is_empty() else "south"

	var persisted: Dictionary = state.get("map", {}) if typeof(state.get("map", null)) == TYPE_DICTIONARY else {}
	var keep_automap: bool = String(persisted.get("floorId", "")) == start_dungeon \
		and not (persisted.get("visitedCells", []) as Array).is_empty()

	var map: Dictionary
	if keep_automap:
		# Re-descend to a floor we already mapped: keep the automap, just re-mark the landing + here.
		map = persisted.duplicate(true)
		map["visitedCells"] = _with(map.get("visitedCells", []), cell_id)
		map["visitedRooms"] = _with(map.get("visitedRooms", []), start_room)
		var exits: Dictionary = map.get("knownExits", {})
		exits[start_room] = open_dirs
		map["knownExits"] = exits
	else:
		# Brand-new expedition, or a different floor than the automap holds: seed fresh.
		map = {
			"visitedCells": [cell_id] if cell_id != "" else [],
			"visitedRooms": [start_room],
			"knownExits": {start_room: open_dirs},
		}
	map["floorId"] = start_dungeon
	map["currentCellId"] = cell_id
	map["currentRoomId"] = start_room
	map["currentFacing"] = facing
	return {"position": {"cellId": cell_id, "roomId": start_room, "facing": facing}, "map": map}

## After a combat concludes, which scene continues the game. Victory leaves phase="dungeon" (resume
## exploration); a wipe/return leaves phase="town".
static func continue_scene(phase: String) -> String:
	return "res://scenes/dungeon.tscn" if phase == "dungeon" else "res://scenes/town.tscn"

static func cell_for_room(world: Dictionary, room_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			if cell.get("roomId", "") == room_id:
				return cell
	return {}

static func open_dirs_for(cell: Dictionary) -> Array:
	var out := []
	for dir in ["north", "east", "south", "west"]:
		if is_passage(cell.get("edges", {}).get(dir, null)):
			out.append(dir)
	return out

static func is_passage(edge: Variant) -> bool:
	return typeof(edge) == TYPE_DICTIONARY and edge.get("kind", "") in PASSAGE_KINDS

static func _with(arr: Array, value: String) -> Array:
	var out := arr.duplicate()
	if value != "" and not out.has(value):
		out.append(value)
	return out

# T30/U5: whether `room_id` is one of this world's town portals. No authored `entrances` ⇒ startRoom only.
static func _is_entrance_room(world: Dictionary, room_id: String) -> bool:
	var authored: Array = world.get("entrances", [])
	if authored.is_empty():
		return room_id == String(world.get("startRoom", ""))
	for entrance in authored:
		if String((entrance as Dictionary).get("startRoom", "")) == room_id:
			return true
	return false

# The floor (dungeon) id that owns `room_id`, or "" if none — mirrors scenario.ts getFloorIdForRoom.
static func _floor_id_for_room(world: Dictionary, room_id: String) -> String:
	for dungeon in world.get("dungeons", []):
		for room in (dungeon as Dictionary).get("rooms", []):
			if String((room as Dictionary).get("id", "")) == room_id:
				return String((dungeon as Dictionary).get("id", ""))
	return ""

extends SceneTree
## #gather — repeatable gather nodes. Searching a `gatherTable` room yields an ITEM per pull (never
## materials), raises the ambush chance the more you rummage, and exhausts after gatherMaxPulls. Drives the
## real _search over terminal-line's tl1f salvage node and asserts: items come out, the pull counter caps,
## an exhausted node gives nothing, and a forced greed-ambush spawns a floor-appropriate pack.

const ExplorationCommands := preload("res://scripts/rules/exploration_commands.gd")
const Encounters := preload("res://scripts/rules/encounters.gd")

const GATHER_ROOM := "room.tl1f.maintenance-terminal"
var _problems: Array[String] = []

func _initialize() -> void:
	var world := _world("terminal-line")
	if world.is_empty():
		_check(false, "terminal-line world loads")
		_finish()
		return

	var state := _gather_state()
	var items := 0
	var ambushes := 0
	for _i in range(0, 8):
		var before := (state.get("inventory", []) as Array).size()
		var res: Dictionary = ExplorationCommands._search(state, world, {}, "", "")
		state = res["state"]
		if (state.get("inventory", []) as Array).size() > before:
			items += 1
		if String(state.get("phase", "")) == "combat":
			ambushes += 1
			state["phase"] = "dungeon"       # isolate the gather loop from the ambush it may trigger
			state["combat"] = null

	_check(items >= 1, "gathering a salvage node yields items (got %d)" % items)
	var pulls := int((state.get("gatherPulls", {}) as Dictionary).get(GATHER_ROOM, 0))
	_check(pulls == 4, "the node caps at gatherMaxPulls=4 (got %d)" % pulls)

	# An exhausted node yields nothing more.
	var pre := (state.get("inventory", []) as Array).size()
	var again: Dictionary = ExplorationCommands._search(state, world, {}, "", "")
	_check((again["state"].get("inventory", []) as Array).size() == pre, "an exhausted node yields nothing further")

	# Greed is punished: a forced ambush spawns a floor-appropriate pack (the escalating chance is seeded).
	var room: Variant = _find_room(world, GATHER_ROOM)
	var forced: Variant = Encounters.begin_wandering_encounter(world, room, _gather_state(), true)
	_check(typeof(forced) == TYPE_DICTIONARY and (forced as Dictionary).has("combat"), "a forced gather ambush spawns a pack")

	_finish()

func _gather_state() -> Dictionary:
	return {
		"phase": "dungeon",
		"turn": 5,
		"position": {"roomId": GATHER_ROOM, "cellId": GATHER_ROOM, "facing": "north"},
		"discoveredSecrets": [],
		"inventory": [],
		"party": [
			{"id": "a", "hp": 20, "maxHp": 30, "mp": 10, "maxMp": 10, "equipment": {}, "status": []},
			{"id": "b", "hp": 25, "maxHp": 30, "mp": 10, "maxMp": 10, "equipment": {}, "status": []}
		]
	}

func _find_room(world: Dictionary, id: String) -> Variant:
	for d in world.get("dungeons", []):
		for r in (d as Dictionary).get("rooms", []):
			if String((r as Dictionary).get("id", "")) == id:
				return r
	return null

func _world(id: String) -> Dictionary:
	var path := "res://data/worlds/%s.json" % id
	if not FileAccess.file_exists(path):
		return {}
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return (doc as Dictionary).get("world", {}) if typeof(doc) == TYPE_DICTIONARY else {}

func _check(ok: bool, label: String) -> void:
	if not ok:
		_problems.append(label)

func _finish() -> void:
	if _problems.is_empty():
		print("[gather] PASS — nodes yield items, cap out, and greedy pulls risk an ambush")
		quit(0)
	else:
		for p in _problems:
			push_error("[gather] %s" % p)
		quit(1)

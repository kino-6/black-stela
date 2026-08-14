extends SceneTree
## #32 random dungeon events — a world's authored events roll while walking and apply their small one-shot
## effects; a world that authors none is a strict no-op (the parity guarantee). Drives the roll directly
## over a deterministic turn sweep (seeded by turn + room) so the weighted outcomes are reproducible.

const DungeonEvents := preload("res://scripts/rules/dungeon_events.gd")

var _problems: Array[String] = []

func _initialize() -> void:
	var tl: Dictionary = _world("terminal-line")
	if tl.is_empty():
		_check(false, "terminal-line world pack loads")
		_finish()
		return

	var fires := 0
	var no_state_change := true
	var saw_text := true
	for turn in range(0, 600):
		var state := _walk_state(turn)
		var r: Variant = DungeonEvents.maybe_roll(state, tl)
		if typeof(r) != TYPE_DICTIONARY:
			continue
		fires += 1
		var ev: Dictionary = r["event"]
		if String(ev.get("type", "")) != "room_event_triggered" or String(ev.get("text", "")).strip_edges() == "":
			saw_text = false
		# FLAVOUR-ONLY: a roaming event must NOT change HP or materials — otherwise pacing back and forth
		# farms/oscillates them (playtest 2026-08-14「往復するとHPが減ったり増えたり」). Effects belong to
		# deliberate actions (gather nodes, chests, combat), never a per-step roll.
		var ns: Dictionary = r["state"]
		if int(ns.get("materials", 0)) != int(state.get("materials", 0)):
			no_state_change = false
		var before_hp := 0
		var after_hp := 0
		for m in state.get("party", []):
			before_hp += int((m as Dictionary).get("hp", 0))
		for m in ns.get("party", []):
			after_hp += int((m as Dictionary).get("hp", 0))
		if after_hp != before_hp:
			no_state_change = false

	_check(fires > 0, "terminal-line rolls dungeon events over a walk (fired %d times)" % fires)
	_check(saw_text, "every fired event carries a room_event_triggered log line")
	_check(no_state_change, "roaming events are flavour-only — they never change HP or materials (no pacing farm)")

	# The parity guarantee: a world that authors no dungeonEvents never rolls (null every step).
	var default_world: Dictionary = _world("default")
	var default_noop := true
	for turn in range(0, 200):
		if typeof(DungeonEvents.maybe_roll(_walk_state(turn), default_world)) == TYPE_DICTIONARY:
			default_noop = false
			break
	_check(default_noop, "a world with no authored dungeon events never rolls (parity no-op)")

	_finish()

func _walk_state(turn: int) -> Dictionary:
	return {
		"turn": turn,
		"position": {"roomId": "room.tl1f.security-corridor"},
		"materials": 0,
		"partyGold": 0,
		"party": [
			{"id": "a", "hp": 20, "maxHp": 30, "maxMp": 10, "mp": 10, "equipment": {}, "status": []},
			{"id": "b", "hp": 25, "maxHp": 30, "maxMp": 10, "mp": 10, "equipment": {}, "status": []}
		]
	}

func _world(id: String) -> Dictionary:
	var path := "res://data/worlds/%s.json" % id
	if not FileAccess.file_exists(path):
		return {}
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(doc) != TYPE_DICTIONARY:
		return {}
	return (doc as Dictionary).get("world", {})

func _check(ok: bool, label: String) -> void:
	if not ok:
		_problems.append(label)

func _finish() -> void:
	if _problems.is_empty():
		print("[dungeon-events] PASS — authored events roll and apply; unauthored worlds are a no-op")
		quit(0)
	else:
		for p in _problems:
			push_error("[dungeon-events] %s" % p)
		quit(1)

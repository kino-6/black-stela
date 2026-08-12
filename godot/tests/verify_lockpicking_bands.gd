extends SceneTree
## D6 — lock success must preserve the choice of handler, growth and tool use.  The TypeScript oracle
## exports raw chance samples; this gate verifies Godot parity AND Terminal Line's authored lock bands.
## godot --headless --path godot/ --script res://tests/verify_lockpicking_bands.gd

const Chests := preload("res://scripts/rules/chests.gd")
const Exploration := preload("res://scripts/rules/exploration.gd")
const ChestPanel := preload("res://scripts/dungeon/chest_panel.gd")

const EXPECTED := [
	{"floor": "dungeon.tl1f", "low": 6, "high": 10, "level": 1},
	{"floor": "dungeon.tl2f", "low": 10, "high": 14, "level": 3},
	{"floor": "dungeon.tl5f", "low": 14, "high": 18, "level": 5},
	{"floor": "dungeon.tl7f", "low": 19, "high": 23, "level": 7},
	{"floor": "dungeon.tl10f", "low": 26, "high": 30, "level": 10},
]

var failures := 0

func _initialize() -> void:
	_verify_typescript_samples()
	var world := _read("res://data/worlds/terminal-line.json").get("world", {}) as Dictionary
	var engine := _read("res://data/engine-data.json")
	if world.is_empty() or engine.is_empty():
		_fail("Terminal Line world or engine data is unavailable")
		quit(1)
		return
	var unlock_aids := _unlock_aids(world)
	for expected in EXPECTED:
		var difficulty := _lock_difficulty(world, String(expected["floor"]))
		if difficulty < 0:
			_fail("%s has no authored lock" % expected["floor"])
			continue
		_check(difficulty >= int(expected["low"]) and difficulty <= int(expected["high"]), "%s lock DC %d is in its authored depth band" % [expected["floor"], difficulty])
		var level := int(expected["level"])
		var untrained := _chance("warrior", level, difficulty, 0, engine)
		var trained := _chance("swordmaster", level, difficulty, 0, engine)
		var specialist := _chance("thief", level, difficulty, 0, engine)
		var tool := _chance("warrior", level, difficulty, 6, engine)
		_check(untrained >= 30 and untrained <= 50, "%s untrained %d%% remains an attempt, not a formality" % [expected["floor"], untrained])
		_check(trained > untrained and trained < specialist, "%s trained %d%% remains between untrained %d%% and specialist %d%%" % [expected["floor"], trained, untrained, specialist])
		_check(specialist >= 55 and specialist <= 70, "%s specialist %d%% is reliable but never capped" % [expected["floor"], specialist])
		_check(tool > untrained and tool < specialist, "%s tool %d%% sits between untrained %d%% and specialist %d%%" % [expected["floor"], tool, untrained, specialist])
		for aid in unlock_aids:
			var aid_dict := aid as Dictionary
			var aid_chance := _chance("warrior", level, difficulty, int(aid_dict.get("bonus", 0)), engine)
			_check(aid_chance > untrained and aid_chance < specialist, "%s %s %d%% stays between untrained and specialist" % [expected["floor"], aid_dict.get("id", "unlock tool"), aid_chance])
		_check(specialist < 95, "%s specialist is not a 95%% automatic success" % expected["floor"])
	var f5 := _lock_difficulty(world, "dungeon.tl5f")
	if f5 >= 0:
		var novice := _chance("thief", 1, f5, 0, engine)
		var practiced := _chance("thief", 5, f5, 0, engine)
		var veteran := _chance("thief", 10, f5, 0, engine)
		_check(practiced >= novice + 8 and veteran >= practiced + 8, "same specialist grows %d%% → %d%% → %d%%" % [novice, practiced, veteran])
	var trained_bonus := _skill("swordmaster", 1, engine) - _skill("warrior", 1, engine)
	var specialist_bonus := _skill("thief", 1, engine) - _skill("warrior", 1, engine)
	_check(trained_bonus > 0 and trained_bonus < specialist_bonus, "unlock has a real trained class tier (%d) below specialist (%d)" % [trained_bonus, specialist_bonus])
	for aid in unlock_aids:
		var aid_dict := aid as Dictionary
		_check(int(aid_dict.get("bonus", 0)) < specialist_bonus, "%s remains weaker than specialist training" % aid_dict.get("id", "unlock tool"))
	_verify_recommended_handler(world, engine)
	print("[lockpicking-bands] %s" % ("PASS" if failures == 0 else "FAIL %d issue(s)" % failures))
	quit(1 if failures > 0 else 0)

func _verify_typescript_samples() -> void:
	var fixture := _read("res://data/lockpicking-samples.json")
	if fixture.is_empty():
		_fail("TypeScript lockpicking sample export is absent")
		return
	for sample in fixture.get("samples", []):
		var actual := Chests.unlock_chance(int((sample as Dictionary).get("skill", 0)), int((sample as Dictionary).get("difficulty", 0)))
		_check(actual == int((sample as Dictionary).get("chance", -1)), "TS↔Godot %s = %d%%" % [(sample as Dictionary).get("id", "sample"), actual])

func _chance(class_id: String, level: int, difficulty: int, tool_bonus: int, engine: Dictionary) -> int:
	return Chests.unlock_chance(_skill(class_id, level, engine) + tool_bonus, difficulty)

func _skill(class_id: String, level: int, engine: Dictionary) -> int:
	var member := {"id": "%s-%d" % [class_id, level], "name": class_id, "classId": class_id, "level": level, "hp": 20, "injury": null, "roleTags": [], "aptitude": {"agility": 5, "wit": 5, "luck": 5}}
	return Exploration.attempt_skill(member, engine, "unlock")

func _lock_difficulty(world: Dictionary, floor_id: String) -> int:
	for dungeon in world.get("dungeons", []):
		if String((dungeon as Dictionary).get("id", "")) != floor_id:
			continue
		for room in (dungeon as Dictionary).get("rooms", []):
			var chest: Variant = (room as Dictionary).get("chest", null)
			if typeof(chest) == TYPE_DICTIONARY and typeof((chest as Dictionary).get("lock", null)) == TYPE_DICTIONARY:
				return int(((chest as Dictionary).get("lock", {}) as Dictionary).get("difficulty", -1))
	return -1

func _unlock_aids(world: Dictionary) -> Array:
	var found := []
	for item in world.get("items", []):
		var aid: Variant = (item as Dictionary).get("explorationAid", null)
		if typeof(aid) == TYPE_DICTIONARY and ((aid as Dictionary).get("actions", []) as Array).has("unlock"):
			found.append({"id": String((item as Dictionary).get("id", "unlock tool")), "bonus": int((aid as Dictionary).get("bonus", 0))})
	return found

# The panel's returned default focus is the controller contract.  The non-headless capture companion
# drives the same panel in the actual Dungeon scene and supplies the visual proof without test-audio
# resources surviving a headless SceneTree shutdown.
func _verify_recommended_handler(world: Dictionary, engine: Dictionary) -> void:
	var chest := {"lock": {"difficulty": 8}, "investigated": false, "unlockAttempted": false, "unlocked": false}
	var party := [
		{"id": "lock-band-untrained", "name": "ユノ", "classId": "warrior", "level": 1, "hp": 20, "injury": null, "roleTags": [], "aptitude": {"agility": 5, "wit": 5, "luck": 5}},
		{"id": "lock-band-specialist", "name": "カイ", "classId": "thief", "level": 1, "hp": 18, "injury": null, "roleTags": [], "aptitude": {"agility": 5, "wit": 5, "luck": 5}},
	]
	var inventory := [{"id": "item.tl-maintenance-multitool", "quantity": 1}, {"id": "item.tl-breach-wedge", "quantity": 1}]
	var built: Dictionary = ChestPanel.build(chest, party, inventory, world, engine, "unlock", func(_action): pass, func(_command): pass, func(): pass, func(): pass)
	var focus: Variant = built.get("focus", null)
	_check(focus is Button and (focus as Button).text == "カイ　成功率 60%", "解錠 handler cursor starts on the specialist 60% candidate")
	if built.get("control", null) is Control:
		(built["control"] as Control).free()

func _read(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[lockpicking-bands] PASS %s" % label)
	else:
		_fail(label)

func _fail(label: String) -> void:
	failures += 1
	push_error("[lockpicking-bands] FAIL %s" % label)

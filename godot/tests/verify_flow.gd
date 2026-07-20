extends SceneTree
## Proves the vertical-slice LOOP connects at the RULES level on ONE shared state: the party at the ash
## gate steps forward (ported move_forward) INTO the authored ash-slime room → the run flips to combat →
## an all-out round (ported CombatRound) → victory + rewards. This is the dungeon→combat→result chain the
## scenes drive; here it is asserted headlessly, byte-independent of presentation. Run:
##   godot --headless --path godot/ --script res://tests/verify_flow.gd

const SliceRules := preload("res://scripts/rules/slice_rules.gd")
const CombatRound := preload("res://scripts/rules/combat_round.gd")

func _initialize() -> void:
	var world: Dictionary = _read("res://data/worlds/default.json").get("world", {})
	var engine: Dictionary = _read("res://data/engine-data.json")
	var state: Dictionary = (_read("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary).duplicate(true)

	var failures := 0

	# Stand at the stair landing (room.b1f.001) facing the one open way — south into room.b1f.002.
	state["phase"] = "dungeon"
	state["position"] = {"cellId": "cell.b1f.001", "roomId": "room.b1f.001", "facing": "south"}

	# 1) Ported move_forward enters room.002 and fires its authored encounter.
	var moved := SliceRules.resolve(state, {"type": "move_forward"}, world)
	state = moved["state"]
	if state.get("phase", "") != "combat":
		push_error("[flow] expected phase=combat after stepping into room.002, got %s" % state.get("phase", ""))
		failures += 1
	var groups: Array = state.get("combat", {}).get("enemyGroups", []) if typeof(state.get("combat", null)) == TYPE_DICTIONARY else []
	if groups.is_empty() or groups[0].get("enemyId", "") != "enemy.b1f.ash-slime":
		push_error("[flow] expected an ash-slime encounter, got %s" % str(groups))
		failures += 1
	# The encounter event is `enemy_encountered` — the name the PORTED rules emit (encounters.gd, from
	# rulesEngine). This assertion said `encounter_started`, a name that only ever existed in the S4 slice's
	# hand-written encounter code; when M4 replaced that with the real port the check went stale and this
	# script has failed ever since. It was not in any gate, so nothing said so.
	if not _has_event(moved["events"], "enemy_encountered"):
		push_error("[flow] expected an enemy_encountered event")
		failures += 1

	# 2) The SAME 6-member party fights an all-out round → CombatRound resolves to victory.
	var actions := []
	for member in state.get("party", []):
		if int(member.get("hp", 0)) > 0:
			actions.append({"action": "attack", "actorId": member.get("id", ""), "targetGroupId": groups[0].get("id", "")})
	var fought := CombatRound.declare_round(state, world, actions, engine)
	state = fought["state"]
	var rewards := _find_event(fought["events"], "combat_rewards")
	if rewards.is_empty():
		push_error("[flow] all-out round did not reach victory (no combat_rewards) — the round left the slime standing")
		failures += 1
	else:
		print("[flow] victory: %d xp / %d gold vs %s" % [int(rewards.get("xp", 0)), int(rewards.get("gold", 0)), str(rewards.get("enemyNames", []))])
	if typeof(state.get("combat", null)) == TYPE_DICTIONARY:
		push_error("[flow] combat was not cleared after victory")
		failures += 1

	print("[flow] %s (%d failures)" % ["PASS" if failures == 0 else "FAIL", failures])
	quit(failures)

func _has_event(events: Array, type_name: String) -> bool:
	return not _find_event(events, type_name).is_empty()

func _find_event(events: Array, type_name: String) -> Dictionary:
	for e in events:
		if typeof(e) == TYPE_DICTIONARY and e.get("type", "") == type_name:
			return e
	return {}

func _read(path: String) -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

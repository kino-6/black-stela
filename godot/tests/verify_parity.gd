extends SceneTree
## S3 parity harness: replay a golden trace's commands through the GDScript rules and assert every
## step reproduces the TS oracle's events and canonical state hash. This is the cross-runtime parity
## proof — TS stays the oracle; Godot must match it byte-for-byte. Run:
##   godot --headless --path godot/ --script res://tests/verify_parity.gd
##
## Only fully-ported routes are checked here; more are added as slice_rules.gd grows.

const StateHash := preload("res://scripts/rules/state_hash.gd")
const SliceRules := preload("res://scripts/rules/slice_rules.gd")

const PARITY_TRACES := ["b1f-turns", "b1f-wall", "b1f-exploration", "b1f-combat-victory", "b1f-combat-rounds", "b2f-ability", "b3f-poison", "b4f-caster", "verdant-wipe", "roster", "economy", "recovery", "recovery-blocked", "quests", "loot", "vocation", "b1f-trap", "b2f-hazard", "b4f-spinner", "b4f-teleport", "b1f-shortcut"]

func _load_world(world_id: String) -> Dictionary:
	var pack: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/%s.json" % world_id))
	return (pack.get("world", {}) if typeof(pack) == TYPE_DICTIONARY else {})

func _load_engine() -> Dictionary:
	var data: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/engine-data.json"))
	return data if typeof(data) == TYPE_DICTIONARY else {}

# Beats are presentation (text + battlefield snapshots the target UI rebuilds and localizes), so parity
# compares events SEMANTICALLY: combat_round_resolved keeps only its round, dropping summaries/beats.
# The state hash remains the strict oracle of game truth.
func _semantic_events(events: Array) -> Array:
	var out := []
	for event in events:
		if typeof(event) == TYPE_DICTIONARY and event.get("type", "") == "combat_round_resolved":
			out.append({"type": "combat_round_resolved", "round": event.get("round", 1)})
		else:
			out.append(event)
	return out

func _initialize() -> void:
	var failures := 0
	for name in PARITY_TRACES:
		failures += _check_trace(name)
	print("[parity] %s (%d failures)" % ["PASS" if failures == 0 else "FAIL", failures])
	quit(failures)

func _check_trace(name: String) -> int:
	var trace: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/traces/%s.json" % name))
	if typeof(trace) != TYPE_DICTIONARY:
		push_error("[parity] cannot load trace: %s" % name)
		return 1

	var failures := 0
	var world := _load_world(trace.get("worldId", "default"))
	var engine := _load_engine()
	var state: Dictionary = trace["initialState"]

	# The initial state must already hash to the oracle's value (the hash port is correct).
	if StateHash.hash_state(state) != trace["initialStateHash"]:
		push_error("[parity] %s: initial hash mismatch" % name)
		failures += 1

	var steps: Array = trace["steps"]
	for i in steps.size():
		var step: Dictionary = steps[i]
		var result: Dictionary = SliceRules.resolve(state, step["command"], world, engine)
		state = result["state"]

		var got_hash := StateHash.hash_state(state)
		var want_hash: String = step["stateHash"]
		var got_events := StateHash.canonical_json(_semantic_events(result["events"]))
		var want_events := StateHash.canonical_json(_semantic_events(step["events"]))

		if got_hash != want_hash:
			push_error("[parity] %s step %d (%s): state hash %s != %s" % [name, i, step["command"].get("type", "?"), got_hash, want_hash])
			failures += 1
		if got_events != want_events:
			push_error("[parity] %s step %d (%s): events %s != %s" % [name, i, step["command"].get("type", "?"), got_events, want_events])
			failures += 1

	if failures == 0:
		print("[parity] %s: %d/%d steps match" % [name, steps.size(), steps.size()])
	return failures

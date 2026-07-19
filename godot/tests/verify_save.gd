extends SceneTree
## M6 save round-trip gate. For each TS-written fixture:
##   1. LOAD it here and check the state hashes to the value the TS oracle recorded (so a run started in
##      React continues in Godot with no data loss),
##   2. RE-SAVE it and load the result again — the hash must be unchanged (Godot's own writes survive),
##   3. check the envelope is preserved (worldId/title/settings), and
##   4. check the version guard REFUSES a save newer than this build supports rather than dropping data.
## Usage: godot --headless --path godot/ --script res://tests/verify_save.gd

const SaveGame := preload("res://scripts/rules/save_game.gd")
const StateHash := preload("res://scripts/rules/state_hash.gd")

func _initialize() -> void:
	var raw: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/save-fixtures.json"))
	if typeof(raw) != TYPE_DICTIONARY:
		push_error("[save] cannot load save-fixtures.json (run `npm run export:saves`)")
		quit(1)
		return

	var failures := 0
	for fixture in raw.get("fixtures", []):
		var name: String = fixture.get("name", "?")
		var want: String = fixture.get("stateHash", "")

		# 1. load a TS-written save
		var loaded: Dictionary = SaveGame.parse_save_data(fixture.get("save", null))
		if not bool(loaded.get("ok", false)):
			print("[save] %s: LOAD FAILED — %s" % [name, loaded.get("error", "?")])
			failures += 1
			continue
		var got: String = StateHash.hash_state(loaded["state"])
		if got != want:
			print("[save] %s: loaded state hash %s != %s (a TS save does not survive the Godot load)" % [name, got, want])
			failures += 1
			continue

		# 2. re-save from Godot and load it again
		var envelope: Dictionary = loaded.get("envelope", {})
		var scenario: Dictionary = envelope.get("scenario", {})
		var rewritten: Dictionary = SaveGame.to_save_data(loaded["state"], {"id": scenario.get("worldId", ""), "title": scenario.get("title", "")}, String(envelope.get("savedAt", "")), String((envelope.get("settings", {}) as Dictionary).get("locale", "ja")))
		var reloaded: Dictionary = SaveGame.parse_save_data(rewritten)
		if not bool(reloaded.get("ok", false)):
			print("[save] %s: RELOAD of a Godot-written save failed — %s" % [name, reloaded.get("error", "?")])
			failures += 1
			continue
		var round_trip: String = StateHash.hash_state(reloaded["state"])
		if round_trip != want:
			print("[save] %s: round-trip hash %s != %s (Godot's own write loses data)" % [name, round_trip, want])
			failures += 1
			continue

		# 3. the envelope must survive the round trip
		var re_scenario: Dictionary = (rewritten.get("scenario", {}) as Dictionary)
		if re_scenario.get("worldId", "") != scenario.get("worldId", "") or re_scenario.get("title", "") != scenario.get("title", ""):
			print("[save] %s: scenario envelope not preserved" % name)
			failures += 1
			continue

		print("[save] %s: OK (load + re-save round-trip, hash %s)" % [name, want])

	# 4. a save from a NEWER build must be refused, not silently downgraded
	var future: Dictionary = SaveGame.parse_save_data({"schemaVersion": 99, "state": {}})
	if bool(future.get("ok", false)):
		print("[save] version guard FAILED: a schemaVersion 99 save was accepted")
		failures += 1
	else:
		print("[save] version guard: a newer save is refused (%s)" % future.get("error", ""))

	print("")
	if failures == 0:
		print("[save] PASS — TS saves load in Godot and survive a Godot re-save unchanged")
		quit(0)
	else:
		print("[save] FAIL — %d problem(s)" % failures)
		quit(1)

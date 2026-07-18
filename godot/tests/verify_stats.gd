extends SceneTree
## S3 chunk 3a: does the GDScript getEffectiveCharacterStats port reproduce the TS oracle? Replays every
## sample in godot/data/stat-samples.json. Run:
##   godot --headless --path godot/ --script res://tests/verify_stats.gd

const StateHash := preload("res://scripts/rules/state_hash.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")

func _initialize() -> void:
	var fixture: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/stat-samples.json"))
	if typeof(fixture) != TYPE_DICTIONARY:
		push_error("[stats] cannot load stat-samples.json (run `npm run export:stats`)")
		quit(1)
		return

	var pack: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/%s.json" % fixture.get("worldId", "default")))
	var world: Dictionary = pack.get("world", {})
	var failures := 0

	for sample in fixture["samples"]:
		var got := CharacterStats.effective(sample["character"], world)
		var got_json := StateHash.canonical_json(got)
		var want_json := StateHash.canonical_json(sample["stats"])
		if got_json == want_json:
			print("[stats] %s: OK" % sample["name"])
		else:
			push_error("[stats] %s: MISMATCH\n  got  %s\n  want %s" % [sample["name"], got_json, want_json])
			failures += 1

	print("[stats] %s (%d failures)" % ["PASS" if failures == 0 else "FAIL", failures])
	quit(failures)

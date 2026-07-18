extends SceneTree
## Headless smoke check for the S2 shell — run with:
##   godot --headless --path godot/ --script res://tests/verify_shell.gd
## It confirms every scene root loads and its script compiles, and that the S1-exported world packs and
## golden traces parse in Godot. Exits non-zero on any failure, so it can gate CI.

func _initialize() -> void:
	var failures := 0

	# 1. Every scene root loads and instantiates (this compiles its attached script).
	for scene_name in ["boot", "title", "town", "dungeon", "combat", "result"]:
		var scene := load("res://scenes/%s.tscn" % scene_name) as PackedScene
		if scene == null or scene.instantiate() == null:
			push_error("scene failed to load: %s" % scene_name)
			failures += 1
		else:
			print("[verify] scene ok: %s" % scene_name)

	# 2. The exported world packs and trace fixtures exist and parse.
	var data_files := [
		"res://data/worlds/index.json",
		"res://data/worlds/default.json",
		"res://data/worlds/verdant.json",
		"res://data/traces/index.json",
		"res://data/traces/b1f-combat-victory.json",
		"res://data/traces/b1f-exploration.json",
	]
	for path in data_files:
		if not FileAccess.file_exists(path):
			push_error("missing data file (run `npm run export:godot`): %s" % path)
			failures += 1
			continue
		var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
		if parsed == null:
			push_error("invalid JSON: %s" % path)
			failures += 1
		else:
			print("[verify] data ok: %s" % path)

	# 3. A golden trace carries the shape S3's parity replay needs (steps with state hashes).
	var trace: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/traces/b1f-combat-victory.json"))
	if typeof(trace) == TYPE_DICTIONARY and (trace.get("steps", []) as Array).size() > 0:
		var first_step: Dictionary = trace["steps"][0]
		if first_step.has("stateHash") and first_step.has("events"):
			print("[verify] trace shape ok: %d steps, first hash=%s" % [(trace["steps"] as Array).size(), first_step["stateHash"]])
		else:
			push_error("trace step missing stateHash/events")
			failures += 1
	else:
		push_error("trace has no steps")
		failures += 1

	print("[verify] %s (%d failures)" % ["PASS" if failures == 0 else "FAIL", failures])
	quit(failures)

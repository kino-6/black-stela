extends SceneTree
## S3 foundation check: does the GDScript canonical-state hash reproduce the TS oracle's hash for the
## initial state of each golden trace? If this passes, the cross-runtime hash port is correct and the
## rules port can be parity-checked against it. Run:
##   godot --headless --path godot/ --script res://tests/verify_hash.gd

const StateHash := preload("res://scripts/rules/state_hash.gd")
const TRACES := ["b1f-combat-victory", "b1f-exploration"]

func _initialize() -> void:
	var failures := 0
	for name in TRACES:
		var path := "res://data/traces/%s.json" % name
		var trace: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
		if typeof(trace) != TYPE_DICTIONARY:
			push_error("cannot load trace: %s" % path)
			failures += 1
			continue
		var expected: String = trace["initialStateHash"]
		print("[hash] %s: canonicalizing…" % name)
		var canon := StateHash.canonical_json((trace["initialState"] as Dictionary).duplicate())
		print("[hash] %s: canonical length=%d, hashing…" % [name, canon.length()])
		var actual := StateHash.hash_state(trace["initialState"])
		if actual == expected:
			print("[hash] %s: initialState OK (%s)" % [name, actual])
		else:
			push_error("[hash] %s: MISMATCH expected=%s actual=%s" % [name, expected, actual])
			failures += 1
	print("[hash] %s (%d failures)" % ["PASS" if failures == 0 else "FAIL", failures])
	quit(failures)

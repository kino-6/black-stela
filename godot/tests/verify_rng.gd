extends SceneTree
## S3 combat groundwork: does the GDScript combat RNG reproduce the TS oracle's values? Replays every
## sample in godot/data/rng-samples.json. If this passes, the seeded-RNG foundation of combat parity is
## sound. Run:
##   godot --headless --path godot/ --script res://tests/verify_rng.gd

const CombatRng := preload("res://scripts/rules/combat_rng.gd")

func _initialize() -> void:
	var samples: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/rng-samples.json"))
	if typeof(samples) != TYPE_DICTIONARY:
		push_error("[rng] cannot load rng-samples.json (run `npm run export:rng`)")
		quit(1)
		return

	var failures := 0

	for s in samples["hashSeed"]:
		var got := CombatRng.hash_seed(s["seed"])
		if got != int(s["value"]):
			push_error("[rng] hashSeed(%s): %d != %d" % [JSON.stringify(s["seed"]), got, int(s["value"])])
			failures += 1

	for c in samples["rollDamage"]:
		var got := CombatRng.roll_damage(c["seed"], int(c["min"]), int(c["max"]), int(c["armor"]))
		if got != int(c["value"]):
			push_error("[rng] rollDamage(%s,%d,%d,%d): %d != %d" % [JSON.stringify(c["seed"]), int(c["min"]), int(c["max"]), int(c["armor"]), got, int(c["value"])])
			failures += 1

	for c in samples["chip"]:
		var got := CombatRng.chip_through_resistance(int(c["damage"]), c["seed"])
		if got != int(c["value"]):
			push_error("[rng] chip(%d,%s): %d != %d" % [int(c["damage"]), JSON.stringify(c["seed"]), got, int(c["value"])])
			failures += 1

	print("[rng] hashSeed=%d rollDamage=%d chip=%d checks" % [(samples["hashSeed"] as Array).size(), (samples["rollDamage"] as Array).size(), (samples["chip"] as Array).size()])
	print("[rng] %s (%d failures)" % ["PASS" if failures == 0 else "FAIL", failures])
	quit(failures)

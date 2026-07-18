extends SceneTree
## S3 chunk 3b: does the GDScript attack-helper port reproduce the TS oracle? Replays every sample in
## godot/data/combat-helper-samples.json. Run:
##   godot --headless --path godot/ --script res://tests/verify_combat_helpers.gd

const StateHash := preload("res://scripts/rules/state_hash.gd")
const CombatRng := preload("res://scripts/rules/combat_rng.gd")
const CombatHelpers := preload("res://scripts/rules/combat_helpers.gd")

func _initialize() -> void:
	var fixture: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/combat-helper-samples.json"))
	if typeof(fixture) != TYPE_DICTIONARY:
		push_error("[combat-helpers] cannot load fixture (run `npm run export:combat-helpers`)")
		quit(1)
		return

	var failures := 0

	for s in fixture["rollPercent"]:
		var got := CombatRng.roll_percent(s["seed"])
		if got != int(s["value"]):
			push_error("[combat-helpers] rollPercent(%s): %d != %d" % [JSON.stringify(s["seed"]), got, int(s["value"])])
			failures += 1

	for c in fixture["criticalChance"]:
		var got := CombatHelpers.get_critical_chance({"aptitude": {"luck": int(c["luck"])}})
		if got != int(c["value"]):
			push_error("[combat-helpers] critChance(luck=%d): %d != %d" % [int(c["luck"]), got, int(c["value"])])
			failures += 1

	for c in fixture["damageGroup"]:
		var got := CombatHelpers.damage_group(c["groups"], c["groupId"], int(c["damage"]))
		var got_json := StateHash.canonical_json(got)
		var want_json := StateHash.canonical_json(c["result"])
		if got_json != want_json:
			push_error("[combat-helpers] damageGroup(dmg=%d):\n  got  %s\n  want %s" % [int(c["damage"]), got_json, want_json])
			failures += 1

	print("[combat-helpers] rollPercent=%d critChance=%d damageGroup=%d checks" % [(fixture["rollPercent"] as Array).size(), (fixture["criticalChance"] as Array).size(), (fixture["damageGroup"] as Array).size()])
	print("[combat-helpers] %s (%d failures)" % ["PASS" if failures == 0 else "FAIL", failures])
	quit(failures)

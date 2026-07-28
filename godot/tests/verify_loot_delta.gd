extends SceneTree
## gate:loot-delta (IMP-045 / playtest #3) — the brought-back accounting must report only what the party
## BROUGHT BACK, not the supplies it carried down. verify_debug_fixtures locks the loot_delta STATE (gained
## item present, baseline excludes it); this locks the same CONTRACT on the real TOWN SCENE's shared helper:
## 持ち帰った物 = the gained item and NOT an untouched descent supply, while the supplies view still lists it.
## (The arrival square no longer prints a 持ち帰った物 row — it was dropped as clutter in the town redesign,
## the loot lives in the inventory/聖遺物 view — so this locks the computation the loot views share, not a row.)
## Run: godot --headless --path godot/ --script res://tests/verify_loot_delta.gd

const Fixtures := preload("res://scripts/debug_fixtures.gd")
const Fmt := preload("res://scripts/town_format.gd")

var _fail := 0

func _initialize() -> void:
	await _run()
	print("[loot-delta] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _run() -> void:
	for i in 4:
		await process_frame
	var run := get_root().get_node_or_null("/root/Run")
	_check(run != null, "the Run autoload is available")
	if run == null:
		return
	run.ensure_loaded()

	# The party stands at the return stair carrying its descent supply (healing-draught) PLUS a gained
	# item (lantern-oil); loot_baseline is the descent inventory.
	Fixtures.load_into(run, "loot_delta")
	var gained := Fmt.localized_catalog_name(run.world, "item.lantern-oil")
	var carried := Fmt.localized_catalog_name(run.world, "item.healing-draught")
	_check(gained != "" and gained != carried, "the gained and carried items have distinct names")

	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for i in 8:
		await process_frame

	# The two ledger values, computed by the SAME code the screen renders.
	var brought := String(town.call("_loot_summary", town.call("state"), "town.noLoot", true))
	var supplies := String(town.call("_loot_summary", town.call("state"), "town.noSupplies", false))

	_check(brought.contains(gained), "the 持ち帰った物 row reports the gained item (%s)" % gained)
	_check(not brought.contains(carried), "the untouched descent supply (%s) is NOT reported as brought back (#3)" % carried)
	_check(supplies.contains(carried), "the supplies row still lists the carried item (baseline is subtracted only for loot)")

	town.queue_free()

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[loot-delta] ok: %s" % label)
	else:
		push_error("[loot-delta] FAIL: %s" % label)
		print("[loot-delta] FAIL: %s" % label)
		_fail += 1

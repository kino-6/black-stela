extends SceneTree
## gate:fixtures — the named QA fixtures must drop the run into the PLAYABLE state their contract
## promises, so a reviewer reaches the held-input / return / loot routes via `-- --fixture <name>` (or
## the panel) without mouse-picking (#29). Locks the state/transition contract Codex approves against.
## Run: godot --headless --path godot/ --script res://tests/verify_debug_fixtures.gd

const Fixtures := preload("res://scripts/debug_fixtures.gd")

var _fail := 0

func _initialize() -> void:
	for i in 4:
		await process_frame   # let the autoloads (Run) mount before we use them
	var run := get_root().get_node_or_null("/root/Run")
	_check(run != null, "the Run autoload is available")
	if run == null:
		quit(1)
		return

	# open_corridor (#17): a dungeon corridor to hold-walk.
	var scene := String(Fixtures.load_into(run, "open_corridor"))
	_check(scene.ends_with("dungeon.tscn"), "open_corridor lands in the dungeon")
	_check(String((run.state.get("position", {}) as Dictionary).get("cellId", "")) != "", "open_corridor gives a walkable cell")

	# return_ready (#44): at a return stair, still in the dungeon.
	scene = String(Fixtures.load_into(run, "return_ready"))
	_check(scene.ends_with("dungeon.tscn") and String(run.state.get("phase", "")) == "dungeon", "return_ready lands in the dungeon at the return point")

	# loot_delta (#3): carries a GAINED item over the descent baseline, so the return ledger shows only it.
	scene = String(Fixtures.load_into(run, "loot_delta"))
	var inv: Array = run.state.get("inventory", [])
	var has_gained := false
	for it in inv:
		if String((it as Dictionary).get("id", "")) == "item.lantern-oil":
			has_gained = true
	_check(has_gained, "loot_delta inventory carries the gained item (item.lantern-oil)")
	_check(not (run.loot_baseline as Dictionary).has("item.lantern-oil"), "loot_delta baseline EXCLUDES the gained item, so it shows as brought-back (#3)")

	# combat_victory (#46): lands the reviewer in the combat scene, mid-fight, so command flow / victory
	# can be inspected in the RIGHT screen (not the dungeon or town).
	scene = String(Fixtures.load_into(run, "combat_victory"))
	_check(scene.ends_with("combat.tscn"), "combat_victory lands in the combat scene")
	_check(String(run.state.get("phase", "")) == "combat" and run.state.get("combat", null) != null, "combat_victory carries a live combat state")

	# IMP-057: the paired Verdant chamber fixtures land in the dungeon on the Verdant world, at the chamber
	# approach cell — `cleared` additionally opens the door and calms the landmark (floorClaimedTreasures).
	for fx in ["verdant_chamber_closed", "verdant_chamber_cleared"]:
		scene = String(Fixtures.load_into(run, fx))
		_check(scene.ends_with("dungeon.tscn"), "%s lands in the dungeon" % fx)
		_check(String(run.world_id) == "verdant" and String(run.state.get("map", {}).get("floorId", "")) == "dungeon.verdant.g1f", "%s is on the Verdant G1F chamber floor" % fx)
	scene = String(Fixtures.load_into(run, "verdant_chamber_cleared"))
	_check((run.state.get("floorClaimedTreasures", []) as Array).size() > 0, "verdant_chamber_cleared calms the chamber landmark (claimed)")

	# IMP-062: the deep-floor review starts stand a LEVELLED party on floor N of the CURRENT world with the
	# whole floor revealed on the map — the mid/late-game states a reviewer otherwise never reaches. Without
	# these, floor_5..floor_8 silently fell back to B1F.
	run.world_id = "default"
	run.reset()
	scene = String(Fixtures.load_into(run, "floor_5"))
	var m5: Dictionary = run.state.get("map", {})
	_check(scene.ends_with("dungeon.tscn") and String(m5.get("floorId", "")) == "dungeon.b5f", "floor_5 lands on default B5F (not the B1F fallback)")
	_check(int((run.state.get("party", [])[0] as Dictionary).get("level", 1)) > 1, "floor_5 levels the review party past 1")
	_check((m5.get("visitedCells", []) as Array).size() > 10, "floor_5 reveals the whole floor on the map (%d cells)" % (m5.get("visitedCells", []) as Array).size())
	run.world_id = "verdant"
	run.reset()
	scene = String(Fixtures.load_into(run, "floor_2"))
	_check(scene.ends_with("dungeon.tscn") and String(run.state.get("map", {}).get("floorId", "")) == "dungeon.verdant.g2f", "floor_2 is world-parametrized (Verdant G2F when the world is Verdant)")
	# T31: the true-clear floors must be reviewable through the same playable deep-floor fixture, not
	# only via a hand-built state or a screenshot from somebody else's machine.
	scene = String(Fixtures.load_into(run, "floor_10"))
	_check(scene.ends_with("dungeon.tscn") and String(run.state.get("map", {}).get("floorId", "")) == "dungeon.verdant.g10f", "floor_10 lands on Verdant G10F")
	_check(int((run.state.get("party", [])[0] as Dictionary).get("level", 1)) >= 10, "floor_10 supplies a depth-appropriate review party")

	print("[fixtures] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[fixtures] ok: %s" % label)
	else:
		push_error("[fixtures] FAIL: %s" % label)
		_fail += 1

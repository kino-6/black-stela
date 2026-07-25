extends SceneTree
## gate:return-loop (IMP-027) — every dungeon return must enter the SAME town preparation loop, never a
## stale service (the React bug: a direct 6/6-guild departure returned to Adventurer Registration). In the
## Godot build each transition rebuilds the scene and the town forces phase="town" on entry, so this locks
## that:
##   (1) return_to_town preserves the party (you are not dumped back to registration), and
##   (2) loading town from ANY incoming phase lands on the square loop — cursor on 迷宮に入る, no service
##       counter left open.
## Usage: godot --headless --path godot/ --script res://tests/verify_return_loop.gd

var _fail := 0

func _initialize() -> void:
	await _run()
	print("[return-loop] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _run() -> void:
	await process_frame
	var fixture: Dictionary = _read_json("res://data/traces/b1f-exploration.json").get("initialState", {})
	var world: Dictionary = _read_json("res://data/worlds/default.json").get("world", {})
	var engine: Dictionary = _read_json("res://data/engine-data.json")
	var party_size := (fixture.get("party", []) as Array).size()
	_check(party_size > 0, "the exploration fixture carries a party")

	# (1) the return RULE keeps the party whole and lands in town — not registration. Stand the party on
	# the floor's stairs-to-town landing (room.b1f.001), the only cell from which returning is valid.
	var dungeon_state: Dictionary = fixture.duplicate(true)
	dungeon_state["phase"] = "dungeon"
	dungeon_state["position"] = {"roomId": "room.b1f.001", "cellId": "cell.b1f.001", "facing": "south"}
	var out: Dictionary = SliceRules.resolve(dungeon_state, {"type": "return_to_town"}, world, engine)
	var after: Dictionary = out.get("state", {})
	_check(String(after.get("phase", "")) == "town", "return_to_town lands the party in town")
	_check((after.get("party", []) as Array).size() == party_size, "return_to_town preserves the whole party (no drop to registration)")

	# (2) the town SCENE, entered from a stale non-town phase, rebuilds on the square loop.
	var run := get_root().get_node_or_null("Run")
	_check(run != null, "the Run autoload is available")
	if run == null:
		return
	run.ensure_loaded()
	run.state = fixture.duplicate(true)
	run.state["phase"] = "dungeon"   # simulate arriving straight off a floor / a stale service mode

	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for i in 8:
		await process_frame

	_check(String((run.state as Dictionary).get("phase", "")) == "town", "entering town forces phase=town regardless of how the party arrived")
	_check(String(town.get("_service")) == "", "no stale service counter is left open on arrival")
	var focused := get_root().gui_get_focus_owner()
	_check(focused is Button, "the square hands the cursor a focusable command")
	_check(focused is Button and (focused as Button).text.find("迷宮") != -1, "the cursor lands on the descent (迷宮に入る), the town loop's anchor")

	town.queue_free()

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[return-loop] ok: %s" % label)
	else:
		push_error("[return-loop] FAIL: %s" % label)
		print("[return-loop] FAIL: %s" % label)
		_fail += 1

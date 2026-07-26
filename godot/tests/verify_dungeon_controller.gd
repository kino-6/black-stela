extends SceneTree
## Controller gate for the DUNGEON — drives the real scene (not a pure decider) so the shipped input
## path is locked: a controller can reach the dock, the full map opens and closes on Esc (#13), and a
## held movement key auto-repeats (#17). This closes the IMP-045 gap — gate:play proved only the pure
## entry/continuation deciders. Turning is used for #17 because it is combat-safe and deterministic.
## Usage: godot --headless --path godot/ --script res://tests/verify_dungeon_controller.gd

var _fail := 0

func _initialize() -> void:
	var d := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(d)
	for i in 12:
		await process_frame

	# 0) The scene builds headless and the party stands in the dungeon at its landing.
	var state: Dictionary = d.get("_state")
	_check(String(state.get("phase", "")) == "dungeon", "scene enters the dungeon phase")
	_check(String((state.get("position", {}) as Dictionary).get("cellId", "")) != "", "party has a landing cell")

	# 1) A controller can reach a dock command (探索/聞く/全体図/隊列/オート).
	_check(_has_focusable_button(d), "the dock offers a focusable command a controller can act on")

	# 2) #13 — the full map opens and Cancel/Esc closes it (the bug: Esc did nothing, only 立ち去る closed).
	d.call("_toggle_full_map")
	_check(_valid(d.get("_full_map")), "全体図 opens")
	d.call("_input", _pressed("cancel"))
	_check(not _valid(d.get("_full_map")), "Esc closes 全体図 (#13)")

	# 3) #17 — a held movement key auto-repeats. Press = one step + arm; a _process tick past the delay
	#    while the key is held = a second step; release stops it.
	var facing0 := _facing(d)
	d.call("_begin_move", "turn_left")
	var facing1 := _facing(d)
	_check(facing1 != facing0 and String(d.get("_hold").held()) == "turn_left", "a movement key steps once and arms the hold")
	Input.action_press("turn_left")
	d.call("_process", 0.30 + 0.16 + 0.01)   # past HOLD_DELAY, then one HOLD_RATE
	var facing2 := _facing(d)
	_check(facing2 != facing1, "holding the key auto-repeats the move (#17)")
	Input.action_release("turn_left")
	d.call("_process", 0.2)
	_check(String(d.get("_hold").held()) == "", "releasing the key stops the repeat")

	# #29 — the 3D geometry follows the party's FLOOR, not always the first one. Put the party on a B2F
	# cell and the view rebuilds for B2F (before the fix a B2F debug jump kept showing B1F walls).
	d.set("_state", {
		"phase": "dungeon",
		"position": {"cellId": "cell.b2f.c1_2", "roomId": "room.b2f.c1_2", "facing": "south"},
		"map": {"floorId": "dungeon.b2f", "currentCellId": "cell.b2f.c1_2", "visitedCells": ["cell.b2f.c1_2"]}
	})
	d.call("_update_view", false)
	_check(String(d.get("_rendered_floor")) == "dungeon.b2f", "the 3D geometry follows the party to B2F (#29)")

	# chest-leave (playtest) — 探索へ戻る steps OFF a chest prompt WITHOUT consuming it, and control returns.
	# The bug: after opening, current_chest() ignored the leave, kept re-raising the panel, and the move-guard
	# (`not current_chest().is_empty()`) left the party FROZEN. Leaving must clear the prompt on this cell.
	d.set("_state", {
		"phase": "dungeon",
		"position": {"cellId": "cell.b1f.002", "roomId": "room.b1f.002", "facing": "south"},
		"map": {"floorId": "dungeon.b1f", "currentCellId": "cell.b1f.002", "visitedCells": ["cell.b1f.002"]}
	})
	d.call("set_ui_state", {"chest": true, "chest_opened": true})
	for i in 3:
		await process_frame
	_check(not (d.call("current_chest") as Dictionary).is_empty(), "an opened chest on the cell raises the panel")
	d.call("_leave_chest")
	for i in 3:
		await process_frame
	_check((d.call("current_chest") as Dictionary).is_empty(), "探索へ戻る releases the chest — movement is not frozen")

	# party-menu Esc (playtest) — the 隊列 overlay must close on Cancel, not only via its 閉じる button.
	d.call("_toggle_party_menu")
	for i in 4:
		await process_frame
	_check(_valid(d.get("_party_menu")), "隊列 opens over the dungeon")
	d.call("_input", _pressed("cancel"))
	for i in 4:
		await process_frame
	_check(not _valid(d.get("_party_menu")), "Esc closes 隊列 (not only its 閉じる button)")

	print("[dungeon-controller] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _facing(d: Object) -> String:
	return String(((d.get("_state") as Dictionary).get("position", {}) as Dictionary).get("facing", ""))

func _pressed(action: String) -> InputEventAction:
	var e := InputEventAction.new()
	e.action = action
	e.pressed = true
	return e

func _has_focusable_button(node: Node) -> bool:
	for c in node.get_children():
		if c is Button and (c as Button).focus_mode != Control.FOCUS_NONE:
			return true
		if _has_focusable_button(c):
			return true
	return false

func _valid(v: Variant) -> bool:
	return v != null and is_instance_valid(v)

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[dungeon-controller] ok: %s" % label)
	else:
		push_error("[dungeon-controller] FAIL: %s" % label)
		_fail += 1

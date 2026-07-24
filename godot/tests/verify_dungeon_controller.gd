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
	_check(facing1 != facing0 and String(d.get("_held_action")) == "turn_left", "a movement key steps once and arms the hold")
	Input.action_press("turn_left")
	d.call("_process", 0.30 + 0.16 + 0.01)   # past HOLD_DELAY, then one HOLD_RATE
	var facing2 := _facing(d)
	_check(facing2 != facing1, "holding the key auto-repeats the move (#17)")
	Input.action_release("turn_left")
	d.call("_process", 0.2)
	_check(String(d.get("_held_action")) == "", "releasing the key stops the repeat")

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

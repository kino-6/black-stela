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
	var initial_party: Array = (state.get("party", []) as Array).duplicate(true)
	_check(String(state.get("phase", "")) == "dungeon", "scene enters the dungeon phase")
	_check(String((state.get("position", {}) as Dictionary).get("cellId", "")) != "", "party has a landing cell")

	# 1) DIRECT dungeon controls (playtest 2026-07-29 redesign): the dungeon is driven by keys, not a command
	#    panel you Tab into. 決定 runs the cell's CONTEXT action (探索 on a plain cell), キャンセル opens the
	#    メニュー. The right panel is a non-interactive hint — there is no focus ring to navigate.
	_check(String(d.call("_context_command")) == "search", "決定 = 探索 on a plain cell (context action)")
	d.call("_input", _pressed("cancel"))
	_check(_valid(d.get("_party_menu")), "キャンセル opens the メニュー")
	d.call("_input", _pressed("cancel"))   # close it so the later menu checks start clean
	for i in 2:
		await process_frame

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
		"map": {"floorId": "dungeon.b1f", "currentCellId": "cell.b1f.002", "visitedCells": ["cell.b1f.002"]},
		"party": initial_party
	})
	# Chest operator choice — Confirm on a closed chest enters investigation, then the cursor starts on the
	# standing member with the largest displayed chance. This protects the requested no-mouse flow: select
	# action → suggested specialist → Confirm, while still allowing deliberate choice of another member.
	d.call("set_ui_state", {"chest": true, "chest_locked": true})
	for i in 3:
		await process_frame
	var chest_focus: Control = get_root().get_viewport().gui_get_focus_owner()
	_check(chest_focus is Button and (chest_focus as Button).text == "調べる", "closed chest focuses 調べる before lockwork")
	d.set("_chest_pending_action", "investigate")
	d.call("_rebuild_dock")
	for i in 3:
		await process_frame
	var handler_focus: Control = get_root().get_viewport().gui_get_focus_owner()
	var Exploration := preload("res://scripts/rules/exploration.gd")
	var Chests := preload("res://scripts/rules/chests.gd")
	var best_name := ""
	var best_chance := -1
	var scripted_chest: Dictionary = d.call("current_chest")
	for member in initial_party:
		if int(member.get("hp", 0)) <= 0 or member.get("injury", null) != null:
			continue
		var chance: int = Chests.success_chance(Exploration.attempt_skill(member, d.get("_engine"), "investigate"), int((scripted_chest.get("trap", {}) as Dictionary).get("difficulty", 0)), 55)
		if chance > best_chance:
			best_chance = chance
			best_name = String(member.get("name", ""))
	_check(handler_focus is Button and (handler_focus as Button).text.begins_with(best_name + "　") and (handler_focus as Button).text.contains("成功率"), "handler choice focuses the highest investigation chance")
	# A successful discovery must not make the player navigate back to a distant option: the trap action is
	# focused on the next panel and Confirm can immediately continue to the recommended handler.
	d.call("set_ui_state", {"chest": true, "chest_result": "trapped"})
	for i in 3:
		await process_frame
	chest_focus = get_root().get_viewport().gui_get_focus_owner()
	_check(chest_focus is Button and (chest_focus as Button).text == "罠を外す", "found trap focuses 罠を外す for Confirm")
	# An opened chest is history, not a second event. It never retakes focus or asks the player to dismiss it.
	d.call("set_ui_state", {"chest": true, "chest_opened": true})
	for i in 3:
		await process_frame
	_check((d.call("current_chest") as Dictionary).is_empty(), "an opened chest no longer raises a panel or takes focus")
	_check(not _valid(d.get("_chest_overlay")), "opened chest leaves the dungeon controls immediately usable")
	_check(String(d.call("_event_line", {"type": "chest_opened"})) == "", "opened chest does not overwrite its loot message")

	# party-menu Esc (playtest) — the 隊列 overlay must close on Cancel, not only via its 閉じる button.
	d.call("_toggle_party_menu")
	for i in 4:
		await process_frame
	_check(_valid(d.get("_party_menu")), "隊列 opens over the dungeon")
	# playtest 2026-07-29: switching to the 装備 tab (or any tab) must never leave the controller with
	# nothing focused. The safety net grabs the first usable control on every rebuild.
	d.call("set", "_party_page", "equipment")
	d.call("_refresh_party_menu")
	for i in 4:
		await process_frame
	var focus_owner: Control = get_root().get_viewport().gui_get_focus_owner()
	var menu: Node = d.get("_party_menu")
	_check(_valid(menu) and focus_owner != null and menu.is_ancestor_of(focus_owner), "the 装備 tab keeps a focused control (no soft-lock)")
	d.call("_input", _pressed("cancel"))
	for i in 4:
		await process_frame
	_check(not _valid(d.get("_party_menu")), "Esc closes 隊列 (not only its 閉じる button)")

	# map consistency (playtest) — the full map and the minimap must classify a cell's SIDES identically, or a
	# wall shows on one and not the other (the stairs-cell wall vanished only on the full map).
	var FloorMap := preload("res://scripts/dungeon/floor_map.gd")
	var mm: Object = preload("res://scripts/minimap.gd").new()
	for kind in ["open", "door", "one_way", "stairs", "shortcut", "secret"]:
		var e := {"kind": kind}
		_check(bool(FloorMap._is_passage(e)) == bool(mm.call("_is_passage", e)), "full map and minimap agree whether a '%s' side is a wall" % kind)

	# Floor scoping (playtest 2026-07-30: 徒歩で1Fに戻ると2FのMapと同じ). Floors share the (x,y) grid, so the
	# minimap must draw ONLY the party's current floor — never another floor's cell that happens to sit at the
	# same coordinate, even when it is in the cumulative visitedCells. Two floors, both with a cell at (5,5).
	var two_floor := {"dungeons": [
		{"id": "f1", "grid": {"cells": [{"id": "a", "x": 5, "y": 5, "roomId": "ra", "edges": {}}]}},
		{"id": "f2", "grid": {"cells": [{"id": "z", "x": 5, "y": 5, "roomId": "rz", "edges": {}}]}},
	]}
	var on_f1 := {"map": {"floorId": "f1", "visitedCells": ["a", "z"]}, "position": {"cellId": "a", "facing": "north"}}
	mm.call("setup", two_floor, on_f1)
	var drawn: Array = mm.call("visible_cell_ids", on_f1)
	_check(drawn.has("a") and not drawn.has("z"), "minimap draws only the CURRENT floor's cells, never 2F's on 1F")

	if mm is Node:
		(mm as Node).free()

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

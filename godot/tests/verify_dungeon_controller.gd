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
		"party": initial_party,
		"inventory": [{"id": "item.lock-picks", "name": "Ashwire Picks", "kind": "utility", "quantity": 1}]
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
	# An exploration tool is a visible, optional alternative on the relevant chest action. It names the
	# tool, shows the improved chance, and sends its item id only if the player confirms that command.
	d.set("_chest_pending_action", "unlock")
	d.call("_rebuild_dock")
	for i in 3:
		await process_frame
	var picks := _button_with_prefix(d.get("_chest_overlay"), "灰線の合鍵で試す")
	_check(picks != null and not picks.disabled and picks.text.contains("成功率"), "unlock tools are visible optional commands with their own chance")
	# A successful discovery must not make the player navigate back to a distant option: the trap action is
	# focused on the next panel and Confirm can immediately continue to the recommended handler.
	d.call("set_ui_state", {"chest": true, "chest_result": "trapped"})
	for i in 3:
		await process_frame
	chest_focus = get_root().get_viewport().gui_get_focus_owner()
	_check(chest_focus is Button and (chest_focus as Button).text == "罠を外す", "found trap focuses 罠を外す for Confirm")
	# Opening is an outcome, not another chest command: show the opened art and the gained item in the centre,
	# focus its single acknowledgement, then give input back to the maze only after Confirm/Cancel.
	d.call("set_ui_state", {"chest": true, "chest_opened": true})
	for i in 3:
		await process_frame
	_check((d.call("current_chest") as Dictionary).is_empty(), "an opened chest no longer raises a panel or takes focus")
	_check(_valid(d.get("_chest_overlay")), "opened chest holds a centred reward result instead of dropping it into the log")
	chest_focus = get_root().get_viewport().gui_get_focus_owner()
	_check(chest_focus is Button and (chest_focus as Button).text == "探索へ戻る", "opened reward focuses 探索へ戻る")
	_check(_has_text(d.get("_chest_overlay"), "灰木の杖"), "opened result names the acquired treasure")
	if chest_focus is Button:
		(chest_focus as Button).emit_signal("pressed")
	for i in 2:
		await process_frame
	_check(not _valid(d.get("_chest_overlay")), "Confirm on the reward acknowledgement restores dungeon input")
	_check(String(d.call("_event_line", {"type": "chest_opened"})) == "", "opened chest does not overwrite its loot message")

	# party-menu Esc (playtest) — the 隊列 overlay must close on Cancel, not only via its 閉じる button.
	d.call("_toggle_party_menu")
	for i in 4:
		await process_frame
	_check(_valid(d.get("_party_menu")), "隊列 opens over the dungeon")
	# Roster browsing is focus-driven: moving the controller cursor onto another adventurer must refresh the
	# right-hand sheet immediately. Confirm is reserved for actions such as swapping rows or equipping.
	var before_browse: Dictionary = d.call("_party_selected")
	var start_browse_focus: Control = get_root().get_viewport().gui_get_focus_owner()
	get_root().push_input(_pressed("ui_down"))
	for i in 4:
		await process_frame
	var browsed: Dictionary = d.call("_party_selected")
	var browsed_focus: Control = get_root().get_viewport().gui_get_focus_owner()
	_check(browsed_focus is Button and browsed_focus != start_browse_focus and _party_member_named(initial_party, (browsed_focus as Button).text), "Down moves to another roster member, not back to the tab strip")
	_check(String(browsed.get("id", "")) != String(before_browse.get("id", "")) and browsed_focus is Button and String(browsed.get("name", "")) == (browsed_focus as Button).text, "roster focus immediately refreshes the inspected adventurer and preserves the cursor")
	# playtest 2026-07-29: switching to the 装備 tab (or any tab) must never leave the controller with
	# nothing focused. The safety net grabs the first usable control on every rebuild.
	d.call("set", "_party_page", "equipment")
	d.call("_refresh_party_menu")
	for i in 4:
		await process_frame
	var focus_owner: Control = get_root().get_viewport().gui_get_focus_owner()
	var menu: Node = d.get("_party_menu")
	_check(_valid(menu) and focus_owner != null and menu.is_ancestor_of(focus_owner), "the 装備 tab keeps a focused control (no soft-lock)")
	# Camp gear must work while exploring. Give a compatible active adventurer an iron cap, activate the
	# same command the equipment list emits, and require both the state and the rebuilt menu to reflect it.
	var Economy := preload("res://scripts/rules/economy.gd")
	var cap: Variant = Economy.create_inventory_item(d.get("_world"), "equip.iron-cap", 1)
	var cap_wearer: Dictionary = {}
	var cap_catalog: Variant = Economy.find_equipment(d.get("_world"), "equip.iron-cap")
	for candidate in initial_party:
		if typeof(cap_catalog) == TYPE_DICTIONARY and Economy.is_equipment_usable_by(cap_catalog, candidate):
			cap_wearer = candidate
			break
	var equip_state: Dictionary = (d.get("_state") as Dictionary).duplicate(true)
	equip_state["party"] = initial_party.duplicate(true)
	equip_state["inventory"] = [cap]
	d.set("_state", equip_state)
	d.set("_party_member_id", String(cap_wearer.get("id", "")))
	d.set("_party_equipment_slot", "head")
	d.set("_party_equipment_candidate", "")
	d.call("_refresh_party_menu")
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	var slot_button := _button_with_prefix(menu, "頭　")
	_check(slot_button != null, "装備 tab exposes the current head slot as a controller command")
	var candidate_button := _button_with_text(menu, "凹み鉄帽")
	_check(candidate_button != null, "selected slot lists the compatible carried piece as a controller command")
	if candidate_button != null:
		candidate_button.emit_signal("pressed")
	for i in 4:
		await process_frame
	var before_equip: Dictionary = d.call("_party_selected")
	_check((before_equip.get("equipment", {}) as Dictionary).get("head", null) == null, "selecting a candidate does not equip it")
	menu = d.get("_party_menu")
	_check(_has_text(menu, "装着後の変化"), "candidate selection shows the post-equip comparison before mutation")
	var equip_button := _button_with_prefix(menu, "%sに装備" % String(cap_wearer.get("name", "")))
	_check(equip_button != null, "comparison exposes an explicit equip confirmation")
	d.call("_input", _pressed("cancel"))
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	_check(_valid(menu) and not _has_text(menu, "装着後の変化"), "Cancel returns from a candidate comparison to the selected slot")
	candidate_button = _button_with_text(menu, "凹み鉄帽")
	if candidate_button != null:
		candidate_button.emit_signal("pressed")
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	equip_button = _button_with_prefix(menu, "%sに装備" % String(cap_wearer.get("name", "")))
	if equip_button != null:
		equip_button.emit_signal("pressed")
	for i in 4:
		await process_frame
	var after_equip: Dictionary = d.call("_party_selected")
	var after_gear: Dictionary = after_equip.get("equipment", {})
	var after_head: Dictionary = after_gear.get("head", {})
	_check(String(after_head.get("id", "")) == "equip.iron-cap", "迷宮の装備 command changes the selected adventurer")
	menu = d.get("_party_menu")
	focus_owner = get_root().get_viewport().gui_get_focus_owner()
	_check(_valid(menu) and focus_owner != null and menu.is_ancestor_of(focus_owner), "装備後も menu rebuild keeps controller focus")
	# A slot list must not silently omit a class-ineligible candidate. Switch to the occultist: the same
	# iron cap remains visible but cannot be Confirmed, and the reason is legible without a tooltip.
	var ineligible: Dictionary = {}
	for candidate in initial_party:
		if typeof(cap_catalog) == TYPE_DICTIONARY and not Economy.is_equipment_usable_by(cap_catalog, candidate):
			ineligible = candidate
			break
	if not ineligible.is_empty():
		d.set("_party_member_id", String(ineligible.get("id", "")))
		d.set("_party_equipment_slot", "head")
		d.set("_party_equipment_candidate", "")
		d.call("_refresh_party_menu")
		for i in 4:
			await process_frame
		menu = d.get("_party_menu")
		var ineligible_button := _button_with_text(menu, "凹み鉄帽")
		_check(ineligible_button != null and ineligible_button.disabled and _has_text(menu, "この職は扱えない"), "ineligible equipment stays visible with a reason instead of disappearing")
	# A unique/shared copy tells the player which member it will leave before the explicit confirmation.
	var transfer_target: Dictionary = {}
	for candidate in initial_party:
		if String(candidate.get("id", "")) != String(cap_wearer.get("id", "")) and typeof(cap_catalog) == TYPE_DICTIONARY and Economy.is_equipment_usable_by(cap_catalog, candidate):
			transfer_target = candidate
			break
	if not transfer_target.is_empty():
		var Fmt := preload("res://scripts/town_format.gd")
		d.set("_party_member_id", String(transfer_target.get("id", "")))
		d.set("_party_equipment_slot", "head")
		d.set("_party_equipment_candidate", Fmt.equipment_selection_key(cap))
		d.call("_refresh_party_menu")
		for i in 4:
			await process_frame
		menu = d.get("_party_menu")
		_check(_has_text(menu, "Rookの頭から移す"), "shared equipment names the current owner before transfer")
		d.call("_input", _pressed("cancel"))
		for i in 4:
			await process_frame
	# Item use has the same safe staging as equipment: selecting a carried remedy does not spend it;
	# selecting a valid recipient only previews the capped result; Confirm is the single mutation point.
	var item_state: Dictionary = (d.get("_state") as Dictionary).duplicate(true)
	var wounded_party: Array = initial_party.duplicate(true)
	var item_target: Dictionary = (wounded_party[0] as Dictionary).duplicate(true)
	item_target["hp"] = maxi(1, int(item_target.get("maxHp", 1)) - 7)
	wounded_party[0] = item_target
	item_state["party"] = wounded_party
	item_state["inventory"] = [{"id": "item.healing-draught", "name": "Healing Draught", "kind": "healing", "quantity": 1, "healAmount": 11}]
	d.set("_state", item_state)
	d.set("_party_member_id", String(item_target.get("id", "")))
	d.set("_party_page", "items")
	d.set("_party_item", "")
	d.set("_party_item_target_id", "")
	d.call("_refresh_party_menu")
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	var remedy := _button_with_text(menu, "治癒の水薬")
	_check(remedy != null, "所持品 tab exposes the carried remedy as a controller command")
	if remedy != null:
		remedy.emit_signal("pressed")
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	_check(_has_text(menu, "対象を選ぶ"), "selecting an item opens target selection without using it")
	_check(int(((d.get("_state") as Dictionary).get("inventory", [])[0] as Dictionary).get("quantity", 0)) == 1, "selecting an item does not consume it")
	var item_target_button := _button_with_prefix(menu, "%sに使う　使用できる" % String(item_target.get("name", "")))
	_check(item_target_button != null, "a member who benefits from the remedy is an enabled target")
	if item_target_button != null:
		item_target_button.emit_signal("pressed")
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	_check(_has_text(menu, "使用後の変化") and _has_text(menu, "所持数　×1 → ×0"), "target selection previews the effect and remaining count before confirmation")
	_check(int(((d.get("_state") as Dictionary).get("inventory", [])[0] as Dictionary).get("quantity", 0)) == 1, "previewing a target still does not consume the remedy")
	d.call("_input", _pressed("cancel"))
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	_check(not _has_text(menu, "使用後の変化"), "Cancel returns from item confirmation to target selection")
	item_target_button = _button_with_prefix(menu, "%sに使う　使用できる" % String(item_target.get("name", "")))
	if item_target_button != null:
		item_target_button.emit_signal("pressed")
	for i in 4:
		await process_frame
	menu = d.get("_party_menu")
	var confirm_item := _button_with_text(menu, "%sに使う" % String(item_target.get("name", "")))
	_check(confirm_item != null, "item preview exposes an explicit use confirmation")
	if confirm_item != null:
		confirm_item.emit_signal("pressed")
	for i in 4:
		await process_frame
	var used_target: Dictionary = d.call("_party_selected")
	_check(int(used_target.get("hp", 0)) > int(item_target.get("hp", 0)) and int(((d.get("_state") as Dictionary).get("inventory", [])[0] as Dictionary).get("quantity", 0)) == 0, "only item confirmation heals and spends one remedy")
	menu = d.get("_party_menu")
	focus_owner = get_root().get_viewport().gui_get_focus_owner()
	_check(focus_owner != null and menu != null and menu.is_ancestor_of(focus_owner), "item use rebuild keeps controller focus inside the menu")
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

func _party_member_named(party: Array, name: String) -> bool:
	for member in party:
		if String(member.get("name", "")) == name:
			return true
	return false

func _has_focusable_button(node: Node) -> bool:
	for c in node.get_children():
		if c is Button and (c as Button).focus_mode != Control.FOCUS_NONE:
			return true
		if _has_focusable_button(c):
			return true
	return false

func _valid(v: Variant) -> bool:
	return v != null and is_instance_valid(v)

func _button_with_text(node: Node, text: String) -> Button:
	if node is Button and (node as Button).text == text:
		return node as Button
	for child in node.get_children():
		var found := _button_with_text(child, text)
		if found != null:
			return found
	return null

func _button_with_prefix(node: Node, prefix: String) -> Button:
	if node is Button and (node as Button).text.begins_with(prefix):
		return node as Button
	for child in node.get_children():
		var found := _button_with_prefix(child, prefix)
		if found != null:
			return found
	return null

func _has_text(node: Node, fragment: String) -> bool:
	if node is Label and (node as Label).text.contains(fragment):
		return true
	if node is Button and (node as Button).text.contains(fragment):
		return true
	for child in node.get_children():
		if _has_text(child, fragment):
			return true
	return false

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[dungeon-controller] ok: %s" % label)
	else:
		push_error("[dungeon-controller] FAIL: %s" % label)
		_fail += 1

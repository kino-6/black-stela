extends SceneTree
## Controller traversal gate for the town (AGENTS.md: a player-facing screen is not done without
## evidence of keyboard/controller-style operation; controller-first-ui: "every screen hands the cursor
## a place to land", and "Cancel means back one step, and it must always resolve").
##
## This drives the town with NO pointer events at all:
##   square -> each destination -> each service -> Cancel back out, asserting at every step that
##   (1) something focusable holds the cursor, and (2) Cancel resolved exactly one level.
## Usage: godot --headless --path godot/ --script res://tests/verify_town_controller.gd

# NOTE: "guild" is NOT a town panel — it launches the registration scene (guild.tscn), which is exercised
# by verify_guild_controller. Opening it here would change_scene mid-gate. Roster management is "party".
const LOCATIONS := {"hall": ["party", "career"], "market": ["shop", "loot", "workshop", "blacksmith"], "archive": ["records", "quests"]}
const DungeonEntry := preload("res://scripts/rules/dungeon_entry.gd")
const I18n := preload("res://scripts/i18n.gd")

var _failures := 0

## Every string the built screen is currently rendering — the gate reads what a PLAYER sees.
func _all_text(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	elif node is RichTextLabel:
		out += (node as RichTextLabel).get_parsed_text() + "\n"
	for child in node.get_children():
		out += _all_text(child)
	return out

func _initialize() -> void:
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for i in 8:
		await process_frame

	# The square must hand the cursor a place to land, and it must be the descent (the command a party
	# standing in town came to give) — not merely the first button in the tree.
	var focused := _focused()
	if focused == null:
		_fail("square: no focus surface — a controller is stuck here")
	elif focused is Button and (focused as Button).text.find("迷宮") == -1:
		_fail("square: cursor landed on '%s', expected 迷宮に入る" % (focused as Button).text)
	else:
		print("[town-controller] square: cursor on %s" % (focused as Button).text)

	for location in LOCATIONS:
		town.call("_go_location", String(location))
		for i in 3:
			await process_frame
		if _focused() == null:
			_fail("%s: no focus surface" % location)

		for service in LOCATIONS[location]:
			var svc := String(service)
			town.call("_open_service", svc)
			for i in 4:
				await process_frame
			var f := _focused()
			if f == null:
				_fail("service %s: no focus surface — a controller cannot act here" % svc)
			elif f is Button and (f as Button).disabled:
				_fail("service %s: cursor landed on a DISABLED control" % svc)
			else:
				print("[town-controller] %s: cursor on %s" % [svc, (f as Button).text if f is Button else f.name])
			if svc == "party":
				# The town and dungeon share this party panel. Focus is sufficient to inspect a different
				# adventurer; Confirm must not be a required second step just to refresh their sheet.
				var current: Dictionary = town.call("selected_member")
				var start_party_focus := _focused()
				get_root().push_input(_action("ui_down"))
				for i in 4:
					await process_frame
				var browsed: Dictionary = town.call("selected_member")
				var browsed_focus := _focused()
				var party: Array = town.call("state").get("party", [])
				if not (browsed_focus is Button and browsed_focus != start_party_focus and _party_member_named(party, (browsed_focus as Button).text)):
					_fail("party: Down did not move to another roster entry")
				elif String(browsed.get("id", "")) == String(current.get("id", "")) or String(browsed.get("name", "")) != (browsed_focus as Button).text:
					_fail("party: roster focus did not refresh and retain the inspected adventurer")
				else:
					print("[town-controller] party: Down refreshes %s without Confirm" % String(browsed.get("name", "")))
					# T17: the 能力/status page READS one adventurer — no 前後交代 command. Row changes live in 編成.
					town.call("set_ui_state", {"service": "party", "party_page": "status"})
					for i in 3:
						await process_frame
					if _all_text(town).contains("前後を交代"):
						_fail("party status page still shows a 前後交代 command (T17 — it belongs to 編成)")
					town.call("set_ui_state", {"service": "party", "party_page": "formation"})
					for i in 3:
						await process_frame
					if not _all_text(town).contains(I18n.t("partyMenu.placeFront")):
						_fail("party 編成 tab lost its 前衛へ placement — row changes must remain reachable")
					else:
						print("[town-controller] party: 前後交代 gone from status; 編成 owns row placement (T17)")
					# #18: the tab strip is reachable by ARROWS, not just Tab ("Tab is not a gamepad button").
					# From the status page's landing focus, ↑ must reach the tab strip and → must walk it to
					# 装備 — the whole path with no Tab press. This FAILS on the pre-fix panel (装備 needed Tab).
					town.call("set_ui_state", {"service": "party", "party_page": "status"})
					for i in 3:
						await process_frame
					get_root().push_input(_action("ui_up"))
					for i in 2:
						await process_frame
					var on_tab := _focused()
					var equip_label := I18n.t("partyMenu.tabs.equipment")
					if not (on_tab is Button):
						_fail("party: ↑ from the page did not reach the tab strip — 装備 still needs Tab (#18)")
					else:
						var reached_equip: bool = (on_tab as Button).text == equip_label
						for _step in 6:
							if reached_equip:
								break
							get_root().push_input(_action("ui_right"))
							for i in 2:
								await process_frame
							var f2 := _focused()
							if f2 is Button and (f2 as Button).text == equip_label:
								reached_equip = true
						if reached_equip:
							print("[town-controller] party: 装備 tab reached by ↑/→ alone, no Tab (#18)")
						else:
							_fail("party: 装備 tab not reachable by arrows without Tab (#18)")
					town.call("set_ui_state", {"service": "party", "party_page": "status"})
					for i in 3:
						await process_frame
					# #17: menus navigate with WASD, not only the arrows. A physical S key must move focus the
					# same as ↓ (W/A/S/D are bound onto the ui_* focus actions). RED if that binding is missing.
					var before_wasd := _focused()
					get_root().push_input(_key(KEY_S))
					for i in 2:
						await process_frame
					if _focused() == before_wasd:
						_fail("party: physical S did not move focus — WASD is not wired to menu nav (#17)")
					else:
						print("[town-controller] party: WASD (S) drives menu focus like ↓ (#17)")
					town.call("set_ui_state", {"service": "party", "party_page": "status"})
					for i in 3:
						await process_frame
					# T18: no page of the party menu may leak a RAW i18n key. First the plain tabs.
					for menu_page in ["status", "formation", "spells", "equipment", "items", "valuables"]:
						town.call("set_ui_state", {"service": "party", "party_page": String(menu_page)})
						for i in 3:
							await process_frame
						if _all_text(town).contains("partyMenu."):
							_fail("party %s tab leaked a raw partyMenu.* i18n key (T18)" % menu_page)
					# Then the 呪文/特技 CAST view — it once rendered a bare "partyMenu.back" as its back button.
					# Find a member who knows a heal, drive their cast target list, and assert it is localized.
					var heal_cast_seen := false
					for member_v in (town.call("state").get("party", []) as Array):
						var mid := String((member_v as Dictionary).get("id", ""))
						town.call("set_ui_state", {"service": "party", "party_page": "spells", "party_member_id": mid, "party_technique_id": "lesser-heal"})
						for i in 3:
							await process_frame
						var cast_text := _all_text(town)
						if cast_text.contains("に使う"):
							heal_cast_seen = true
							if cast_text.contains("partyMenu."):
								_fail("heal-cast view leaked a raw partyMenu.* key — the back button (T18)")
							break
					if heal_cast_seen:
						print("[town-controller] party: heal-cast target view is fully localized (T18)")
					else:
						print("[town-controller] party: every tab is fully localized — no raw partyMenu.* key (T18)")
					town.call("set_ui_state", {"service": "party", "party_page": "status", "party_technique_id": ""})
					for i in 3:
						await process_frame

			# Cancel must resolve one step back: counter -> the location's service menu.
			_press_cancel(town)
			for i in 3:
				await process_frame
			if town.get("_service") != "":
				_fail("service %s: Cancel did not close the counter" % svc)
			if _focused() == null:
				_fail("service %s: focus lost after Cancel" % svc)

		# Cancel from a location returns to the square.
		_press_cancel(town)
		for i in 3:
			await process_frame
		if town.get("_location") != "":
			_fail("%s: Cancel did not return to the square" % location)

	# The loot counter's confirm stage must cancel back to the counter, NOT out of the service.
	town.call("_open_service", "loot")
	for i in 3:
		await process_frame
	town.call("set_ui_state", {"loot_pending": "sell"})
	for i in 3:
		await process_frame
	_press_cancel(town)
	for i in 3:
		await process_frame
	if town.get("_loot_pending") != "":
		_fail("loot: Cancel did not leave the confirm stage")
	if town.get("_service") != "loot":
		_fail("loot: Cancel from the confirm stage ejected the player out of the service")
	else:
		print("[town-controller] loot confirm: Cancel returned to the counter, not out of it")

	# T8 — the shop is an Etrian/世界樹 買う/売る split, party-wide (buying drops into the SHARED bag, not a
	# per-adventurer scope), and equipping lives in the party 装備 tab. This locks: (1) 買う and 売る are two
	# separate reachable modes; (2) buying adds to the shared inventory, not to one character; (3) the old
	# per-adventurer purchase picker (「見る冒険者」) is gone; (4) both modes hand the controller a cursor.
	# It is proven to fail on the pre-T8 single-page shop (no modes, a 見る冒険者 picker, no shared-bag guide).
	town.set("_shop_mode", "buy")
	town.call("set_ui_state", {"service": "shop", "shop_category": "weapon", "shop_item_id": "equip.rusted-dirk"})
	for i in 4:
		await process_frame
	var buy_text := _all_text(town)
	if _button_with_text(town, I18n.t("town.shopModeBuy")) == null or _button_with_text(town, I18n.t("town.shopModeSell")) == null:
		_fail("shop: 買う/売る are not both reachable as modes")
	if not buy_text.contains(I18n.t("town.shopStock")):
		_fail("shop 買う: no 品揃え stock heading")
	if buy_text.contains("見る冒険者"):
		_fail("shop 買う: the per-adventurer purchase picker is still present — buying must be party-wide")
	if not buy_text.contains("共有の持ち物"):
		_fail("shop 買う: the shared-bag guide (buying is party-wide) is missing")
	var buy_labels: Array = []
	_buttons_with_text(town, I18n.t("town.buy"), buy_labels)
	if buy_labels.size() < 2:
		_fail("shop 買う: no controller-visible 買う purchase action (only the mode tab)")
	if _focused() == null:
		_fail("shop 買う: no controller focus route")
	# Buying drops the piece into the SHARED inventory — assert the bag grows, not one member's equipment.
	var shop_state: Dictionary = (town.call("state") as Dictionary).duplicate(true)
	shop_state["partyGold"] = 99999
	shop_state["inventory"] = []
	var shop_run: Node = town.get("_run")
	if shop_run != null:
		shop_run.state = shop_state
	else:
		town.set("_fallback_state", shop_state)
	town.call("set_ui_state", {"service": "shop", "shop_category": "weapon", "shop_item_id": "equip.rusted-dirk"})
	for i in 4:
		await process_frame
	var before_bag := int((town.call("state").get("inventory", []) as Array).size())
	# 買う labels BOTH the mode tab and the purchase action; take the LAST match — the action board renders
	# after the mode tabs — so we press the purchase, not re-select the mode.
	var buy_candidates: Array = []
	_buttons_with_text(town, I18n.t("town.buy"), buy_candidates)
	var buy_now: Button = buy_candidates.back() if not buy_candidates.is_empty() else null
	if buy_now == null or buy_now.disabled:
		_fail("shop 買う: 買う is unavailable even with gold to spend")
	else:
		buy_now.emit_signal("pressed")
		for i in 4:
			await process_frame
		var after_bag := int((town.call("state").get("inventory", []) as Array).size())
		if after_bag <= before_bag:
			_fail("shop 買う: buying did not add the piece to the SHARED inventory")
		else:
			print("[town-controller] shop 買う: purchase landed in the shared bag (%d→%d)" % [before_bag, after_bag])

	# 売る is a distinct mode — the stock heading gives way to the 所持品 sell list.
	town.set("_shop_mode", "sell")
	town.call("set_ui_state", {"service": "shop", "shop_mode": "sell"})
	for i in 4:
		await process_frame
	var sell_text := _all_text(town)
	if sell_text.contains(I18n.t("town.shopStock")):
		_fail("shop 売る: still showing the 買う stock — 買う/売る are not separate modes")
	if not sell_text.contains(I18n.t("town.inventory")):
		_fail("shop 売る: no 所持品 sell list")
	# T16: a sell row states its 売値 (the gold you get) so the sale is judgeable — not just a name + 個数.
	if not sell_text.contains("売値"):
		_fail("shop 売る: a sell row does not show its 売値 (sell value)")
	if _focused() == null:
		_fail("shop 売る: no controller focus route")
	else:
		print("[town-controller] shop: 買う/売る are separate modes; sell rows show 売値 (T16)")
	town.set("_shop_mode", "buy")
	_press_cancel(town)
	for i in 3:
		await process_frame

	# T9: the 鍛冶屋 (blacksmith) tempers a WORN piece for GOLD — 鍛える raises its +level and spends gold.
	var forge_state: Dictionary = (town.call("state") as Dictionary).duplicate(true)
	forge_state["partyGold"] = 9999
	var forge_run: Node = town.get("_run")
	if forge_run != null:
		forge_run.state = forge_state
	else:
		town.set("_fallback_state", forge_state)
	town.call("set_ui_state", {"service": "blacksmith"})
	for i in 4:
		await process_frame
	var gold_before := int((town.call("state").get("partyGold", 0)))
	var forge_btn := _button_with_text(town, I18n.t("blacksmith.forge", {"cost": 30}))
	if forge_btn == null or forge_btn.disabled:
		_fail("blacksmith: no affordable 鍛える action even with gold to spend")
	else:
		forge_btn.emit_signal("pressed")
		for i in 4:
			await process_frame
		var gold_after := int((town.call("state").get("partyGold", 0)))
		if gold_after >= gold_before:
			_fail("blacksmith: 鍛える did not spend gold from the shared purse (T9)")
		else:
			print("[town-controller] blacksmith: 鍛える tempers a worn piece for gold (%d->%d)" % [gold_before, gold_after])
	_press_cancel(town)
	for i in 3:
		await process_frame

	# Equipment follows the same controller decision path in town as it does in the dungeon: select a
	# slot, inspect a candidate without mutation, compare, then explicitly equip. Cancel only leaves the
	# comparison stage, not the party counter.
	var Economy := preload("res://scripts/rules/economy.gd")
	var equipment_state: Dictionary = (town.call("state") as Dictionary).duplicate(true)
	var cap: Variant = Economy.create_inventory_item(town.get("_world"), "equip.iron-cap", 1)
	var cap_catalog: Variant = Economy.find_equipment(town.get("_world"), "equip.iron-cap")
	var cap_wearer: Dictionary = {}
	for member in equipment_state.get("party", []):
		if typeof(cap_catalog) == TYPE_DICTIONARY and Economy.is_equipment_usable_by(cap_catalog, member):
			cap_wearer = member
			break
	if cap_wearer.is_empty():
		_fail("equipment: no compatible party member for the controller fixture")
	else:
		equipment_state["inventory"] = [cap]
		var run_for_equipment: Node = town.get("_run")
		if run_for_equipment != null:
			run_for_equipment.state = equipment_state
		else:
			town.set("_fallback_state", equipment_state)
		town.set("_selected_id", String(cap_wearer.get("id", "")))
		town.call("set_ui_state", {"service": "party", "party_page": "equipment", "party_equipment_slot": "head", "party_equipment_candidate": ""})
		for i in 4:
			await process_frame
		var cap_button := _button_with_text(town, "凹み鉄帽")
		if cap_button == null:
			_fail("equipment: selected head slot has no candidate command")
		else:
			cap_button.emit_signal("pressed")
			for i in 4:
				await process_frame
			var before: Dictionary = town.call("selected_member")
			if (before.get("equipment", {}) as Dictionary).get("head", null) != null:
				_fail("equipment: selecting a candidate mutated town state")
			elif not _all_text(town).contains("装着後の変化") or _button_with_text(town, "%sに装備" % String(cap_wearer.get("name", ""))) == null:
				_fail("equipment: town does not show comparison and explicit confirmation")
			else:
				_press_cancel(town)
				for i in 4:
					await process_frame
				if town.get("_service") != "party" or town.get("_party_equipment_candidate") != "":
					_fail("equipment: Cancel did not return from comparison to the selected slot")
				else:
					cap_button = _button_with_text(town, "凹み鉄帽")
					if cap_button != null:
						cap_button.emit_signal("pressed")
					for i in 4:
						await process_frame
					var equip_button := _button_with_text(town, "%sに装備" % String(cap_wearer.get("name", "")))
					if equip_button == null:
						_fail("equipment: explicit town equip command disappeared")
					else:
						equip_button.emit_signal("pressed")
						for i in 4:
							await process_frame
						var after: Dictionary = town.call("selected_member")
						if String(((after.get("equipment", {}) as Dictionary).get("head", {}) as Dictionary).get("id", "")) != "equip.iron-cap":
							_fail("equipment: explicit town confirmation did not equip the selected candidate")
						elif town.get("_party_equipment_candidate") != "":
							_fail("equipment: town kept a stale selected candidate after equipping")
						else:
							print("[town-controller] equipment: slot → candidate → comparison → confirm works without pointer input")
					_press_cancel(town)
					for i in 3:
						await process_frame

	# Recovery/cure techniques are not combat-only entries in the party menu. The controller selects the
	# caster's art, then an injured ally; the rules command spends MP and updates that ally without pointer
	# input or a second, unrelated item surface.
	var technique_state: Dictionary = (town.call("state") as Dictionary).duplicate(true)
	var priest: Dictionary = {}
	var injured: Dictionary = {}
	for member_v in technique_state.get("party", []):
		var member: Dictionary = member_v
		if String(member.get("classId", "")) == "priest":
			priest = member
		elif injured.is_empty():
			injured = member
	if priest.is_empty() or injured.is_empty():
		_fail("techniques: fixture has no priest and ally")
	else:
		for index in technique_state["party"].size():
			var patched: Dictionary = (technique_state["party"][index] as Dictionary).duplicate(true)
			if String(patched.get("id", "")) == String(priest.get("id", "")):
				patched["mp"] = maxi(8, int(patched.get("mp", 0)))
			if String(patched.get("id", "")) == String(injured.get("id", "")):
				patched["hp"] = maxi(1, int(patched.get("maxHp", 10)) - 5)
			technique_state["party"][index] = patched
		var run_for_techniques: Node = town.get("_run")
		if run_for_techniques != null:
			run_for_techniques.state = technique_state
		else:
			town.set("_fallback_state", technique_state)
		var Techniques := preload("res://scripts/rules/techniques.gd")
		var heal_label := Techniques.label("heal", town.call("engine"))
		town.set("_selected_id", String(priest.get("id", "")))
		town.call("set_ui_state", {"service": "party", "party_page": "spells", "party_technique_id": ""})
		for i in 4:
			await process_frame
		var heal_button := _button_with_text(town, heal_label)
		if heal_button == null or heal_button.disabled:
			_fail("techniques: a usable recovery art is not a controller command")
		else:
			heal_button.emit_signal("pressed")
			for i in 4:
				await process_frame
			var target_button := _button_with_text(town, "%sに使う" % String(injured.get("name", "")))
			if target_button == null or target_button.disabled:
				_fail("techniques: recovery art did not offer the injured ally as a target")
			else:
				target_button.emit_signal("pressed")
				for i in 4:
					await process_frame
				var after_party: Array = (town.call("state") as Dictionary).get("party", [])
				var after_target: Dictionary = {}
				for after_member_v in after_party:
					var after_member: Dictionary = after_member_v
					if String(after_member.get("id", "")) == String(injured.get("id", "")):
						after_target = after_member
						break
				if int(after_target.get("hp", 0)) <= int(injured.get("maxHp", 0)) - 5:
					_fail("techniques: selecting an ally did not apply recovery")
				else:
					print("[town-controller] techniques: recovery art selects and heals an ally by controller")
				_press_cancel(town)
				for i in 3:
					await process_frame

	# REGRESSION (playtest #4): a BRAND-NEW game has never descended — town must read as a FIRST departure
	# (初めて潜る前に / 手持ち), never a post-return state (帰還後の支度 / 持ち帰った物). The shared state seeds
	# from a debug mid-dungeon fixture; start_guild() must zero the expedition history, or the first town
	# screen reports a starting potion as brought-back loot and the first descent resumes mid-floor.
	var run := get_root().get_node_or_null("Run")
	if run != null:
		run.start_guild()
		# Give the fresh guild a recruit so the screen isn't the empty-roster edge — first_departure is a
		# function of expeditions, not of party size.
		run.state["party"] = [{"id": "new", "name": "新兵", "classId": "warrior", "row": "front", "hp": 10, "maxHp": 10}]
		if int(run.state.get("expeditions", -1)) != 0:
			_fail("new game: expeditions was not zeroed (%d) — town will show the 帰還後 view" % int(run.state.get("expeditions", -1)))
		if run.state.get("position") != null:
			_fail("new game: position survived start_guild — the first descent would resume mid-floor")
		# The first descent must land at the world's ENTRANCE, not the fixture's mid-floor fight cell.
		var landing: Dictionary = DungeonEntry.plan(run.state, run.world)
		var landing_cell := String((landing.get("position", {}) as Dictionary).get("cellId", ""))
		if landing_cell == "cell.b1f.002" or landing_cell == "":
			_fail("new game: the first descent did not land at the entrance (landed at '%s')" % landing_cell)
		var fresh_town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
		get_root().add_child(fresh_town)
		for i in 8:
			await process_frame
		var shown := _all_text(fresh_town)
		# The town redesign dropped the first-departure/return HEADINGS for the world title; a fresh party is
		# now one with no return line (no last-log subtitle, no wounds ledger), never a "帰還後" greeting. So the
		# regression check is the NEGATIVE one that always mattered: a brand-new game must not read as post-return.
		if not shown.contains("町の施設"):
			_fail("new game: the town square did not render (no 町の施設 destinations)")
		if shown.contains("帰還後の支度") or shown.contains("持ち帰った物") or shown.contains("帰還記録"):
			_fail("new game: town shows a post-return view (帰還後の支度 / 持ち帰った物 / 帰還記録) before the first descent")
		else:
			print("[town-controller] new game reads as a first departure (no 帰還後 / 持ち帰った物 / 帰還記録)")
		fresh_town.queue_free()

	print("")
	if _failures == 0:
		print("[town-controller] PASS — every town surface is reachable, focusable and cancellable by controller")
		quit(0)
	else:
		print("[town-controller] FAIL — %d problem(s)" % _failures)
		quit(1)

func _press_cancel(town: Node) -> void:
	var event := InputEventAction.new()
	event.action = "cancel"
	event.pressed = true
	town.call("_unhandled_input", event)

func _focused() -> Control:
	return get_root().gui_get_focus_owner()

func _action(name: String) -> InputEventAction:
	var event := InputEventAction.new()
	event.action = name
	event.pressed = true
	return event

# A physical key press (not a named action) — proves the WASD→ui_* binding exists end-to-end (#17).
func _key(keycode: int) -> InputEventKey:
	var event := InputEventKey.new()
	event.physical_keycode = keycode
	event.pressed = true
	return event

func _party_member_named(party: Array, name: String) -> bool:
	for member in party:
		if String(member.get("name", "")) == name:
			return true
	return false

func _button_with_text(node: Node, text: String) -> Button:
	if node is Button and (node as Button).text == text:
		return node as Button
	for child in node.get_children():
		var found := _button_with_text(child, text)
		if found != null:
			return found
	return null

func _buttons_with_text(node: Node, text: String, out: Array) -> void:
	if node is Button and (node as Button).text == text:
		out.append(node)
	for child in node.get_children():
		_buttons_with_text(child, text, out)

func _fail(message: String) -> void:
	_failures += 1
	push_error("[town-controller] %s" % message)
	print("[town-controller] FAIL: %s" % message)

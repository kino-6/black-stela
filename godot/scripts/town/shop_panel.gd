extends RefCounted
## Faithful port of src/components/ShopPanel.tsx — stock, inventory (sell), and the equip board.
##
## AGENTS.md: "Shops must show who can use equipment and what changes." So every stock row that is
## equipment carries, against the SELECTED adventurer: can/cannot equip, the stat delta it would cause,
## its price, and the gold left after buying. The equip board below shows that adventurer's six slots
## and what is in them, so "what changes" has something to change FROM.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var party: Array = state.get("party", [])
	var party_gold := int(state.get("partyGold", 0))
	var inventory: Array = state.get("inventory", [])
	var shops: Array = world.get("shops", [])
	var shop: Dictionary = shops[0] if not shops.is_empty() else {}

	var selected: Dictionary = ctx["selected_member"].call()
	var root := UI.col(10)
	root.add_child(UI.service_heading(Fmt.localized_shop_name(shop), I18n.t("town.gold", {"gold": party_gold})))
	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	if selected.is_empty():
		root.add_child(UI.label(I18n.t("town.noParty"), 18, UI.DIM))
		var empty_back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
		root.add_child(empty_back)
		ctx["focus_hint"].call(empty_back)
		return root

	var selected_stats: Dictionary = CharacterStats.effective(selected, world)

	# --- who we are shopping FOR (React: shop-adventurer-panel) ---
	var who := UI.col(4)
	who.add_child(UI.label("%s: %s" % [I18n.t("town.selectedAdventurer"), String(selected.get("name", ""))], 19, UI.GOLD))
	who.add_child(UI.label(_summary(selected_stats), 16, UI.INK))
	var picker := UI.row()
	for member in party:
		var mid := String(member.get("id", ""))
		var is_sel := mid == String(selected.get("id", ""))
		var b := UI.button(String(member.get("name", "?")), func(): ctx["set_selected"].call(mid), Vector2(120, 36), 15)
		if is_sel:
			b.add_theme_color_override("font_color", UI.GOLD)
		picker.add_child(b)
	who.add_child(picker)
	root.add_child(UI.card(who))

	# --- stock | decision board ---
	# A counter is not a spreadsheet: first choose one item from stock, then the opposite panel gives the
	# player its bearer, fit, stat change and remaining purse together. Only that board owns the Buy command.
	var cols := UI.row()
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(cols)

	var left := UI.col(6)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(left)
	left.add_child(UI.label(I18n.t("town.shopStock"), 20, UI.GOLD))

	# category tabs — the stock is browsed by kind, not scrolled as one heap
	var categories := _available_categories(world, shop, state)
	var active: String = ctx.get("shop_category", "")
	if active == "" or not categories.has(active):
		active = categories[0] if not categories.is_empty() else "consumable"
	var tabs := UI.row()
	for cat in categories:
		var c := String(cat)
		var tb := UI.button(I18n.t("town.category.%s" % c), func(): ctx["set_shop_category"].call(c), Vector2(110, 34), 14)
		if c == active:
			tb.add_theme_color_override("font_color", UI.GOLD)
		tabs.add_child(tb)
	left.add_child(tabs)

	var stock_list := UI.col(6)
	var visible_stock: Array = []
	for entry in shop.get("stock", []):
		var item_id := String(entry.get("itemId", ""))
		if _stock_available(entry, state) and Fmt.shop_category_for(world, item_id) == active:
			visible_stock.append(entry)
	var selected_item_id: String = String(ctx.get("shop_item_id", ""))
	var selected_entry: Dictionary = {}
	for entry in visible_stock:
		if String((entry as Dictionary).get("itemId", "")) == selected_item_id:
			selected_entry = entry
			break
	if selected_entry.is_empty() and not visible_stock.is_empty():
		selected_entry = visible_stock[0]
		selected_item_id = String(selected_entry.get("itemId", ""))
	var focus_target: Button = null
	for entry in visible_stock:
		var item_id := String((entry as Dictionary).get("itemId", ""))
		var built := _stock_row(ctx, world, entry, item_id, selected, item_id == selected_item_id)
		stock_list.add_child(built)
		if focus_target == null:
			var candidate := UI.first_focusable(built)
			if candidate:
				focus_target = candidate
	if stock_list.get_child_count() == 0:
		stock_list.add_child(UI.label(I18n.t("town.inventoryEmpty"), 15, UI.DIM))
	left.add_child(UI.scroller(stock_list, Vector2(820, 560)))

	var right := UI.col(6)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(right)
	var decision := UI.col(6)
	decision.add_child(UI.prose(I18n.t("town.shopGuide"), 15, UI.DIM, 700))
	decision.add_child(UI.label(I18n.t("town.selectedItem"), 20, UI.GOLD))
	if selected_entry.is_empty():
		decision.add_child(UI.label(I18n.t("town.inventoryEmpty"), 16, UI.DIM))
	else:
		decision.add_child(_selected_item_board(ctx, world, selected_entry, selected, selected_stats, party_gold))
	decision.add_child(UI.hsep())
	decision.add_child(UI.label(I18n.t("town.inventory"), 20, UI.GOLD))
	var inv_list := UI.col(6)
	if inventory.is_empty():
		inv_list.add_child(UI.label(I18n.t("town.inventoryEmpty"), 15, UI.DIM))
	for item in inventory:
		inv_list.add_child(_inventory_row(ctx, world, item, party))
	decision.add_child(UI.scroller(inv_list, Vector2(720, 170)))
	decision.add_child(UI.hsep())
	decision.add_child(UI.label(I18n.t("town.equipment"), 20, UI.GOLD))
	decision.add_child(_equipment_board(ctx, world, inventory, selected, selected_stats))
	right.add_child(UI.scroller(decision, Vector2(720, 560)))

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	# The counter must CLAIM the cursor — otherwise focus stays on the town menu behind this panel and a
	# controller player operates a screen they cannot see.
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

static func _summary(stats: Dictionary) -> String:
	return I18n.t("town.equipmentSummary", {
		"attack": int(stats.get("damageMax", 0)),
		"accuracy": int(stats.get("accuracy", 0)),
		"armorValue": int(stats.get("armor", 0)),
		"speed": int(stats.get("speed", 0))
	})

static func _stock_available(stock: Dictionary, state: Dictionary) -> bool:
	if stock.get("availability", "") == "unlocked" and stock.get("unlockFlag", null) != null:
		return state.get("discoveredSecrets", []).has(stock.get("unlockFlag"))
	return stock.get("availability", "") != "unlocked"

static func _available_categories(world: Dictionary, shop: Dictionary, state: Dictionary) -> Array:
	var seen := {}
	for entry in shop.get("stock", []):
		if _stock_available(entry, state):
			seen[Fmt.shop_category_for(world, String(entry.get("itemId", "")))] = true
	var out := []
	for cat in Fmt.SHOP_CATEGORY_ORDER:
		if seen.has(cat):
			out.append(cat)
	return out

static func _stock_row(ctx: Dictionary, world: Dictionary, entry: Dictionary, item_id: String, member: Dictionary, is_selected: bool) -> Control:
	var price := int(entry.get("price", 0))
	var eq: Variant = Fmt.find_equipment(world, item_id)
	var body := UI.col(2)
	body.add_child(UI.label(Fmt.localized_catalog_name(world, item_id), 17, UI.INK))
	# Every item explains itself — gear AND consumables. The consumable tab used to show only a name and a
	# price (playtest #2); the description is authored per item and belongs on every category, not just gear.
	var desc := Fmt.localized_catalog_description(world, item_id)
	if desc != "":
		body.add_child(UI.prose(desc, 13, UI.DIM, 380))

	if typeof(eq) == TYPE_DICTIONARY:
		body.add_child(UI.label("%s · %s" % [Fmt.format_equipment_slot(String(eq.get("slot", ""))), Fmt.format_equipment_effect(eq)], 14, UI.DIM))
		# The compact list is the first filter: show whether the currently selected adventurer may use a
		# piece before they spend a Confirm opening its board. The board then supplies the exact stat delta.
		var usable := Fmt.is_usable_by(eq, member)
		body.add_child(UI.label(I18n.t("town.canEquip" if usable else "town.cannotEquip", {"member": String(member.get("name", ""))}), 14, UI.OK if usable else UI.BAD))
	body.add_child(UI.label(I18n.t("town.price", {"gold": price}), 15, UI.INK))

	var line := UI.row()
	line.add_child(UI.grow(body))
	var inspect := UI.button(I18n.t("town.inspect"), func(): ctx["set_shop_item"].call(item_id), Vector2(132, 40), 15)
	if is_selected:
		inspect.add_theme_color_override("font_color", UI.GOLD)
	line.add_child(inspect)
	return UI.card(line, UI.GOLD if is_selected else Color("3a4326"))

static func _selected_item_board(ctx: Dictionary, world: Dictionary, entry: Dictionary, selected: Dictionary, selected_stats: Dictionary, party_gold: int) -> Control:
	var item_id := String(entry.get("itemId", ""))
	var price := int(entry.get("price", 0))
	var afford := party_gold >= price
	var eq: Variant = Fmt.find_equipment(world, item_id)
	var body := UI.col(4)
	body.add_child(UI.label(Fmt.localized_catalog_name(world, item_id), 22, UI.INK))
	var desc := Fmt.localized_catalog_description(world, item_id)
	if desc != "":
		body.add_child(UI.prose(desc, 15, UI.DIM, 650))
	if typeof(eq) == TYPE_DICTIONARY:
		body.add_child(UI.label("%s · %s" % [Fmt.format_equipment_slot(String(eq.get("slot", ""))), Fmt.format_equipment_effect(eq)], 15, UI.DIM))
		var usable: bool = Fmt.is_usable_by(eq, selected)
		var fit := I18n.t("town.canEquip" if usable else "town.cannotEquip", {"member": String(selected.get("name", ""))})
		if usable:
			var preview: Dictionary = Fmt.preview_equipment_stats(selected, eq, world)
			fit += " · " + Fmt.format_stat_delta(selected_stats, preview)
		body.add_child(UI.label(fit, 16, UI.OK if usable else UI.BAD))
	body.add_child(UI.label(I18n.t("town.price", {"gold": price}) + "　" + I18n.t("town.remainingGold", {"gold": maxi(0, party_gold - price)}), 16, UI.INK if afford else UI.BAD))
	var line := UI.row()
	line.add_child(UI.grow(body))
	var buy := UI.button(I18n.t("town.buy"), func(): ctx["dispatch"].call({"type": "buy_item", "shopId": ctx["world"].get("shops", [{}])[0].get("id", ""), "itemId": item_id}), Vector2(130, 46), 17)
	buy.disabled = not afford
	line.add_child(buy)
	return UI.card(line, UI.GOLD)

static func _equipment_board(ctx: Dictionary, world: Dictionary, inventory: Array, selected: Dictionary, selected_stats: Dictionary) -> Control:
	var board := UI.col(4)
	board.add_child(UI.label("%s　%s" % [String(selected.get("name", "")), _summary(selected_stats)], 16, UI.INK))
	var slots := []
	for slot in Fmt.EQUIPMENT_SLOT_ORDER:
		slots.append("%s: %s" % [Fmt.format_equipment_slot(String(slot)), Fmt.equipped_name(world, (selected.get("equipment", {}) as Dictionary).get(slot, null))])
	board.add_child(UI.prose("　".join(PackedStringArray(slots)), 14, UI.DIM, 650))
	for item in inventory:
		if item.get("kind", "") != "equipment":
			continue
		var eq: Variant = Fmt.find_equipment(world, item.get("id", ""))
		var usable: bool = typeof(eq) == TYPE_DICTIONARY and Fmt.is_usable_by(eq, selected)
		var line := UI.row()
		line.add_child(UI.grow(UI.label(Fmt.describe_equipment_instance(world, item.get("id", ""), item.get("plus", null), item.get("affix", null)), 15, UI.INK if usable else UI.DIM)))
		line.add_child(UI.label(I18n.t("town.allowed") if usable else I18n.t("town.ineligible"), 14, UI.OK if usable else UI.BAD))
		var equip := UI.button(I18n.t("town.equip"), func(): ctx["dispatch"].call({"type": "equip_item", "characterId": selected.get("id", ""), "equipmentId": item.get("id", ""), "plus": item.get("plus", null), "affix": item.get("affix", null)}), Vector2(96, 34), 14)
		equip.disabled = not usable
		line.add_child(equip)
		board.add_child(line)
	return UI.card(board)

static func _inventory_row(ctx: Dictionary, world: Dictionary, item: Dictionary, party: Array) -> Control:
	var body := UI.col(2)
	body.add_child(UI.label(Fmt.describe_equipment_instance(world, item.get("id", ""), item.get("plus", null), item.get("affix", null)), 17, UI.INK))
	if item.get("kind", "") == "equipment" and item.get("slot", null) != null:
		body.add_child(UI.label("%s · %s" % [Fmt.format_equipment_slot(String(item.get("slot", ""))), Fmt.format_inventory_effect(item)], 14, UI.DIM))
	body.add_child(UI.label(I18n.t("town.quantity", {"count": int(item.get("quantity", 1))}), 14, UI.DIM))

	var equipped_now := Fmt.is_equipped_by_party(party, item)
	var line := UI.row()
	line.add_child(UI.grow(body))
	var sell := UI.button(I18n.t("town.sell"), func(): ctx["dispatch"].call({"type": "sell_item", "itemId": item.get("id", ""), "plus": item.get("plus", null), "affix": item.get("affix", null)}), Vector2(96, 40), 15)
	sell.disabled = int(item.get("sellValue", 0)) <= 0 or equipped_now
	line.add_child(sell)
	return UI.card(line)

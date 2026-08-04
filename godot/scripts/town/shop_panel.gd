extends RefCounted
## The town shop — Etrian/世界樹 style (T8): a top-level 買う / 売る split. 買う browses stock by category and
## buys into the SHARED party inventory (equipping is done in the party 装備 tab, not here) — party-wide, not
## per-character. 売る lists the party's sellable goods. The old screen crammed buy + sell + a per-adventurer
## equip board onto one page; this is three cleaner decisions across two modes.
##
## AGENTS.md: "Shops must show who can use equipment and what changes." The buy detail keeps that as INFO —
## it names which members CAN equip a piece — without binding the purchase to one adventurer.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const WorldResources := preload("res://scripts/world_resources.gd")

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var party: Array = state.get("party", [])
	var party_gold := int(state.get("partyGold", 0))
	var shops: Array = world.get("shops", [])
	var shop: Dictionary = shops[0] if not shops.is_empty() else {}
	# A world can author several counters in one market (Terminal Line's supply stall + shutter armory).
	# The player-facing shop is one stable buy/sell surface, so merge their stock here while retaining the
	# source shop id for the eventual purchase command. Reading only shops[0] silently made the whole armory
	# unreachable even though the catalog and treasure data existed.
	var market_stock: Array = []
	for source in shops:
		if typeof(source) != TYPE_DICTIONARY:
			continue
		for source_entry in (source as Dictionary).get("stock", []):
			if typeof(source_entry) != TYPE_DICTIONARY:
				continue
			var entry: Dictionary = (source_entry as Dictionary).duplicate(true)
			entry["shopId"] = String((source as Dictionary).get("id", ""))
			market_stock.append(entry)

	var root := UI.col(10)
	root.add_child(UI.service_heading(Fmt.localized_shop_name(shop), I18n.t("town.gold", {"gold": party_gold})))
	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	if party.is_empty():
		root.add_child(UI.label(I18n.t("town.noParty"), 18, UI.DIM))
		var empty_back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
		root.add_child(empty_back)
		ctx["focus_hint"].call(empty_back)
		return root

	# 買う / 売る — the top-level split. Equipping is elsewhere; buying is party-wide.
	var mode: String = String(ctx.get("shop_mode", "buy"))
	if mode != "buy" and mode != "sell":
		mode = "buy"
	var mode_tabs := UI.row()
	for entry in [["buy", "town.shopModeBuy"], ["sell", "town.shopModeSell"]]:
		var mid := String(entry[0])
		var mb := UI.button(I18n.t(String(entry[1])), func(): ctx["set_shop_mode"].call(mid), Vector2(160, 42), 18)
		if mid == mode:
			mb.add_theme_color_override("font_color", UI.GOLD)
		mode_tabs.add_child(mb)
	root.add_child(mode_tabs)
	root.add_child(UI.hsep())

	var focus_target: Control = null
	if mode == "sell":
		focus_target = _sell_mode(ctx, root, world, state)
	else:
		focus_target = _buy_mode(ctx, root, world, state, market_stock, party, party_gold)

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	root.add_child(back)
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

# --- 買う ------------------------------------------------------------------------------------------
static func _buy_mode(ctx: Dictionary, root: VBoxContainer, world: Dictionary, state: Dictionary, market_stock: Array, party: Array, party_gold: int) -> Control:
	var cols := UI.row()
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(cols)

	var left := UI.col(6)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(left)
	left.add_child(UI.label(I18n.t("town.shopStock"), 20, UI.GOLD))

	var categories := _available_categories(world, market_stock, state)
	var active: String = String(ctx.get("shop_category", ""))
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

	var visible_stock: Array = []
	for entry in market_stock:
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

	var stock_list := UI.col(6)
	var focus_target: Button = null
	for entry in visible_stock:
		var item_id := String((entry as Dictionary).get("itemId", ""))
		var built := _stock_row(ctx, world, entry, item_id, item_id == selected_item_id)
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
	right.add_child(UI.prose(I18n.t("town.shopGuideShared"), 15, UI.DIM, 700))
	right.add_child(UI.label(I18n.t("town.selectedItem"), 20, UI.GOLD))
	if selected_entry.is_empty():
		right.add_child(UI.label(I18n.t("town.inventoryEmpty"), 16, UI.DIM))
	else:
		right.add_child(_selected_item_board(ctx, world, selected_entry, party, party_gold))
	return focus_target

static func _stock_row(ctx: Dictionary, world: Dictionary, entry: Dictionary, item_id: String, is_selected: bool) -> Control:
	var price := int(entry.get("price", 0))
	var eq: Variant = Fmt.find_equipment(world, item_id)
	var body := UI.col(2)
	body.add_child(UI.label(Fmt.localized_catalog_name(world, item_id), 17, UI.INK))
	var desc := Fmt.localized_catalog_description(world, item_id)
	if desc != "":
		body.add_child(UI.prose(desc, 13, UI.DIM, 380))
	if typeof(eq) == TYPE_DICTIONARY:
		body.add_child(UI.label("%s · %s" % [Fmt.format_equipment_slot(String(eq.get("slot", ""))), Fmt.format_equipment_effect(eq)], 14, UI.DIM))
	body.add_child(UI.label(I18n.t("town.price", {"gold": price}), 15, UI.INK))

	var line := UI.row()
	var icon := _catalog_icon(world, item_id, 58)
	if icon != null:
		line.add_child(icon)
	line.add_child(UI.grow(body))
	var inspect := UI.button(I18n.t("town.inspect"), func(): ctx["set_shop_item"].call(item_id), Vector2(132, 40), 15)
	if is_selected:
		inspect.add_theme_color_override("font_color", UI.GOLD)
	line.add_child(inspect)
	return UI.card(line, UI.GOLD if is_selected else Color("3a4326"))

static func _selected_item_board(ctx: Dictionary, world: Dictionary, entry: Dictionary, party: Array, party_gold: int) -> Control:
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
		# Who CAN equip it — information, not a purchase scope. Buying still drops it into the shared bag.
		var wearers := []
		for member in party:
			if Fmt.is_usable_by(eq as Dictionary, member):
				wearers.append(String(member.get("name", "")))
		if wearers.is_empty():
			body.add_child(UI.label(I18n.t("town.equipNoneCan"), 15, UI.BAD))
		else:
			body.add_child(UI.label(I18n.t("town.equipWhoCan", {"names": "・".join(PackedStringArray(wearers))}), 15, UI.OK))
	body.add_child(UI.label(I18n.t("town.price", {"gold": price}) + "　" + I18n.t("town.remainingGold", {"gold": maxi(0, party_gold - price)}), 16, UI.INK if afford else UI.BAD))
	var line := UI.row()
	var icon := _catalog_icon(world, item_id, 116)
	if icon != null:
		line.add_child(icon)
	line.add_child(UI.grow(body))
	var buy := UI.button(I18n.t("town.buy"), func(): ctx["dispatch"].call({"type": "buy_item", "shopId": String(entry.get("shopId", "")), "itemId": item_id}), Vector2(130, 46), 17)
	buy.disabled = not afford
	line.add_child(buy)
	return UI.card(line, UI.GOLD)

# --- 売る ------------------------------------------------------------------------------------------
static func _sell_mode(ctx: Dictionary, root: VBoxContainer, world: Dictionary, state: Dictionary) -> Control:
	var party: Array = state.get("party", [])
	var inventory: Array = state.get("inventory", [])
	root.add_child(UI.label(I18n.t("town.inventory"), 20, UI.GOLD))
	root.add_child(UI.prose(I18n.t("town.shopSellGuide"), 15, UI.DIM, 760))
	var list := UI.col(6)
	var focus_target: Button = null
	var any := false
	for item in inventory:
		any = true
		var built := _inventory_row(ctx, world, item, party)
		list.add_child(built)
		if focus_target == null:
			var candidate := UI.first_focusable(built)
			if candidate:
				focus_target = candidate
	if not any:
		list.add_child(UI.label(I18n.t("town.inventoryEmpty"), 15, UI.DIM))
	root.add_child(UI.scroller(list, Vector2(1180, 560)))
	return focus_target

static func _inventory_row(ctx: Dictionary, world: Dictionary, item: Dictionary, party: Array) -> Control:
	var body := UI.col(2)
	body.add_child(UI.label(Fmt.describe_equipment_instance(world, item.get("id", ""), item.get("plus", null), item.get("affix", null)), 17, UI.INK))
	if item.get("kind", "") == "equipment" and item.get("slot", null) != null:
		body.add_child(UI.label("%s · %s" % [Fmt.format_equipment_slot(String(item.get("slot", ""))), Fmt.format_inventory_effect(item)], 14, UI.DIM))
	# T16: the seller needs 性能 (what it does) and 売値 (what they get) to judge the sale.
	var desc := Fmt.localized_catalog_description(world, item.get("id", ""))
	if desc != "":
		body.add_child(UI.prose(desc, 13, UI.DIM, 560))
	body.add_child(UI.label(I18n.t("town.sellValue", {"gold": int(item.get("sellValue", 0))}), 14, UI.GOLD))
	body.add_child(UI.label(I18n.t("town.quantity", {"count": int(item.get("quantity", 1))}), 14, UI.DIM))

	var equipped_now := Fmt.is_equipped_by_party(party, item)
	var line := UI.row()
	line.add_child(UI.grow(body))
	var sell := UI.button(I18n.t("town.sell"), func(): ctx["dispatch"].call({"type": "sell_item", "itemId": item.get("id", ""), "plus": item.get("plus", null), "affix": item.get("affix", null)}), Vector2(96, 40), 15)
	sell.disabled = int(item.get("sellValue", 0)) <= 0 or equipped_now
	line.add_child(sell)
	return UI.card(line)

# --- shared -----------------------------------------------------------------------------------------
static func _stock_available(stock: Dictionary, state: Dictionary) -> bool:
	if stock.get("availability", "") == "unlocked" and stock.get("unlockFlag", null) != null:
		return state.get("discoveredSecrets", []).has(stock.get("unlockFlag"))
	return stock.get("availability", "") != "unlocked"

static func _catalog_icon(world: Dictionary, item_id: String, size: int) -> TextureRect:
	var world_id := String(world.get("id", "")).trim_prefix("world.")
	if world_id == "":
		return null
	var basename := item_id.replace(".", "-")
	var texture := WorldResources.texture(WorldResources.world_asset(world_id, "icons/%s.png" % basename))
	if texture == null:
		return null
	var icon := TextureRect.new()
	icon.texture = texture
	icon.custom_minimum_size = Vector2(size, size)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return icon

static func _available_categories(world: Dictionary, market_stock: Array, state: Dictionary) -> Array:
	var seen := {}
	for entry in market_stock:
		if _stock_available(entry, state):
			seen[Fmt.shop_category_for(world, String(entry.get("itemId", "")))] = true
	var out := []
	for cat in Fmt.SHOP_CATEGORY_ORDER:
		if seen.has(cat):
			out.append(cat)
	return out

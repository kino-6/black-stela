extends RefCounted
## Faithful port of src/components/LootPanel.tsx — the town APPRAISER (鑑定所).
##
## The React panel's contract: rare finds arrive unidentified; the player PAYS to reveal them, protects
## keepers (lock / favorite), sees how an appraised piece fits a CHOSEN adventurer (and can equip it),
## and clears routine loot in one previewed, CONFIRM-gated bulk operation that never consumes an
## equipped, locked, favorite or unidentified item. Every one of those stages is reproduced here — a
## one-press "convert everything" is the exact failure this two-step exists to prevent.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Loot := preload("res://scripts/rules/loot.gd")
const Economy := preload("res://scripts/rules/economy.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")

# The stats a fit-comparison surfaces, in the order the player reads them.
const COMPARE_STATS := ["attack", "damageMin", "damageMax", "accuracy", "armor", "speed", "maxHp", "maxMp"]
const RARITIES := ["common", "rare", "epic"]

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var party: Array = state.get("party", [])
	var party_gold := int(state.get("partyGold", 0))
	var materials := int(state.get("materials", 0))
	var inventory: Array = state.get("inventory", [])

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("loot.title"), "%s · %s" % [I18n.t("loot.gold", {"gold": party_gold}), I18n.t("loot.materials", {"materials": materials})]))
	root.add_child(UI.prose(I18n.t("loot.intro"), 16, UI.DIM, 900))
	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	var fit_member: Dictionary = ctx["selected_member"].call()

	# --- who an appraised piece is fitted to ---
	if not party.is_empty():
		var picker := UI.row()
		picker.add_child(UI.label("%s:" % I18n.t("loot.compareFor"), 15, UI.DIM))
		for member in party:
			var mid := String(member.get("id", ""))
			var b := UI.button(String(member.get("name", "?")), func(): ctx["set_selected"].call(mid), Vector2(110, 34), 14)
			if mid == String(fit_member.get("id", "")):
				b.add_theme_color_override("font_color", UI.GOLD)
			picker.add_child(b)
		root.add_child(picker)

	# --- bulk conversion: filter -> preview -> CONFIRM ---
	var equipped_keys := Loot.equipped_instance_keys(state)
	var equipment := []
	for item in inventory:
		if item.get("kind", "") == "equipment":
			equipment.append(item)
	var convertible := []
	for item in equipment:
		if not Loot.is_protected_from_bulk(item, equipped_keys):
			convertible.append(item)

	var present_rarities := []
	for rarity in RARITIES:
		for item in convertible:
			if String(item.get("rarity", "common")) == rarity:
				present_rarities.append(rarity)
				break

	var filter: String = ctx.get("loot_filter", "all")
	if filter != "all" and not present_rarities.has(filter):
		filter = "all"
	var filtered := []
	for item in convertible:
		if filter == "all" or String(item.get("rarity", "common")) == filter:
			filtered.append(item)

	var sell_total := 0
	var dismantle_total := 0
	var convert_count := 0
	for item in filtered:
		sell_total += Loot.sell_value_of(item) * int(item.get("quantity", 1))
		dismantle_total += Loot.dismantle_yield(item)
		convert_count += int(item.get("quantity", 1))

	var bulk := UI.col(6)
	bulk.add_child(UI.label(I18n.t("loot.bulkHeading"), 20, UI.GOLD))
	var pending: String = ctx.get("loot_pending_bulk", "")

	# The rarity filter only appears when there is a real choice to make.
	if pending == "" and present_rarities.size() > 1:
		var frow := UI.row()
		frow.add_child(UI.label("%s:" % I18n.t("loot.filterHeading"), 14, UI.DIM))
		var all_b := UI.button(I18n.t("loot.filterAll"), func(): ctx["set_loot_filter"].call("all"), Vector2(90, 32), 13)
		if filter == "all":
			all_b.add_theme_color_override("font_color", UI.GOLD)
		frow.add_child(all_b)
		for rarity in present_rarities:
			var r := String(rarity)
			var rb := UI.button(I18n.t("loot.rarity.%s" % r), func(): ctx["set_loot_filter"].call(r), Vector2(90, 32), 13)
			if filter == r:
				rb.add_theme_color_override("font_color", UI.GOLD)
			frow.add_child(rb)
		bulk.add_child(frow)

	var focus_target: Button = null
	if convert_count == 0:
		bulk.add_child(UI.label(I18n.t("loot.nothingToConvert"), 15, UI.DIM))
	elif pending != "":
		# CONFIRM STAGE — nothing is destroyed until this is answered.
		var question := I18n.t("loot.confirmSell", {"count": convert_count, "gold": sell_total}) if pending == "sell" else I18n.t("loot.confirmDismantle", {"count": convert_count, "materials": dismantle_total})
		bulk.add_child(UI.label(question, 18, UI.INK))
		var acts := UI.row()
		var rarities_arg: Variant = null if filter == "all" else [filter]
		var yes := UI.button(I18n.t("loot.confirm"), func():
			ctx["set_loot_pending"].call("")
			ctx["dispatch"].call({"type": "bulk_convert", "mode": pending, "rarities": rarities_arg}), Vector2(150, 44), 17)
		acts.add_child(yes)
		acts.add_child(UI.button(I18n.t("loot.cancel"), func(): ctx["set_loot_pending"].call(""), Vector2(150, 44), 17))
		bulk.add_child(acts)
		focus_target = yes
	else:
		bulk.add_child(UI.label(I18n.t("loot.convertible", {"count": convert_count, "gold": sell_total, "materials": dismantle_total}), 16, UI.INK))
		var acts2 := UI.row()
		var sell_b := UI.button(I18n.t("loot.sellAll"), func(): ctx["set_loot_pending"].call("sell"), Vector2(200, 44), 16)
		acts2.add_child(sell_b)
		acts2.add_child(UI.button(I18n.t("loot.dismantleAll"), func(): ctx["set_loot_pending"].call("dismantle"), Vector2(200, 44), 16))
		bulk.add_child(acts2)
		focus_target = sell_b
	root.add_child(UI.card(bulk))

	# --- the carried equipment, with rarity, protection, per-instance actions and fit ---
	var list := UI.col(6)
	if equipment.is_empty():
		list.add_child(UI.label(I18n.t("loot.empty"), 15, UI.DIM))
	for item in equipment:
		list.add_child(_loot_row(ctx, world, state, item, equipped_keys, fit_member, party_gold))
	root.add_child(UI.scroller(list, Vector2(1080, 300)))

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

static func _affix_label(world: Dictionary, affix_id: Variant) -> String:
	if typeof(affix_id) != TYPE_STRING or affix_id == "":
		return ""
	for affix in world.get("affixes", []):
		if affix.get("id", "") == affix_id:
			var ja: Dictionary = (affix.get("locales", {}) as Dictionary).get("ja", {})
			return String(ja.get("label", affix.get("label", affix_id)))
	return String(affix_id)

static func _loot_row(ctx: Dictionary, world: Dictionary, state: Dictionary, item: Dictionary, equipped_keys: Dictionary, fit_member: Dictionary, party_gold: int) -> Control:
	var unidentified := Loot.is_unidentified_rare(item)
	var key := Economy.equipment_instance_key(item.get("id", ""), item.get("plus", null), item.get("affix", null))
	var equipped := equipped_keys.has(key)
	var rare_instance: bool = typeof(item.get("instanceId", null)) == TYPE_STRING
	var rarity := String(item.get("rarity", "common"))

	var body := UI.col(4)
	var head := UI.row()
	head.add_child(UI.label(I18n.t("loot.rarity.%s" % rarity), 14, UI.GOLD if rarity != "common" else UI.DIM))
	var name := ""
	if not unidentified and typeof(item.get("affix", null)) == TYPE_STRING:
		name += "%s " % _affix_label(world, item.get("affix"))
	name += Fmt.localized_catalog_name(world, item.get("id", ""))
	if item.get("plus", null) != null and int(item.get("plus", 0)) != 0:
		name += " +%d" % int(item.get("plus", 0))
	head.add_child(UI.grow(UI.label(name, 17, UI.INK)))
	if unidentified:
		head.add_child(UI.label(I18n.t("loot.unidentified"), 13, UI.BAD))
	if equipped:
		head.add_child(UI.label(I18n.t("loot.equipped"), 13, UI.OK))
	if bool(item.get("locked", false)):
		head.add_child(UI.label(I18n.t("loot.locked"), 13, UI.DIM))
	if bool(item.get("favorite", false)):
		head.add_child(UI.label(I18n.t("loot.favorited"), 13, UI.DIM))
	body.add_child(head)

	if rare_instance:
		var iid := String(item.get("instanceId"))
		var acts := UI.row()
		if unidentified:
			var fee := Loot.appraisal_fee(item)
			var can_afford := party_gold >= fee
			var ap := UI.button(I18n.t("loot.appraiseCost", {"cost": fee}) if can_afford else I18n.t("loot.appraiseCantAfford", {"cost": fee}), func(): ctx["dispatch"].call({"type": "appraise_item", "instanceId": iid}), Vector2(170, 36), 14)
			ap.disabled = not can_afford
			acts.add_child(ap)
		acts.add_child(UI.button(I18n.t("loot.unlock") if bool(item.get("locked", false)) else I18n.t("loot.lock"), func(): ctx["dispatch"].call({"type": "toggle_item_lock", "instanceId": iid}), Vector2(110, 36), 14))
		acts.add_child(UI.button(I18n.t("loot.unfavorite") if bool(item.get("favorite", false)) else I18n.t("loot.favorite"), func(): ctx["dispatch"].call({"type": "toggle_item_favorite", "instanceId": iid}), Vector2(130, 36), 14))
		body.add_child(acts)

	# Appraised (or plain) piece → how it fits the chosen adventurer, and the chance to wear it.
	if not fit_member.is_empty() and not unidentified and not equipped:
		var definition: Variant = Fmt.find_equipment(world, item.get("id", ""))
		if typeof(definition) == TYPE_DICTIONARY:
			var slot := String(definition.get("slot", ""))
			var before: Dictionary = CharacterStats.effective(fit_member, world)
			var hypothetical: Dictionary = fit_member.duplicate(true)
			var slots: Dictionary = (hypothetical.get("equipment", {}) as Dictionary).duplicate(true)
			var hypothetical_piece := {"id": item.get("id", "")}
			if item.get("plus", null) != null:
				hypothetical_piece["plus"] = item.get("plus")
			if item.get("affix", null) != null:
				hypothetical_piece["affix"] = item.get("affix")
			slots[slot] = hypothetical_piece
			hypothetical["equipment"] = slots
			var after: Dictionary = CharacterStats.effective(hypothetical, world)

			var compare := UI.col(3)
			compare.add_child(UI.label("%s: %s" % [I18n.t("loot.compareFor"), String(fit_member.get("name", ""))], 14, UI.DIM))
			var deltas := UI.row()
			var any := false
			for stat in COMPARE_STATS:
				var delta := int(after.get(stat, 0)) - int(before.get(stat, 0))
				if delta == 0:
					continue
				any = true
				deltas.add_child(UI.label("%s %s%d" % [I18n.t("career.stat.%s" % stat), "+" if delta > 0 else "", delta], 14, UI.OK if delta > 0 else UI.BAD))
			if any:
				compare.add_child(deltas)
			else:
				compare.add_child(UI.label(I18n.t("loot.statUnchanged"), 14, UI.DIM))
			var current: Variant = (fit_member.get("equipment", {}) as Dictionary).get(slot, null)
			compare.add_child(UI.label(I18n.t("loot.equipReplaces", {"name": Fmt.equipped_name(world, current)}) if typeof(current) == TYPE_DICTIONARY else I18n.t("loot.compareSlotEmpty"), 14, UI.DIM))
			var equip_row := UI.row()
			equip_row.add_child(UI.button(I18n.t("loot.equipOn", {"member": String(fit_member.get("name", ""))}), func(): ctx["dispatch"].call({"type": "equip_item", "characterId": fit_member.get("id", ""), "equipmentId": item.get("id", ""), "plus": item.get("plus", null), "affix": item.get("affix", null)}), Vector2(200, 36), 14))
			compare.add_child(equip_row)
			body.add_child(compare)

	return UI.card(body, UI.GOLD if rarity != "common" else Color("3a4326"))

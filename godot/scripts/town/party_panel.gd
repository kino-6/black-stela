extends RefCounted
## Port of src/components/PartyMenuPanel.tsx (roster/party menu) — the six-person formation screen.
##
## The four tabs of the React panel: 能力 (condition, combat stats, resistances, aptitudes, level/xp),
## 装備 (the six slots), 所持品 (usable items + spare gear) and 貴重品 (keys, treasure, escape charms).
## An item's detail says what it DOES before any action is offered, discarding is a two-press CONFIRM,
## and a valuable that may not be discarded says so rather than showing a dead button.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const Leveling := preload("res://scripts/rules/leveling.gd")

const APTITUDES := ["might", "agility", "spirit", "wit", "luck"]

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var party: Array = state.get("party", [])
	var reserve: Array = state.get("reserve", [])

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("partyMenu.title"), I18n.t("town.gold", {"gold": int(state.get("partyGold", 0))})))
	root.add_child(UI.prose(I18n.t("partyMenu.subtitleTown"), 16, UI.DIM, 900))
	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	var member: Dictionary = ctx["selected_member"].call()
	if member.is_empty():
		root.add_child(UI.label(I18n.t("town.noParty"), 18, UI.DIM))
		var empty_back := UI.button(I18n.t("partyMenu.close"), ctx["close"], Vector2(180, 44), 18)
		root.add_child(empty_back)
		ctx["focus_hint"].call(empty_back)
		return root

	# --- tabs ---
	var page: String = ctx.get("party_page", "status")
	var tabs := UI.row()
	for entry in [["status", "partyMenu.tabs.status"], ["equipment", "partyMenu.tabs.equipment"], ["items", "partyMenu.tabs.items"], ["valuables", "partyMenu.tabs.valuables"]]:
		var key := String(entry[0])
		var tb := UI.button(I18n.t(String(entry[1])), func(): ctx["set_party_page"].call(key), Vector2(130, 36), 15)
		if key == page:
			tb.add_theme_color_override("font_color", UI.GOLD)
		tabs.add_child(tb)
	root.add_child(tabs)

	if page == "items" or page == "valuables":
		var built: Dictionary = _item_page(ctx, world, member, page)
		root.add_child(built["control"])
		var item_foot := UI.row()
		var item_back := UI.button(I18n.t("partyMenu.close"), ctx["close"], Vector2(180, 44), 18)
		item_foot.add_child(item_back)
		root.add_child(item_foot)
		# The cursor belongs on the CARRIED LIST — the thing the player opened this tab to act on — not
		# on the tab strip it just came through. Gold must mean focus and nothing else, so the active tab
		# is marked by its own state, never by borrowing the focus ring.
		ctx["focus_hint"].call(built["focus"] if built["focus"] != null else item_back)
		return root

	var body := UI.row()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(body)

	# LEFT: the formation — who is in front, who is behind, who is benched.
	var roster := UI.col(6)
	roster.custom_minimum_size = Vector2(430, 0)
	roster.add_child(UI.label(I18n.t("partyMenu.members"), 19, UI.GOLD))
	for candidate in party:
		roster.add_child(_roster_row(ctx, candidate, member, true))
	if not reserve.is_empty():
		roster.add_child(UI.label(I18n.t("town.reserve") if I18n.has("town.reserve") else I18n.t("partyMenu.members"), 16, UI.DIM))
		for candidate in reserve:
			roster.add_child(_roster_row(ctx, candidate, member, false))
	body.add_child(UI.card(roster))

	# RIGHT: the selected adventurer in full — condition, combat stats, resistances, aptitudes, gear.
	var detail := UI.col(6)
	detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var stats: Dictionary = CharacterStats.effective(member, world)

	var head := UI.row()
	head.add_child(UI.grow(UI.label(String(member.get("name", "?")), 24, UI.GOLD)))
	head.add_child(UI.label("%s %d" % [I18n.t("partyMenu.level"), int(member.get("level", 1))], 17, UI.INK))
	detail.add_child(head)

	var vitals := UI.row()
	vitals.add_child(UI.label("HP %d/%d" % [int(member.get("hp", 0)), int(member.get("maxHp", 0))], 18, UI.BAD if int(member.get("hp", 0)) < int(member.get("maxHp", 0)) else UI.INK))
	vitals.add_child(UI.label("MP %d/%d" % [int(member.get("mp", 0)), int(member.get("maxMp", 0))], 18, UI.INK))
	vitals.add_child(UI.label("%s: %s" % [I18n.t("partyMenu.condition"), _condition(member)], 16, UI.BAD if member.get("injury", null) != null else UI.OK))
	detail.add_child(vitals)

	# XP to the next level — the reason to keep descending.
	var next_level := int(member.get("level", 1)) + 1
	var to_next := maxi(0, Leveling.xp_for_level(next_level) - int(member.get("xp", 0)))
	detail.add_child(UI.label("%s: %d" % [I18n.t("partyMenu.xpToNext"), to_next], 15, UI.DIM))

	detail.add_child(UI.label(I18n.t("partyMenu.combatStats"), 18, UI.GOLD))
	var combat := UI.col(2)
	_stat_row(combat, I18n.t("partyMenu.attack"), str(int(stats.get("attack", 0))))
	_stat_row(combat, I18n.t("party.damage"), "%d-%d" % [int(stats.get("damageMin", 0)), int(stats.get("damageMax", 0))])
	_stat_row(combat, I18n.t("party.accuracy"), str(int(stats.get("accuracy", 0))))
	_stat_row(combat, I18n.t("party.armor"), str(int(stats.get("armor", 0))))
	_stat_row(combat, I18n.t("party.speed"), str(int(stats.get("speed", 0))))
	detail.add_child(combat)

	# Resistances — what this adventurer can stand in the dark.
	var resist: Dictionary = stats.get("resistance", {})
	if not resist.is_empty():
		var rrow := UI.row()
		rrow.add_child(UI.label(I18n.t("partyMenu.resistances"), 15, UI.DIM))
		for key in resist:
			rrow.add_child(UI.label("%s %d" % [I18n.t("partyMenu.status.%s" % String(key)) if I18n.has("partyMenu.status.%s" % String(key)) else String(key), int(resist[key])], 14, UI.INK))
		detail.add_child(rrow)

	# Aptitudes, with what each one actually governs.
	detail.add_child(UI.label(I18n.t("party.aptitude"), 18, UI.GOLD))
	var apt: Dictionary = member.get("aptitude", {})
	for key in APTITUDES:
		var line := UI.row()
		var k := String(key)
		line.add_child(UI.label(I18n.t("aptitude.%s" % k) if I18n.has("aptitude.%s" % k) else k, 15, UI.DIM))
		line.add_child(UI.label(str(int(apt.get(k, 0))), 15, UI.INK))
		line.add_child(UI.grow(UI.label(I18n.t("partyMenu.aptitudeEffect.%s" % k), 13, UI.DIM)))
		detail.add_child(line)

	# Equipment — the six slots and what fills them.
	detail.add_child(UI.label(I18n.t("partyMenu.equipped"), 18, UI.GOLD))
	detail.add_child(UI.label(I18n.t("partyMenu.equipmentTown"), 14, UI.DIM))
	for slot in Fmt.EQUIPMENT_SLOT_ORDER:
		var line2 := UI.row()
		line2.add_child(UI.label(Fmt.format_equipment_slot(String(slot)), 15, UI.DIM))
		line2.add_child(UI.grow(UI.label(Fmt.equipped_name(world, (member.get("equipment", {}) as Dictionary).get(slot, null)), 15, UI.INK)))
		detail.add_child(line2)

	body.add_child(UI.scroller(detail, Vector2(900, 620)))

	var back := UI.button(I18n.t("partyMenu.close"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(back)
	return root

static func _condition(member: Dictionary) -> String:
	if member.get("injury", null) != null:
		return I18n.t("partyMenu.wounded")
	var status: Array = member.get("status", [])
	if not status.is_empty():
		var parts := []
		for s in status:
			var key := "partyMenu.status.%s" % String(s)
			parts.append(I18n.t(key) if I18n.has(key) else String(s))
		return " / ".join(PackedStringArray(parts))
	return I18n.t("partyMenu.healthy")

static func _stat_row(host: VBoxContainer, term: String, value: String) -> void:
	var row := UI.row()
	var t := UI.label(term, 15, UI.DIM)
	t.custom_minimum_size = Vector2(120, 0)
	row.add_child(t)
	row.add_child(UI.grow(UI.label(value, 16, UI.INK)))
	host.add_child(row)

static func _roster_row(ctx: Dictionary, candidate: Dictionary, selected: Dictionary, active: bool) -> Control:
	var cid := String(candidate.get("id", ""))
	var is_selected := cid == String(selected.get("id", ""))
	var body := UI.col(3)
	var head := UI.row()
	var name_btn := UI.button(String(candidate.get("name", "?")), func(): ctx["set_selected"].call(cid), Vector2(150, 34), 15)
	if is_selected:
		name_btn.add_theme_color_override("font_color", UI.GOLD)
	head.add_child(name_btn)
	head.add_child(UI.label("Lv.%d" % int(candidate.get("level", 1)), 14, UI.DIM))
	head.add_child(UI.grow(UI.label("HP %d/%d" % [int(candidate.get("hp", 0)), int(candidate.get("maxHp", 0))], 14, UI.INK)))
	if active:
		head.add_child(UI.label(I18n.t("play.frontRow") if String(candidate.get("row", "front")) == "front" else I18n.t("play.backRow"), 14, UI.DIM))
	body.add_child(head)

	var acts := UI.row()
	if active:
		var to_row := "back" if String(candidate.get("row", "front")) == "front" else "front"
		acts.add_child(UI.button(I18n.t("play.backRow") if to_row == "back" else I18n.t("play.frontRow"), func(): ctx["dispatch"].call({"type": "set_member_row", "characterId": cid, "row": to_row}), Vector2(110, 32), 13))
		acts.add_child(UI.button(I18n.t("town.bench") if I18n.has("town.bench") else I18n.t("partyMenu.close"), func(): ctx["dispatch"].call({"type": "bench_member", "characterId": cid}), Vector2(110, 32), 13))
	else:
		acts.add_child(UI.button(I18n.t("town.recall") if I18n.has("town.recall") else I18n.t("partyMenu.members"), func(): ctx["dispatch"].call({"type": "recall_member", "characterId": cid}), Vector2(110, 32), 13))
	body.add_child(acts)
	return UI.card(body, UI.GOLD if is_selected else Color("3a4326"))


const VALUABLE_KINDS := ["key", "treasure", "escape"]
const USABLE_KINDS := ["healing", "cure", "focus", "growth"]

# 所持品 / 貴重品: the carried list on the left, and what the SELECTED item does on the right.
static func _item_page(ctx: Dictionary, world: Dictionary, member: Dictionary, page: String) -> Dictionary:
	var state: Dictionary = ctx["state"]
	var visible := []
	for item in state.get("inventory", []):
		var is_valuable := VALUABLE_KINDS.has(String(item.get("kind", "")))
		if (page == "valuables") == is_valuable:
			visible.append(item)

	var selected_key: String = ctx.get("party_item", "")
	var selected: Dictionary = {}
	for item in visible:
		if _item_key(item) == selected_key:
			selected = item
			break
	if selected.is_empty() and not visible.is_empty():
		selected = visible[0]

	var cols := UI.row()
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL

	var focus: Button = null
	var list := UI.col(4)
	list.custom_minimum_size = Vector2(420, 0)
	if visible.is_empty():
		list.add_child(UI.label(I18n.t("partyMenu.valuablesEmpty" if page == "valuables" else "partyMenu.inventoryEmpty"), 15, UI.DIM))
	for item in visible:
		var key := _item_key(item)
		var row := UI.row()
		var b := UI.button(Fmt.describe_equipment_instance(world, item.get("id", ""), item.get("plus", null), item.get("affix", null)) if item.get("kind", "") == "equipment" else Fmt.localized_catalog_name(world, item.get("id", "")), func(): ctx["set_party_item"].call(key), Vector2(300, 36), 15)
		if key == _item_key(selected):
			b.add_theme_color_override("font_color", UI.GOLD)
			focus = b
		if focus == null:
			focus = b
		row.add_child(UI.grow(b))
		row.add_child(UI.label("×%d" % int(item.get("quantity", 1)), 14, UI.DIM))
		list.add_child(row)
	cols.add_child(UI.scroller(list, Vector2(440, 520)))

	var detail := UI.col(6)
	detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if not selected.is_empty():
		var is_equipment := String(selected.get("kind", "")) == "equipment"
		detail.add_child(UI.label(Fmt.describe_equipment_instance(world, selected.get("id", ""), selected.get("plus", null), selected.get("affix", null)) if is_equipment else Fmt.localized_catalog_name(world, selected.get("id", "")), 22, UI.GOLD))
		var description := Fmt.localized_catalog_description(world, selected.get("id", ""))
		detail.add_child(UI.prose(description if description != "" else _describe_consumable(selected), 15, UI.DIM, 700))
		if is_equipment:
			detail.add_child(UI.label(Fmt.format_inventory_effect(selected), 15, UI.INK))
		detail.add_child(UI.gap(6))

		var actions := UI.row()
		if USABLE_KINDS.has(String(selected.get("kind", ""))):
			actions.add_child(UI.button(I18n.t("partyMenu.useOn", {"name": String(member.get("name", ""))}), func(): ctx["dispatch"].call({"type": "use_item", "itemId": selected.get("id", ""), "targetCharacterId": member.get("id", "")}), Vector2(220, 40), 16))
		if is_equipment:
			var equip: Variant = Fmt.find_equipment(world, selected.get("id", ""))
			var usable: bool = typeof(equip) == TYPE_DICTIONARY and Fmt.is_usable_by(equip, member)
			var eb := UI.button(I18n.t("partyMenu.equipOn", {"name": String(member.get("name", ""))}) if usable else I18n.t("partyMenu.cannotEquip"), func(): ctx["dispatch"].call({"type": "equip_item", "characterId": member.get("id", ""), "equipmentId": selected.get("id", ""), "plus": selected.get("plus", null), "affix": selected.get("affix", null)}), Vector2(220, 40), 16)
			eb.disabled = not usable
			actions.add_child(eb)
		# Discarding is a TWO-PRESS confirm — one press can never destroy a carried item.
		if not VALUABLE_KINDS.has(String(selected.get("kind", ""))):
			var pending: bool = bool(ctx.get("party_discard_pending", false))
			var db := UI.button(I18n.t("partyMenu.confirmDiscard") if pending else I18n.t("partyMenu.discard"), func():
				if not pending:
					ctx["set_party_discard"].call(true)
				else:
					ctx["set_party_discard"].call(false)
					ctx["dispatch"].call({"type": "discard_item", "itemId": selected.get("id", ""), "plus": selected.get("plus", null), "affix": selected.get("affix", null)}), Vector2(200, 40), 16)
			if pending:
				db.add_theme_color_override("font_color", UI.BAD)
			actions.add_child(db)
		else:
			detail.add_child(UI.label(I18n.t("partyMenu.protectedItem"), 15, UI.DIM))
		detail.add_child(actions)
	cols.add_child(detail)
	return {"control": cols, "focus": focus}

static func _item_key(item: Dictionary) -> String:
	if item.is_empty():
		return ""
	return "%s|%s|%s" % [String(item.get("id", "")), str(item.get("plus", "")), str(item.get("affix", ""))]

# What a consumable DOES, in the player's words, when the catalog has no description.
static func _describe_consumable(item: Dictionary) -> String:
	var parts := []
	if item.get("healAmount", null) != null:
		parts.append(I18n.t("partyMenu.restoreHp", {"amount": int(item["healAmount"])}))
	if item.get("restoreMp", null) != null:
		parts.append(I18n.t("partyMenu.restoreMp", {"amount": int(item["restoreMp"])}))
	var cures: Variant = item.get("curesStatuses", null)
	if typeof(cures) == TYPE_ARRAY and not (cures as Array).is_empty():
		var names := []
		for status in cures:
			names.append(I18n.t("partyMenu.status.%s" % String(status)))
		parts.append(I18n.t("partyMenu.cures", {"statuses": "・".join(PackedStringArray(names))}))
	return " / ".join(PackedStringArray(parts)) if not parts.is_empty() else I18n.t("partyMenu.noDescription")

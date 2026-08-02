extends RefCounted
## The Blacksmith (鍛冶屋, T9) — the GOLD sink twin of the Forge (錬成所). Mirror of BlacksmithPanel.tsx.
##
## Spend coin earned in the dungeon to temper what an adventurer already WEARS. Each row says WHICH STAT
## the step buys (blacksmith.boosts) and its gold cost, and shows the at-cap and cant-afford states rather
## than going dead — so the player can tell a maxed piece from an unaffordable one.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Loot := preload("res://scripts/rules/loot.gd")

const SLOT_ORDER := ["weapon", "offhand", "body", "head", "hands", "accessory"]

# The `plus` mechanic raises the slot's primary stat; name it so the player sees what tempering buys.
static func _primary_stat_key(slot: String) -> String:
	if slot == "weapon":
		return "attack"
	if slot == "accessory":
		return "accuracy"
	return "armor"

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var party: Array = state.get("party", [])
	var party_gold := int(state.get("partyGold", 0))

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("blacksmith.title"), I18n.t("blacksmith.gold", {"gold": party_gold})))
	root.add_child(UI.prose(I18n.t("blacksmith.intro"), 16, UI.DIM, 900))
	if party_gold <= 0:
		root.add_child(UI.prose(I18n.t("blacksmith.noGold"), 15, UI.GOLD, 900))
	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	var member: Dictionary = ctx["selected_member"].call()
	if member.is_empty():
		root.add_child(UI.label(I18n.t("town.noParty"), 18, UI.DIM))
		var empty_back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
		root.add_child(empty_back)
		ctx["focus_hint"].call(empty_back)
		return root

	var picker := UI.row()
	picker.add_child(UI.label("%s:" % I18n.t("blacksmith.member"), 15, UI.DIM))
	for candidate in party:
		var cid := String(candidate.get("id", ""))
		var b := UI.button(String(candidate.get("name", "?")), func(): ctx["select_party_member"].call(cid), Vector2(110, 34), 14)
		if cid == String(member.get("id", "")):
			b.add_theme_color_override("font_color", UI.GOLD)
		picker.add_child(b)
	root.add_child(picker)

	var equipment: Dictionary = member.get("equipment", {})
	var worn := []
	for slot in SLOT_ORDER:
		if typeof(equipment.get(slot, null)) == TYPE_DICTIONARY:
			worn.append(slot)

	var focus_target: Button = null
	if worn.is_empty():
		root.add_child(UI.label(I18n.t("blacksmith.nothingWorn"), 16, UI.DIM))
	else:
		var list := UI.col(6)
		for slot in worn:
			var s := String(slot)
			var equipped: Dictionary = equipment[s]
			var current_plus := int(equipped.get("plus", 0))
			var at_cap := current_plus >= Loot.MAX_REINFORCE
			var cost := Loot.forge_cost(current_plus)
			var can_afford := party_gold >= cost

			var body := UI.col(3)
			var head := UI.row()
			head.add_child(UI.label(I18n.t("career.slot.%s" % s), 14, UI.DIM))
			head.add_child(UI.grow(UI.label(Fmt.describe_equipment_instance(world, equipped.get("id", ""), equipped.get("plus", null), equipped.get("affix", null)), 17, UI.INK)))
			body.add_child(head)

			var acts := UI.row()
			acts.add_child(UI.grow(UI.label(I18n.t("blacksmith.boosts", {"stat": I18n.t("career.stat.%s" % _primary_stat_key(s))}), 15, UI.OK)))
			var text := I18n.t("blacksmith.atCap") if at_cap else (I18n.t("blacksmith.forge", {"cost": cost}) if can_afford else I18n.t("blacksmith.cantAfford", {"cost": cost}))
			var fb := UI.button(text, func(): ctx["dispatch"].call({"type": "forge_equipment", "characterId": member.get("id", ""), "slot": s}), Vector2(200, 38), 15)
			fb.disabled = at_cap or not can_afford
			if focus_target == null and not fb.disabled:
				focus_target = fb
			acts.add_child(fb)
			body.add_child(acts)
			list.add_child(UI.card(body))
		root.add_child(UI.scroller(list, Vector2(1000, 380)))

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

extends RefCounted
## Faithful port of src/components/WorkshopPanel.tsx — the Forge (錬成所), the materials SINK.
##
## Spend the take from dismantled loot to temper what an adventurer already WEARS. Each row must say
## WHICH STAT the step buys (workshop.boosts) and what it costs, and must show the at-cap and
## cant-afford states rather than just going dead — otherwise the player cannot tell a maxed piece
## from an unaffordable one.

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
	var materials := int(state.get("materials", 0))

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("workshop.title"), I18n.t("workshop.materials", {"materials": materials})))
	root.add_child(UI.prose(I18n.t("workshop.intro"), 16, UI.DIM, 900))
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
	picker.add_child(UI.label("%s:" % I18n.t("workshop.member"), 15, UI.DIM))
	for candidate in party:
		var cid := String(candidate.get("id", ""))
		var b := UI.button(String(candidate.get("name", "?")), func(): ctx["set_selected"].call(cid), Vector2(110, 34), 14)
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
		root.add_child(UI.label(I18n.t("workshop.nothingWorn"), 16, UI.DIM))
	else:
		var list := UI.col(6)
		for slot in worn:
			var s := String(slot)
			var equipped: Dictionary = equipment[s]
			var current_plus := int(equipped.get("plus", 0))
			var at_cap := current_plus >= Loot.MAX_REINFORCE
			var cost := Loot.reinforce_cost(current_plus)
			var can_afford := materials >= cost

			var body := UI.col(3)
			var head := UI.row()
			head.add_child(UI.label(I18n.t("career.slot.%s" % s), 14, UI.DIM))
			head.add_child(UI.grow(UI.label(Fmt.describe_equipment_instance(world, equipped.get("id", ""), equipped.get("plus", null), equipped.get("affix", null)), 17, UI.INK)))
			if current_plus > 0:
				head.add_child(UI.label(I18n.t("workshop.current", {"plus": current_plus}), 14, UI.GOLD))
			body.add_child(head)

			var acts := UI.row()
			acts.add_child(UI.grow(UI.label(I18n.t("workshop.boosts", {"stat": I18n.t("career.stat.%s" % _primary_stat_key(s))}), 15, UI.OK)))
			var text := I18n.t("workshop.atCap") if at_cap else (I18n.t("workshop.reinforce", {"cost": cost}) if can_afford else I18n.t("workshop.cantAfford", {"cost": cost}))
			var rb := UI.button(text, func(): ctx["dispatch"].call({"type": "reinforce_equipment", "characterId": member.get("id", ""), "slot": s}), Vector2(180, 38), 15)
			rb.disabled = at_cap or not can_afford
			if focus_target == null and not rb.disabled:
				focus_target = rb
			acts.add_child(rb)
			body.add_child(acts)
			list.add_child(UI.card(body))
		root.add_child(UI.scroller(list, Vector2(1000, 380)))

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

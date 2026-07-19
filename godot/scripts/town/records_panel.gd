extends RefCounted
## Faithful port of src/components/RecordsPanel.tsx + the bestiary projection (src/domain/bestiary.ts).
##
## The bestiary is the PREPARATION surface: which enemies the party has met, how dangerous they are,
## and — once actually defeated — their weaknesses and drop sources. Coarse only (no exact HP), and an
## unmet enemy is not listed at all. A flat name list would not tell a player what to pack.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("town.recordsHeading"), I18n.t("town.gold", {"gold": int(state.get("partyGold", 0))})))

	# --- bestiary ---
	root.add_child(UI.label(I18n.t("bestiary.heading"), 20, UI.GOLD))
	var entries := _bestiary_entries(world, state.get("enemyRecord", {}))
	var list := UI.col(6)
	if entries.is_empty():
		list.add_child(UI.label(I18n.t("bestiary.empty"), 15, UI.DIM))
	for entry in entries:
		list.add_child(_bestiary_row(entry))
	root.add_child(UI.scroller(list, Vector2(1080, 300)))

	# --- recent log ---
	root.add_child(UI.label(I18n.t("bestiary.logHeading"), 20, UI.GOLD))
	var log: Array = state.get("log", [])
	root.add_child(UI.label(I18n.t("town.logCount", {"count": log.size()}), 15, UI.DIM))
	var log_list := UI.col(3)
	var shown := 0
	for i in range(log.size() - 1, -1, -1):
		if shown >= 8:
			break
		var line: Dictionary = log[i]
		var row := UI.row()
		row.add_child(UI.label(I18n.t("log.turn", {"turn": int(line.get("turn", 0))}), 13, UI.DIM))
		row.add_child(UI.grow(UI.label(String(line.get("text", "")), 15, UI.INK)))
		log_list.add_child(row)
		shown += 1
	root.add_child(UI.scroller(log_list, Vector2(1080, 160)))

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(back)
	return root

static func _element_label(world: Dictionary, element_id: String) -> String:
	for element in world.get("elements", []):
		if element.get("id", "") == element_id:
			var ja: Dictionary = (element.get("locales", {}) as Dictionary).get("ja", {})
			return String(ja.get("label", element.get("label", element_id)))
	return element_id

static func _bestiary_entries(world: Dictionary, record: Dictionary) -> Array:
	var out := []
	for enemy in world.get("enemies", []):
		var eid := String(enemy.get("id", ""))
		var entry: Dictionary = record.get(eid, {})
		var encountered := int(entry.get("encountered", 0))
		var defeated := int(entry.get("defeated", 0))
		if encountered <= 0 and defeated <= 0:
			continue
		var known := defeated > 0
		var weaknesses := []
		var drops := []
		if known:
			for element in (enemy.get("weaknesses", {}) as Dictionary):
				if float((enemy["weaknesses"] as Dictionary)[element]) > 1.0:
					weaknesses.append(_element_label(world, String(element)))
			for item_id in enemy.get("drops", []):
				drops.append(Fmt.localized_catalog_name(world, item_id))
		out.append({
			"name": Fmt.localized_enemy_name(world, enemy),
			"encountered": encountered,
			"defeated": defeated,
			"threat": int(enemy.get("dangerTier", 1)),
			"known": known,
			"weaknesses": weaknesses,
			"drops": drops
		})
	out.sort_custom(func(a, b):
		if int(a["defeated"]) != int(b["defeated"]):
			return int(a["defeated"]) > int(b["defeated"])
		return int(a["encountered"]) > int(b["encountered"]))
	return out

static func _bestiary_row(entry: Dictionary) -> Control:
	var body := UI.col(3)
	var head := UI.row()
	head.add_child(UI.grow(UI.label(String(entry["name"]), 17, UI.INK)))
	head.add_child(UI.label("★".repeat(mini(5, int(entry["threat"]))), 15, UI.GOLD))
	head.add_child(UI.label(I18n.t("bestiary.threat", {"threat": int(entry["threat"])}), 13, UI.DIM))
	head.add_child(UI.label(I18n.t("bestiary.defeated", {"count": int(entry["defeated"])}), 14, UI.DIM))
	body.add_child(head)

	if bool(entry["known"]):
		var meta := UI.row()
		var weaknesses: Array = entry["weaknesses"]
		var drops: Array = entry["drops"]
		meta.add_child(UI.label("%s: %s" % [I18n.t("bestiary.weaknesses"), " / ".join(PackedStringArray(weaknesses)) if not weaknesses.is_empty() else I18n.t("bestiary.none")], 14, UI.OK))
		meta.add_child(UI.label("%s: %s" % [I18n.t("bestiary.drops"), " / ".join(PackedStringArray(drops)) if not drops.is_empty() else I18n.t("bestiary.none")], 14, UI.INK))
		body.add_child(meta)
	else:
		body.add_child(UI.label(I18n.t("bestiary.unknown"), 14, UI.DIM))
	return UI.card(body)

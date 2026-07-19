extends RefCounted
## Port of src/components/PartyMenuPanel.tsx (roster/party menu) — the six-person formation screen.
##
## The React panel is tabbed (能力 / 装備 / 所持品 / 貴重品). This port covers the two tabs whose
## commands are ported: 能力 (condition, combat stats, resistances, aptitudes, level/xp) and 装備
## (the six slots), plus the front/back row swap and bench/recall. The 所持品 / 貴重品 tabs depend on
## `use_item`, which is not ported yet — the tab is shown as unavailable rather than faked, so the
## screen never implies a capability the rules do not have.

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

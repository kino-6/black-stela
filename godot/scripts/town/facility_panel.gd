extends RefCounted
## Base facilities (#33) — the salvage-`materials` sink. Each row shows a facility, its current level,
## the active effect, and the NEXT level's effect + material cost with an upgrade button (absent when
## maxed, locked behind a descent flag, or unaffordable). Mirrors quest_panel.gd's shape.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Facilities := preload("res://scripts/rules/facilities.gd")

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("facility.title"), I18n.t("facility.materials", {"materials": int(state.get("materials", 0))})))
	root.add_child(UI.prose(I18n.t("facility.intro"), 16, UI.DIM, 900))
	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	var facilities: Array = world.get("facilities", [])
	var focus_target: Button = null
	# The upgrade buttons must be chained EXPLICITLY: with several tall facility cards the scroller pushes
	# a lower button (e.g. 兵装工廠 強化する（60）) below the 戻る button's screen position, so the D-pad's
	# geometry resolution jumps 強化（8）→戻る and never reaches the deeper button (focus-trap gate: "強化
	# する（60）unreachable"). An explicit column makes every upgrade a deterministic ↑↓ stop.
	var actions: Array = []
	if facilities.is_empty():
		root.add_child(UI.label(I18n.t("facility.empty"), 16, UI.DIM))
	else:
		var list := UI.col(8)
		for facility in facilities:
			var result := _facility_row(ctx, state, facility)
			list.add_child(result["control"])
			if result["action"] != null:
				actions.append(result["action"])
				if focus_target == null:
					focus_target = result["action"]
		root.add_child(UI.scroller(list, Vector2(1080, 460)))

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	# Chain the upgrade buttons top-to-bottom and hand off to 戻る; 戻る climbs back to the last upgrade.
	UI.chain_column(actions, null, back)
	if not actions.is_empty():
		back.focus_neighbor_top = back.get_path_to(actions.back())
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

static func _level_effect_text(level_def: Dictionary) -> String:
	var ja: Dictionary = (level_def.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("effect", ""))

static func _facility_row(ctx: Dictionary, state: Dictionary, facility: Dictionary) -> Dictionary:
	var fid := String(facility.get("id", ""))
	var levels: Array = facility.get("levels", [])
	var current := Facilities.facility_level(state, fid)
	var maxed := current >= levels.size()

	var body := UI.col(4)
	var head := UI.row()
	head.add_child(UI.grow(UI.label(Fmt.localized_facility_name(facility), 18, UI.INK)))
	head.add_child(UI.label(I18n.t("facility.level", {"level": current, "max": levels.size()}), 15, UI.GOLD))
	body.add_child(head)

	var desc := Fmt.localized_facility_description(facility)
	if desc != "":
		body.add_child(UI.prose(desc, 14, UI.DIM, 900))

	if current > 0:
		var cur_text := _level_effect_text(levels[current - 1])
		if cur_text != "":
			body.add_child(UI.label(I18n.t("facility.current", {"effect": cur_text}), 14, UI.OK))

	var action: Button = null
	if maxed:
		body.add_child(UI.label(I18n.t("facility.maxed"), 14, UI.DIM))
	else:
		var next_def: Dictionary = levels[current]
		var cost := int(next_def.get("cost", 0))
		var next_text := _level_effect_text(next_def)
		if next_text != "":
			body.add_child(UI.label(I18n.t("facility.next", {"effect": next_text, "cost": cost}), 15, UI.INK))
		var unlock_flag := String(next_def.get("unlockFlag", ""))
		var locked := unlock_flag != "" and not (state.get("discoveredSecrets", []) as Array).has(unlock_flag)
		if locked:
			body.add_child(UI.label(I18n.t("facility.locked"), 13, UI.DIM))
		elif int(state.get("materials", 0)) >= cost:
			action = UI.button(I18n.t("facility.upgrade", {"cost": cost}), func(): ctx["dispatch"].call({"type": "upgrade_facility", "facilityId": fid}), Vector2(240, 40), 16)
			body.add_child(action)
		else:
			body.add_child(UI.label(I18n.t("facility.tooPoor", {"cost": cost}), 13, UI.DIM))

	return {"control": UI.card(body), "action": action}

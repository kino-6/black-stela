extends RefCounted
## Faithful port of src/components/CareerPanel.tsx — the vocation hall (生業).
##
## THIS PANEL IS THE REMEDIATION. It was rebuilt in React precisely because the first version was
## "too thin to decide in": a two-pane screen with the chosen adventurer PINNED on the left (current
## vocation, mastery rank, learned techniques and the bounded combat loadout) and, on the right, the
## destinations grouped 上級の道 / 基礎の道 where EVERY destination renders its signature, stat shifts,
## equippable slots, granted techniques and its unlock requirements. Porting this as a list of
## "就任" buttons would throw that work away a second time.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Vocations := preload("res://scripts/rules/vocations.gd")
const Techniques := preload("res://scripts/rules/techniques.gd")

const STAT_ORDER := ["maxHp", "maxMp", "attack", "damageMin", "damageMax", "accuracy", "armor", "speed"]

# The technique name comes from the one shared reader (rules/techniques.gd), not a fourth copy of the
# label map — the drift §9.5 spent five deletions cleaning up.
static func _technique_name(id: String, engine: Dictionary = {}) -> String:
	return Techniques.label(id, engine)

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var engine: Dictionary = ctx["engine"]
	var party: Array = state.get("party", [])

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("career.title"), I18n.t("town.gold", {"gold": int(state.get("partyGold", 0))})))
	root.add_child(UI.prose(I18n.t("career.intro"), 16, UI.DIM, 900))
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
	picker.add_child(UI.label("%s:" % I18n.t("career.member"), 15, UI.DIM))
	for candidate in party:
		var cid := String(candidate.get("id", ""))
		var b := UI.button(String(candidate.get("name", "?")), func(): ctx["set_selected"].call(cid), Vector2(110, 34), 14)
		if cid == String(member.get("id", "")):
			b.add_theme_color_override("font_color", UI.GOLD)
		picker.add_child(b)
	root.add_child(picker)

	var voc_state: Dictionary = Vocations.resolve_vocation_state(member, engine)
	var catalog: Array = Vocations.resolve_vocation_catalog(world, engine)
	var mastered_rank := int(engine.get("masteredRank", 5))
	var loadout_limit := int(engine.get("loadoutLimit", 6))

	# --- two panes ---
	var body := UI.row()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(body)

	# LEFT: who this adventurer is now (pinned)
	var overview := UI.col(6)
	overview.custom_minimum_size = Vector2(380, 0)
	overview.add_child(UI.label(I18n.t("career.overview"), 19, UI.GOLD))
	var cur_id := String(voc_state.get("current", ""))
	var cur_row := UI.row()
	cur_row.add_child(UI.label(I18n.t("career.current"), 15, UI.DIM))
	cur_row.add_child(UI.label(Vocations.localized_vocation_name(world, engine, cur_id, "ja"), 17, UI.INK))
	overview.add_child(cur_row)
	var mas_row := UI.row()
	mas_row.add_child(UI.label(I18n.t("career.mastery"), 15, UI.DIM))
	var cur_rank := Vocations.mastery_rank(voc_state, cur_id)
	mas_row.add_child(UI.label(I18n.t("career.mastered") if cur_rank >= mastered_rank else I18n.t("career.masteryRank", {"rank": cur_rank, "max": mastered_rank}), 17, UI.INK))
	overview.add_child(mas_row)

	# learned techniques + the bounded combat loadout
	var learned: Array = voc_state.get("learned", [])
	var loadout: Array = voc_state.get("loadout", [])
	overview.add_child(UI.label(I18n.t("career.loadout", {"count": loadout.size(), "max": loadout_limit}), 17, UI.GOLD))
	if learned.is_empty():
		overview.add_child(UI.label(I18n.t("career.noTechniques"), 14, UI.DIM))
	else:
		for technique in learned:
			var tid := String(technique)
			var in_loadout := loadout.has(tid)
			var full := loadout.size() >= loadout_limit
			var line := UI.row()
			line.add_child(UI.grow(UI.label(_technique_name(tid, ctx.get("engine", {})), 15, UI.INK if in_loadout else UI.DIM)))
			var next_loadout := []
			if in_loadout:
				for t2 in loadout:
					if String(t2) != tid:
						next_loadout.append(t2)
			else:
				next_loadout = loadout.duplicate()
				next_loadout.append(tid)
			var lb := UI.button(I18n.t("career.removeFromLoadout") if in_loadout else (I18n.t("career.loadoutFull") if full else I18n.t("career.addToLoadout")), func(): ctx["dispatch"].call({"type": "set_loadout", "characterId": member.get("id", ""), "loadout": next_loadout}), Vector2(140, 34), 14)
			lb.disabled = (not in_loadout) and full
			line.add_child(lb)
			overview.add_child(line)
	body.add_child(UI.card(overview))

	# RIGHT: where they can go — grouped by tier, each judgeable at a glance
	var dest := UI.col(6)
	dest.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	dest.add_child(UI.label(I18n.t("career.destinations"), 19, UI.GOLD))
	var advanced := []
	var basic := []
	for vocation in catalog:
		if String(vocation.get("tier", "")) == "advanced":
			advanced.append(vocation)
		else:
			basic.append(vocation)

	var focus_target: Button = null
	var list := UI.col(8)
	if not advanced.is_empty():
		list.add_child(UI.label(I18n.t("career.advancedGroup"), 16, UI.DIM))
		for vocation in advanced:
			var r := _vocation_card(ctx, world, engine, member, voc_state, vocation, mastered_rank)
			list.add_child(r["control"])
			if focus_target == null and r["action"] != null:
				focus_target = r["action"]
	list.add_child(UI.label(I18n.t("career.basicGroup"), 16, UI.DIM))
	for vocation in basic:
		var r2 := _vocation_card(ctx, world, engine, member, voc_state, vocation, mastered_rank)
		list.add_child(r2["control"])
		if focus_target == null and r2["action"] != null:
			focus_target = r2["action"]
	dest.add_child(UI.scroller(list, Vector2(700, 440)))
	body.add_child(dest)

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

static func _requirement_text(world: Dictionary, engine: Dictionary, requires: Dictionary) -> String:
	var parts := []
	for req in requires.get("mastered", []):
		parts.append(I18n.t("career.reqMastered", {"vocation": Vocations.localized_vocation_name(world, engine, String(req), "ja")}))
	if int(requires.get("minLevel", 0)) > 0:
		parts.append(I18n.t("career.reqLevel", {"level": int(requires.get("minLevel", 0))}))
	return " · ".join(PackedStringArray(parts))

static func _vocation_card(ctx: Dictionary, world: Dictionary, engine: Dictionary, member: Dictionary, voc_state: Dictionary, vocation: Dictionary, mastered_rank: int) -> Dictionary:
	var vid := String(vocation.get("id", ""))
	var is_current := vid == String(voc_state.get("current", ""))
	var available: bool = (not is_current) and Vocations.can_adopt_vocation(member, vid, world, engine)
	var rank := Vocations.mastery_rank(voc_state, vid)
	var tier := String(vocation.get("tier", "basic"))

	var body := UI.col(4)
	var head := UI.row()
	head.add_child(UI.label(I18n.t("career.advanced") if tier == "advanced" else I18n.t("career.basic"), 13, UI.DIM))
	head.add_child(UI.grow(UI.label(Vocations.localized_vocation_name(world, engine, vid, "ja"), 18, UI.INK)))
	if rank > 0:
		head.add_child(UI.label(I18n.t("career.mastered") if rank >= mastered_rank else I18n.t("career.masteryRank", {"rank": rank, "max": mastered_rank}), 13, UI.GOLD))
	body.add_child(head)

	# The role signature — the one line a player judges a destination by.
	var signature := ""
	for authored in world.get("vocations", []):
		if authored.get("id", "") == vid:
			signature = Fmt.localized_vocation_signature(world, authored)
			break
	if signature != "":
		body.add_child(UI.prose(signature, 14, UI.DIM, 640))

	# 能力変化
	var mods: Dictionary = vocation.get("statModifiers", {})
	var shifts := UI.row()
	shifts.add_child(UI.label(I18n.t("career.shifts"), 14, UI.DIM))
	var any_shift := false
	for stat in STAT_ORDER:
		var value := int(mods.get(stat, 0))
		if value == 0:
			continue
		any_shift = true
		shifts.add_child(UI.label("%s %s%d" % [I18n.t("career.stat.%s" % stat), "+" if value > 0 else "", value], 14, UI.OK if value > 0 else UI.BAD))
	if not any_shift:
		shifts.add_child(UI.label(I18n.t("career.noShifts"), 14, UI.DIM))
	body.add_child(shifts)

	# 装備可能
	var slots: Array = vocation.get("allowedSlots", [])
	if not slots.is_empty():
		var srow := UI.row()
		srow.add_child(UI.label(I18n.t("career.equips"), 14, UI.DIM))
		for slot in slots:
			srow.add_child(UI.label(I18n.t("career.slot.%s" % String(slot)), 14, UI.INK))
		body.add_child(srow)

	# 習得
	var grants: Array = vocation.get("grantsTechniques", [])
	if not grants.is_empty():
		var grow_row := UI.row()
		grow_row.add_child(UI.label(I18n.t("career.grants"), 14, UI.DIM))
		for technique in grants:
			grow_row.add_child(UI.label(_technique_name(String(technique), ctx.get("engine", {})), 14, UI.INK))
		body.add_child(grow_row)

	# 条件
	var requires: Dictionary = vocation.get("requires", {})
	if not is_current and (requires.has("mastered") or requires.has("minLevel")):
		var req_text := _requirement_text(world, engine, requires)
		if req_text != "":
			body.add_child(UI.label(I18n.t("career.requires", {"requirements": req_text}), 14, UI.DIM))

	var action: Button = null
	if is_current:
		body.add_child(UI.label(I18n.t("career.current"), 15, UI.GOLD))
	elif available:
		action = UI.button(I18n.t("career.changeTo", {"vocation": Vocations.localized_vocation_name(world, engine, vid, "ja")}), func(): ctx["dispatch"].call({"type": "change_vocation", "characterId": member.get("id", ""), "vocationId": vid}), Vector2(220, 38), 15)
		body.add_child(action)
	else:
		body.add_child(UI.label(I18n.t("career.locked"), 15, UI.DIM))

	return {"control": UI.card(body, UI.GOLD if is_current else Color("3a4326")), "action": action}

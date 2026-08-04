extends RefCounted
## The 転職 hall (guild hall → 転職), rebuilt as an SFC-style flow (playtest 2026-07-30: the old two-pane
## screen "read like a business app" — every destination shed its full stat/slot/technique sheet at once, a
## wall of data with no cursor rhythm). The DQ3-Dharma / FF5-job / Wizardry idiom instead is:
##
##   現職 (who they are now, left) → 就ける道 (a lean NAME list, right) → a class is chosen → 変化プレビュー
##   (that one class's signature, stat shifts, kept/gained techniques, equip slots) + 確定 (転職する / 戻る).
##
## One class's detail at a time, cursor-driven. The left pane also keeps the 戦闘セット editor (it is about the
## CURRENT calling's learned techniques, not the reclass). Faithful counterpart of src/components/CareerPanel.tsx.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Vocations := preload("res://scripts/rules/vocations.gd")
const Techniques := preload("res://scripts/rules/techniques.gd")

const STAT_ORDER := ["maxHp", "maxMp", "attack", "damageMin", "damageMax", "accuracy", "armor", "speed"]

static func _technique_name(id: String, engine: Dictionary = {}, world: Dictionary = {}) -> String:
	return Techniques.label(id, engine, world)

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var engine: Dictionary = ctx["engine"]
	var party: Array = state.get("party", [])

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("career.title"), I18n.t("town.gold", {"gold": int(state.get("partyGold", 0))})))
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

	var voc_state: Dictionary = Vocations.resolve_vocation_state(member, engine, world)
	var catalog: Array = Vocations.resolve_vocation_catalog(world, engine)
	var mastered_rank := int(engine.get("masteredRank", 5))

	var body := UI.row()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(body)

	# LEFT: who this adventurer is now (pinned) + the 戦闘セット editor for the CURRENT calling.
	body.add_child(UI.card(_overview(ctx, world, engine, member, voc_state, mastered_rank)))

	# RIGHT: 就ける道 — a lean NAME list; choosing one swaps this pane for its PREVIEW + CONFIRM.
	var dest := UI.col(8)
	dest.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var preview_id := String(ctx.get("career_preview", ""))
	var preview_voc := {}
	for vocation in catalog:
		if String(vocation.get("id", "")) == preview_id:
			preview_voc = vocation
			break

	var focus_target: Button = null
	if not preview_voc.is_empty():
		var pv := _vocation_preview(ctx, world, engine, member, voc_state, preview_voc, mastered_rank)
		dest.add_child(pv["control"])
		focus_target = pv["action"]
	else:
		dest.add_child(UI.label(I18n.t("career.destinations"), 19, UI.GOLD))
		dest.add_child(UI.label(I18n.t("career.pickPath"), 14, UI.DIM))
		var advanced := []
		var basic := []
		for vocation in catalog:
			if String(vocation.get("tier", "")) == "advanced":
				advanced.append(vocation)
			else:
				basic.append(vocation)
		var list := UI.col(4)
		if not advanced.is_empty():
			list.add_child(UI.label(I18n.t("career.advancedGroup"), 15, UI.DIM))
			for vocation in advanced:
				var r := _vocation_row(ctx, world, engine, member, voc_state, vocation, mastered_rank)
				list.add_child(r["control"])
				if focus_target == null and r["action"] != null:
					focus_target = r["action"]
		list.add_child(UI.label(I18n.t("career.basicGroup"), 15, UI.DIM))
		for vocation in basic:
			var r2 := _vocation_row(ctx, world, engine, member, voc_state, vocation, mastered_rank)
			list.add_child(r2["control"])
			if focus_target == null and r2["action"] != null:
				focus_target = r2["action"]
		dest.add_child(UI.scroller(list, Vector2(720, 470)))
	body.add_child(dest)

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

# --- LEFT pane: current calling + combat-set editor -------------------------------------------------
static func _overview(ctx: Dictionary, world: Dictionary, engine: Dictionary, member: Dictionary, voc_state: Dictionary, mastered_rank: int) -> Control:
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

	var learned: Array = voc_state.get("learned", [])
	var loadout: Array = voc_state.get("loadout", [])
	overview.add_child(UI.label(I18n.t("career.loadout", {"count": loadout.size()}), 17, UI.GOLD))
	if learned.is_empty():
		overview.add_child(UI.label(I18n.t("career.noTechniques"), 14, UI.DIM))
	else:
		for technique in learned:
			var tid := String(technique)
			var in_loadout := loadout.has(tid)
			var line := UI.row()
			line.add_child(UI.grow(UI.label(_technique_name(tid, engine, world), 15, UI.INK if in_loadout else UI.DIM)))
			var next_loadout := []
			if in_loadout:
				for t2 in loadout:
					if String(t2) != tid:
						next_loadout.append(t2)
			else:
				next_loadout = loadout.duplicate()
				next_loadout.append(tid)
			var lb := UI.button(I18n.t("career.removeFromLoadout") if in_loadout else I18n.t("career.addToLoadout"), func(): ctx["dispatch"].call({"type": "set_loadout", "characterId": member.get("id", ""), "loadout": next_loadout}), Vector2(140, 34), 14)
			line.add_child(lb)
			overview.add_child(line)
	return overview

# --- RIGHT pane, list mode: one lean NAME row per calling -------------------------------------------
static func _vocation_row(ctx: Dictionary, world: Dictionary, engine: Dictionary, member: Dictionary, voc_state: Dictionary, vocation: Dictionary, mastered_rank: int) -> Dictionary:
	var vid := String(vocation.get("id", ""))
	var is_current := vid == String(voc_state.get("current", ""))
	var available: bool = (not is_current) and Vocations.can_adopt_vocation(member, vid, world, engine)
	var rank := Vocations.mastery_rank(voc_state, vid)
	var name := Vocations.localized_vocation_name(world, engine, vid, "ja")
	var badge := ""
	if rank > 0:
		badge = "  ◆" if rank >= mastered_rank else "  ・%d" % rank   # a small mastery mark, not a data sheet

	if is_current:
		var cur := UI.label("%s （%s）" % [name, I18n.t("career.current")], 17, UI.GOLD)
		return {"control": UI.card(cur, UI.GOLD), "action": null}
	if available:
		# The row IS the choice: 決定 opens this calling's preview+confirm (set_career_preview), it never
		# reclasses in one press — the confirm lives in the preview.
		var b := UI.button("%s%s" % [name, badge], func(): ctx["set_career_preview"].call(vid), Vector2(700, 40), 17)
		return {"control": b, "action": b}
	# Locked: name + a 未解禁 tag + the one requirement line, greyed. No button — nothing to press yet.
	var req := _requirement_text(world, engine, vocation.get("requires", {}))
	var locked_row := UI.row()
	locked_row.add_child(UI.label(name, 15, UI.DIM))
	locked_row.add_child(UI.label(I18n.t("career.locked"), 13, UI.DIM))
	if req != "":
		locked_row.add_child(UI.label(req, 13, UI.DIM))
	return {"control": locked_row, "action": null}

# --- RIGHT pane, preview mode: one calling's full sheet + the confirm --------------------------------
static func _vocation_preview(ctx: Dictionary, world: Dictionary, engine: Dictionary, member: Dictionary, voc_state: Dictionary, vocation: Dictionary, mastered_rank: int) -> Dictionary:
	var vid := String(vocation.get("id", ""))
	var name := Vocations.localized_vocation_name(world, engine, vid, "ja")
	var tier := String(vocation.get("tier", "basic"))
	var col := UI.col(8)

	var head := UI.row()
	head.add_child(UI.label(name, 22, UI.GOLD))
	head.add_child(UI.label(I18n.t("career.advanced") if tier == "advanced" else I18n.t("career.basic"), 13, UI.DIM))
	var rank := Vocations.mastery_rank(voc_state, vid)
	if rank > 0:
		head.add_child(UI.label(I18n.t("career.mastered") if rank >= mastered_rank else I18n.t("career.masteryRank", {"rank": rank, "max": mastered_rank}), 13, UI.GOLD))
	col.add_child(head)

	# 現在の職 → この職 — the transition read at a glance.
	var cur_name := Vocations.localized_vocation_name(world, engine, String(voc_state.get("current", "")), "ja")
	col.add_child(UI.label("%s：%s  →  %s" % [I18n.t("career.current"), cur_name, name], 15, UI.DIM))

	var signature := ""
	for authored in world.get("vocations", []):
		if authored.get("id", "") == vid:
			signature = Fmt.localized_vocation_signature(world, authored)
			break
	if signature != "":
		col.add_child(UI.prose(signature, 14, UI.DIM, 640))

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
	col.add_child(shifts)

	# 装備可能
	var slots: Array = vocation.get("allowedSlots", [])
	if not slots.is_empty():
		var srow := UI.row()
		srow.add_child(UI.label(I18n.t("career.equips"), 14, UI.DIM))
		for slot in slots:
			srow.add_child(UI.label(I18n.t("career.slot.%s" % String(slot)), 14, UI.INK))
		col.add_child(srow)

	# 習得
	var grants: Array = vocation.get("grantsTechniques", [])
	if not grants.is_empty():
		var grow_row := UI.row()
		grow_row.add_child(UI.label(I18n.t("career.grants"), 14, UI.DIM))
		for technique in grants:
			grow_row.add_child(UI.label(_technique_name(String(technique), engine, world), 14, UI.INK))
		col.add_child(grow_row)

	# What reclassing keeps (level + learned techniques) — the DQ3 "half your stats?" fear, answered up front.
	col.add_child(UI.prose(I18n.t("career.intro"), 13, UI.DIM, 640))

	# The confirm beat.
	col.add_child(UI.label(I18n.t("career.reclassPrompt", {"vocation": name}), 16, UI.INK))
	var confirm_row := UI.row()
	# 転職する: apply the change, then drop back to the 就ける道 list so the new current reads at a glance.
	var on_reclass := func():
		ctx["dispatch"].call({"type": "change_vocation", "characterId": member.get("id", ""), "vocationId": vid})
		ctx["set_career_preview"].call("")
	var action := UI.button(I18n.t("career.doReclass"), on_reclass, Vector2(260, 46), 17)
	confirm_row.add_child(action)
	confirm_row.add_child(UI.button(I18n.t("career.back"), func(): ctx["set_career_preview"].call(""), Vector2(160, 46), 16))
	col.add_child(confirm_row)

	return {"control": UI.card(col, UI.GOLD), "action": action}

static func _requirement_text(world: Dictionary, engine: Dictionary, requires: Dictionary) -> String:
	var parts := []
	for req in requires.get("mastered", []):
		parts.append(I18n.t("career.reqMastered", {"vocation": Vocations.localized_vocation_name(world, engine, String(req), "ja")}))
	if int(requires.get("minLevel", 0)) > 0:
		parts.append(I18n.t("career.reqLevel", {"level": int(requires.get("minLevel", 0))}))
	if parts.is_empty():
		return ""
	# Wrap in the 条件：{requirements} copy — a bare list read as if it were already met, with no cue it is a
	# LOCK requirement (mirrors the React fix; e2e career.spec expects the label, 2026-07-31).
	return I18n.t("career.requires", {"requirements": " · ".join(PackedStringArray(parts))})

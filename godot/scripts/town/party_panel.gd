extends RefCounted
## Port of src/components/PartyMenuPanel.tsx (roster/party menu) — the six-person formation screen.
##
## The tabs separate 編成 from 能力: status browsing never repeats formation controls six times.
## An item's detail says what it DOES before any action is offered, discarding is a two-press CONFIRM,
## and a valuable that may not be discarded says so rather than showing a dead button.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const Leveling := preload("res://scripts/rules/leveling.gd")
const Helpers := preload("res://scripts/rules/combat_helpers.gd")
const Vocations := preload("res://scripts/rules/vocations.gd")
const Techniques := preload("res://scripts/rules/techniques.gd")
const WorldResources := preload("res://scripts/world_resources.gd")

# The member's portrait, from an imported data-URL ref or a built-in portrait key — the face equipment
# decisions want beside the name (T11). Falls back to the 'gate' portrait when none is set.
static func _roster_portrait(member: Dictionary, world: Dictionary) -> Texture2D:
	var ref := String(member.get("portraitRef", ""))
	var key := "gate"
	const BUILTIN := "builtin://portrait/"
	if ref.begins_with(BUILTIN):
		key = ref.trim_prefix(BUILTIN)
	var world_id := String(world.get("id", "default")).trim_prefix("world.")
	# face_path (not the bare portraits/<key>.png) so a body-only figure (a world.portraits key like chara-13,
	# no square face) top-crops its standing art instead of blanking (playtest 2026-08-05).
	return WorldResources.portrait_texture(ref, WorldResources.face_path(world_id, key))

const APTITUDES := ["might", "agility", "spirit", "wit", "luck"]

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]
	var party: Array = state.get("party", [])
	var reserve: Array = state.get("reserve", [])

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("partyMenu.title"), I18n.t("town.gold", {"gold": int(state.get("partyGold", 0))})))
	# The same panel opens in town and in the dungeon. Both are legitimate preparation surfaces; combat is
	# the only phase that locks equipment because a resolved round must not change beneath queued actions.
	var in_town: bool = String(state.get("phase", "town")) == "town"
	root.add_child(UI.prose(I18n.t("partyMenu.subtitleTown" if in_town else "partyMenu.subtitleDungeon"), 16, UI.DIM, 900))
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
	var engine: Dictionary = ctx.get("engine", {})
	var page: String = ctx.get("party_page", "status")
	var tabs := UI.row()
	for entry in [["status", "partyMenu.tabs.status"], ["formation", "partyMenu.tabs.formation"], ["spells", "partyMenu.tabs.spells"], ["equipment", "partyMenu.tabs.equipment"], ["items", "partyMenu.tabs.items"], ["valuables", "partyMenu.tabs.valuables"]]:
		var key := String(entry[0])
		var tb := UI.button(I18n.t(String(entry[1])), func(): ctx["set_party_page"].call(key), Vector2(130, 36), 15)
		if key == page:
			tb.add_theme_color_override("font_color", UI.GOLD)
		tabs.add_child(tb)
	# コンフィグ from inside the camp menu — the classic "settings while you rest" slot. Only when the host
	# offers it (the dungeon does; the town already has its own メニュー button), so it is not doubled in town.
	if ctx.has("open_config"):
		tabs.add_child(UI.grow(Control.new()))
		tabs.add_child(UI.button(I18n.t("partyMenu.config"), func(): ctx["open_config"].call(), Vector2(130, 36), 15))
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

	# 呪文/特技 — the classic camp "spells" page: a READ-ONLY reference of what the chosen adventurer knows,
	# split 呪文 (spells) / 特技 (skills), each with its MP cost and what it does. Pick a member on the left.
	if page == "spells":
		var sbody := UI.row()
		sbody.size_flags_vertical = Control.SIZE_EXPAND_FILL
		root.add_child(sbody)
		var sroster := UI.col(6)
		sroster.custom_minimum_size = Vector2(430, 0)
		sroster.add_child(UI.label(I18n.t("partyMenu.members"), 19, UI.GOLD))
		var sfocus: Control = null
		var selected_sfocus: Control = null
		for candidate in party:
			var rr := _roster_row(ctx, candidate, member)
			sroster.add_child(rr)
			if sfocus == null:
				sfocus = _first_button(rr)
			if String(candidate.get("id", "")) == String(member.get("id", "")):
				selected_sfocus = _first_button(rr)
		sbody.add_child(UI.card(sroster))
		var spell_page := _spells_page(ctx, world, engine, member)
		sbody.add_child(spell_page["control"])
		var sfoot := UI.row()
		var sback := UI.button(I18n.t("partyMenu.close"), ctx["close"], Vector2(180, 44), 18)
		sfoot.add_child(sback)
		root.add_child(sfoot)
		ctx["focus_hint"].call(spell_page["focus"] if spell_page["focus"] != null else selected_sfocus if selected_sfocus != null else sfocus if sfocus != null else sback)
		return root

	# 編成 is its own decision surface. The status page is for reading one adventurer, not for six repeated
	# 前衛/後衛 buttons (and never shows the dungeon-no-op bench action as 「閉じる」).
	if page == "formation":
		var formation := _formation_page(ctx, party, member)
		root.add_child(formation["control"])
		var formation_foot := UI.row()
		var formation_back := UI.button(I18n.t("partyMenu.close"), ctx["close"], Vector2(180, 44), 18)
		formation_foot.add_child(formation_back)
		root.add_child(formation_foot)
		ctx["focus_hint"].call(formation["focus"] if formation["focus"] != null else formation_back)
		return root

	# 装備 is an action surface, not a read-only ledger. The player sees the six worn slots beside every
	# carried piece this adventurer can use, and Confirm equips it immediately in town or while exploring.
	if page == "equipment":
		var equipment_page := _equipment_page(ctx, world, party, member)
		root.add_child(equipment_page["control"])
		var equipment_foot := UI.row()
		var equipment_back := UI.button(I18n.t("partyMenu.close"), ctx["close"], Vector2(180, 44), 18)
		equipment_foot.add_child(equipment_back)
		root.add_child(equipment_foot)
		ctx["focus_hint"].call(equipment_page["focus"] if equipment_page["focus"] != null else equipment_back)
		return root

	var body := UI.row()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(body)

	# LEFT: the formation — who is in front, who is behind, who is benched.
	var roster := UI.col(6)
	roster.custom_minimum_size = Vector2(430, 0)
	roster.add_child(UI.label(I18n.t("partyMenu.members"), 19, UI.GOLD))
	var selected_roster_focus: Control = null
	for candidate in party:
		var roster_row := _roster_row(ctx, candidate, member)
		roster.add_child(roster_row)
		if String(candidate.get("id", "")) == String(member.get("id", "")):
			selected_roster_focus = _first_button(roster_row)
	if not reserve.is_empty():
		roster.add_child(UI.label(I18n.t("town.reserve") if I18n.has("town.reserve") else I18n.t("partyMenu.members"), 16, UI.DIM))
		for candidate in reserve:
			roster.add_child(_roster_row(ctx, candidate, member))
	body.add_child(UI.card(roster))

	# RIGHT: the selected adventurer in full — condition, combat stats, resistances, aptitudes, gear.
	var detail := UI.col(6)
	detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var stats: Dictionary = CharacterStats.effective(member, world)

	# Name then level, adjacent on the LEFT — the level used to be grow-pushed to the far right edge, where
	# it sat under the scroll bar and a two-digit level would have been hidden behind it (playtest).
	var head := UI.row()
	head.add_child(UI.label(String(member.get("name", "?")), 24, UI.GOLD))
	head.add_child(UI.label("%s %d" % [I18n.t("partyMenu.level"), int(member.get("level", 1))], 17, UI.DIM))
	detail.add_child(head)

	var vitals := UI.row()
	vitals.add_child(UI.label("HP %d/%d" % [int(member.get("hp", 0)), int(member.get("maxHp", 0))], 18, UI.BAD if int(member.get("hp", 0)) < int(member.get("maxHp", 0)) else UI.INK))
	vitals.add_child(UI.label("MP %d/%d" % [int(member.get("mp", 0)), int(member.get("maxMp", 0))], 18, UI.INK))
	vitals.add_child(UI.label("%s: %s" % [I18n.t("partyMenu.condition"), _condition(member)], 16, UI.BAD if member.get("injury", null) != null else UI.OK))
	detail.add_child(vitals)

	# T17: the ability/status page READS one adventurer — it no longer carries a 前後交代 command (playtest
	# 2026-08-02: "意味わからんコマンドは不要"). Front/back changes live in the 編成 tab, which owns them
	# with explicit 前衛へ/後衛へ placement.

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
	# The four DERIVED numbers React shows beside the raw stats: they are where aptitude actually pays
	# off, and without them a player cannot tell why a nimble adventurer survives or a witty one lands
	# afflictions. All four come from the ported combat math, never from a second formula written here.
	_stat_row(combat, I18n.t("partyMenu.evasion"), "%d%%" % Helpers.get_evasion_chance(member, world))
	_stat_row(combat, I18n.t("partyMenu.spellPower"), "+%d" % Helpers.get_spell_power_bonus(member))
	_stat_row(combat, I18n.t("partyMenu.statusPower"), "%d%%" % Helpers.get_status_spell_chance(member, 0))
	_stat_row(combat, I18n.t("partyMenu.critical"), "%d%%" % Helpers.get_critical_chance(member))
	detail.add_child(combat)

	# Resistances — what this adventurer can stand in the dark. React lists the four afflictions ALWAYS,
	# 0% included: "no resistance" is the answer the player came for as much as a number is.
	var resist: Dictionary = stats.get("resistance", {})
	var rrow := UI.row()
	rrow.add_child(UI.label(I18n.t("partyMenu.resistances"), 15, UI.DIM))
	for key in ["poison", "fear", "silence", "sleep"]:
		rrow.add_child(UI.label("%s %d%%" % [I18n.t("partyMenu.status.%s" % key), int(resist.get(key, 0))], 14, UI.INK))
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
	detail.add_child(UI.label(I18n.t("partyMenu.equipmentTown" if in_town else "partyMenu.equipmentDungeon"), 14, UI.DIM))
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
	# Browsing the roster is not an action. The highlighted adventurer is already the subject of the
	# right-hand sheet, so the cursor starts there and an arrow move changes the sheet immediately.
	ctx["focus_hint"].call(selected_roster_focus if selected_roster_focus != null else back)
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

static func _roster_row(ctx: Dictionary, candidate: Dictionary, selected: Dictionary) -> Control:
	var cid := String(candidate.get("id", ""))
	var is_selected := cid == String(selected.get("id", ""))
	var body := UI.col(3)
	var head := UI.row()
	var name_btn := UI.button(String(candidate.get("name", "?")), func(): ctx["select_party_member"].call(cid), Vector2(150, 34), 15)
	# Selecting a member is an inspection operation, not a two-step command. Button focus is the source of
	# truth for controller/keyboard browsing; Confirm remains available without being required to refresh.
	if ctx.has("focus_selected"):
		name_btn.focus_entered.connect(func(): ctx["focus_selected"].call(cid))
	if is_selected:
		name_btn.add_theme_color_override("font_color", UI.GOLD)
	head.add_child(name_btn)
	head.add_child(UI.label("Lv.%d" % int(candidate.get("level", 1)), 14, UI.DIM))
	head.add_child(UI.grow(UI.label("HP %d/%d" % [int(candidate.get("hp", 0)), int(candidate.get("maxHp", 0))], 14, UI.INK)))
	body.add_child(head)
	# T11 — the context equipment decisions need: front/back row and the current job, on a compact line.
	var world: Dictionary = ctx.get("world", {})
	var engine: Dictionary = ctx.get("engine", {})
	var row_label := I18n.t("play.frontRow") if String(candidate.get("row", "front")) == "front" else I18n.t("play.backRow")
	var voc: Dictionary = Vocations.resolve_vocation_state(candidate, engine, world)
	var job := Vocations.localized_vocation_name(world, engine, String(voc.get("current", "")), "ja")
	body.add_child(UI.label("%s ・ %s" % [row_label, job], 13, UI.DIM))
	# T11 — the face, so a member reads at a glance.
	var portrait := TextureRect.new()
	portrait.custom_minimum_size = Vector2(46, 54)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.texture = _roster_portrait(candidate, world)
	var framed := UI.row()
	framed.add_child(portrait)
	framed.add_child(UI.grow(body))
	return UI.card(framed, UI.GOLD if is_selected else Color("3a4326"))

static func _formation_page(ctx: Dictionary, party: Array, selected: Dictionary) -> Dictionary:
	var root := UI.col(10)
	root.add_child(UI.label(I18n.t("partyMenu.formationHeading"), 20, UI.GOLD))
	root.add_child(UI.label(I18n.t("partyMenu.formationHint"), 16, UI.DIM))
	var rows := UI.row()
	var focus: Button = null
	var selected_focus: Button = null
	for row_id in ["front", "back"]:
		var column := UI.col(6)
		column.custom_minimum_size = Vector2(360, 0)
		column.add_child(UI.label(I18n.t("play.frontRow") if row_id == "front" else I18n.t("play.backRow"), 18, UI.GOLD))
		for candidate in party.filter(func(entry): return String(entry.get("row", "front")) == row_id):
			var cid := String(candidate.get("id", ""))
			var b := UI.button(String(candidate.get("name", "?")), func(): ctx["select_party_member"].call(cid), Vector2(300, 38), 16)
			if ctx.has("focus_selected"):
				b.focus_entered.connect(func(): ctx["focus_selected"].call(cid))
			if cid == String(selected.get("id", "")):
				b.add_theme_color_override("font_color", UI.GOLD)
				selected_focus = b
			if focus == null: focus = b
			column.add_child(b)
		rows.add_child(UI.card(column))
	root.add_child(rows)
	var actions := UI.row()
	for row_id in ["front", "back"]:
		var label := I18n.t("partyMenu.placeFront") if row_id == "front" else I18n.t("partyMenu.placeBack")
		var b := UI.button(label, func(): ctx["dispatch"].call({"type": "set_member_row", "characterId": selected.get("id", ""), "row": row_id}), Vector2(220, 44), 17)
		b.disabled = String(selected.get("row", "front")) == row_id
		actions.add_child(b)
		if focus == null and not b.disabled: focus = b
	root.add_child(actions)
	return {"control": UI.card(root), "focus": selected_focus if selected_focus != null else focus}

static func _equipment_page(ctx: Dictionary, world: Dictionary, party: Array, member: Dictionary) -> Dictionary:
	var state: Dictionary = ctx["state"]
	var body := UI.row()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL

	var roster := UI.col(6)
	roster.custom_minimum_size = Vector2(430, 0)
	roster.add_child(UI.label(I18n.t("partyMenu.members"), 19, UI.GOLD))
	var selected_roster_focus: Control = null
	var roster_buttons: Array[Button] = []
	for candidate in party:
		var roster_row := _roster_row(ctx, candidate, member)
		roster.add_child(roster_row)
		var rb := _first_button(roster_row)
		if rb != null:
			roster_buttons.append(rb)
		if String(candidate.get("id", "")) == String(member.get("id", "")):
			selected_roster_focus = rb
	body.add_child(UI.card(roster))

	# Equipment is a four-step preparation decision: choose a slot, inspect a carried instance, compare the
	# complete effective result, then equip. The old list equipped as soon as it was pressed, giving the
	# player no chance to see what it displaced or whether a copy would be moved from another adventurer.
	var selected_slot: String = String(ctx.get("party_equipment_slot", "weapon"))
	if not Fmt.EQUIPMENT_SLOT_ORDER.has(selected_slot):
		selected_slot = "weapon"
	var selected_key: String = String(ctx.get("party_equipment_candidate", ""))
	var selected_item: Dictionary = {}
	for item_v in state.get("inventory", []):
		var item: Dictionary = item_v
		if Fmt.equipment_selection_key(item) == selected_key:
			selected_item = item
			break

	var detail := UI.col(8)
	detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	detail.add_child(UI.label("%s — %s" % [String(member.get("name", "")), I18n.t("partyMenu.equipped")], 20, UI.GOLD))
	detail.add_child(UI.label(I18n.t("partyMenu.equipmentSelectSlot"), 15, UI.DIM))
	var slots := UI.col(3)
	var selected_slot_focus: Control = null
	var slot_buttons: Array[Button] = []
	for slot_v in Fmt.EQUIPMENT_SLOT_ORDER:
		var slot := String(slot_v)
		var current: Variant = (member.get("equipment", {}) as Dictionary).get(slot, null)
		var label := "%s　%s" % [Fmt.format_equipment_slot(slot), Fmt.equipped_name(world, current)]
		var slot_button := UI.button(label, func(): ctx["set_party_equipment_slot"].call(slot), Vector2(610, 36), 15)
		if slot == selected_slot:
			slot_button.add_theme_color_override("font_color", UI.GOLD)
			selected_slot_focus = slot_button
		slots.add_child(slot_button)
		slot_buttons.append(slot_button)
	detail.add_child(UI.card(slots))

	var candidates := UI.col(4)
	candidates.add_child(UI.label(I18n.t("partyMenu.equipmentCandidates"), 18, UI.GOLD))
	var candidate_focus: Control = null
	var candidate_buttons: Array[Button] = []
	var equip_button_ref: Button = null
	var found := false
	# Collect the slot-matching carried gear, then order EQUIPPABLE-first with the class-ineligible pieces
	# BELOW (dimmed + a reason) — so the cursor meets the usable picks first instead of hunting past greyed
	# rows (user decision 2026-08-04「装備可能を上・不可を下に淡色」). Not filtered out: the reason stays visible.
	var slot_items := []
	for item_v in state.get("inventory", []):
		var item: Dictionary = item_v
		if String(item.get("kind", "")) != "equipment":
			continue
		var catalog: Variant = Fmt.find_equipment(world, item.get("id", ""))
		if typeof(catalog) != TYPE_DICTIONARY or String((catalog as Dictionary).get("slot", "")) != selected_slot:
			continue
		slot_items.append({"item": item, "catalog": catalog as Dictionary, "usable": Fmt.is_usable_by(catalog as Dictionary, member)})
	slot_items.sort_custom(func(a, b): return a["usable"] and not b["usable"])  # equippable first; equal-usability keeps inventory order
	for entry in slot_items:
		var item: Dictionary = entry["item"]
		found = true
		var usable: bool = entry["usable"]
		var row := UI.row()
		var key := Fmt.equipment_selection_key(item)
		var candidate_button := UI.button(Fmt.describe_equipment_instance(world, item.get("id", ""), item.get("plus", null), item.get("affix", null)), func(): ctx["set_party_equipment_candidate"].call(key), Vector2(330, 38), 16)
		candidate_button.disabled = not usable
		if key == selected_key:
			candidate_button.add_theme_color_override("font_color", UI.GOLD)
			candidate_focus = candidate_button
		row.add_child(candidate_button)
		row.add_child(UI.grow(UI.label(I18n.t("partyMenu.equipmentIncompatible") if not usable else Fmt.format_inventory_effect(item), 14, UI.DIM)))
		candidates.add_child(row)
		candidate_buttons.append(candidate_button)
	if not found:
		candidates.add_child(UI.label(I18n.t("partyMenu.equipmentNoCandidate"), 15, UI.DIM))
	var comparison := UI.col(4)
	var current_item: Variant = (member.get("equipment", {}) as Dictionary).get(selected_slot, null)
	comparison.add_child(UI.label("%s：%s" % [I18n.t("partyMenu.equipmentCurrent"), Fmt.equipped_name(world, current_item)], 15, UI.DIM))
	if selected_item.is_empty():
		comparison.add_child(UI.label(I18n.t("partyMenu.equipmentCandidates"), 15, UI.DIM))
	else:
		comparison.add_child(UI.label(I18n.t("partyMenu.equipmentCompare"), 18, UI.GOLD))
		comparison.add_child(UI.label("%s：%s" % [I18n.t("partyMenu.equipmentCandidate"), Fmt.describe_equipment_instance(world, selected_item.get("id", ""), selected_item.get("plus", null), selected_item.get("affix", null))], 16, UI.INK))
		comparison.add_child(UI.prose(Fmt.localized_catalog_description(world, selected_item.get("id", "")), 14, UI.DIM, 720))
		var catalog: Variant = Fmt.find_equipment(world, selected_item.get("id", ""))
		if typeof(catalog) == TYPE_DICTIONARY:
			for passive_id in (catalog as Dictionary).get("grantsPassives", []):
				comparison.add_child(UI.label("%s：%s" % [I18n.t("partyMenu.equipmentPassive"), Techniques.label(String(passive_id), ctx.get("engine", {}), world)], 15, UI.OK))
		var usable := typeof(catalog) == TYPE_DICTIONARY and Fmt.is_usable_by(catalog as Dictionary, member)
		if not usable:
			comparison.add_child(UI.label(I18n.t("partyMenu.equipmentIncompatible"), 15, UI.BAD))
		else:
			var current_stats := CharacterStats.effective(member, world)
			var next_stats := Fmt.preview_equipment_instance_stats(member, selected_item, world)
			for line in Fmt.equipment_comparison_lines(current_stats, next_stats):
				comparison.add_child(UI.label(String(line), 15, UI.INK))
			var transfer := Fmt.transfer_source(party, selected_item, String(member.get("id", "")))
			if not transfer.is_empty():
				comparison.add_child(UI.label(I18n.t("partyMenu.equipmentTransferFrom", {"name": String(transfer.get("name", "")), "slot": Fmt.format_equipment_slot(String(transfer.get("slot", "")))}), 15, UI.BAD))
			var same := Fmt.equipment_selection_key(selected_item) == Fmt.equipment_selection_key(current_item if typeof(current_item) == TYPE_DICTIONARY else {})
			var equip_label := I18n.t("partyMenu.equipmentSame") if same else I18n.t("partyMenu.equipOn", {"name": String(member.get("name", ""))})
			var equip_button := UI.button(equip_label, func(): ctx["dispatch"].call({"type": "equip_item", "characterId": member.get("id", ""), "equipmentId": selected_item.get("id", ""), "plus": selected_item.get("plus", null), "affix": selected_item.get("affix", null)}), Vector2(260, 42), 16)
			equip_button.disabled = same
			comparison.add_child(equip_button)
			equip_button_ref = equip_button
	# Candidate selection and its consequence are one decision, so they sit beside each other rather than
	# forcing the player to scan from the top of a sparse list to a detached lower panel.
	var decision := UI.row()
	decision.size_flags_vertical = Control.SIZE_EXPAND_FILL
	decision.add_child(UI.scroller(candidates, Vector2(520, 250)))
	decision.add_child(UI.grow(UI.card(comparison)))
	detail.add_child(decision)
	body.add_child(UI.grow(UI.card(detail)))

	# T12 — controller navigation was chaotic: LEFT from a slot/candidate jumped to the TAB strip, not the
	# roster, so character-select and the slot→candidate→equip chain were effectively unreachable by pad.
	# Wire explicit neighbours: the detail column's LEFT always returns to the selected roster row; the
	# roster's RIGHT enters the slots; slots→candidates→equip flow down/right. Buttons keep their geometric
	# up/down within a column.
	var into_detail: Control = selected_slot_focus if selected_slot_focus != null else (slot_buttons[0] if not slot_buttons.is_empty() else null)
	var back_to_roster: Control = selected_roster_focus if selected_roster_focus != null else (roster_buttons[0] if not roster_buttons.is_empty() else null)
	if back_to_roster != null:
		for rb in roster_buttons:
			if into_detail != null:
				rb.focus_neighbor_right = rb.get_path_to(into_detail)
		for sb in slot_buttons:
			sb.focus_neighbor_left = sb.get_path_to(back_to_roster)
		for cb in candidate_buttons:
			cb.focus_neighbor_left = cb.get_path_to(back_to_roster)
		if equip_button_ref != null:
			equip_button_ref.focus_neighbor_left = equip_button_ref.get_path_to(back_to_roster)
	# Last slot flows DOWN into the first candidate (or the equip button) so the choose-slot→choose-item→
	# equip sequence is one straight run.
	if not slot_buttons.is_empty():
		var after_slots: Control = (candidate_buttons[0] if not candidate_buttons.is_empty() else equip_button_ref)
		if after_slots != null:
			slot_buttons[slot_buttons.size() - 1].focus_neighbor_bottom = slot_buttons[slot_buttons.size() - 1].get_path_to(after_slots)

	var restore_member_focus: bool = String(ctx.get("party_focus_member_id", "")) != ""
	return {"control": body, "focus": selected_roster_focus if restore_member_focus and selected_roster_focus != null else candidate_focus if candidate_focus != null else selected_slot_focus}


const VALUABLE_KINDS := ["key", "treasure", "escape"]
const USABLE_KINDS := ["healing", "cure", "focus", "growth"]

# 所持品 / 貴重品: the carried list on the left, and what the SELECTED item does on the right.
static func _item_page(ctx: Dictionary, world: Dictionary, member: Dictionary, page: String) -> Dictionary:
	var in_town: bool = String((ctx["state"] as Dictionary).get("phase", "town")) == "town"
	var state: Dictionary = ctx["state"]
	var visible := []
	for item in state.get("inventory", []):
		# A depleted stack (quantity 0) is dead data — hide it so it never shows as ×0/使用できる.
		if int(item.get("quantity", 1)) <= 0:
			continue
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

		var kind := String(selected.get("kind", ""))
		# An escape charm is USED from the menu — its reachable home now the dungeon dock is key-driven and no
		# longer lists it (playtest 2026-07-30: 脱出アイテムに触れない). Only in the dungeon; town has nothing to
		# escape. It reuses the return-charm label the dock used to carry.
		var can_use_escape := kind == "escape" and not in_town
		if USABLE_KINDS.has(kind):
			# Item → target → preview → confirmation. Looking at an item or selecting a recipient is safe;
			# only this final command may spend inventory or advance exploration time.
			var chosen_target_id: String = ctx.get("party_item_target_id", "")
			var chosen_target: Dictionary = {}
			for candidate in state.get("party", []):
				if String(candidate.get("id", "")) == chosen_target_id:
					chosen_target = candidate
			detail.add_child(UI.label(I18n.t("partyMenu.itemChooseTarget"), 17, UI.GOLD))
			var target_rows := UI.col(4)
			for candidate in state.get("party", []):
				var preview := _item_use_preview(selected, candidate, world)
				var target_label := "%s　%s" % [I18n.t("partyMenu.useOn", {"name": String(candidate.get("name", ""))}), String(preview.get("short", ""))]
				var target_button := UI.button(target_label, func(): ctx["set_party_item_target"].call(String(candidate.get("id", ""))), Vector2(430, 34), 15)
				target_button.disabled = not bool(preview.get("eligible", false))
				if String(candidate.get("id", "")) == chosen_target_id:
					target_button.add_theme_color_override("font_color", UI.GOLD)
				target_rows.add_child(target_button)
			detail.add_child(UI.scroller(target_rows, Vector2(460, 230)))
			if not chosen_target.is_empty():
				var chosen_preview := _item_use_preview(selected, chosen_target, world)
				if bool(chosen_preview.get("eligible", false)):
					var preview_card := UI.col(4)
					preview_card.add_child(UI.label(I18n.t("partyMenu.itemAfterUse"), 17, UI.GOLD))
					for line in chosen_preview.get("lines", []):
						preview_card.add_child(UI.label(String(line), 15, UI.INK))
					preview_card.add_child(UI.label(I18n.t("partyMenu.itemQuantityAfter", {"before": int(selected.get("quantity", 1)), "after": maxi(0, int(selected.get("quantity", 1)) - 1)}), 15, UI.BAD))
					if not in_town:
						preview_card.add_child(UI.label(I18n.t("partyMenu.itemCostsExploreAction"), 14, UI.DIM))
					var use_label := I18n.t("partyMenu.useOn", {"name": String(chosen_target.get("name", ""))})
					preview_card.add_child(UI.button(use_label, func(): ctx["dispatch"].call({"type": "use_item", "itemId": selected.get("id", ""), "targetCharacterId": chosen_target.get("id", "")}), Vector2(250, 40), 16))
					detail.add_child(UI.card(preview_card))
		elif can_use_escape:
			var escape_card := UI.col(4)
			escape_card.add_child(UI.label(I18n.t("partyMenu.itemAfterUse"), 17, UI.GOLD))
			escape_card.add_child(UI.label(I18n.t("partyMenu.itemReturnTown"), 15, UI.INK))
			escape_card.add_child(UI.label(I18n.t("partyMenu.itemQuantityAfter", {"before": int(selected.get("quantity", 1)), "after": maxi(0, int(selected.get("quantity", 1)) - 1)}), 15, UI.BAD))
			escape_card.add_child(UI.label(I18n.t("partyMenu.itemCostsExploreAction"), 14, UI.DIM))
			escape_card.add_child(UI.button(I18n.t("play.useReturnCharm"), func(): ctx["dispatch"].call({"type": "use_item", "itemId": selected.get("id", ""), "targetCharacterId": ""}), Vector2(250, 40), 16))
			detail.add_child(UI.card(escape_card))
		elif kind == "escape":
			detail.add_child(UI.label(I18n.t("partyMenu.itemDungeonOnly"), 15, UI.DIM))
		elif kind == "utility":
			var aid := _exploration_aid(world, String(selected.get("id", "")))
			if not aid.is_empty():
				detail.add_child(UI.label(I18n.t("partyMenu.itemUtilityUse", {"actions": _exploration_aid_label(aid.get("actions", [])), "bonus": int(aid.get("bonus", 0))}), 15, UI.INK))
				detail.add_child(UI.label(I18n.t("partyMenu.itemUtilityHint"), 14, UI.DIM))
		elif kind == "ward" or kind == "throwable" or kind == "scroll":
			detail.add_child(UI.label(I18n.t("partyMenu.itemCombatOnly"), 15, UI.DIM))

		var actions := UI.row()
		if is_equipment:
			var equip: Variant = Fmt.find_equipment(world, selected.get("id", ""))
			var usable: bool = typeof(equip) == TYPE_DICTIONARY and Fmt.is_usable_by(equip, member)
			# Inventory is a safe inspection list. Equipping routes to the dedicated slot → candidate →
			# comparison surface, so the player never mutates gear just by reading an item.
			var label := I18n.t("partyMenu.equipmentInspect")
			if not usable:
				label = I18n.t("partyMenu.cannotEquip")
			var eb := UI.button(label, func(): ctx["open_equipment_item"].call(selected), Vector2(220, 40), 16)
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
		if actions.get_child_count() > 0:
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

# The UI preview deliberately mirrors ItemCommands' outside-combat eligibility and caps. It is a display
# projection only; the canonical resolver refuses a no-benefit command again before changing state.
static func _item_use_preview(item: Dictionary, target: Dictionary, world: Dictionary) -> Dictionary:
	var lines := []
	var kind := String(item.get("kind", ""))
	if kind == "growth":
		var grants: Dictionary = item.get("grants", {})
		for entry in [["maxHp", "最大HP"], ["maxMp", "最大MP"], ["attack", "攻撃"], ["might", "筋力"], ["agility", "敏捷"], ["spirit", "精神"], ["wit", "知恵"], ["luck", "運"]]:
			var key := String(entry[0])
			var amount := int(grants.get(key, 0))
			if amount == 0:
				continue
			var before := int(target.get(key, 0)) if key == "maxHp" or key == "maxMp" or key == "attack" else int((target.get("aptitude", {}) as Dictionary).get(key, 0))
			lines.append("%s　%d → %d" % [String(entry[1]), before, before + amount])
		if int(grants.get("xp", 0)) != 0:
			var xp_before := int(target.get("xp", 0))
			var grown := target.duplicate(true)
			grown["xp"] = xp_before + int(grants["xp"])
			var leveled: Dictionary = Leveling.apply_level_ups(grown)
			var level_after := int((leveled.get("character", {}) as Dictionary).get("level", target.get("level", 1)))
			lines.append("経験値　%d → %d" % [xp_before, xp_before + int(grants["xp"])])
			if level_after != int(target.get("level", 1)):
				lines.append("レベル　%d → %d" % [int(target.get("level", 1)), level_after])
		return {"eligible": true, "short": I18n.t("partyMenu.itemGrowth"), "lines": lines}

	var stats := CharacterStats.effective(target, world)
	var eligible := false
	if int(item.get("healAmount", 0)) > 0:
		var hp_before := int(target.get("hp", 0))
		var hp_after := mini(int(stats.get("maxHp", target.get("maxHp", 0))), hp_before + int(item["healAmount"]))
		if hp_after > hp_before:
			eligible = true
			lines.append("HP　%d → %d" % [hp_before, hp_after])
	if int(item.get("restoreMp", 0)) > 0:
		var mp_before := int(target.get("mp", 0))
		var mp_after := mini(int(stats.get("maxMp", target.get("maxMp", 0))), mp_before + int(item["restoreMp"]))
		if mp_after > mp_before:
			eligible = true
			lines.append("MP　%d → %d" % [mp_before, mp_after])
	var cures: Variant = item.get("curesStatuses", [])
	var cured_names := []
	if typeof(cures) == TYPE_ARRAY:
		for status in target.get("status", []):
			if (cures as Array).has(status):
				eligible = true
				cured_names.append(I18n.t("partyMenu.status.%s" % String(status)))
	if not cured_names.is_empty():
		lines.append(I18n.t("partyMenu.itemCured", {"statuses": "・".join(PackedStringArray(cured_names))}))
	var short := I18n.t("partyMenu.itemCanUse") if eligible else I18n.t("partyMenu.itemNoEffect")
	return {"eligible": eligible, "short": short, "lines": lines}

static func _exploration_aid(world: Dictionary, item_id: String) -> Dictionary:
	for catalog in world.get("items", []):
		if String(catalog.get("id", "")) == item_id and typeof(catalog.get("explorationAid", null)) == TYPE_DICTIONARY:
			return catalog.get("explorationAid", {})
	return {}

static func _exploration_aid_label(actions: Variant) -> String:
	var names := []
	for action in (actions if typeof(actions) == TYPE_ARRAY else []):
		match String(action):
			"unlock": names.append("解錠")
			"disarm": names.append("罠の解除")
			"detectSecret": names.append("隠し通路の発見")
			_: names.append("探索")
	return "・".join(PackedStringArray(names))

# --- 呪文/特技 page -------------------------------------------------------------------------------
# Recovery and cure arts have a deterministic exploration meaning, so they are usable from this menu.
# Combat-only techniques remain visible as reference material rather than pretending they persist outside
# a round. The route is actor → technique → target → command; candidate selection itself costs nothing.
static func _spells_page(ctx: Dictionary, world: Dictionary, engine: Dictionary, member: Dictionary) -> Dictionary:
	var col := UI.col(6)
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_child(UI.label("%s — %s" % [String(member.get("name", "")), I18n.t("partyMenu.tabs.spells")], 19, UI.GOLD))
	var voc: Dictionary = Vocations.resolve_vocation_state(member, engine, world)
	var learned: Array = voc.get("learned", [])
	if learned.is_empty():
		col.add_child(UI.label(I18n.t("partyMenu.noSpells"), 15, UI.DIM))
		return {"control": col, "focus": null}
	var spells := []
	var skills := []
	for tid in learned:
		if Techniques.is_skill(String(tid), engine, world):
			skills.append(String(tid))
		else:
			spells.append(String(tid))
	var selected_id := String(ctx.get("party_technique_id", ""))
	if selected_id != "" and learned.has(selected_id) and Techniques.is_camp_usable(selected_id, engine, world):
		var back := UI.button(I18n.t("partyMenu.back"), func(): ctx["set_party_technique"].call(""), Vector2(180, 38), 15)
		col.add_child(back)
		col.add_child(UI.label(Techniques.label(selected_id, engine, world), 20, UI.GOLD))
		var summary := Techniques.summary(selected_id, engine, world)
		if summary != "":
			col.add_child(UI.label(summary, 15, UI.DIM))
		var target_mode := Techniques.targeting(selected_id, engine, world)
		var party: Array = (ctx["state"] as Dictionary).get("party", [])
		var target_focus: Control = back
		if target_mode == "ally":
			col.add_child(UI.label(I18n.t("partyMenu.members"), 16, UI.DIM))
			# T18: a pure-heal cannot help a full-HP ally — disable those targets, and land the cursor on the
			# MOST-wounded valid target (not the top of the list). After a cast the panel re-renders and this
			# recomputes, so the cursor moves to the next-most-wounded instead of snapping back to the top.
			var is_heal := Techniques.heals(selected_id, engine, world)
			var best_wounded: Control = null
			var lowest_pct := 2.0
			for target_v in party:
				var target: Dictionary = target_v
				var alive := int(target.get("hp", 0)) > 0 and target.get("injury", null) == null
				var wounded := int(target.get("hp", 0)) < int(target.get("maxHp", 0))
				var usable_target := alive and (not is_heal or wounded)
				var target_button := UI.button(I18n.t("partyMenu.useOn", {"name": String(target.get("name", ""))}), func(): ctx["dispatch"].call({"type": "use_technique", "characterId": member.get("id", ""), "techniqueId": selected_id, "targetCharacterId": target.get("id", "")}), Vector2(360, 38), 16)
				target_button.disabled = not usable_target
				col.add_child(target_button)
				if usable_target:
					var pct := float(int(target.get("hp", 0))) / maxf(1.0, float(int(target.get("maxHp", 1))))
					if pct < lowest_pct:
						lowest_pct = pct
						best_wounded = target_button
			if best_wounded != null:
				target_focus = best_wounded
		else:
			var action := UI.button(I18n.t("partyMenu.useOn", {"name": String(member.get("name", ""))}), func(): ctx["dispatch"].call({"type": "use_technique", "characterId": member.get("id", ""), "techniqueId": selected_id, "targetCharacterId": member.get("id", "")}), Vector2(360, 40), 16)
			col.add_child(action)
			target_focus = action
		return {"control": col, "focus": target_focus}
	var focus: Control = null
	focus = _tech_group(col, I18n.t("partyMenu.spellsGroup"), spells, world, engine, ctx, member, focus)
	focus = _tech_group(col, I18n.t("partyMenu.skillsGroup"), skills, world, engine, ctx, member, focus)
	return {"control": col, "focus": focus}

static func _tech_group(host: Control, title: String, ids: Array, world: Dictionary, engine: Dictionary, ctx: Dictionary, member: Dictionary, focus: Control) -> Control:
	if ids.is_empty():
		return focus
	host.add_child(UI.label(title, 16, UI.DIM))
	for id in ids:
		var row := UI.row()
		var technique_id := String(id)
		var camp_usable := Techniques.is_camp_usable(technique_id, engine, world)
		var name_control: Control
		if camp_usable:
			var active := _can_use_camp_technique(member, technique_id, engine, world)
			var technique_button := UI.button(Techniques.label(technique_id, engine, world), func(): ctx["set_party_technique"].call(technique_id), Vector2(240, 36), 16)
			technique_button.disabled = not active
			name_control = technique_button
			if focus == null and active:
				focus = technique_button
		else:
			name_control = UI.label(Techniques.label(technique_id, engine, world), 16, UI.INK)
		row.add_child(UI.grow(name_control))
		var mp := Techniques.cost(technique_id, engine, world)
		if mp > 0:
			row.add_child(UI.label("MP %d" % mp, 14, UI.DIM))
		host.add_child(row)
		var summary := Techniques.summary(technique_id, engine, world)
		if summary != "":
			host.add_child(UI.label("　%s" % summary, 13, UI.DIM))
	return focus

static func _can_use_camp_technique(member: Dictionary, technique_id: String, engine: Dictionary, world: Dictionary = {}) -> bool:
	var statuses: Array = member.get("status", [])
	if int(member.get("hp", 0)) <= 0 or member.get("injury", null) != null or statuses.has("sleep"):
		return false
	var definition: Dictionary = Techniques._resolve_technique_catalog(engine, world).get(technique_id, {})
	if String(definition.get("kind", "")) == "spell" and statuses.has("silence"):
		return false
	return int(member.get("mp", 0)) >= Techniques.cost(technique_id, engine, world)

static func _first_button(node: Node) -> Control:
	if node is Button:
		return node
	for c in node.get_children():
		var b := _first_button(c)
		if b != null:
			return b
	return null

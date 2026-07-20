extends RefCounted
## Port of src/components/CombatCommandMenu.tsx — the PER-ACTOR command menu.
##
## The DRPG contract this preserves: orders are given one adventurer at a time (front-first), each
## actor picks 攻撃 / 防御 / 特技 / 呪文 / 道具, and a choice that needs a target opens a second STAGE
## (標的を選ぶ) rather than a free-aim cursor. Esc backs out one stage — command → actor → nothing.
## 全員でかかる stays available as the one-press round for when there is nothing to decide.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

const SPELL_LABEL := {
	"heal": "play.spellHeal", "firebolt": "play.spellFirebolt",
	"sleep": "play.spellSleep", "power-strike": "play.skillPowerStrike"
}
# The three techniques' costs mirror combat_round.SPELLS.
const SPELL_COST := {"heal": 3, "firebolt": 4, "sleep": 3, "power-strike": 3}
const SKILL_IDS := ["power-strike"]

static func technique_label(id: String) -> String:
	return I18n.t(String(SPELL_LABEL[id])) if SPELL_LABEL.has(id) else id

## Build the menu for `actor` at `stage`.
## ctx = { actor, stage, loadout, party, groups, inventory, choose: Callable(kind, payload), back: Callable }
## Returns { control, focus }.
static func build(ctx: Dictionary) -> Dictionary:
	var actor: Dictionary = ctx["actor"]
	var stage: String = String(ctx.get("stage", "command"))

	var root := UI.col(6)
	root.add_child(UI.label(I18n.t("play.commandFor", {"name": String(actor.get("name", ""))}), 20, UI.GOLD))
	root.add_child(UI.label("HP %d/%d  ・  %s %d/%d" % [
		int(actor.get("hp", 0)), int(actor.get("maxHp", 0)),
		I18n.t("play.mpShort"), int(actor.get("mp", 0)), int(actor.get("maxMp", 0))], 15, UI.INK))

	var focus: Button = null
	match stage:
		"command":
			focus = _command_stage(root, ctx, actor)
		"skill", "spell":
			focus = _technique_stage(root, ctx, actor, stage)
		"item":
			focus = _item_stage(root, ctx)
		"target-group":
			focus = _group_target_stage(root, ctx)
		"target-ally":
			focus = _ally_target_stage(root, ctx)

	root.add_child(UI.label(I18n.t("play.menuHint"), 13, UI.DIM))
	return {"control": root, "focus": focus}

static func _command_stage(root: VBoxContainer, ctx: Dictionary, actor: Dictionary) -> Button:
	var loadout: Array = ctx.get("loadout", [])
	var has_skill := false
	var has_spell := false
	for id in loadout:
		if SKILL_IDS.has(String(id)):
			has_skill = true
		else:
			has_spell = true

	var first: Button = null
	var attack := UI.button(I18n.t("play.attack"), func(): ctx["choose"].call("attack", {}), Vector2(240, 40), 17)
	root.add_child(attack)
	first = attack
	root.add_child(UI.button(I18n.t("play.defend"), func(): ctx["choose"].call("defend", {}), Vector2(240, 40), 17))
	if has_skill:
		root.add_child(UI.button(I18n.t("play.skill"), func(): ctx["choose"].call("stage", {"stage": "skill"}), Vector2(240, 40), 17))
	if has_spell:
		root.add_child(UI.button(I18n.t("play.spell"), func(): ctx["choose"].call("stage", {"stage": "spell"}), Vector2(240, 40), 17))
	if not (ctx.get("inventory", []) as Array).is_empty():
		root.add_child(UI.button(I18n.t("play.useItem"), func(): ctx["choose"].call("stage", {"stage": "item"}), Vector2(240, 40), 17))
	return first

# A technique the actor cannot pay for is shown with its cost and DISABLED — the player must be able to
# see why it is unavailable, not find it missing.
static func _technique_stage(root: VBoxContainer, ctx: Dictionary, actor: Dictionary, stage: String) -> Button:
	root.add_child(UI.label(I18n.t("play.chooseSkill" if stage == "skill" else "play.chooseSpell"), 17, UI.GOLD))
	var first: Button = null
	for id in ctx.get("loadout", []):
		var technique := String(id)
		var is_skill := SKILL_IDS.has(technique)
		if (stage == "skill") != is_skill:
			continue
		var cost := int(SPELL_COST.get(technique, 0))
		var affordable := int(actor.get("mp", 0)) >= cost
		var b := UI.button("%s  (%s %d)" % [technique_label(technique), I18n.t("play.mpShort"), cost], func(): ctx["choose"].call("technique", {"spellId": technique}), Vector2(280, 40), 16)
		b.disabled = not affordable
		root.add_child(b)
		if first == null and affordable:
			first = b
	return first

static func _item_stage(root: VBoxContainer, ctx: Dictionary) -> Button:
	root.add_child(UI.label(I18n.t("play.chooseItem"), 17, UI.GOLD))
	var first: Button = null
	for item in ctx.get("inventory", []):
		var kind := String(item.get("kind", ""))
		if kind != "healing" and kind != "cure" and kind != "focus":
			continue
		if int(item.get("quantity", 0)) <= 0:
			continue
		var item_id := String(item.get("id", ""))
		var b := UI.button("%s ×%d" % [String(item.get("name", "")), int(item.get("quantity", 0))], func(): ctx["choose"].call("item", {"itemId": item_id}), Vector2(280, 40), 16)
		root.add_child(b)
		if first == null:
			first = b
	if first == null:
		root.add_child(UI.label(I18n.t("partyMenu.inventoryEmpty"), 14, UI.DIM))
	return first

# TARGETING HAPPENS ON THE STAGE. The reticle rides the chosen creature (combat.gd draws it); this
# stage only shows WHICH creature is aimed at and how to move the aim. React deliberately moved this
# off a list — a list row is not where the player is looking.
static func _group_target_stage(root: VBoxContainer, ctx: Dictionary) -> Button:
	root.add_child(UI.label(I18n.t("play.chooseTarget"), 17, UI.GOLD))
	var living := []
	for group in ctx.get("groups", []):
		if int(group.get("count", 0)) > 0:
			living.append(group)
	if living.is_empty():
		return null
	var aimed := String(ctx.get("target_group_id", ""))
	var current: Dictionary = living[0]
	for group in living:
		if String(group.get("id", "")) == aimed:
			current = group
	# The creature under the reticle, named — the confirmation of what the stage is already showing.
	root.add_child(UI.label("%s  ×%d" % [String(ctx["enemy_name"].call(current)), int(current.get("count", 0))], 20, UI.INK))
	var row := UI.row()
	if living.size() > 1:
		row.add_child(UI.button("◀", func(): ctx["cycle_target"].call(-1), Vector2(56, 40), 17))
		row.add_child(UI.button("▶", func(): ctx["cycle_target"].call(1), Vector2(56, 40), 17))
	var confirm := UI.button(I18n.t("play.attack"), func(): ctx["choose"].call("target-group", {"targetGroupId": String(current.get("id", ""))}), Vector2(150, 40), 16)
	row.add_child(confirm)
	root.add_child(row)
	return confirm

static func _ally_target_stage(root: VBoxContainer, ctx: Dictionary) -> Button:
	root.add_child(UI.label(I18n.t("play.chooseTarget"), 17, UI.GOLD))
	var first: Button = null
	for member in ctx.get("party", []):
		if int(member.get("hp", 0)) <= 0:
			continue
		var mid := String(member.get("id", ""))
		var b := UI.button("%s  HP %d/%d" % [String(member.get("name", "")), int(member.get("hp", 0)), int(member.get("maxHp", 0))], func(): ctx["choose"].call("target-ally", {"targetCharacterId": mid}), Vector2(280, 40), 16)
		root.add_child(b)
		if first == null:
			first = b
	return first

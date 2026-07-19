extends RefCounted
## Faithful port of src/components/QuestBoardPanel.tsx — standing bounties and delivery tithes.
##
## A contract is only decidable when the player can see its OBJECTIVE, its PROGRESS toward that
## objective, and its REWARD broken down. A row that says only "受注する" is the thin-list failure;
## these rows carry kind, status, description, objective, count/required, reward parts, repeatable and
## how many times it has been claimed.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

const STATUS_KEY := {
	"available": "questBoard.statusAvailable",
	"active": "questBoard.statusActive",
	"ready": "questBoard.statusReady",
	"done": "questBoard.statusDone"
}

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var world: Dictionary = ctx["world"]

	var root := UI.col(10)
	root.add_child(UI.service_heading(I18n.t("questBoard.title"), I18n.t("town.gold", {"gold": int(state.get("partyGold", 0))})))
	root.add_child(UI.prose(I18n.t("questBoard.intro"), 16, UI.DIM, 900))
	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	var progress_by_id := {}
	for p in state.get("quests", []):
		progress_by_id[String(p.get("questId", ""))] = p

	var quests: Array = world.get("quests", [])
	var focus_target: Button = null
	if quests.is_empty():
		root.add_child(UI.label(I18n.t("questBoard.empty"), 16, UI.DIM))
	else:
		var list := UI.col(8)
		for quest in quests:
			var result := _quest_row(ctx, world, state, quest, progress_by_id)
			list.add_child(result["control"])
			if focus_target == null and result["action"] != null:
				focus_target = result["action"]
		root.add_child(UI.scroller(list, Vector2(1080, 460)))

	var back := UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(back)
	root.add_child(foot)
	ctx["focus_hint"].call(focus_target if focus_target else back)
	return root

static func _target_name(world: Dictionary, quest: Dictionary) -> String:
	if quest.get("kind", "") == "bounty":
		for enemy in world.get("enemies", []):
			if enemy.get("id", "") == quest.get("targetEnemyId", ""):
				return Fmt.localized_enemy_name(world, enemy)
		return String(quest.get("targetEnemyId", ""))
	return Fmt.localized_catalog_name(world, quest.get("targetItemId", ""))

static func _reward_text(world: Dictionary, quest: Dictionary) -> String:
	var reward: Dictionary = quest.get("reward", {})
	var parts := []
	if int(reward.get("gold", 0)) > 0:
		parts.append(I18n.t("questBoard.rewardGold", {"gold": int(reward.get("gold", 0))}))
	if int(reward.get("xp", 0)) > 0:
		parts.append(I18n.t("questBoard.rewardXp", {"xp": int(reward.get("xp", 0))}))
	if typeof(reward.get("itemId", null)) == TYPE_STRING:
		var name := Fmt.localized_catalog_name(world, reward.get("itemId"))
		var qty := int(reward.get("itemQuantity", 1))
		parts.append("%s ×%d" % [name, qty] if qty > 1 else name)
	return I18n.t("questBoard.rewardSeparator").join(PackedStringArray(parts))

static func _current_count(state: Dictionary, quest: Dictionary, progress: Variant) -> int:
	if quest.get("kind", "") == "delivery" and typeof(quest.get("targetItemId", null)) == TYPE_STRING:
		var total := 0
		for item in state.get("inventory", []):
			if item.get("id", "") == quest.get("targetItemId"):
				total += int(item.get("quantity", 0))
		return total
	return int(progress.get("killCount", 0)) if typeof(progress) == TYPE_DICTIONARY else 0

static func _quest_row(ctx: Dictionary, world: Dictionary, state: Dictionary, quest: Dictionary, progress_by_id: Dictionary) -> Dictionary:
	var qid := String(quest.get("id", ""))
	var progress: Variant = progress_by_id.get(qid, null)
	var required := int(quest.get("requiredCount", 1))
	var count := _current_count(state, quest, progress)
	var claims := int(progress.get("claims", 0)) if typeof(progress) == TYPE_DICTIONARY else 0

	var status := "available"
	if typeof(progress) == TYPE_DICTIONARY:
		if progress.get("status", "") == "done":
			status = "done"
		elif count >= required:
			status = "ready"
		else:
			status = "active"

	var body := UI.col(4)
	var head := UI.row()
	head.add_child(UI.label(I18n.t("questBoard.kindBounty" if quest.get("kind", "") == "bounty" else "questBoard.kindDelivery"), 14, UI.DIM))
	head.add_child(UI.grow(UI.label(Fmt.localized_quest_name(quest), 18, UI.INK)))
	head.add_child(UI.label(I18n.t(String(STATUS_KEY[status])), 15, UI.OK if status == "ready" else (UI.DIM if status == "done" else UI.GOLD)))
	body.add_child(head)

	var desc := Fmt.localized_quest_description(quest)
	if desc != "":
		body.add_child(UI.prose(desc, 14, UI.DIM, 900))

	var meta := UI.row()
	meta.add_child(UI.label(I18n.t("questBoard.objectiveBounty" if quest.get("kind", "") == "bounty" else "questBoard.objectiveDelivery", {"target": _target_name(world, quest), "count": required}), 15, UI.INK))
	meta.add_child(UI.label(I18n.t("questBoard.progress", {"count": count, "required": required}), 15, UI.OK if count >= required else UI.DIM))
	meta.add_child(UI.label("%s: %s" % [I18n.t("questBoard.reward"), _reward_text(world, quest)], 15, UI.INK))
	if bool(quest.get("repeatable", false)):
		meta.add_child(UI.label(I18n.t("questBoard.repeatable"), 13, UI.DIM))
	if claims > 0:
		meta.add_child(UI.label(I18n.t("questBoard.claimedTimes", {"count": claims}), 13, UI.DIM))
	body.add_child(meta)

	var action: Button = null
	if status == "available":
		action = UI.button(I18n.t("questBoard.accept"), func(): ctx["dispatch"].call({"type": "accept_quest", "questId": qid}), Vector2(170, 38), 15)
		body.add_child(action)
	elif status == "ready":
		action = UI.button(I18n.t("questBoard.turnIn" if quest.get("kind", "") == "delivery" else "questBoard.claim"), func(): ctx["dispatch"].call({"type": "claim_quest", "questId": qid}), Vector2(190, 38), 15)
		body.add_child(action)

	return {"control": UI.card(body), "action": action}

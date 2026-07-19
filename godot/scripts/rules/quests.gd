extends RefCounted
## Port of the quest commands (src/domain/commands/questCommands.ts + quests.ts): accept_quest /
## claim_quest, town-only. A claim grants gold + XP (through the level curve, so it can level the party)
## and, for a delivery, consumes the handed-over items; a repeatable quest resets to active, a one-shot
## ends done. XP goes through Leveling (bypassing the combat out-levelling falloff by construction).

const Leveling := preload("res://scripts/rules/leveling.gd")
const Economy := preload("res://scripts/rules/economy.gd")

static func find_quest(world: Dictionary, quest_id: String) -> Variant:
	for q in world.get("quests", []):
		if q.get("id", "") == quest_id:
			return q
	return null

static func get_quest_progress(state: Dictionary, quest_id: String) -> Variant:
	for p in state.get("quests", []):
		if p.get("questId", "") == quest_id:
			return p
	return null

static func _carried_quantity(state: Dictionary, item_id: String) -> int:
	var total := 0
	for item in state.get("inventory", []):
		if item.get("id", "") == item_id:
			total += int(item.get("quantity", 0))
	return total

static func _current_objective_count(state: Dictionary, quest: Dictionary, progress: Variant) -> int:
	if quest.get("kind", "") == "delivery":
		var tid: Variant = quest.get("targetItemId", null)
		return _carried_quantity(state, tid) if typeof(tid) == TYPE_STRING else 0
	return int(progress.get("killCount", 0)) if typeof(progress) == TYPE_DICTIONARY else 0

static func _is_ready(state: Dictionary, quest: Dictionary, progress: Variant) -> bool:
	return typeof(progress) == TYPE_DICTIONARY and progress.get("status", "") == "active" and _current_objective_count(state, quest, progress) >= int(quest.get("requiredCount", 1))

static func accept(state: Dictionary, world: Dictionary, quest_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var quest: Variant = find_quest(world, quest_id)
	if typeof(quest) != TYPE_DICTIONARY or typeof(get_quest_progress(state, quest_id)) == TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	(next["quests"] as Array).append({"questId": quest_id, "status": "active", "killCount": 0, "claims": 0})
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "quest_accepted", "questId": quest_id, "questName": quest.get("name", "")}]}

static func claim(state: Dictionary, world: Dictionary, quest_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var quest: Variant = find_quest(world, quest_id)
	var progress: Variant = get_quest_progress(state, quest_id)
	if typeof(quest) != TYPE_DICTIONARY or not _is_ready(state, quest, progress):
		return {"state": state, "events": []}

	var reward: Dictionary = quest.get("reward", {})
	var xp_grant := int(reward.get("xp", 0))
	var level_events := []
	var party := (state.get("party", []) as Array).duplicate(true)
	if xp_grant > 0:
		var grown := []
		for member in party:
			var m: Dictionary = member.duplicate(true)
			m["xp"] = int(m.get("xp", 0)) + xp_grant
			var leveled := Leveling.apply_level_ups(m)
			grown.append(leveled["character"])
			level_events.append_array(leveled["events"])
		party = grown

	var inventory := (state.get("inventory", []) as Array).duplicate(true)
	if quest.get("kind", "") == "delivery" and typeof(quest.get("targetItemId", null)) == TYPE_STRING:
		inventory = Economy.remove_inventory_item(inventory, quest["targetItemId"], int(quest.get("requiredCount", 1)), null, null)
	var reward_item_name: Variant = null
	if typeof(reward.get("itemId", null)) == TYPE_STRING:
		var reward_item: Variant = Economy.create_inventory_item(world, reward["itemId"], int(reward.get("itemQuantity", 1)))
		if typeof(reward_item) == TYPE_DICTIONARY:
			inventory = Economy.add_inventory_item(inventory, reward_item)
			reward_item_name = reward_item.get("name", "")

	var claimed: Dictionary = (progress as Dictionary).duplicate(true)
	claimed["claims"] = int(claimed.get("claims", 0)) + 1
	claimed["killCount"] = 0
	claimed["status"] = "active" if quest.get("repeatable", false) else "done"

	var next: Dictionary = state.duplicate(true)
	next["party"] = party
	next["partyGold"] = int(next.get("partyGold", 0)) + int(reward.get("gold", 0))
	next["inventory"] = inventory
	var quests := []
	for entry in next.get("quests", []):
		quests.append(claimed if entry.get("questId", "") == quest_id else entry)
	next["quests"] = quests
	next["turn"] = int(next.get("turn", 0)) + 1

	var event := {"type": "quest_claimed", "questId": quest_id, "questName": quest.get("name", ""), "gold": int(reward.get("gold", 0)), "xp": xp_grant}
	if reward_item_name != null:
		event["itemName"] = reward_item_name
	var events := [event]
	events.append_array(level_events)
	return {"state": next, "events": events}

extends RefCounted
## Port of src/domain/exploration.ts — WHO made an exploration attempt, and with what.
##
## The chest commands used to scan the party, pick the best score and act, so the player could not send
## anyone and learned who had gone only from a name in the log (docs/design/class-system.md §7, §8.2). An
## attempt now names its actor: a DECLARED one is obeyed, even an untrained one, because sending the
## wrong adventurer is a decision the player is allowed to make. When nobody is named the automatic pick
## is still taken — nothing already saved or scripted breaks — but the event REPORTS it as automatic
## rather than passing it off as the player's choice.
##
## Proficiency comes from the exported class contract (engine-data.json `classCapabilities`), so the
## runtime and the TypeScript oracle read one table. An unlisted action is `untrained`: worse odds, never
## a refusal.

const SPECIALIST_BONUS := 8
const TRAINED_BONUS := 4

## The class's declared proficiency for an action, from the exported contract. Falls back to the legacy
## `trap_handling` role tag so a character loaded from an older save keeps a skill it already had.
static func proficiency_for(member: Dictionary, engine: Dictionary, action: String) -> String:
	var capabilities: Dictionary = engine.get("classCapabilities", {})
	var entry: Variant = capabilities.get(String(member.get("classId", "")), null)
	if typeof(entry) == TYPE_DICTIONARY:
		var declared: Variant = (entry.get("exploration", {}) as Dictionary).get(action, null)
		if typeof(declared) == TYPE_STRING:
			return String(declared)
	if (member.get("roleTags", []) as Array).has("trap_handling"):
		return "specialist"
	return "untrained"

static func proficiency_bonus(proficiency: String) -> int:
	match proficiency:
		"specialist":
			return SPECIALIST_BONUS
		"trained":
			return TRAINED_BONUS
		_:
			return 0

## The check's total before the roll: level, aptitude, the class's proficiency, and any aid. Mirrors
## chests.trapSkill exactly, which is why an un-declared attempt still scores what it always scored.
static func attempt_skill(member: Dictionary, engine: Dictionary, action: String) -> int:
	var apt: Dictionary = member.get("aptitude", {})
	var declared := proficiency_bonus(proficiency_for(member, engine, action))
	return int(member.get("level", 1)) + int(apt.get("agility", 0)) * 2 + int(apt.get("wit", 0)) + int(apt.get("luck", 0)) + declared

static func able_members(party: Array) -> Array:
	var able := []
	for member in party:
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null:
			able.append(member)
	return able

## The player is told which wall they hit, without being shown a percentage.
static func difficulty_band(difficulty: int) -> String:
	if difficulty <= 8:
		return "routine"
	if difficulty <= 14:
		return "tricky"
	if difficulty <= 20:
		return "severe"
	return "deadly"

## Resolve one attempt. Returns { actor, skill, proficiency, selection, band, itemConsumed, inventory,
## refused } — `refused` is set (and everything else meaningless) when a named adventurer cannot act.
static func resolve_attempt(state: Dictionary, world: Dictionary, engine: Dictionary, action: String, difficulty: int, character_id: String = "", item_id: String = "") -> Dictionary:
	var able := able_members(state.get("party", []))
	var actor: Variant = null
	var selection := "automatic"

	if character_id != "":
		selection = "declared"
		for member in able:
			if String(member.get("id", "")) == character_id:
				actor = member
				break
		if actor == null:
			return {"refused": "actor_unavailable"}
	elif not able.is_empty():
		var best: Dictionary = able[0]
		for member in able:
			if attempt_skill(member, engine, action) > attempt_skill(best, engine, action):
				best = member
		actor = best

	# An item buys a better attempt for a party with no specialist (§4). Spent whether it wins or loses.
	var aid := _find_aid(state, world, item_id, action)
	var inventory: Array = state.get("inventory", [])
	var consumed := ""
	if not aid.is_empty():
		consumed = String(aid["itemId"])
		inventory = _consume(inventory, consumed)

	var proficiency := proficiency_for(actor, engine, action) if typeof(actor) == TYPE_DICTIONARY else "untrained"
	var skill := (attempt_skill(actor, engine, action) if typeof(actor) == TYPE_DICTIONARY else 0) + int(aid.get("bonus", 0))
	return {
		"action": action,
		"actor": actor,
		"skill": skill,
		"proficiency": proficiency,
		"selection": selection,
		"band": difficulty_band(difficulty),
		"itemConsumed": consumed,
		"inventory": inventory,
		"refused": ""
	}

## Write the attempt record onto the event the command emits — who took the risk, how they were chosen,
## against which band, and what it cost.
static func stamp_event(event: Dictionary, attempt: Dictionary) -> void:
	var actor: Variant = attempt.get("actor", null)
	if typeof(actor) == TYPE_DICTIONARY:
		event["actorId"] = String(actor.get("id", ""))
	event["action"] = attempt.get("action", event.get("action", ""))
	event["selection"] = attempt.get("selection", "automatic")
	event["proficiency"] = attempt.get("proficiency", "untrained")
	event["difficultyBand"] = attempt.get("band", "routine")
	if String(attempt.get("itemConsumed", "")) != "":
		event["itemConsumed"] = String(attempt["itemConsumed"])

static func _find_aid(state: Dictionary, world: Dictionary, item_id: String, action: String) -> Dictionary:
	if item_id == "":
		return {}
	var held := false
	for item in state.get("inventory", []):
		if String(item.get("id", "")) == item_id and int(item.get("quantity", 0)) > 0:
			held = true
			break
	if not held:
		return {}
	for item in world.get("items", []):
		if String(item.get("id", "")) != item_id:
			continue
		var aid: Variant = item.get("explorationAid", null)
		if typeof(aid) != TYPE_DICTIONARY:
			return {}
		if not (aid.get("actions", []) as Array).has(action):
			return {}
		return {"itemId": item_id, "bonus": int(aid.get("bonus", 0))}
	return {}

static func _consume(inventory: Array, item_id: String) -> Array:
	var out := []
	for item in inventory:
		if String(item.get("id", "")) != item_id:
			out.append(item)
			continue
		var next: Dictionary = (item as Dictionary).duplicate(true)
		next["quantity"] = int(next.get("quantity", 0)) - 1
		if int(next["quantity"]) > 0:
			out.append(next)
	return out

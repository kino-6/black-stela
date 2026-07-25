extends RefCounted
## Item-use commands, extracted VERBATIM from slice_rules (IMP-050): a consumable heals, an ESCAPE charm
## goes home (barred on the boss floor — the finale is a commitment), a GROWTH item permanently raises an
## adventurer. Pure — {state, events}, no scene/input/fs. Turn increments, seeds, event text and dict shape
## are unchanged; the growth-items and escape-resume golden traces prove parity.

const RosterUtil := preload("res://scripts/rules/roster_util.gd")
const CombatRound := preload("res://scripts/rules/combat_round.gd")
const Leveling := preload("res://scripts/rules/leveling.gd")

# use_item outside combat: an ESCAPE charm goes home, a GROWTH item permanently raises an adventurer,
# a consumable heals. The escape charm is barred on the boss floor — the finale is a commitment.
static func use_item(state: Dictionary, world: Dictionary, item_id: String, target_id: String) -> Dictionary:
	var item: Variant = _find_inventory_item(state, item_id)
	if typeof(item) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var kind := String(item.get("kind", ""))

	if kind == "escape":
		if state.get("phase", "") != "dungeon" or state.get("position", null) == null:
			return {"state": state, "events": []}
		if _is_boss_floor(world, (state.get("map", {}) as Dictionary).get("floorId", null)):
			return _log_only(state, {"type": "command_blocked", "reason": "town_return_unavailable", "command": "return_to_town"})
		var escaped: Dictionary = state.duplicate(true)
		escaped["phase"] = "town"
		escaped["position"] = null
		escaped["combat"] = null
		escaped["map"]["currentRoomId"] = null
		escaped["map"]["currentCellId"] = null
		escaped["map"]["currentFacing"] = null
		escaped["inventory"] = _spend_one(escaped.get("inventory", []), item_id)
		escaped["turn"] = int(escaped.get("turn", 0)) + 1
		return {"state": escaped, "events": [{"type": "returned_to_town"}]}

	if kind == "growth" and typeof(item.get("grants", null)) == TYPE_DICTIONARY:
		return _use_growth_item(state, item, target_id)

	var target := RosterUtil.find_by_id(state.get("party", []), target_id)
	if target.is_empty() or not (kind == "healing" or kind == "cure" or kind == "focus"):
		return {"state": state, "events": []}
	var applied := CombatRound._apply_healing_item(state.get("party", []), state.get("inventory", []), item_id, target_id, world)
	var next: Dictionary = state.duplicate(true)
	next["party"] = applied["party"]
	next["inventory"] = applied["inventory"]
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "item_used", "itemId": item.get("id", ""), "itemName": item.get("name", ""), "targetCharacterId": target_id, "targetName": target.get("name", ""), "healAmount": int(item.get("healAmount", 0))}]}

# A GROWTH item raises aptitudes/stats permanently; granted xp goes through the level curve.
static func _use_growth_item(state: Dictionary, item: Dictionary, target_id: String) -> Dictionary:
	if state.get("phase", "") == "combat":
		return {"state": state, "events": []}
	var target := RosterUtil.find_by_id(state.get("party", []), target_id)
	var grants: Dictionary = item.get("grants", {})
	if target.is_empty():
		return {"state": state, "events": []}
	var level_before := int(target.get("level", 1))

	var grown := []
	var grown_target := {}
	for member in state.get("party", []):
		if String(member.get("id", "")) != target_id:
			grown.append(member)
			continue
		var m: Dictionary = member.duplicate(true)
		var apt: Dictionary = (m.get("aptitude", {}) as Dictionary).duplicate(true)
		for key in ["might", "agility", "spirit", "wit", "luck"]:
			apt[key] = int(apt.get(key, 0)) + int(grants.get(key, 0))
		m["aptitude"] = apt
		m["maxHp"] = int(m.get("maxHp", 0)) + int(grants.get("maxHp", 0))
		m["hp"] = int(m.get("hp", 0)) + int(grants.get("maxHp", 0))   # the new HP is usable immediately
		m["maxMp"] = int(m.get("maxMp", 0)) + int(grants.get("maxMp", 0))
		m["mp"] = int(m.get("mp", 0)) + int(grants.get("maxMp", 0))
		m["attack"] = int(m.get("attack", 0)) + int(grants.get("attack", 0))
		m["damageMin"] = int(m.get("damageMin", 0)) + int(grants.get("attack", 0))
		m["damageMax"] = int(m.get("damageMax", 0)) + int(grants.get("attack", 0))
		m["xp"] = int(m.get("xp", 0)) + int(grants.get("xp", 0))
		if int(grants.get("xp", 0)) != 0:
			m = Leveling.apply_level_ups(m)["character"]
		grown_target = m
		grown.append(m)

	var next: Dictionary = state.duplicate(true)
	next["party"] = grown
	next["inventory"] = _spend_one(next.get("inventory", []), String(item.get("id", "")))
	next["turn"] = int(next.get("turn", 0)) + 1
	var events: Array = [{"type": "item_used", "itemId": item.get("id", ""), "itemName": item.get("name", ""), "targetCharacterId": target_id, "targetName": target.get("name", ""), "healAmount": 0}]
	if int(grown_target.get("level", 1)) > level_before:
		events.append({"type": "character_leveled_up", "characterId": target_id, "characterName": grown_target.get("name", ""), "level": int(grown_target.get("level", 1))})
	return {"state": next, "events": events}

# --- module-internal helpers (item-only; moved with their sole consumer) -----------------------------
static func _find_inventory_item(state: Dictionary, item_id: String) -> Variant:
	for candidate in state.get("inventory", []):
		if candidate.get("id", "") == item_id and int(candidate.get("quantity", 0)) > 0:
			return candidate
	return null

static func _spend_one(inventory: Array, item_id: String) -> Array:
	var out := []
	for candidate in inventory:
		if candidate.get("id", "") == item_id:
			var c: Dictionary = candidate.duplicate(true)
			c["quantity"] = maxi(0, int(c.get("quantity", 0)) - 1)
			out.append(c)
		else:
			out.append(candidate)
	return out

static func _is_boss_floor(world: Dictionary, floor_id: Variant) -> bool:
	for dungeon in world.get("dungeons", []):
		if dungeon.get("id", "") == floor_id:
			return (dungeon.get("tags", []) as Array).has("boss")
	return false

# Verbatim copy of the dispatcher's _log_only (duplicates state + increments turn) so this leaf stays
# self-contained; a later slice can hoist it into a shared rules util once more consumers are extracted.
static func _log_only(state: Dictionary, event: Dictionary) -> Dictionary:
	var next: Dictionary = state.duplicate(true)
	next["turn"] = int(next["turn"]) + 1
	return {"state": next, "events": [event]}

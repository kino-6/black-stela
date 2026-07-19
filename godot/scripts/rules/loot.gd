extends RefCounted
## Port of the loot / workshop commands (src/domain/commands/economyCommands.ts + loot.ts):
## appraise_item, toggle_item_lock, toggle_item_favorite, reinforce_equipment, bulk_convert. All
## town-only. Appraisal spends gold to reveal a rare's affix; reinforce spends materials to +1 a worn
## piece; bulk_convert sells/dismantles every UNPROTECTED equipment (equipped/locked/favorite/
## unidentified-rare are spared). The toggle flags carry no turn cost; the others advance the turn.

const Economy := preload("res://scripts/rules/economy.gd")

const MAX_REINFORCE := 5
const RARITY_ORDER := ["common", "rare", "epic"]
const RARITY_APPRAISAL_FEE := {"common": 0, "rare": 20, "epic": 55}
const RARITY_SELL_BONUS := {"common": 0, "rare": 12, "epic": 30}
const RARITY_MATERIALS := {"common": 1, "rare": 2, "epic": 4}

static func rarity_rank(rarity: Variant) -> int:
	var r := String(rarity) if typeof(rarity) == TYPE_STRING else "common"
	return RARITY_ORDER.find(r)

static func is_unidentified_rare(item: Dictionary) -> bool:
	return rarity_rank(item.get("rarity", null)) >= 1 and item.get("identified", null) == false

static func appraisal_fee(item: Dictionary) -> int:
	var r := String(item.get("rarity", "common")) if typeof(item.get("rarity", null)) == TYPE_STRING else "common"
	return int(RARITY_APPRAISAL_FEE.get(r, 0))

static func reinforce_cost(current_plus: int) -> int:
	return (current_plus + 1) * 2

# appraise_item: pay the reading fee, flip identified→true, reveal the affix. Rare/unidentified only.
static func appraise(state: Dictionary, instance_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var item: Variant = null
	for candidate in state.get("inventory", []):
		if candidate.get("instanceId", "") == instance_id:
			item = candidate
			break
	if typeof(item) != TYPE_DICTIONARY or not is_unidentified_rare(item):
		return {"state": state, "events": []}
	var fee := appraisal_fee(item)
	if int(state.get("partyGold", 0)) < fee:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["partyGold"] = int(next.get("partyGold", 0)) - fee
	var inventory := []
	for candidate in next.get("inventory", []):
		if candidate.get("instanceId", "") == instance_id:
			var revealed: Dictionary = candidate.duplicate(true)
			revealed["identified"] = true
			inventory.append(revealed)
		else:
			inventory.append(candidate)
	next["inventory"] = inventory
	next["turn"] = int(next.get("turn", 0)) + 1
	var event := {"type": "item_appraised", "itemId": item.get("id", ""), "itemName": item.get("name", ""), "affix": item.get("affix", null), "rarity": item.get("rarity", "rare"), "cost": fee}
	return {"state": next, "events": [event]}

# toggle_item_lock / toggle_item_favorite: flip a per-instance protection flag. No turn cost, no event.
static func toggle_flag(state: Dictionary, instance_id: String, flag: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var found := false
	for candidate in state.get("inventory", []):
		if candidate.get("instanceId", "") == instance_id:
			found = true
			break
	if not found:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	var inventory := []
	for candidate in next.get("inventory", []):
		if candidate.get("instanceId", "") == instance_id:
			var flagged: Dictionary = candidate.duplicate(true)
			flagged[flag] = not bool(flagged.get(flag, false))
			inventory.append(flagged)
		else:
			inventory.append(candidate)
	next["inventory"] = inventory
	return {"state": next, "events": []}

# reinforce_equipment: spend materials to +1 a WORN slot's plus. Guards: town, worn, under the cap,
# affordable. Never spends past what it has, never exceeds MAX_REINFORCE.
static func reinforce(state: Dictionary, world: Dictionary, character_id: String, slot: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member: Variant = null
	for candidate in state.get("party", []):
		if candidate.get("id", "") == character_id:
			member = candidate
			break
	if typeof(member) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var equipped: Variant = (member.get("equipment", {}) as Dictionary).get(slot, null)
	if typeof(equipped) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var current_plus := int(equipped.get("plus", 0))
	var cost := reinforce_cost(current_plus)
	if current_plus >= MAX_REINFORCE or int(state.get("materials", 0)) < cost:
		return {"state": state, "events": []}
	var next_plus := current_plus + 1
	var definition: Variant = null
	for candidate in world.get("equipment", []):
		if candidate.get("id", "") == equipped.get("id", ""):
			definition = candidate
			break
	var next: Dictionary = state.duplicate(true)
	next["materials"] = int(next.get("materials", 0)) - cost
	var party := []
	for candidate in next.get("party", []):
		if candidate.get("id", "") == character_id:
			var grown: Dictionary = candidate.duplicate(true)
			var equipment: Dictionary = (grown.get("equipment", {}) as Dictionary).duplicate(true)
			var piece: Dictionary = (equipment.get(slot) as Dictionary).duplicate(true)
			piece["plus"] = next_plus
			equipment[slot] = piece
			grown["equipment"] = equipment
			party.append(grown)
		else:
			party.append(candidate)
	next["party"] = party
	next["turn"] = int(next.get("turn", 0)) + 1
	var item_name := String(definition.get("name", equipped.get("id", ""))) if typeof(definition) == TYPE_DICTIONARY else String(equipped.get("id", ""))
	var event := {"type": "equipment_reinforced", "characterName": member.get("name", ""), "itemId": equipped.get("id", ""), "itemName": item_name, "slot": slot, "plus": next_plus, "cost": cost}
	return {"state": next, "events": [event]}

static func equipped_instance_keys(state: Dictionary) -> Dictionary:
	var keys := {}
	for member in state.get("party", []):
		for equipped in (member.get("equipment", {}) as Dictionary).values():
			if typeof(equipped) == TYPE_DICTIONARY:
				keys[Economy.equipment_instance_key(equipped.get("id", ""), equipped.get("plus", null), equipped.get("affix", null))] = true
	return keys

static func is_protected_from_bulk(item: Dictionary, equipped_keys: Dictionary) -> bool:
	if bool(item.get("locked", false)) or bool(item.get("favorite", false)) or is_unidentified_rare(item):
		return true
	return equipped_keys.has(Economy.equipment_instance_key(item.get("id", ""), item.get("plus", null), item.get("affix", null)))

static func sell_value_of(item: Dictionary) -> int:
	var r := String(item.get("rarity", "common")) if typeof(item.get("rarity", null)) == TYPE_STRING else "common"
	return int(item.get("sellValue", 0)) + int(RARITY_SELL_BONUS.get(r, 0))

static func dismantle_yield(item: Dictionary) -> int:
	var r := String(item.get("rarity", "common")) if typeof(item.get("rarity", null)) == TYPE_STRING else "common"
	return int(RARITY_MATERIALS.get(r, 1)) * maxi(1, int(item.get("quantity", 1)))

# bulk_convert: sell-or-dismantle every unprotected equipment, optionally scoped to a rarity list.
static func bulk_convert(state: Dictionary, mode: String, rarities: Variant) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var rarity_filter: Variant = null
	if typeof(rarities) == TYPE_ARRAY and (rarities as Array).size() > 0:
		rarity_filter = {}
		for r in rarities:
			rarity_filter[String(r)] = true
	var equipped_keys := equipped_instance_keys(state)
	var convertible := []
	for item in state.get("inventory", []):
		if item.get("kind", "") != "equipment":
			continue
		if is_protected_from_bulk(item, equipped_keys):
			continue
		if rarity_filter != null and not (rarity_filter as Dictionary).has(String(item.get("rarity", "common"))):
			continue
		convertible.append(item)
	if convertible.is_empty():
		return {"state": state, "events": []}
	var gold_gained := 0
	var materials_gained := 0
	var converted_count := 0
	var converted_keys := {}
	for item in convertible:
		if mode == "sell":
			gold_gained += sell_value_of(item) * int(item.get("quantity", 1))
		elif mode == "dismantle":
			materials_gained += dismantle_yield(item)
		converted_count += int(item.get("quantity", 1))
		converted_keys[_bulk_key(item)] = true
	var next: Dictionary = state.duplicate(true)
	var inventory := []
	for item in next.get("inventory", []):
		if not converted_keys.has(_bulk_key(item)):
			inventory.append(item)
	next["inventory"] = inventory
	next["partyGold"] = int(next.get("partyGold", 0)) + gold_gained
	next["materials"] = int(next.get("materials", 0)) + materials_gained
	next["turn"] = int(next.get("turn", 0)) + 1
	var event := {"type": "bulk_converted", "mode": mode, "count": converted_count, "gold": gold_gained, "materials": materials_gained}
	return {"state": next, "events": [event]}

static func _bulk_key(item: Dictionary) -> String:
	var iid: Variant = item.get("instanceId", null)
	if typeof(iid) == TYPE_STRING:
		return String(iid)
	return Economy.equipment_instance_key(item.get("id", ""), item.get("plus", null), item.get("affix", null))

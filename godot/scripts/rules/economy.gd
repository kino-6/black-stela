extends RefCounted
## GDScript port of the town economy (src/domain/economy.ts + commands/economyCommands.ts): buy / sell /
## equip / discard, plus the inventory + equipment helpers they share. State-hash parity requires the
## built item dict to carry EXACTLY the fields TS emits — undefined catalog fields are omitted in JSON,
## so create_inventory_item copies an optional field only when the catalog entry has it.

const CharacterStats := preload("res://scripts/rules/character_stats.gd")

const RECOVERY_HP_COST := 1
const RECOVERY_INJURY_COST := 8

const ITEM_OPTIONAL := ["healAmount", "restoreMp", "curesStatuses", "grants", "sellValue"]
const EQUIP_OPTIONAL := ["attackBonus", "defenseBonus", "accuracyBonus", "speedBonus", "sellValue"]
const PROTECTED_KINDS := ["key", "treasure", "escape"]

static func equipment_instance_key(id: String, plus: Variant, affix: Variant) -> String:
	var p := ("+%d" % int(plus)) if (plus != null and int(plus) != 0) else ""
	var a := ("@%s" % String(affix)) if (affix != null and String(affix) != "") else ""
	return "%s%s%s" % [id, p, a]

static func _key_of(item: Dictionary) -> String:
	return equipment_instance_key(item.get("id", ""), item.get("plus", null), item.get("affix", null))

static func find_catalog_item(world: Dictionary, id: String) -> Variant:
	for it in world.get("items", []):
		if it.get("id", "") == id:
			return it
	return null

static func find_equipment(world: Dictionary, id: String) -> Variant:
	for eq in world.get("equipment", []):
		if eq.get("id", "") == id:
			return eq
	return null

static func get_equipment_slot(world: Dictionary, id: String) -> Variant:
	var eq: Variant = find_equipment(world, id)
	return eq.get("slot", null) if typeof(eq) == TYPE_DICTIONARY else null

static func is_equipment_usable_by(equipment: Dictionary, character: Dictionary) -> bool:
	var allowed: Variant = equipment.get("allowedClasses", null)
	if typeof(allowed) != TYPE_ARRAY or (allowed as Array).is_empty():
		return true
	return allowed.has(character.get("classId", ""))

static func create_inventory_item(world: Dictionary, item_id: String, quantity: int) -> Variant:
	var it: Variant = find_catalog_item(world, item_id)
	if typeof(it) == TYPE_DICTIONARY:
		var out := {"id": it.get("id", ""), "name": it.get("name", ""), "kind": it.get("kind", ""), "quantity": quantity}
		for k in ITEM_OPTIONAL:
			if it.has(k):
				out[k] = it[k]
		return out
	var eq: Variant = find_equipment(world, item_id)
	if typeof(eq) == TYPE_DICTIONARY:
		var out := {"id": eq.get("id", ""), "name": eq.get("name", ""), "kind": "equipment", "quantity": quantity, "slot": eq.get("slot", "")}
		for k in EQUIP_OPTIONAL:
			if eq.has(k):
				out[k] = eq[k]
		return out
	return null

static func add_inventory_item(inventory: Array, item: Dictionary) -> Array:
	if item.get("instanceId", null) != null:
		return inventory + [item]
	var key := _key_of(item)
	var out := []
	var merged := false
	for cand in inventory:
		if _key_of(cand) == key:
			var c: Dictionary = cand.duplicate(true)
			c["quantity"] = int(c.get("quantity", 0)) + int(item.get("quantity", 0))
			out.append(c)
			merged = true
		else:
			out.append(cand)
	if not merged:
		out.append(item)
	return out

static func remove_inventory_item(inventory: Array, item_id: String, quantity: int, plus: Variant, affix: Variant) -> Array:
	var key := equipment_instance_key(item_id, plus, affix)
	var out := []
	for item in inventory:
		if _key_of(item) == key:
			var c: Dictionary = item.duplicate(true)
			c["quantity"] = maxi(0, int(c.get("quantity", 0)) - quantity)
			if int(c["quantity"]) > 0:
				out.append(c)
		else:
			out.append(item)
	return out

static func is_stock_available(stock: Dictionary, state: Dictionary) -> bool:
	if stock.get("availability", "") == "unlocked" and stock.get("unlockFlag", null) != null:
		return (state.get("discoveredSecrets", []) as Array).has(stock["unlockFlag"])
	return stock.get("availability", "") != "unlocked"

# --- recovery (infirmary) -------------------------------------------------------------------------
static func recovery_cost(party: Array, world: Dictionary) -> int:
	var total := 0
	for member in party:
		total += maxi(0, int(member.get("maxHp", 0)) - int(member.get("hp", 0))) * RECOVERY_HP_COST
		if member.get("injury", null) != null:
			total += RECOVERY_INJURY_COST
	return total

static func recover(state: Dictionary, world: Dictionary) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var cost := recovery_cost(state.get("party", []), world)
	if int(state.get("partyGold", 0)) < cost:
		var blocked: Dictionary = state.duplicate(true)
		blocked["turn"] = int(blocked.get("turn", 0)) + 1
		return {"state": blocked, "events": [{"type": "recovery_blocked", "goldRequired": cost, "goldAvailable": int(state.get("partyGold", 0))}]}
	var next: Dictionary = state.duplicate(true)
	for member in next["party"]:
		var stats := CharacterStats.effective(member, world)
		member["hp"] = int(stats.get("maxHp", member.get("maxHp", 0)))
		member["mp"] = int(stats.get("maxMp", member.get("maxMp", 0)))
		member.erase("injury")
	next["partyGold"] = int(next.get("partyGold", 0)) - cost
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "party_recovered", "gold": cost}]}

# --- commands -------------------------------------------------------------------------------------
static func buy(state: Dictionary, world: Dictionary, shop_id: String, item_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var shop: Variant = null
	for s in world.get("shops", []):
		if s.get("id", "") == shop_id:
			shop = s
			break
	if typeof(shop) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var stock: Variant = null
	for st in shop.get("stock", []):
		if st.get("itemId", "") == item_id:
			stock = st
			break
	if typeof(stock) != TYPE_DICTIONARY or not is_stock_available(stock, state):
		return {"state": state, "events": []}
	var price := int(stock.get("price", 0))
	if int(state.get("partyGold", 0)) < price:
		return {"state": state, "events": []}
	var item: Variant = create_inventory_item(world, item_id, 1)
	if typeof(item) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["partyGold"] = int(next.get("partyGold", 0)) - price
	next["inventory"] = add_inventory_item(next.get("inventory", []), item)
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "item_bought", "itemId": item_id, "itemName": item.get("name", ""), "gold": price}]}

static func sell(state: Dictionary, world: Dictionary, item_id: String, plus: Variant, affix: Variant) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var key := equipment_instance_key(item_id, plus, affix)
	var item: Variant = _find_inv(state.get("inventory", []), key)
	if typeof(item) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	if _is_equipped(state.get("party", []), key):
		return {"state": state, "events": []}
	var value := int(item.get("sellValue", _catalog_sell_value(world, item_id)))
	if value <= 0:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["partyGold"] = int(next.get("partyGold", 0)) + value
	next["inventory"] = remove_inventory_item(next.get("inventory", []), item_id, 1, plus, affix)
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "item_sold", "itemId": item_id, "itemName": item.get("name", ""), "gold": value}]}

static func equip(state: Dictionary, world: Dictionary, char_id: String, equip_id: String, plus: Variant, affix: Variant) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var key := equipment_instance_key(equip_id, plus, affix)
	var item: Variant = _find_inv(state.get("inventory", []), key)
	var equipment: Variant = find_equipment(world, equip_id)
	var slot: Variant = get_equipment_slot(world, equip_id)
	var character: Variant = _member(state.get("party", []), char_id)
	if typeof(item) != TYPE_DICTIONARY or item.get("kind", "") != "equipment" or typeof(equipment) != TYPE_DICTIONARY or slot == null or typeof(character) != TYPE_DICTIONARY or not is_equipment_usable_by(equipment, character):
		return {"state": state, "events": []}

	# Move a shared instance off another member if the target does not already hold it and no free copy exists.
	var owners := []  # [{characterId, slot}]
	for m in state.get("party", []):
		for s in m.get("equipment", {}):
			var e: Variant = m["equipment"][s]
			if typeof(e) == TYPE_DICTIONARY and equipment_instance_key(e.get("id", ""), e.get("plus", null), e.get("affix", null)) == key:
				owners.append({"characterId": m.get("id", ""), "slot": s})
	var target_has := false
	for o in owners:
		if o["characterId"] == char_id:
			target_has = true
	var transfer_from: Variant = null
	if not target_has and owners.size() >= int(item.get("quantity", 0)):
		for o in owners:
			if o["characterId"] != char_id:
				transfer_from = o
				break

	var equipped := {"id": equip_id}
	if plus != null and int(plus) != 0:
		equipped["plus"] = int(plus)
	if affix != null and String(affix) != "":
		equipped["affix"] = String(affix)

	var next: Dictionary = state.duplicate(true)
	for m in next["party"]:
		if typeof(transfer_from) == TYPE_DICTIONARY and m.get("id", "") == transfer_from["characterId"]:
			(m["equipment"] as Dictionary).erase(transfer_from["slot"])
		if m.get("id", "") == char_id:
			m["equipment"][slot] = equipped.duplicate(true)
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "equipment_changed", "itemId": equip_id, "characterName": character.get("name", ""), "itemName": equipment.get("name", ""), "slot": slot}]}

static func discard(state: Dictionary, item_id: String, plus: Variant, affix: Variant) -> Dictionary:
	if state.get("phase", "") == "combat":
		return {"state": state, "events": []}
	var key := equipment_instance_key(item_id, plus, affix)
	var item: Variant = _find_inv(state.get("inventory", []), key)
	if typeof(item) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	if PROTECTED_KINDS.has(item.get("kind", "")):
		return {"state": state, "events": []}
	var equipped_count := 0
	for m in state.get("party", []):
		for s in m.get("equipment", {}):
			var e: Variant = m["equipment"][s]
			if typeof(e) == TYPE_DICTIONARY and equipment_instance_key(e.get("id", ""), e.get("plus", null), e.get("affix", null)) == key:
				equipped_count += 1
	if int(item.get("quantity", 0)) <= equipped_count:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["inventory"] = remove_inventory_item(next.get("inventory", []), item_id, 1, plus, affix)
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "item_discarded", "itemId": item_id, "itemName": item.get("name", "")}]}

# --- lookups --------------------------------------------------------------------------------------
static func _find_inv(inventory: Array, key: String) -> Variant:
	for item in inventory:
		if _key_of(item) == key and int(item.get("quantity", 0)) > 0:
			return item
	return null

static func _member(party: Array, id: String) -> Variant:
	for m in party:
		if m.get("id", "") == id:
			return m
	return null

static func _is_equipped(party: Array, key: String) -> bool:
	for m in party:
		for s in m.get("equipment", {}):
			var e: Variant = m["equipment"][s]
			if typeof(e) == TYPE_DICTIONARY and equipment_instance_key(e.get("id", ""), e.get("plus", null), e.get("affix", null)) == key:
				return true
	return false

static func _catalog_sell_value(world: Dictionary, item_id: String) -> int:
	var it: Variant = find_catalog_item(world, item_id)
	if typeof(it) == TYPE_DICTIONARY and it.has("sellValue"):
		return int(it["sellValue"])
	var eq: Variant = find_equipment(world, item_id)
	if typeof(eq) == TYPE_DICTIONARY and eq.has("sellValue"):
		return int(eq["sellValue"])
	return 0

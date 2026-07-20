extends RefCounted
## Port of the IMP-029 treasure-chest state machine (src/domain/chests.ts) and its rulesEngine wiring
## (investigate/disarm/open commands + the treasure roll).
##
## The contract: ONE attempt each, and the outcome is fixed per chest identity — no caller can reload a
## failure into a success. A failed investigation is honestly "uncertain"; it NEVER reports a trapped
## chest as clear. Opening an undisarmed trapped chest springs it, but the reward is never destroyed.
## Trap handling is never class-locked: the trap_handling vocations get a real bonus, anyone may try.

const CombatRng := preload("res://scripts/rules/combat_rng.gd")
const Economy := preload("res://scripts/rules/economy.gd")
const Exploration := preload("res://scripts/rules/exploration.gd")

# chests.ts keeps its own leaf RNG (same FNV-1a shape as the combat one) to avoid an import cycle; the
# seeds must therefore match that function, not the combat roller's.
static func _hash_seed(seed_text: String) -> int:
	return CombatRng.hash_seed(seed_text)

static func _roll_percent(seed_text: String) -> int:
	return (_hash_seed(seed_text) % 100) + 1

static func _clamp_int(value: int, low: int, high: int) -> int:
	return maxi(low, mini(high, value))

## A member's aptitude for handling traps. Agility/wit/luck/level all feed it; a `trap_handling` role
## tag adds a real specialist bonus, but anyone may try (a non-specialist just runs a worse check).
static func trap_skill(member: Dictionary) -> int:
	var apt: Dictionary = member.get("aptitude", {})
	var specialist := 8 if (member.get("roleTags", []) as Array).has("trap_handling") else 0
	return int(member.get("level", 1)) + int(apt.get("agility", 0)) * 2 + int(apt.get("wit", 0)) + int(apt.get("luck", 0)) + specialist

## The best standing (un-injured) handler the rules pick automatically, or null if nobody can act.
static func select_trap_handler(party: Array) -> Variant:
	var able := []
	for member in party:
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null:
			able.append(member)
	if able.is_empty():
		return null
	var best: Dictionary = able[0]
	for member in able:
		if trap_skill(member) > trap_skill(best):
			best = member
	return best

static func _success_chance(skill: int, difficulty: int, base: int) -> int:
	return _clamp_int(base + skill * 3 - difficulty, 5, 95)

static func chest_at(state: Dictionary, cell_id: Variant) -> Variant:
	for chest in state.get("chests", []):
		if chest.get("cellId", "") == cell_id:
			return chest
	return null

## A chest only operates on the CURRENT cell — off-cell is "no_chest", which is what makes a chest hold
## the cell it sits on rather than being a menu item.
static func current_chest(state: Dictionary) -> Variant:
	if state.get("phase", "") != "dungeon" or state.get("position", null) == null:
		return null
	var cell_id: Variant = (state["position"] as Dictionary).get("cellId", null)
	if typeof(cell_id) != TYPE_STRING:
		return null
	return chest_at(state, cell_id)

static func _replace_chest(state: Dictionary, chest: Dictionary) -> Dictionary:
	var next: Dictionary = state.duplicate(true)
	var out := []
	for existing in next.get("chests", []):
		out.append(chest if existing.get("cellId", "") == chest.get("cellId", "") else existing)
	next["chests"] = out
	return next

static func _blocked(state: Dictionary, reason: String) -> Dictionary:
	return {"state": state, "events": [{"type": "command_blocked_chest", "reason": reason}]}

# --- commands --------------------------------------------------------------------------------------

static func investigate(state: Dictionary, world: Dictionary = {}, engine: Dictionary = {}, character_id: String = "", item_id: String = "") -> Dictionary:
	var chest: Variant = current_chest(state)
	if typeof(chest) != TYPE_DICTIONARY:
		return _blocked(state, "no_chest")
	if chest.get("phase", "") == "opened":
		return _blocked(state, "already_open")
	if bool(chest.get("investigated", false)):
		return _blocked(state, "already_tried")

	var difficulty := int((chest.get("trap", null) as Dictionary).get("difficulty", 0)) if typeof(chest.get("trap", null)) == TYPE_DICTIONARY else 0
	var attempt := Exploration.resolve_attempt(state, world, engine, "investigate", difficulty, character_id, item_id)
	# Naming someone who cannot act is refused outright — silently handing the job to somebody else is
	# the hidden-handler behaviour the class-system remediation removes.
	if String(attempt.get("refused", "")) != "":
		return _blocked(state, String(attempt["refused"]))
	var handler: Variant = attempt.get("actor", null)
	var skill := int(attempt.get("skill", 0))
	var seed_text := "%s:%s" % [String(chest.get("cellId", "")), String(chest.get("roomId", ""))]
	var success := _roll_percent("%s:investigate" % seed_text) < _success_chance(skill, difficulty, 55)
	# A failed check is honestly uncertain — it must never report a trapped chest as clear.
	var result := "uncertain"
	if success:
		result = "trapped" if typeof(chest.get("trap", null)) == TYPE_DICTIONARY else "clear"

	var updated: Dictionary = chest.duplicate(true)
	updated["investigated"] = true
	updated["investigateResult"] = result
	var next := _replace_chest(state, updated)
	next["turn"] = int(next.get("turn", 0)) + 1
	next["inventory"] = attempt.get("inventory", next.get("inventory", []))
	var event := {"type": "chest_investigated", "result": result}
	if typeof(handler) == TYPE_DICTIONARY:
		event["handlerName"] = handler.get("name", "")
	Exploration.stamp_event(event, attempt)
	return {"state": next, "events": [event]}

static func disarm(state: Dictionary, world: Dictionary = {}, engine: Dictionary = {}, character_id: String = "", item_id: String = "") -> Dictionary:
	var chest: Variant = current_chest(state)
	if typeof(chest) != TYPE_DICTIONARY:
		return _blocked(state, "no_chest")
	if chest.get("phase", "") == "opened":
		return _blocked(state, "already_open")
	if typeof(chest.get("trap", null)) != TYPE_DICTIONARY or bool(chest.get("disarmed", false)):
		return _blocked(state, "no_trap")
	if bool(chest.get("disarmAttempted", false)):
		return _blocked(state, "already_tried")

	var difficulty := int((chest["trap"] as Dictionary).get("difficulty", 0))
	var attempt := Exploration.resolve_attempt(state, world, engine, "disarm", difficulty, character_id, item_id)
	if String(attempt.get("refused", "")) != "":
		return _blocked(state, String(attempt["refused"]))
	var handler: Variant = attempt.get("actor", null)
	var skill := int(attempt.get("skill", 0))
	var seed_text := "%s:%s" % [String(chest.get("cellId", "")), String(chest.get("roomId", ""))]
	var success := _roll_percent("%s:disarm" % seed_text) < _success_chance(skill, difficulty, 45)

	var updated: Dictionary = chest.duplicate(true)
	updated["disarmAttempted"] = true
	updated["disarmed"] = success
	var next := _replace_chest(state, updated)
	next["turn"] = int(next.get("turn", 0)) + 1
	next["inventory"] = attempt.get("inventory", next.get("inventory", []))
	var event := {"type": "chest_disarmed", "success": success}
	if typeof(handler) == TYPE_DICTIONARY:
		event["handlerName"] = handler.get("name", "")
	Exploration.stamp_event(event, attempt)
	return {"state": next, "events": [event]}

static func open_chest(state: Dictionary, world: Dictionary, engine: Dictionary) -> Dictionary:
	var chest: Variant = current_chest(state)
	if typeof(chest) != TYPE_DICTIONARY:
		return _blocked(state, "no_chest")
	if chest.get("phase", "") == "opened":
		return _blocked(state, "already_open")

	var has_trap: bool = typeof(chest.get("trap", null)) == TYPE_DICTIONARY
	var trap_sprung: bool = has_trap and not bool(chest.get("disarmed", false)) and not bool(chest.get("sprung", false))
	var damage := int((chest["trap"] as Dictionary).get("damage", 0)) if trap_sprung else 0

	var opened: Dictionary = chest.duplicate(true)
	opened["phase"] = "opened"
	opened["sprung"] = bool(chest.get("sprung", false)) or trap_sprung
	var next := _replace_chest(state, opened)

	var events := []
	if trap_sprung:
		# An already-wounded member is not hit again; nobody is killed by a chest.
		var hurt := []
		for member in next.get("party", []):
			if member.get("injury", null) != null:
				hurt.append(member)
			else:
				var m: Dictionary = member.duplicate(true)
				m["hp"] = maxi(1, int(m.get("hp", 0)) - damage)
				hurt.append(m)
		next["party"] = hurt
		events.append({"type": "chest_trap_sprung", "trapKind": (chest["trap"] as Dictionary).get("kind", ""), "damage": damage})

	var room_id := String(chest.get("roomId", ""))
	var item: Variant = null
	if not (state.get("floorClaimedTreasures", []) as Array).has(room_id):
		item = roll_treasure_item(world, engine, room_id, chest.get("treasureTable", null), int(state.get("turn", 0)))
	if typeof(item) == TYPE_DICTIONARY:
		next["inventory"] = Economy.add_inventory_item(next.get("inventory", []), item)
		var claimed: Array = (next.get("claimedTreasures", []) as Array).duplicate()
		if not claimed.has(room_id):
			claimed.append(room_id)
		next["claimedTreasures"] = claimed
		var floor_claimed: Array = (next.get("floorClaimedTreasures", []) as Array).duplicate()
		floor_claimed.append(room_id)
		next["floorClaimedTreasures"] = floor_claimed
		var gained := {"type": "inventory_item_gained", "itemId": item.get("id", ""), "itemName": item.get("name", ""), "quantity": int(item.get("quantity", 1)), "source": "treasure"}
		if item.get("plus", null) != null:
			gained["plus"] = item["plus"]
		if item.get("affix", null) != null:
			gained["affix"] = item["affix"]
		events.append(gained)

	events.append({"type": "chest_opened"})
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": events}

# --- the treasure roll -----------------------------------------------------------------------------

static func _floor_number_for_room(world: Dictionary, room_id: String) -> int:
	for dungeon in world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == room_id:
				var re := RegEx.new()
				re.compile("[a-zA-Z](\\d+)f")
				var m := re.search(String(dungeon.get("id", "")))
				return int(m.get_string(1)) if m else 1
	return 1

static func _resolve_treasure_table(world: Dictionary, table_id: Variant, seed_text: String) -> Variant:
	for table in world.get("treasureTables", []):
		if table.get("id", "") == table_id:
			var entries: Array = table.get("entries", [])
			if entries.is_empty():
				return null
			var total := 0
			for entry in entries:
				total += int(entry.get("weight", 0))
			if total <= 0:
				return entries[0]
			var roll := _hash_seed(seed_text) % total
			for entry in entries:
				roll -= int(entry.get("weight", 0))
				if roll < 0:
					return entry
			return entries[0]
	return null

# Built-in affixes (from the engine bag) merged with the world's authored ones — authored wins on a
# shared id, exactly as resolveAffixCatalog does.
static func _resolve_affix_catalog(world: Dictionary, engine: Dictionary) -> Array:
	var authored_ids := {}
	for affix in world.get("affixes", []):
		authored_ids[affix.get("id", "")] = true
	var out := []
	for affix in engine.get("equipmentAffixes", []):
		if authored_ids.has(affix.get("id", "")):
			continue
		out.append({
			"id": affix.get("id", ""), "label": affix.get("id", ""), "slots": affix.get("slots", []),
			"minFloor": int(affix.get("minFloor", 1)), "rarity": "common", "weight": 1,
			"attackBonus": affix.get("attackBonus", null), "defenseBonus": affix.get("defenseBonus", null),
			"accuracyBonus": affix.get("accuracyBonus", null), "speedBonus": affix.get("speedBonus", null)
		})
	for affix in world.get("affixes", []):
		var merged: Dictionary = affix.duplicate(true)
		merged["weight"] = int(affix.get("weight", 1)) if affix.get("weight", null) != null else 1
		out.append(merged)
	return out

const RARITY_ORDER := ["common", "rare", "epic"]

static func _rarity_rank(rarity: Variant) -> int:
	return RARITY_ORDER.find(String(rarity) if typeof(rarity) == TYPE_STRING else "common")

static func _roll_rarity(seed_text: String, floor_number: int) -> String:
	var roll := _hash_seed("%s:rarity" % seed_text) % 100
	var epic_chance := mini(6, 1 + int(floor(float(floor_number) / 3.0)))
	var rare_chance := mini(24, 10 + floor_number)
	if roll < epic_chance:
		return "epic"
	if roll < epic_chance + rare_chance:
		return "rare"
	return "common"

static func _roll_equipment_instance(world: Dictionary, engine: Dictionary, slot: String, floor_number: int, seed_text: String) -> Dictionary:
	var result := {}
	if _hash_seed("%s:plus" % seed_text) % 100 < 20 + floor_number * 5:
		result["plus"] = 2 if (floor_number >= 4 and _hash_seed("%s:plus2" % seed_text) % 100 < 30) else 1
	if _hash_seed("%s:affix" % seed_text) % 100 < 15 + floor_number * 5:
		var pool := []
		for affix in engine.get("equipmentAffixes", []):
			if (affix.get("slots", []) as Array).has(slot) and int(affix.get("minFloor", 1)) <= floor_number:
				pool.append(affix)
		if not pool.is_empty():
			result["affix"] = pool[_hash_seed("%s:affixpick" % seed_text) % pool.size()].get("id", "")
	return result

static func _roll_equipment_drop(world: Dictionary, engine: Dictionary, base_equip_id: String, floor_number: int, seed_text: String) -> Variant:
	var equip: Variant = Economy.find_equipment(world, base_equip_id)
	if typeof(equip) != TYPE_DICTIONARY:
		return null
	var base := {
		"id": equip.get("id", ""), "name": equip.get("name", ""), "kind": "equipment", "quantity": 1,
		"slot": equip.get("slot", ""), "sellValue": equip.get("sellValue", 0), "rarity": "common", "identified": true
	}
	var rarity := _roll_rarity(seed_text, floor_number)
	if rarity == "common":
		return base

	var eligible := []
	for affix in _resolve_affix_catalog(world, engine):
		if (affix.get("slots", []) as Array).has(equip.get("slot", "")) and int(affix.get("minFloor", 1)) <= floor_number and _rarity_rank(affix.get("rarity", "common")) >= 1:
			eligible.append(affix)
	if eligible.is_empty():
		return base  # no rare affix fits this slot/floor — a plain common beats an empty "rare"

	var total := 0
	for affix in eligible:
		total += int(affix.get("weight", 1))
	var pick := _hash_seed("%s:affix" % seed_text) % maxi(1, total)
	var chosen: Dictionary = eligible[0]
	for affix in eligible:
		pick -= int(affix.get("weight", 1))
		if pick < 0:
			chosen = affix
			break

	var out: Dictionary = base.duplicate(true)
	out["rarity"] = rarity
	out["affix"] = chosen.get("id", "")
	out["identified"] = false
	out["instanceId"] = "loot-%s" % _to_base36(_hash_seed("%s:%s:%s" % [seed_text, String(equip.get("id", "")), String(chosen.get("id", ""))]))
	return out

# JS Number.toString(36).
static func _to_base36(value: int) -> String:
	if value == 0:
		return "0"
	const DIGITS := "0123456789abcdefghijklmnopqrstuvwxyz"
	var n := absi(value)
	var out := ""
	while n > 0:
		out = DIGITS[n % 36] + out
		n /= 36
	return out

static func roll_treasure_item(world: Dictionary, engine: Dictionary, room_id: String, table_id: Variant, turn: int) -> Variant:
	if typeof(table_id) != TYPE_STRING:
		return null
	var seed_text := "%s:%d" % [room_id, turn]
	var entry: Variant = _resolve_treasure_table(world, table_id, seed_text)
	if typeof(entry) != TYPE_DICTIONARY:
		return null
	var item: Variant = Economy.create_inventory_item(world, String(entry.get("itemId", "")), int(entry.get("quantity", 1)) if entry.get("quantity", null) != null else 1)
	if typeof(item) != TYPE_DICTIONARY:
		return null
	# Dropped equipment rolls a numeric "+N" upgrade and a RARITY: a common stacks and is known, a
	# rare/epic is a unique unidentified instance carrying an authored affix.
	if item.get("kind", "") == "equipment":
		var equipment: Variant = Economy.find_equipment(world, String(entry.get("itemId", "")))
		if typeof(equipment) == TYPE_DICTIONARY:
			var floor_number := _floor_number_for_room(world, room_id)
			var instance := _roll_equipment_instance(world, engine, String(equipment.get("slot", "")), floor_number, seed_text)
			if instance.has("plus"):
				item["plus"] = instance["plus"]
			var drop: Variant = _roll_equipment_drop(world, engine, String(entry.get("itemId", "")), floor_number, seed_text)
			if typeof(drop) == TYPE_DICTIONARY:
				item["rarity"] = drop["rarity"]
				item["identified"] = drop["identified"]
				if drop.has("instanceId"):
					item["instanceId"] = drop["instanceId"]
				if drop.has("affix") and drop["affix"] != null:
					item["affix"] = drop["affix"]
	return item

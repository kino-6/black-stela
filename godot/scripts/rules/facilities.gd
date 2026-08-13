extends RefCounted
## Base facility upgrades — the salvage-`materials` sink (#33). A facility is authored per world
## (world.facilities); its built level lives in state["facilities"][id] (0 = not built yet). upgrade()
## spends the NEXT level's `cost` in materials to raise it by one.
##
## NEW Godot feature — no TS parity: state["facilities"] is materialized LAZILY (never added to
## STATE_DEFAULTS), so parity traces that never touch a facility stay hash-identical to the TS oracle.

const CharacterStats := preload("res://scripts/rules/character_stats.gd")

static func facility_level(state: Dictionary, facility_id: String) -> int:
	var map: Dictionary = state.get("facilities", {})
	return int(map.get(facility_id, 0))

static func _find_facility(world: Dictionary, facility_id: String) -> Variant:
	for f in world.get("facilities", []):
		if String(f.get("id", "")) == facility_id:
			return f
	return null

# Aggregate every ACTIVE facility effect for the current run. A facility at level N applies every effect
# declared at levels 1..N — booleans stay ON once granted, numeric fields take the strongest value. This
# is the single source of truth read by the panel AND by the effect hooks (maxHp/exploration/shop/return).
static func active_effects(state: Dictionary, world: Dictionary) -> Dictionary:
	var out := {"restOnReturn": false, "restMp": false, "clearInjury": false, "maxHpPct": 0, "shopDiscountPct": 0, "explorationBonus": 0}
	for f in world.get("facilities", []):
		var level := facility_level(state, String(f.get("id", "")))
		var levels: Array = f.get("levels", [])
		for i in range(mini(level, levels.size())):
			var eff: Dictionary = levels[i]
			if bool(eff.get("restOnReturn", false)):
				out["restOnReturn"] = true
			if bool(eff.get("restMp", false)):
				out["restMp"] = true
			if bool(eff.get("clearInjury", false)):
				out["clearInjury"] = true
			out["maxHpPct"] = maxi(int(out["maxHpPct"]), int(eff.get("maxHpPct", 0)))
			out["shopDiscountPct"] = maxi(int(out["shopDiscountPct"]), int(eff.get("shopDiscountPct", 0)))
			out["explorationBonus"] = maxi(int(out["explorationBonus"]), int(eff.get("explorationBonus", 0)))
	return out

# The infirmary's return-to-town effect: when restOnReturn is active, restore every member's HP (and
# revive the downed, since hp is set to full), layering MP and injury-clearing at higher levels. Returns a
# NEW healed state, or the same state untouched when the base grants no return heal. Called from the
# deliberate town return (NOT a wipe-evacuation, which keeps its failure penalty).
static func apply_return_heal(state: Dictionary, world: Dictionary) -> Dictionary:
	var eff := active_effects(state, world)
	if not bool(eff.get("restOnReturn", false)):
		return state
	var next: Dictionary = state.duplicate(true)
	for member in next.get("party", []):
		var stats := CharacterStats.effective(member, world)
		member["hp"] = int(stats.get("maxHp", member.get("maxHp", 0)))
		if bool(eff.get("restMp", false)):
			member["mp"] = int(stats.get("maxMp", member.get("maxMp", 0)))
		if bool(eff.get("clearInjury", false)):
			member.erase("injury")
	return next

# upgrade_facility: spend materials to raise a facility one level. Guards: town phase, facility exists,
# not already maxed, the next level's unlockFlag (if any) is discovered, and affordable. Mirrors the
# validate → duplicate → deduct → mutate → bump-turn → emit shape of Loot.reinforce.
static func upgrade(state: Dictionary, world: Dictionary, facility_id: String) -> Dictionary:
	if String(state.get("phase", "")) != "town":
		return {"state": state, "events": []}
	var facility: Variant = _find_facility(world, facility_id)
	if typeof(facility) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var levels: Array = (facility as Dictionary).get("levels", [])
	var current := facility_level(state, facility_id)
	if current >= levels.size():
		return {"state": state, "events": []}
	var next_def: Dictionary = levels[current]
	var unlock_flag := String(next_def.get("unlockFlag", ""))
	if unlock_flag != "" and not (state.get("discoveredSecrets", []) as Array).has(unlock_flag):
		return {"state": state, "events": []}
	var cost := int(next_def.get("cost", 0))
	if int(state.get("materials", 0)) < cost:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["materials"] = int(next.get("materials", 0)) - cost
	var map: Dictionary = (next.get("facilities", {}) as Dictionary).duplicate(true)
	map[facility_id] = current + 1
	next["facilities"] = map
	next["turn"] = int(next.get("turn", 0)) + 1
	var event := {"type": "facility_upgraded", "facilityId": facility_id, "level": current + 1, "cost": cost}
	return {"state": next, "events": [event]}

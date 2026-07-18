class_name CombatRound
## Port of declareRound's ATTACK + VICTORY path (src/domain/rulesEngine.ts) — enough for the
## b1f-combat-victory slice route (front-line attacks, no spells/items/defend; the hero kills the group
## so the victory check precedes any enemy turn). Beats are presentation and are NOT reproduced — the
## parity oracle is the state hash; events are compared semantically (see verify_parity.gd).
## `engine` carries classAbilities + mastery constants (engine-data.json).

const CombatRng := preload("res://scripts/rules/combat_rng.gd")
const CombatHelpers := preload("res://scripts/rules/combat_helpers.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")

const CRIT_MULTIPLIER := 1.5
const FEAR_ACCURACY_PENALTY := 15
const MASTERY_BASE_PER_FIGHT := 34
const FALLOFF_PER_LEVEL := 0.86
const FALLOFF_FLOOR := 0.12

static func declare_round(state: Dictionary, world: Dictionary, actions: Array, engine: Dictionary) -> Dictionary:
	if state.get("phase", "") != "combat" or typeof(state.get("combat", null)) != TYPE_DICTIONARY:
		return {"state": state, "events": []}

	var combat: Dictionary = state["combat"]
	var turn := int(state.get("turn", 0))
	var rnd := int(combat.get("round", 1))
	var enemy_groups: Array = (combat.get("enemyGroups", []) as Array).duplicate(true)
	var party: Array = (state.get("party", []) as Array).duplicate(true)

	# Regen affix (round-start heal) is skipped — the slice hero has none. TODO for regen builds.

	var ordered := actions.duplicate(true)
	ordered.sort_custom(func(a, b):
		var la: Variant = _find_member(party, a.get("actorId", ""))
		var lb: Variant = _find_member(party, b.get("actorId", ""))
		var sa := CombatHelpers.get_initiative_score(la, world) if typeof(la) == TYPE_DICTIONARY else 0
		var sb := CombatHelpers.get_initiative_score(lb, world) if typeof(lb) == TYPE_DICTIONARY else 0
		return sa > sb)

	for action in ordered:
		var actor: Variant = _find_member(party, action.get("actorId", ""))
		if typeof(actor) != TYPE_DICTIONARY or int(actor.get("hp", 0)) <= 0 or actor.get("injury", null) != null:
			continue
		if _has_status(actor, "sleep"):
			continue
		if action.get("action", "") != "attack" or action.get("targetGroupId", null) == null:
			continue
		var group: Variant = _find_group(enemy_groups, action["targetGroupId"])
		if typeof(group) != TYPE_DICTIONARY:
			continue

		var stats := CharacterStats.effective(actor, world)
		var eff_acc := int(stats["accuracy"]) - (FEAR_ACCURACY_PENALTY if _has_status(actor, "fear") else 0)
		var hit_seed := "%d:%d:%s:%s:hit" % [turn, rnd, actor["id"], group["id"]]
		if CombatRng.roll_percent(hit_seed) > eff_acc:
			continue

		var attack_seed := "%d:%d:%s:%s:damage" % [turn, rnd, actor["id"], group["id"]]
		var raw := CombatRng.roll_damage(attack_seed, int(stats["damageMin"]), int(stats["damageMax"]), int(group.get("armor", 0)))
		var enemy_def: Variant = CharacterStats._find_by_id(world.get("enemies", []), group.get("enemyId", ""))
		var tags: Variant = enemy_def.get("tags", []) if typeof(enemy_def) == TYPE_DICTIONARY else []
		var species := CombatHelpers.character_species_multiplier(actor, world, tags)
		var elem := CombatRng.element_multiplier(group.get("weaknesses", {}), stats["attackElement"])
		var weakened := CombatRng.chip_through_resistance(roundi(raw * elem * species), attack_seed)
		var crit := CombatRng.roll_percent("%d:%d:%s:%s:crit" % [turn, rnd, actor["id"], group["id"]]) < CombatHelpers.get_critical_chance(actor)
		var damage := roundi(weakened * CRIT_MULTIPLIER) if crit else weakened
		enemy_groups = CombatHelpers.damage_group(enemy_groups, group["id"], damage)

	var living := enemy_groups.filter(func(g): return int(g.get("count", 0)) > 0)
	if living.is_empty():
		return _victory(state, world, combat, party, engine)

	push_error("[combat_round] enemy turn not ported — the b1f-combat-victory route resolves at victory")
	return {"state": state, "events": []}

# --- victory + rewards ------------------------------------------------------------------------------

static func _victory(state: Dictionary, world: Dictionary, combat: Dictionary, party: Array, engine: Dictionary) -> Dictionary:
	var groups: Array = combat.get("enemyGroups", [])
	var xp := 0
	var gold := 0
	var defeated_ids := []
	var defeated_names := []
	for g in groups:
		xp += int(g.get("xp", 0)) * int(g.get("count", 0))
		gold += int(g.get("gold", 0)) * int(g.get("count", 0))
		defeated_ids.append(g.get("enemyId", ""))
		defeated_names.append(g.get("name", ""))

	var grown := []
	for member in party:
		grown.append(_reward_member(member, groups, gold, defeated_names, engine))

	var next: Dictionary = state.duplicate(true)
	next["phase"] = "dungeon"
	next["combat"] = null
	next["party"] = grown
	next["partyGold"] = int(state.get("partyGold", 0)) + gold
	next["combatConclusion"] = {
		"enemyIds": defeated_ids,
		"enemyNames": defeated_names,
		"xp": xp,
		"gold": gold,
		"levelUps": [],
		"resumePosition": (state["position"].duplicate(true) if state.get("position", null) != null else null)
	}
	next["defeatedEnemies"] = _unique_concat(state.get("defeatedEnemies", []), defeated_ids)
	next["floorClearedEnemies"] = _unique_concat(state.get("floorClearedEnemies", []), defeated_ids)
	next["enemyRecord"] = _record_defeats(state.get("enemyRecord", {}), defeated_ids)
	# recordQuestKills is a no-op with no active quests, so next["quests"] carries over unchanged.
	next["turn"] = int(state.get("turn", 0)) + 1

	var events := [{"type": "combat_round_resolved", "round": int(combat.get("round", 1))}]
	for i in defeated_names.size():
		events.append({"type": "enemy_defeated", "enemyId": defeated_ids[i], "enemyName": defeated_names[i]})
	events.append({"type": "combat_rewards", "xp": xp, "gold": gold, "enemyNames": defeated_names, "enemyIds": defeated_ids})
	return {"state": next, "events": events}

static func _reward_member(member: Dictionary, groups: Array, gold: int, defeated_names: Array, engine: Dictionary) -> Dictionary:
	var m: Dictionary = member.duplicate(true)
	var level := int(member.get("level", 1))

	var xp_gain := 0
	for g in groups:
		xp_gain += _reward_xp_for(int(g.get("xp", 0)) * int(g.get("count", 0)), level, g)
	m["xp"] = int(member.get("xp", 0)) + xp_gain
	m["gold"] = int(member.get("gold", 0)) + gold

	var mastery_points := 0
	for g in groups:
		mastery_points += _reward_xp_for(MASTERY_BASE_PER_FIGHT, level, g)
	m["vocation"] = _apply_mastery(_resolve_vocation_state(member, engine), mastery_points, engine)

	var mem: Dictionary = (member.get("memory", {}) as Dictionary).duplicate(true)
	mem["notableVictories"] = _unique_concat(mem.get("notableVictories", []), defeated_names)
	m["memory"] = mem

	return _apply_level_ups(m)

static func _reward_xp_for(base_xp: int, member_level: int, enemy: Dictionary) -> int:
	if enemy.get("prizedXp", false):
		return base_xp
	return maxi(1, roundi(base_xp * _xp_falloff(member_level, _enemy_level(enemy))))

static func _enemy_level(enemy: Dictionary) -> int:
	if enemy.get("level", null) != null:
		return int(enemy["level"])
	return maxi(1, int(enemy.get("dangerTier", 1)) * 2 - 1)

static func _xp_falloff(member_level: int, target_level: int) -> float:
	var over := member_level - target_level
	if over <= 0:
		return 1.0
	return maxf(FALLOFF_FLOOR, pow(FALLOFF_PER_LEVEL, over))

static func _resolve_vocation_state(member: Dictionary, engine: Dictionary) -> Dictionary:
	if typeof(member.get("vocation", null)) == TYPE_DICTIONARY:
		return member["vocation"]
	var class_id: String = member.get("classId", "")
	var learned := _known_spells(class_id, int(member.get("level", 1)), engine)
	var limit := int(engine.get("loadoutLimit", 6))
	return {
		"current": class_id,
		"mastery": {},
		"progress": {},
		"learned": learned.duplicate(),
		"loadout": learned.slice(0, limit)
	}

static func _known_spells(class_id: String, level: int, engine: Dictionary) -> Array:
	var abilities: Variant = (engine.get("classAbilities", {}) as Dictionary).get(class_id, [])
	var out := []
	if typeof(abilities) == TYPE_ARRAY:
		for entry in abilities:
			if level >= int(entry.get("level", 0)):
				out.append(entry.get("spellId", ""))
	return out

static func _apply_mastery(state: Dictionary, points: int, engine: Dictionary) -> Dictionary:
	var current: String = state["current"]
	var mastered := int(engine.get("masteredRank", 5))
	var per_rank := int(engine.get("masteryPointsPerRank", 100))
	var rank := int((state.get("mastery", {}) as Dictionary).get(current, 0))
	if rank >= mastered:
		return state
	var banked := int((state.get("progress", {}) as Dictionary).get(current, 0)) + maxi(0, points)
	var next_rank := mini(mastered, rank + banked / per_rank)
	var remainder := 0 if next_rank >= mastered else banked % per_rank
	var out: Dictionary = state.duplicate(true)
	(out["mastery"] as Dictionary)[current] = next_rank
	(out["progress"] as Dictionary)[current] = remainder
	return out

# applyLevelUps: the slice hero never crosses a threshold; port the guard and refuse to guess growth.
static func _apply_level_ups(member: Dictionary) -> Dictionary:
	if int(member.get("xp", 0)) >= _xp_for_level(int(member.get("level", 1)) + 1):
		push_error("[combat_round] level-up growth not ported (no slice route triggers it)")
	return member

static func _xp_for_level(level: int) -> int:
	if level <= 1:
		return 0
	return 4 * (level - 1) * level

static func _record_defeats(record: Variant, ids: Array) -> Dictionary:
	var out: Dictionary = (record.duplicate(true) if typeof(record) == TYPE_DICTIONARY else {})
	for id in ids:
		var entry: Dictionary = (out.get(id, {"encountered": 0, "defeated": 0}) as Dictionary).duplicate(true)
		entry["defeated"] = int(entry.get("defeated", 0)) + 1
		out[id] = entry
	return out

static func _unique_concat(a: Variant, b: Array) -> Array:
	var out: Array = (a as Array).duplicate() if typeof(a) == TYPE_ARRAY else []
	for x in b:
		if not out.has(x):
			out.append(x)
	return out

static func _find_member(party: Array, id: String) -> Variant:
	for member in party:
		if String(member.get("id", "")) == id:
			return member
	return null

static func _find_group(groups: Array, id: String) -> Variant:
	for group in groups:
		if String(group.get("id", "")) == id and int(group.get("count", 0)) > 0:
			return group
	return null

static func _has_status(actor: Dictionary, status: String) -> bool:
	var list: Variant = actor.get("status", [])
	return typeof(list) == TYPE_ARRAY and list.has(status)

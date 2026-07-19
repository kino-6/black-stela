class_name CombatRound
## Port of declareRound's ATTACK + VICTORY path (src/domain/rulesEngine.ts) — enough for the
## b1f-combat-victory slice route (front-line attacks, no spells/items/defend; the hero kills the group
## so the victory check precedes any enemy turn). Beats are presentation and are NOT reproduced — the
## parity oracle is the state hash; events are compared semantically (see verify_parity.gd).
## `engine` carries classAbilities + mastery constants (engine-data.json).

const CombatRng := preload("res://scripts/rules/combat_rng.gd")
const CombatHelpers := preload("res://scripts/rules/combat_helpers.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const Leveling := preload("res://scripts/rules/leveling.gd")

const CRIT_MULTIPLIER := 1.5
const FEAR_ACCURACY_PENALTY := 20   # matches src/domain/status.ts (was 15 — a latent parity bug)
const MASTERY_BASE_PER_FIGHT := 34
const FALLOFF_PER_LEVEL := 0.86
const FALLOFF_FLOOR := 0.12
const POISON_DAMAGE := 2
const STATUS_WEAR_OFF := {"ward": 100, "poison": 30, "sleep": 45, "silence": 35, "fear": 35}

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

	# --- ENEMY TURN (ported from declareRound's post-victory branch) ---
	# Each living GROUP acts once, fastest first: an authored ability (its own reach), else a basic
	# front-first swing. Damage wounds — never kills — a member (hp<=0 → hp:1 + `wounded`).
	var injured_events := []
	var ordered_groups: Array = living.duplicate(true)
	ordered_groups.sort_custom(func(a, b): return int(a.get("speed", 0)) > int(b.get("speed", 0)))

	for group in ordered_groups:
		if _group_has_status(group, "sleep"):
			continue
		var group_id: String = group["id"]
		var ability: Variant = _select_enemy_ability(group.get("abilities", []), "%d:%d:%s" % [turn, rnd, group_id])
		var target: Variant
		if typeof(ability) == TYPE_DICTIONARY:
			target = _choose_enemy_target_for(party, ability.get("target", "front"), "%d:%d:%s:ability-target" % [turn, rnd, group_id])
		else:
			target = _choose_enemy_target(party, "%d:%d:%s:target" % [turn, rnd, group_id])
		if typeof(target) != TYPE_DICTIONARY:
			continue
		var target_id: String = target["id"]

		if typeof(ability) == TYPE_DICTIONARY:
			var effect: Dictionary = ability.get("effect", {})
			var tstats := CharacterStats.effective(target, world)
			if effect.get("kind", "") == "damage":
				var guarded_a: bool = _has_status(target, "ward")
				var armor_a: int = int(tstats.get("armor", 0)) + (2 if guarded_a else 0)
				var raw_a := CombatRng.roll_damage("%d:%d:%s:%s:ability" % [turn, rnd, group_id, target_id], int(effect.get("min", 0)), int(effect.get("max", 0)), armor_a)
				var resist_mult: float = float((tstats.get("elementResist", {}) as Dictionary).get(effect.get("element", ""), 1.0))
				var dmg_a: int = maxi(0, roundi(raw_a * resist_mult))
				party = _damage_party_member(party, target_id, dmg_a, injured_events)
			else:
				var resist_pct := _status_resist_pct(tstats.get("resistance", {}), effect.get("status", ""))
				var roll_a := CombatRng.roll_percent("%d:%d:%s:%s:ability-resist" % [turn, rnd, group_id, target_id])
				if roll_a < resist_pct:
					pass
				else:
					party = _apply_status(party, target_id, effect.get("status", ""))
			continue

		# Basic swing.
		var hit := CombatRng.roll_percent("%d:%d:%s:%s:hit" % [turn, rnd, group_id, target_id])
		if hit > maxi(5, int(group.get("accuracy", 0)) - _get_evasion_chance(target, world)):
			continue
		var tstats2 := CharacterStats.effective(target, world)
		var guarded: bool = _has_status(target, "ward")
		var armor: int = int(tstats2.get("armor", 0)) + (2 if guarded else 0)
		var dmg := CombatRng.roll_damage("%d:%d:%s:%s:damage" % [turn, rnd, group_id, target_id], int(group.get("damageMin", 0)), int(group.get("damageMax", 0)), armor)
		party = _damage_party_member(party, target_id, dmg, injured_events)

		var inflicts: Variant = group.get("inflicts", null)
		if typeof(inflicts) == TYPE_DICTIONARY:
			var ail: String = inflicts.get("status", "")
			var resist_i := _status_resist_pct(CharacterStats.effective(target, world).get("resistance", {}), ail)
			var inflict_roll := CombatRng.roll_percent("%d:%d:%s:%s:inflict" % [turn, rnd, group_id, target_id])
			var resist_roll := CombatRng.roll_percent("%d:%d:%s:%s:resist" % [turn, rnd, group_id, target_id])
			if inflict_roll < int(inflicts.get("chance", 0)) and resist_roll >= resist_i:
				party = _apply_status(party, target_id, ail)

	# --- ROUND END: poison bites, ailments roll to wear off, round advances ---
	party = party.map(func(member):
		var tick := _tick_status_list(member.get("status", []), "%d:%d:%s" % [turn, rnd, member.get("id", "")])
		var next_hp: int = int(member.get("hp", 0)) if member.get("injury", null) != null else maxi(1, int(member.get("hp", 0)) - int(tick["poisonDamage"]))
		var m: Dictionary = (member as Dictionary).duplicate(true)
		m["hp"] = next_hp
		m["status"] = tick["statuses"]
		return m
	)
	var ticked_groups: Array = living.map(func(group):
		var tick := _tick_status_list(group.get("status", []), "%d:%d:%s" % [turn, rnd, group.get("id", "")])
		var g: Dictionary = (group as Dictionary).duplicate(true)
		g["status"] = tick["statuses"]
		return g
	)
	var next_combat: Dictionary = combat.duplicate(true)
	next_combat["round"] = rnd + 1
	next_combat["enemyGroups"] = ticked_groups
	next_combat["pendingActions"] = []
	next_combat = _sync_combat_enemy(next_combat)

	# PARTY WIPE: once every member is wounded, nobody can act — the run would soft-lock. The expedition
	# FAILS instead: dragged back to town, still wounded, minus a rescue fee (half the purse).
	var no_one_can_act := true
	for member in party:
		if member.get("injury", null) == null and int(member.get("hp", 0)) > 0:
			no_one_can_act = false
			break
	if no_one_can_act:
		var rescue_fee: int = int(state.get("partyGold", 0)) / 2
		var wiped: Dictionary = state.duplicate(true)
		wiped["phase"] = "town"
		wiped["position"] = null
		wiped["combat"] = null
		wiped["party"] = party
		wiped["partyGold"] = int(state.get("partyGold", 0)) - rescue_fee
		wiped["map"]["currentRoomId"] = null
		wiped["map"]["currentCellId"] = null
		wiped["map"]["currentFacing"] = null
		wiped["turn"] = int(state.get("turn", 0)) + 1
		var wipe_events := [{"type": "combat_round_resolved", "round": rnd}]
		wipe_events.append_array(injured_events)
		wipe_events.append({"type": "party_wiped", "rescueFee": rescue_fee})
		return {"state": wiped, "events": wipe_events}

	var cont: Dictionary = state.duplicate(true)
	cont["combat"] = next_combat
	cont["party"] = party
	cont["turn"] = int(state.get("turn", 0)) + 1
	var cont_events := [{"type": "combat_round_resolved", "round": rnd}]
	cont_events.append_array(injured_events)
	return {"state": cont, "events": cont_events}

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
	var level_events := []
	for member in party:
		var rewarded := _reward_member(member, groups, gold, defeated_names, engine)
		grown.append(rewarded["character"])
		level_events.append_array(rewarded["events"])
	var level_ups := []
	for e in level_events:
		level_ups.append({"characterId": e.get("characterId", ""), "name": e.get("characterName", ""), "level": e.get("level", 0)})

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
		"levelUps": level_ups,
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
	events.append_array(level_events)
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

	return Leveling.apply_level_ups(m)

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

static func _group_has_status(group: Dictionary, status: String) -> bool:
	var list: Variant = group.get("status", [])
	return typeof(list) == TYPE_ARRAY and list.has(status)

# --- enemy turn helpers (ports of the same-named functions in rulesEngine.ts) ------------------------

# The first ability whose per-seed roll lands under its chance, else null (a basic swing).
static func _select_enemy_ability(abilities: Variant, seed: String) -> Variant:
	if typeof(abilities) != TYPE_ARRAY:
		return null
	for ability in abilities:
		if typeof(ability) == TYPE_DICTIONARY and CombatRng.roll_percent("%s:%s" % [seed, ability.get("name", "")]) < int(ability.get("chance", 0)):
			return ability
	return null

# Basic melee: front-first, spread across the row by the seed. Only standing, un-injured members.
static func _choose_enemy_target(party: Array, seed: String) -> Variant:
	var standing := party.filter(func(m): return int(m.get("hp", 0)) > 0 and m.get("injury", null) == null)
	if standing.is_empty():
		return null
	var front := standing.filter(func(m): return m.get("row", "front") == "front")
	var pool: Array = front if not front.is_empty() else standing
	return pool[CombatRng.hash_seed(seed) % pool.size()]

# Ability reach: `any` = most wounded; `back` reaches the exposed casters; `front` mirrors basic reach.
static func _choose_enemy_target_for(party: Array, pref: String, seed: String) -> Variant:
	var alive := party.filter(func(m): return int(m.get("hp", 0)) > 0 and m.get("injury", null) == null)
	if alive.is_empty():
		return null
	if pref == "any":
		var lowest: Dictionary = alive[0]
		for m in alive:
			if int(m.get("hp", 0)) < int(lowest.get("hp", 0)):
				lowest = m
		return lowest
	var wanted := "back" if pref == "back" else "front"
	var in_row := alive.filter(func(m): return m.get("row", "front") == wanted)
	var pool: Array = in_row if not in_row.is_empty() else alive
	return pool[CombatRng.hash_seed(seed) % pool.size()]

# Agility's defensive payoff: clamp(agility*3 + floor(speed/4), 0, 30). Speed is the effective stat.
static func _get_evasion_chance(character: Dictionary, world: Dictionary) -> int:
	var speed := int(CharacterStats.effective(character, world).get("speed", 0))
	var agility := int((character.get("aptitude", {}) as Dictionary).get("agility", 0))
	return clampi(agility * 3 + int(floor(speed / 4.0)), 0, 30)

# Apply damage to one member, WOUNDING (not killing) at 0 HP. Appends a character_injured event on wound.
static func _damage_party_member(party: Array, target_id: String, damage: int, injured_events: Array) -> Array:
	var out := []
	for member in party:
		if String(member.get("id", "")) != target_id:
			out.append(member)
			continue
		var m: Dictionary = (member as Dictionary).duplicate(true)
		var hp := int(m.get("hp", 0)) - damage
		m["status"] = _clear_round_statuses(m.get("status", []))
		if hp <= 0:
			injured_events.append({"type": "character_injured", "characterId": m.get("id", ""), "characterName": m.get("name", ""), "injury": "wounded"})
			m["hp"] = 1
			m["injury"] = "wounded"
			var mem: Dictionary = (m.get("memory", {}) as Dictionary).duplicate(true)
			mem["injuries"] = int(mem.get("injuries", 0)) + 1
			m["memory"] = mem
		else:
			m["hp"] = hp
		out.append(m)
	return out

static func _apply_status(party: Array, target_id: String, status: String) -> Array:
	var out := []
	for member in party:
		if String(member.get("id", "")) == target_id and member.get("injury", null) == null:
			var m: Dictionary = (member as Dictionary).duplicate(true)
			m["status"] = _unique_statuses(_append(m.get("status", []), status))
			out.append(m)
		else:
			out.append(member)
	return out

static func _status_resist_pct(resistance: Variant, status: String) -> int:
	var pct: int = int((resistance as Dictionary).get(status, 0)) if typeof(resistance) == TYPE_DICTIONARY else 0
	return clampi(pct, 0, 100)

# Round-end for one combatant: ward drops, poison bites, each ailment rolls to wear off.
static func _tick_status_list(statuses: Variant, seed: String) -> Dictionary:
	var poison_damage := 0
	var kept := []
	var worn_off := []
	if typeof(statuses) == TYPE_ARRAY:
		for status in statuses:
			if status == "ward":
				worn_off.append(status)
				continue
			if status == "poison":
				poison_damage += POISON_DAMAGE
			if CombatRng.roll_percent("%s:%s:wearoff" % [seed, status]) < int(STATUS_WEAR_OFF.get(status, 0)):
				worn_off.append(status)
				continue
			kept.append(status)
	return {"statuses": kept, "poisonDamage": poison_damage, "wornOff": worn_off}

static func _clear_round_statuses(statuses: Variant) -> Array:
	if typeof(statuses) != TYPE_ARRAY:
		return []
	return statuses.filter(func(s): return s != "ward")

static func _unique_statuses(statuses: Array) -> Array:
	var out := []
	for s in statuses:
		if not out.has(s):
			out.append(s)
	return out

static func _append(arr: Variant, item: Variant) -> Array:
	var out: Array = (arr as Array).duplicate() if typeof(arr) == TYPE_ARRAY else []
	out.append(item)
	return out

# Re-sync combat.enemy to the first living group's summary (state-hash-visible).
static func _sync_combat_enemy(combat: Dictionary) -> Dictionary:
	var groups: Array = combat.get("enemyGroups", [])
	var first_living: Variant = null
	for g in groups:
		if int(g.get("count", 0)) > 0:
			first_living = g
			break
	if first_living == null and not groups.is_empty():
		first_living = groups[0]
	if typeof(first_living) != TYPE_DICTIONARY:
		return combat
	var out: Dictionary = combat.duplicate(true)
	var enemy: Dictionary = (out.get("enemy", {}) as Dictionary).duplicate(true)
	enemy["id"] = first_living.get("enemyId", enemy.get("id", ""))
	enemy["name"] = first_living.get("name", enemy.get("name", ""))
	enemy["hp"] = first_living.get("hpEach", enemy.get("hp", 0))
	enemy["attack"] = first_living.get("attack", enemy.get("attack", 0))
	enemy["role"] = first_living.get("role", enemy.get("role", ""))
	out["enemy"] = enemy
	return out

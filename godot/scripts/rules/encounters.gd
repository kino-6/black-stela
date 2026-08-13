extends RefCounted
## Port of the encounter machinery (src/domain/rulesEngine.ts): createEnemyGroup / createCombatState /
## createMultiGroupCombatState / resolveEncounterTable / selectEncounterGroups / scaledEncounterCount /
## underpowerFactor / beginWanderingEncounter, plus recordEncounters (bestiary).
##
## This is what makes the corridors dangerous. Without the WANDERING branch the dungeon is a fixed set
## of set-piece rooms and walking is never a risk — and Verdant, which is wandering-only, reaches no
## fight at all on its own.

const CombatRng := preload("res://scripts/rules/combat_rng.gd")
const Facilities := preload("res://scripts/rules/facilities.gd")

const WANDERING_ENCOUNTER_PCT := 4
const WANDERING_COOLDOWN_STEPS := 8
const UNDERPOWER := {"levelWeight": 0.5, "sizeWeight": 0.35, "maxFactor": 2.5, "maxExtraUnits": 4, "absoluteMax": 8}

# `?? fallback` semantics: a key that is absent OR null takes the fallback.
static func _or(source: Dictionary, key: String, fallback: Variant) -> Variant:
	var value: Variant = source.get(key, null)
	return fallback if value == null else value

static func find_enemy(world: Dictionary, enemy_id: Variant) -> Variant:
	for enemy in world.get("enemies", []):
		if enemy.get("id", "") == enemy_id:
			return enemy
	return null

static func floor_for_room(world: Dictionary, room_id: String) -> Variant:
	for dungeon in world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == room_id:
				return dungeon
	return null

static func create_enemy_group(enemy: Dictionary, count: int) -> Dictionary:
	var attack := int(enemy.get("attack", 0))
	var danger := int(_or(enemy, "dangerTier", 1))
	var group := {
		"id": "group.%s" % String(enemy.get("id", "")),
		"enemyId": enemy.get("id", ""),
		"name": enemy.get("name", ""),
		"count": count,
		"initialCount": count,
		"hpEach": int(enemy.get("hp", 0)),
		"maxHpEach": int(enemy.get("hp", 0)),
		"attack": attack,
		"armor": int(_or(enemy, "armor", 0)),
		"accuracy": int(_or(enemy, "accuracy", 70)),
		"damageMin": int(_or(enemy, "damageMin", maxi(1, attack - 1))),
		"damageMax": int(_or(enemy, "damageMax", maxi(1, attack + 1))),
		"speed": int(_or(enemy, "speed", 4)),
		"morale": int(_or(enemy, "morale", 7)),
		"xp": int(_or(enemy, "xp", maxi(1, danger))),
		"gold": int(_or(enemy, "gold", maxi(0, danger))),
		"status": []
	}
	# Optional fields are only present when the enemy carries them — an undefined field must NOT be
	# serialized, or the canonical state hash diverges from the oracle.
	for key in ["level", "dangerTier", "prizedXp", "role", "elevation", "resistances", "inflicts", "weaknesses", "abilities"]:
		if enemy.get(key, null) != null:
			group[key] = enemy[key]
	return group

static func create_combat_state(room_id: String, enemy: Dictionary, count: int = 1) -> Dictionary:
	var group := create_enemy_group(enemy, count)
	return {
		"enemy": enemy.duplicate(true),
		"roomId": room_id,
		"round": 1,
		"enemyGroups": [group],
		"pendingActions": [],
		"selectedTargetId": group["id"]
	}

# Distinct types side by side; all front-line and freely targetable (no squad shielding).
static func create_multi_group_combat_state(room_id: String, groups: Array) -> Dictionary:
	var enemy_groups := []
	for entry in groups:
		enemy_groups.append(create_enemy_group(entry["enemy"], int(entry["count"])))
	return {
		"enemy": (groups[0]["enemy"] as Dictionary).duplicate(true),
		"roomId": room_id,
		"round": 1,
		"enemyGroups": enemy_groups,
		"pendingActions": [],
		"selectedTargetId": enemy_groups[0]["id"]
	}

static func underpower_factor(party: Array, floor_def: Variant) -> float:
	if typeof(floor_def) != TYPE_DICTIONARY or party.is_empty():
		return 1.0
	var recommended_level := float(_or(floor_def, "recommendedPartyLevel", 1))
	var recommended_size := float(_or(floor_def, "recommendedPartySize", 1))
	var total := 0.0
	for member in party:
		total += float(_or(member, "level", 1))
	var average_level := total / float(party.size())
	var level_shortfall := maxf(0.0, recommended_level - average_level)
	var size_shortfall := maxf(0.0, recommended_size - float(party.size()))
	var factor := 1.0 + float(UNDERPOWER["levelWeight"]) * level_shortfall + float(UNDERPOWER["sizeWeight"]) * size_shortfall
	return minf(factor, float(UNDERPOWER["maxFactor"]))

# Swell a rolled pack for an under-strength party, capped so a group stays readable.
static func scaled_encounter_count(base_count: int, party: Array, floor_def: Variant) -> int:
	var scaled := _round_half_up(float(base_count) * underpower_factor(party, floor_def))
	return mini(mini(scaled, base_count + int(UNDERPOWER["maxExtraUnits"])), int(UNDERPOWER["absoluteMax"]))

# JS Math.round is half-UP (toward +inf), not Godot's round-half-away-from-zero. Counts are positive
# here, but keep the rule explicit so a future negative never silently diverges.
static func _round_half_up(value: float) -> int:
	return int(floor(value + 0.5))

static func select_encounter_groups(rolled: Array, defeated: Array, groups_max: int) -> Array:
	var designed_mixed := groups_max >= 2 and rolled.size() > 1
	if designed_mixed:
		for group in rolled:
			if not defeated.has((group["enemy"] as Dictionary).get("id", "")):
				return rolled
		return []
	var out := []
	for group in rolled:
		if not defeated.has((group["enemy"] as Dictionary).get("id", "")):
			out.append(group)
	return out

# Roll a table into 1..groupsMax DISTINCT groups, drawn by weight without replacement.
static func resolve_encounter_table(world: Dictionary, table_id: String, seed_value: int) -> Array:
	var table: Variant = null
	for candidate in world.get("encounterTables", []):
		if candidate.get("id", "") == table_id:
			table = candidate
			break
	if typeof(table) != TYPE_DICTIONARY or (table.get("entries", []) as Array).is_empty():
		return []

	var entries: Array = table["entries"]
	var groups_max := mini(maxi(1, int(_or(table, "groupsMax", 1))), entries.size())
	# Distinct-type count is ROLLED in [groups_min, groups_max] (both scenario-tunable) — the mirror of
	# rulesEngine.resolveEncounterTable. groups_min DEFAULTS TO groups_max (inert on existing balance); a
	# table drops it below groups_max to roll a lone foe OR the pair.
	var groups_min := mini(maxi(1, int(_or(table, "groupsMin", groups_max))), groups_max)
	var group_count := groups_min + (CombatRng.hash_seed("%s:%d:groups" % [table_id, seed_value]) % (groups_max - groups_min + 1))
	var remaining := entries.duplicate()
	var chosen := []
	for picked in range(group_count):
		if remaining.is_empty():
			break
		var total_weight := 0
		for entry in remaining:
			total_weight += int(entry.get("weight", 0))
		if total_weight <= 0:
			break
		var roll := CombatRng.hash_seed("%s:%d:pick%d" % [table_id, seed_value, picked]) % total_weight
		var index := -1
		for i in remaining.size():
			roll -= int(remaining[i].get("weight", 0))
			if roll < 0:
				index = i
				break
		if index < 0:
			index = 0
		chosen.append(remaining[index])
		remaining.remove_at(index)

	var out := []
	for group_index in chosen.size():
		var entry: Dictionary = chosen[group_index]
		var enemy: Variant = find_enemy(world, entry.get("enemyId", ""))
		if typeof(enemy) != TYPE_DICTIONARY:
			continue
		var minimum := int(_or(entry, "minCount", 1))
		var maximum := int(_or(entry, "maxCount", minimum))
		var count := minimum + (CombatRng.hash_seed("%s:%d:count%d" % [table_id, seed_value, group_index]) % (maximum - minimum + 1))
		out.append({"enemy": enemy, "count": count})
	return out

# The corridor itself ambushes you. Authored rooms own their own fight; landings and rest points are
# safe ground; and a cooldown window since the last fight keeps it from chaining.
static func begin_wandering_encounter(world: Dictionary, room: Variant, state: Dictionary) -> Variant:
	if typeof(room) != TYPE_DICTIONARY:
		return null
	if room.get("encounter", null) != null or room.get("encounterTable", null) != null or room.get("encounterSquad", null) != null:
		return null
	if bool(room.get("stairsToTown", false)) or bool(room.get("restPoint", false)):
		return null
	var floor_def: Variant = floor_for_room(world, String(room.get("id", "")))
	if typeof(floor_def) != TYPE_DICTIONARY:
		return null
	# Density is scenario-authored (IMP-041); a world with no override keeps the engine defaults.
	var balance: Dictionary = world.get("balance", {}) if typeof(world.get("balance", null)) == TYPE_DICTIONARY else {}
	var cooldown := int(balance.get("wanderingCooldownSteps", WANDERING_COOLDOWN_STEPS))
	var encounter_pct := int(balance.get("wanderingEncounterPct", WANDERING_ENCOUNTER_PCT))
	# #37 管制室: a base control-room facility quiets the line — fewer wandering ambushes. No-op (0%) for any
	# world without the facility, so the wandering roll stays byte-identical on every parity trace.
	var wander_off := int(Facilities.active_effects(state, world).get("wanderingReductionPct", 0))
	if wander_off > 0:
		encounter_pct = int(round(float(encounter_pct) * (100.0 - float(wander_off)) / 100.0))
	if int(state.get("stepsSinceEncounter", 0)) < cooldown:
		return null
	if CombatRng.roll_percent("%d:%s:wander" % [int(state.get("turn", 0)), String(room.get("id", ""))]) >= encounter_pct:
		return null

	var table: Variant = null
	for candidate in world.get("encounterTables", []):
		if candidate.get("floorId", "") == floor_def.get("id", ""):
			table = candidate
			break
	if typeof(table) != TYPE_DICTIONARY:
		return null

	var rolled := resolve_encounter_table(world, String(table.get("id", "")), int(state.get("turn", 0)))
	# A `respawns` table opts out of first-contact suppression, so its foes keep appearing (#20).
	var cleared_now: Array = [] if bool(_or(table, "respawns", false)) else (state.get("floorClearedEnemies", []) as Array)
	var fresh := select_encounter_groups(rolled, cleared_now, int(_or(table, "groupsMax", 1)))
	if fresh.is_empty():
		return null

	var scaled := []
	for group in fresh:
		scaled.append({"enemy": group["enemy"], "count": scaled_encounter_count(int(group["count"]), state.get("party", []), floor_def)})

	var combat: Dictionary
	if scaled.size() == 1:
		combat = create_combat_state(String(room.get("id", "")), scaled[0]["enemy"], int(scaled[0]["count"]))
	else:
		combat = create_multi_group_combat_state(String(room.get("id", "")), scaled)

	var labels := []
	for group in scaled:
		var name := String((group["enemy"] as Dictionary).get("name", ""))
		labels.append("%s x%d" % [name, int(group["count"])] if int(group["count"]) > 1 else name)
	return {
		"combat": combat,
		"event": {"type": "enemy_encountered", "enemyId": (scaled[0]["enemy"] as Dictionary).get("id", ""), "enemyName": " & ".join(PackedStringArray(labels)), "roomId": room.get("id", "")}
	}

# IMP-022D: seeing an enemy records it in the bestiary (defeating it later reveals more).
static func record_encounters(record: Variant, enemy_ids: Array) -> Dictionary:
	var out: Dictionary = (record as Dictionary).duplicate(true) if typeof(record) == TYPE_DICTIONARY else {}
	for enemy_id in enemy_ids:
		var key := String(enemy_id)
		var entry: Dictionary = (out.get(key, {}) as Dictionary).duplicate(true)
		entry["encountered"] = int(entry.get("encountered", 0)) + 1
		if not entry.has("defeated"):
			entry["defeated"] = 0
		out[key] = entry
	return out


static func _group_is_back(group: Dictionary) -> bool:
	var elevation := String(group.get("elevation", ""))
	return elevation == "air" or elevation == "mid"

static func _has_standing_front(groups: Array) -> bool:
	for group in groups:
		if int(group.get("count", 0)) > 0 and not _group_is_back(group):
			return true
	return false

static func _melee_targetable(group: Dictionary, groups: Array) -> bool:
	return int(group.get("count", 0)) > 0 and (not _group_is_back(group) or not _has_standing_front(groups))

# A fixed squad fight: the first enemy is the front line, the rest hang back (this is what stops
# Repeat-spam — the party must break the front line or reach past it).
static func create_squad_combat_state(room_id: String, enemies: Array) -> Dictionary:
	var groups := []
	for index in enemies.size():
		var enemy: Dictionary = enemies[index]
		var group := create_enemy_group(enemy, 1)
		group["id"] = "%s.%d" % [String(group["id"]), index]
		group["elevation"] = _or(enemy, "elevation", "ground" if index == 0 else "air")
		groups.append(group)
	var selected: Variant = null
	for group in groups:
		if _melee_targetable(group, groups):
			selected = group["id"]
			break
	if selected == null:
		selected = groups[0]["id"]
	return {
		"enemy": (enemies[0] as Dictionary).duplicate(true),
		"roomId": room_id,
		"round": 1,
		"enemyGroups": groups,
		"pendingActions": [],
		"selectedTargetId": selected
	}

# Whatever fight a room begins on entry: a fixed SQUAD (front + back line), a fixed teaching fight, or
# a rolled pack (swelled for an under-strength party). Null when nothing fires (already cleared this
# floor visit, or no encounter authored).
static func begin_room_encounter(world: Dictionary, room: Variant, state: Dictionary) -> Variant:
	if typeof(room) != TYPE_DICTIONARY:
		return null
	var room_id := String(room.get("id", ""))
	var cleared: Array = state.get("floorClearedEnemies", [])
	# A Wiz-style 玄室 (chamberGuardian): its guardian is gated PER-ROOM — not by enemy-type first contact —
	# so every chamber on a floor fights even when they share one pack table (playtest: with a shared table
	# only the first chamber fought and the rest sat empty). "Cleared" for this visit = the guardian is beaten,
	# read as "its guarded chest is now out (or already claimed)". That kills the re-fight exploit (playtest:
	# walking in and out re-fought the room with no stair between) while re-arming on a fresh descent — chests
	# and claims both reset on a floor change.
	var chest_out := false
	for chest in state.get("chests", []):
		if String(chest.get("roomId", "")) == room_id:
			chest_out = true
			break
	var chamber_beaten: bool = chest_out or (state.get("floorClaimedTreasures", []) as Array).has(room_id)
	var chamber_guardian: bool = bool(room.get("chamberGuardian", false)) and not chamber_beaten

	# A BEATEN chamberGuardian never fights again this floor visit — full stop. Without this it re-rolled its
	# shared multi-type pack table and fought a not-yet-seen type on re-entry (玄室の再戦バグ). Mirrors rulesEngine.
	if bool(room.get("chamberGuardian", false)) and chamber_beaten:
		return null

	var squad_ids: Variant = room.get("encounterSquad", null)
	if typeof(squad_ids) == TYPE_ARRAY:
		var squad := []
		for enemy_id in squad_ids:
			var enemy: Variant = find_enemy(world, enemy_id)
			if typeof(enemy) == TYPE_DICTIONARY:
				squad.append(enemy)
		if squad.size() >= 2 and (chamber_guardian or not cleared.has((squad[0] as Dictionary).get("id", ""))):
			var names := []
			for enemy in squad:
				names.append(String((enemy as Dictionary).get("name", "")))
			return {
				"combat": create_squad_combat_state(room_id, squad),
				"event": {"type": "enemy_encountered", "enemyId": (squad[0] as Dictionary).get("id", ""), "enemyName": " & ".join(PackedStringArray(names)), "roomId": room_id}
			}

	var encounter: Variant = room.get("encounter", null)
	var fixed_fight: bool = typeof(encounter) == TYPE_DICTIONARY
	var rolled := []
	if fixed_fight:
		var enemy2: Variant = find_enemy(world, (encounter as Dictionary).get("id", ""))
		rolled = [{"enemy": enemy2 if typeof(enemy2) == TYPE_DICTIONARY else encounter, "count": 1}]
	elif typeof(room.get("encounterTable", null)) == TYPE_STRING:
		rolled = resolve_encounter_table(world, String(room["encounterTable"]), int(state.get("turn", 0)))

	var groups_max := 1
	var respawns := false
	if typeof(room.get("encounterTable", null)) == TYPE_STRING:
		for candidate in world.get("encounterTables", []):
			if candidate.get("id", "") == room["encounterTable"]:
				groups_max = int(_or(candidate, "groupsMax", 1))
				respawns = bool(_or(candidate, "respawns", false))
				break

	# Suppression is scoped to THIS FLOOR VISIT: leave and come back and the chambers are repopulated.
	# A `respawns` table opts out entirely (#20); a 玄室 guardian opts out too (gated per-room above), so
	# shared-table chambers each fight rather than suppressing each other.
	var fresh := select_encounter_groups(rolled, ([] if (respawns or chamber_guardian) else cleared), groups_max)
	if fresh.is_empty():
		return null

	var floor_def: Variant = floor_for_room(world, room_id)
	var scaled := []
	for group in fresh:
		# A rolled pack swells for an under-strength party; the fixed teaching fight does not.
		var count := int(group["count"]) if fixed_fight else scaled_encounter_count(int(group["count"]), state.get("party", []), floor_def)
		scaled.append({"enemy": group["enemy"], "count": count})

	var combat: Dictionary
	if scaled.size() == 1:
		combat = create_combat_state(room_id, scaled[0]["enemy"], int(scaled[0]["count"]))
	else:
		combat = create_multi_group_combat_state(room_id, scaled)

	var labels := []
	for group in scaled:
		var name := String((group["enemy"] as Dictionary).get("name", ""))
		labels.append("%s x%d" % [name, int(group["count"])] if int(group["count"]) > 1 else name)
	return {
		"combat": combat,
		"event": {"type": "enemy_encountered", "enemyId": (scaled[0]["enemy"] as Dictionary).get("id", ""), "enemyName": " & ".join(PackedStringArray(labels)), "roomId": room_id}
	}

class_name CombatHelpers
## Pure attack-path helpers ported from rulesEngine.ts / combatMath.ts: damageGroup (a group's hp/count
## transition when hit), getCriticalChance (luck-scaled clamp), getInitiativeScore (= effective speed),
## and characterSpeciesMultiplier (a species-bane affix vs matching enemy tags). Verified against
## godot/data/combat-helper-samples.json (godot/tests/verify_combat_helpers.gd).

const CharacterStats := preload("res://scripts/rules/character_stats.gd")

# damageGroup: reduce the target group's hpEach; when it drops to 0 a body falls and the next steps up
# at full HP (or the group is empty). Other groups pass through unchanged. Keeps every group field.
static func damage_group(groups: Array, group_id: String, damage: int) -> Array:
	var out := []
	for group in groups:
		if String(group.get("id", "")) != group_id:
			out.append(group)
			continue
		var remaining := int(group["hpEach"]) - damage
		var g: Dictionary = (group as Dictionary).duplicate(true)
		if remaining > 0:
			g["hpEach"] = remaining
		else:
			var count := maxi(0, int(group["count"]) - 1)
			g["count"] = count
			g["hpEach"] = int(group["maxHpEach"]) if count > 0 else 0
		out.append(g)
	return out

# getCriticalChance(character): 5 + luck*3, clamped to [5, 50].
static func get_critical_chance(character: Dictionary) -> int:
	var luck := 0
	var aptitude: Variant = character.get("aptitude", {})
	if typeof(aptitude) == TYPE_DICTIONARY:
		luck = int(aptitude.get("luck", 0))
	return clampi(5 + luck * 3, 5, 50)

# getInitiativeScore(character, world): the character's effective speed.
static func get_initiative_score(character: Dictionary, world: Dictionary) -> int:
	return int(CharacterStats.effective(character, world)["speed"])

# characterSpeciesMultiplier(character, world, enemyTags): the largest matching species-bane multiplier
# across worn affixes, else 1.
static func character_species_multiplier(character: Dictionary, world: Dictionary, enemy_tags: Variant) -> float:
	if typeof(enemy_tags) != TYPE_ARRAY or (enemy_tags as Array).is_empty():
		return 1.0
	var multiplier := 1.0
	var equipment: Dictionary = character.get("equipment", {})
	for slot in equipment:
		var equipped: Variant = equipment[slot]
		if typeof(equipped) != TYPE_DICTIONARY or equipped.get("affix", null) == null:
			continue
		var affix: Variant = CharacterStats._find_by_id(world.get("affixes", []), equipped["affix"])
		if typeof(affix) == TYPE_DICTIONARY and typeof(affix.get("speciesBonus", null)) == TYPE_DICTIONARY:
			var species: Dictionary = affix["speciesBonus"]
			if enemy_tags.has(species.get("tag", "")):
				multiplier = maxf(multiplier, float(species.get("multiplier", 1)))
	return multiplier

extends RefCounted
## Port of src/domain/leveling.ts — the XP curve + per-level stat growth. Used by combat victory rewards
## AND quest XP grants (both bank XP that can cross a level threshold). apply_level_ups mutates a member
## up as many levels as its XP allows, returning { character, events } (character_leveled_up per level).

static func xp_for_level(level: int) -> int:
	if level <= 1:
		return 0
	return 4 * (level - 1) * level

# Per-level stat gain, keyed off aptitude + the new level (some stats grow on a cadence).
static func growth_for_level(character: Dictionary, new_level: int) -> Dictionary:
	var apt: Dictionary = character.get("aptitude", {})
	var might := int(apt.get("might", 0))
	var agility := int(apt.get("agility", 0))
	var spirit := int(apt.get("spirit", 0))
	var wit := int(apt.get("wit", 0))
	var every_other := new_level % 2 == 0
	var max_mp := int(character.get("maxMp", 0))
	return {
		"maxHp": 2 + maxi(might, spirit),
		"maxMp": (2 if (max_mp > 0 and spirit + wit >= 2) else (1 if max_mp > 0 else 0)),
		"attack": 1 if every_other else 0,
		"damageMin": 1 if new_level % 3 == 0 else 0,
		"damageMax": 1 if every_other else 0,
		"accuracy": 1 if every_other else 0,
		"armor": 1 if new_level % 4 == 0 else 0,
		"speed": 1 if (agility >= 2 and every_other) else 0,
	}

static func apply_level_ups(character: Dictionary) -> Dictionary:
	var current: Dictionary = character.duplicate(true)
	var events := []
	while int(current.get("xp", 0)) >= xp_for_level(int(current.get("level", 1)) + 1):
		var next_level := int(current.get("level", 1)) + 1
		var gain := growth_for_level(current, next_level)
		var max_hp := int(current.get("maxHp", 0)) + int(gain["maxHp"])
		var max_mp := int(current.get("maxMp", 0)) + int(gain["maxMp"])
		current["level"] = next_level
		current["maxHp"] = max_hp
		current["hp"] = mini(int(current.get("hp", 0)) + int(gain["maxHp"]), max_hp)
		current["maxMp"] = max_mp
		current["mp"] = mini(int(current.get("mp", 0)) + int(gain["maxMp"]), max_mp)
		current["attack"] = int(current.get("attack", 0)) + int(gain["attack"])
		current["damageMin"] = int(current.get("damageMin", 0)) + int(gain["damageMin"])
		current["damageMax"] = int(current.get("damageMax", 0)) + int(gain["damageMax"])
		current["accuracy"] = int(current.get("accuracy", 0)) + int(gain["accuracy"])
		current["armor"] = int(current.get("armor", 0)) + int(gain["armor"])
		current["speed"] = int(current.get("speed", 0)) + int(gain["speed"])
		events.append({"type": "character_leveled_up", "characterId": current.get("id", ""), "characterName": current.get("name", ""), "level": next_level})
	return {"character": current, "events": events}

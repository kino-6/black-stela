extends RefCounted
## GDScript port of createGuildCharacter (src/domain/characterCreation.ts) — the guild character build
## math: buildAptitude → deriveStats → baseMaxMpForClass → equipment. The class/background/trait
## catalogs + the per-class MP mode come from res://data/character-data.json (exported by
## `npm run export:character-data`), so Godot builds an adventurer byte-identical to TS. The minted id
## is NOT part of this math (caller supplies it); everything else is derived here.
##
## create(input, data) returns a Character dict. `input` = { name, classId?, backgroundId?, traitIds?,
## aptitudeFocus?, bonusAptitude?, accentColor?, title?, notes?, method?, seed?, registeredAtTurn? }.

const APTITUDE_KEYS := ["might", "agility", "spirit", "wit", "luck"]

static func create(input: Dictionary, data: Dictionary) -> Dictionary:
	var class_def := _find(data.get("classes", []), input.get("classId", "vanguard"))
	if class_def.is_empty():
		class_def = _find(data.get("classes", []), "vanguard")
	var background := _find(data.get("backgrounds", []), input.get("backgroundId", "watch"))
	if background.is_empty():
		background = _find(data.get("backgrounds", []), "watch")
	var trait_ids: Array = input.get("traitIds", [])
	if trait_ids.is_empty():
		trait_ids = ["steady"]
	else:
		trait_ids = trait_ids.slice(0, 2)
	var traits := []
	for tid in trait_ids:
		var t := _find(data.get("traits", []), tid)
		if not t.is_empty():
			traits.append(t)

	var aptitude := _build_aptitude(class_def, input.get("aptitudeFocus", "balanced"), background, traits, input.get("bonusAptitude", {}), data.get("defaultAptitude", {}))
	var stats := _derive_stats(class_def, aptitude)
	var mp := _base_max_mp(input.get("classId", "vanguard"), aptitude, data.get("mpModeByClass", {}))

	# equipment is an ORDERED array of {slot, id} (class-insertion order) so startingEquipment matches TS.
	var loadout: Array = class_def.get("equipment", [])
	var equipment := {}
	var starting := []
	for entry in loadout:
		if typeof(entry) != TYPE_DICTIONARY:
			continue
		var slot: String = entry.get("slot", "")
		var eid: Variant = entry.get("id", "")
		if slot != "" and typeof(eid) == TYPE_STRING and eid != "":
			equipment[slot] = {"id": eid}
			starting.append(eid)

	return {
		"id": input.get("id", ""),
		"name": String(input.get("name", "")).strip_edges(),
		"classId": class_def.get("id", "vanguard"),
		"roleTags": class_def.get("roleTags", []),
		"rowPreference": class_def.get("rowPreference", "front"),
		"backgroundId": background.get("id", "watch"),
		"aptitude": aptitude,
		"traitIds": trait_ids,
		"accentColor": input.get("accentColor", background.get("accentColor", "#c9a765")),
		"startingEquipment": starting,
		"equipment": equipment,
		"row": class_def.get("rowPreference", "front"),
		"level": 1,
		"hp": int(stats["maxHp"]),
		"maxHp": int(stats["maxHp"]),
		"mp": mp,
		"maxMp": mp,
		"attack": int(stats["attack"]),
		"damageMin": int(stats["damageMin"]),
		"damageMax": int(stats["damageMax"]),
		"accuracy": int(stats["accuracy"]),
		"armor": int(stats["armor"]),
		"speed": int(stats["speed"]),
		"xp": 0,
		"gold": 0,
		"status": [],
	}

# default {2,2,2,2,2} + class + focus(+2) + background + each trait + bonus.
static func _build_aptitude(class_def: Dictionary, focus: String, background: Dictionary, traits: Array, bonus: Dictionary, default_apt: Dictionary) -> Dictionary:
	var apt := {}
	for k in APTITUDE_KEYS:
		apt[k] = int(default_apt.get(k, 0))
	_add_apt(apt, class_def.get("aptitude", {}))
	if focus != "balanced" and APTITUDE_KEYS.has(focus):
		apt[focus] = int(apt[focus]) + 2
	_add_apt(apt, background.get("aptitude", {}))
	for t in traits:
		_add_apt(apt, t.get("aptitude", {}))
	_add_apt(apt, bonus)
	return apt

static func _add_apt(apt: Dictionary, src: Variant) -> void:
	if typeof(src) != TYPE_DICTIONARY:
		return
	for k in src:
		if apt.has(k):
			apt[k] = int(apt[k]) + int(src[k])

static func _derive_stats(class_def: Dictionary, apt: Dictionary) -> Dictionary:
	var base: Dictionary = class_def.get("base", {})
	var might := int(apt.get("might", 0))
	var agility := int(apt.get("agility", 0))
	var spirit := int(apt.get("spirit", 0))
	var luck := int(apt.get("luck", 0))
	return {
		"maxHp": int(base.get("maxHp", 0)) + might + int(floor(spirit / 2.0)),
		"attack": int(base.get("attack", 0)) + int(floor(might / 2.0)),
		"damageMin": int(base.get("damageMin", 0)) + int(floor(might / 3.0)),
		"damageMax": int(base.get("damageMax", 0)) + int(floor((might + luck) / 3.0)),
		"accuracy": mini(95, int(base.get("accuracy", 0)) + agility + int(floor(luck / 2.0))),
		"armor": int(base.get("armor", 0)) + int(floor(spirit / 4.0)),
		"speed": int(base.get("speed", 0)) + agility,
	}

# caster: 4 + (spirit+wit)*2 ; martial: 3 + might ; none: 0.
static func _base_max_mp(class_id: String, apt: Dictionary, mp_modes: Dictionary) -> int:
	match String(mp_modes.get(class_id, "none")):
		"caster":
			return 4 + (int(apt.get("spirit", 0)) + int(apt.get("wit", 0))) * 2
		"martial":
			return 3 + int(apt.get("might", 0))
		_:
			return 0

static func _find(items: Array, id: String) -> Dictionary:
	for item in items:
		if typeof(item) == TYPE_DICTIONARY and item.get("id", "") == id:
			return item
	return {}

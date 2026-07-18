class_name CharacterStats
## Port of getEffectiveCharacterStats (src/domain/economy.ts): base stats + equipment bonuses (with the
## "+N" primary-stat reinforce and the named affix) + the active vocation's stat modifiers. Operates on
## the JSON-shaped character + world dicts so the result canonicalizes identically to the TS oracle.
## Verified against godot/data/stat-samples.json (godot/tests/verify_stats.gd).
##
## Affixes are resolved against world.affixes (authored). Built-in common enchants live in TS code, not
## the world pack — resolving those needs the merged catalog exported, which no sample/route needs yet.

static func effective(character: Dictionary, world: Dictionary) -> Dictionary:
	var attack_bonus := 0
	var defense_bonus := 0
	var accuracy_bonus := 0
	var speed_bonus := 0
	var hp_bonus := 0
	var mp_bonus := 0
	var resistance: Dictionary = (character.get("resistance", {}) as Dictionary).duplicate(true)
	var attack_element := "physical"
	var element_resist := {}

	var equipment: Dictionary = character.get("equipment", {})
	for slot in equipment:
		var equipped: Variant = equipment[slot]
		if typeof(equipped) != TYPE_DICTIONARY:
			continue
		var catalog: Variant = _find_by_id(world.get("equipment", []), equipped.get("id", ""))
		if typeof(catalog) != TYPE_DICTIONARY:
			continue

		attack_bonus += int(catalog.get("attackBonus", 0))
		defense_bonus += int(catalog.get("defenseBonus", 0))
		accuracy_bonus += int(catalog.get("accuracyBonus", 0))
		speed_bonus += int(catalog.get("speedBonus", 0))
		hp_bonus += int(catalog.get("hpBonus", 0))
		mp_bonus += int(catalog.get("mpBonus", 0))
		_add_resist(resistance, catalog.get("resistBonus", {}))
		if catalog.get("slot", "") == "weapon" and catalog.has("element"):
			attack_element = catalog["element"]
		_mul_element_resist(element_resist, catalog.get("elementResist", {}))

		var plus := int(equipped.get("plus", 0))
		if plus != 0:
			match _plus_primary(catalog.get("slot", "")):
				"attackBonus": attack_bonus += plus
				"defenseBonus": defense_bonus += plus
				_: accuracy_bonus += plus

		var affix: Variant = _find_by_id(world.get("affixes", []), equipped.get("affix", null))
		if typeof(affix) == TYPE_DICTIONARY:
			attack_bonus += int(affix.get("attackBonus", 0))
			defense_bonus += int(affix.get("defenseBonus", 0))
			accuracy_bonus += int(affix.get("accuracyBonus", 0))
			speed_bonus += int(affix.get("speedBonus", 0))
			hp_bonus += int(affix.get("hpBonus", 0))
			mp_bonus += int(affix.get("mpBonus", 0))
			_add_resist(resistance, affix.get("resistBonus", {}))
			_mul_element_resist(element_resist, affix.get("elementResist", {}))

	var current_voc: String = character.get("classId", "")
	var voc_state: Variant = character.get("vocation", null)
	if typeof(voc_state) == TYPE_DICTIONARY and voc_state.has("current"):
		current_voc = voc_state["current"]
	var voc: Dictionary = _vocation_modifiers(world, current_voc)

	return {
		"attack": int(character.get("attack", 0)) + attack_bonus + _voc(voc, "attack"),
		"damageMin": int(character.get("damageMin", 0)) + attack_bonus + _voc_or(voc, "damageMin", "attack"),
		"damageMax": int(character.get("damageMax", 0)) + attack_bonus + _voc_or(voc, "damageMax", "attack"),
		"accuracy": clampi(int(character.get("accuracy", 0)) + accuracy_bonus + _voc(voc, "accuracy"), 0, 100),
		"armor": int(character.get("armor", 0)) + defense_bonus + _voc(voc, "armor"),
		"speed": maxi(0, int(character.get("speed", 0)) + speed_bonus + _voc(voc, "speed")),
		"maxHp": maxi(1, int(character.get("maxHp", 0)) + hp_bonus + _voc(voc, "maxHp")),
		"maxMp": maxi(0, int(character.get("maxMp", 0)) + mp_bonus + _voc(voc, "maxMp")),
		"resistance": resistance,
		"attackElement": attack_element,
		"elementResist": element_resist,
	}

static func _find_by_id(list: Array, id: Variant) -> Variant:
	if id == null:
		return null
	for entry in list:
		if typeof(entry) == TYPE_DICTIONARY and entry.get("id", "") == id:
			return entry
	return null

static func _plus_primary(slot: String) -> String:
	if slot == "weapon":
		return "attackBonus"
	if slot == "accessory":
		return "accuracyBonus"
	return "defenseBonus"

static func _add_resist(resistance: Dictionary, bonus: Variant) -> void:
	if typeof(bonus) != TYPE_DICTIONARY:
		return
	for status in bonus:
		resistance[status] = int(resistance.get(status, 0)) + int(bonus[status])

static func _mul_element_resist(er: Dictionary, bonus: Variant) -> void:
	if typeof(bonus) != TYPE_DICTIONARY:
		return
	for element in bonus:
		er[element] = float(er.get(element, 1)) * float(bonus[element])

static func _vocation_modifiers(world: Dictionary, voc_id: String) -> Dictionary:
	var voc: Variant = _find_by_id(world.get("vocations", []), voc_id)
	if typeof(voc) == TYPE_DICTIONARY and typeof(voc.get("statModifiers", null)) == TYPE_DICTIONARY:
		return voc["statModifiers"]
	return {}

static func _voc(voc: Dictionary, key: String) -> int:
	return int(voc.get(key, 0))

# JS: voc.damageMin ?? voc.attack ?? 0 — the key, else the fallback key, else 0.
static func _voc_or(voc: Dictionary, key: String, fallback: String) -> int:
	if voc.has(key):
		return int(voc[key])
	if voc.has(fallback):
		return int(voc[fallback])
	return 0

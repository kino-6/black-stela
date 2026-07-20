extends RefCounted
## Port of the town career commands (src/domain/commands/vocationCommands.ts + vocations.ts):
## change_vocation and set_loadout. Both town-only. Changing to a BASIC class reclasses the base stats
## (character_creation.reclass_character, level kept); an ADVANCED vocation layers modifiers at
## effective-stat time and grants its techniques. Level is never reset; learned techniques are a UNION
## (nothing forgotten). The class catalog + mastery knobs ride on the engine bag.

const CharacterCreation := preload("res://scripts/rules/character_creation.gd")

static func _loadout_limit(engine: Dictionary) -> int:
	return int(engine.get("loadoutLimit", 6))

static func _mastered_rank(engine: Dictionary) -> int:
	return int(engine.get("masteredRank", 5))

static func _known_spells(class_id: String, level: int, engine: Dictionary) -> Array:
	var abilities: Variant = (engine.get("classAbilities", {}) as Dictionary).get(class_id, [])
	var out := []
	if typeof(abilities) == TYPE_ARRAY:
		for entry in abilities:
			if level >= int(entry.get("level", 0)):
				out.append(entry.get("spellId", ""))
	return out

# Built-in basics (from engine.classes) + authored world vocations; authored wins on a shared id.
static func resolve_vocation_catalog(world: Dictionary, engine: Dictionary) -> Array:
	var authored_ids := {}
	for v in world.get("vocations", []):
		authored_ids[v.get("id", "")] = true
	var out := []
	for def in engine.get("classes", []):
		if authored_ids.has(def.get("id", "")):
			continue
		var label: Dictionary = def.get("label", {})
		out.append({"id": def.get("id", ""), "tier": "basic", "name": label.get("en", def.get("id", "")), "authored": false})
	for v in world.get("vocations", []):
		out.append({"id": v.get("id", ""), "tier": v.get("tier", "advanced"), "name": v.get("name", ""), "authored": true, "requires": v.get("requires", {}), "statModifiers": v.get("statModifiers", {}), "allowedSlots": v.get("allowedSlots", []), "grantsTechniques": v.get("grantsTechniques", [])})
	return out

static func find_vocation(world: Dictionary, engine: Dictionary, id: String) -> Variant:
	for v in resolve_vocation_catalog(world, engine):
		if v.get("id", "") == id:
			return v
	return null

# Materialise a default vocation state from the class when the character has none.
static func resolve_vocation_state(character: Dictionary, engine: Dictionary) -> Dictionary:
	var class_id: String = character.get("classId", "")
	var class_line := _known_spells(class_id, int(character.get("level", 1)), engine)
	var limit := _loadout_limit(engine)

	if typeof(character.get("vocation", null)) == TYPE_DICTIONARY:
		# §9.4b, mirroring src/domain/vocations.ts: LEVELLING MUST STILL TEACH. Stored vocation state is
		# only ever written by a vocation CHANGE, so a character who had touched the career screen once
		# had `learned` frozen at that moment and never learned anything again — a level 9 Knight would
		# never receive `cover`. Fold the class's line at the CURRENT level in on every read. It is a
		# union, never a replacement: training from other vocations must persist (§6).
		var stored: Dictionary = character["vocation"]
		var learned: Array = (stored.get("learned", []) as Array).duplicate()
		for technique in class_line:
			if not learned.has(technique):
				learned.append(technique)
		if learned.size() == (stored.get("learned", []) as Array).size():
			return stored
		# A newly learned technique fills a free loadout slot rather than sitting unusable behind the
		# career screen — the player's own picks and their order are never disturbed.
		var loadout: Array = (stored.get("loadout", []) as Array).duplicate()
		for technique in learned:
			if loadout.size() >= limit:
				break
			if not loadout.has(technique):
				loadout.append(technique)
		var refreshed := stored.duplicate()
		refreshed["learned"] = learned
		refreshed["loadout"] = loadout
		return refreshed

	return {"current": class_id, "mastery": {}, "progress": {}, "learned": class_line.duplicate(), "loadout": class_line.slice(0, limit)}

static func mastery_rank(state: Dictionary, vocation_id: String) -> int:
	return int((state.get("mastery", {}) as Dictionary).get(vocation_id, 0))

static func is_mastered(state: Dictionary, vocation_id: String, engine: Dictionary) -> bool:
	return mastery_rank(state, vocation_id) >= _mastered_rank(engine)

static func can_adopt_vocation(character: Dictionary, vocation_id: String, world: Dictionary, engine: Dictionary) -> bool:
	var vocation: Variant = find_vocation(world, engine, vocation_id)
	if typeof(vocation) != TYPE_DICTIONARY:
		return false
	var state := resolve_vocation_state(character, engine)
	var requires: Dictionary = vocation.get("requires", {})
	if int(requires.get("minLevel", 0)) > 0 and int(character.get("level", 1)) < int(requires.get("minLevel", 0)):
		return false
	for required in requires.get("mastered", []):
		if not is_mastered(state, String(required), engine):
			return false
	return true

# Switch `current`, keep level/learned, union the new vocation's granted techniques, and fill the
# loadout up to the limit from freshly-granted techniques.
static func adopt_vocation_state(state: Dictionary, vocation: Dictionary, engine: Dictionary) -> Dictionary:
	var learned := []
	for t in state.get("learned", []):
		if not learned.has(t):
			learned.append(t)
	for t in vocation.get("grantsTechniques", []):
		if not learned.has(t):
			learned.append(t)
	var mastery: Dictionary = (state.get("mastery", {}) as Dictionary).duplicate(true)
	if not mastery.has(vocation.get("id", "")):
		mastery[vocation.get("id", "")] = 0
	var loadout := []
	for t in state.get("loadout", []):
		if learned.has(t):
			loadout.append(t)
	var limit := _loadout_limit(engine)
	for t in vocation.get("grantsTechniques", []):
		if loadout.size() >= limit:
			break
		if not loadout.has(t):
			loadout.append(t)
	var next: Dictionary = state.duplicate(true)
	next["current"] = vocation.get("id", "")
	next["learned"] = learned
	next["mastery"] = mastery
	next["loadout"] = loadout
	return next

# A BASIC vocation IS a class → reclass the base (level kept). An ADVANCED one keeps the class base and
# layers modifiers. Either way learned is a UNION and `current` points at the new vocation.
static func change_character_vocation(character: Dictionary, vocation: Dictionary, world: Dictionary, engine: Dictionary) -> Dictionary:
	var builtin_ids := {}
	for def in engine.get("classes", []):
		builtin_ids[def.get("id", "")] = true
	var is_basic_class: bool = vocation.get("tier", "") == "basic" and builtin_ids.has(vocation.get("id", ""))
	var rebuilt: Dictionary = CharacterCreation.reclass_character(character, vocation.get("id", ""), world, engine) if is_basic_class else character.duplicate(true)
	var prior_state := resolve_vocation_state(rebuilt, engine)
	var class_techniques := _known_spells(rebuilt.get("classId", ""), int(rebuilt.get("level", 1)), engine) if is_basic_class else []
	var with_class: Dictionary = prior_state.duplicate(true)
	var learned := []
	for t in prior_state.get("learned", []):
		if not learned.has(t):
			learned.append(t)
	for t in class_techniques:
		if not learned.has(t):
			learned.append(t)
	with_class["learned"] = learned
	var result: Dictionary = rebuilt.duplicate(true)
	result["vocation"] = adopt_vocation_state(with_class, vocation, engine)
	return result

static func set_loadout(state: Dictionary, desired: Array, engine: Dictionary) -> Dictionary:
	var learned: Dictionary = {}
	for t in state.get("learned", []):
		learned[t] = true
	var limit := _loadout_limit(engine)
	var loadout := []
	for t in desired:
		if learned.has(t) and not loadout.has(t) and loadout.size() < limit:
			loadout.append(t)
	var next: Dictionary = state.duplicate(true)
	next["loadout"] = loadout
	return next

static func localized_vocation_name(world: Dictionary, engine: Dictionary, id: String, locale: String) -> String:
	for v in world.get("vocations", []):
		if v.get("id", "") == id:
			var locales: Dictionary = v.get("locales", {})
			var loc: Dictionary = locales.get(locale, {})
			return String(loc.get("name", v.get("name", "")))
	for def in engine.get("classes", []):
		if def.get("id", "") == id:
			var label: Dictionary = def.get("label", {})
			return String(label.get(locale, label.get("en", id)))
	return id

# --- commands ---

static func change_vocation(state: Dictionary, world: Dictionary, engine: Dictionary, character_id: String, vocation_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member: Variant = null
	for candidate in state.get("party", []):
		if candidate.get("id", "") == character_id:
			member = candidate
			break
	var vocation: Variant = find_vocation(world, engine, vocation_id)
	if typeof(member) != TYPE_DICTIONARY or typeof(vocation) != TYPE_DICTIONARY or not can_adopt_vocation(member, vocation_id, world, engine):
		return {"state": state, "events": []}
	if resolve_vocation_state(member, engine).get("current", "") == vocation_id:
		return {"state": state, "events": []}
	var changed := change_character_vocation(member, vocation, world, engine)
	var next: Dictionary = state.duplicate(true)
	var party := []
	for candidate in next.get("party", []):
		party.append(changed if candidate.get("id", "") == character_id else candidate)
	next["party"] = party
	next["turn"] = int(next.get("turn", 0)) + 1
	var event := {"type": "vocation_changed", "characterId": character_id, "characterName": member.get("name", ""), "vocationId": vocation_id, "vocationName": localized_vocation_name(world, engine, vocation_id, "en")}
	return {"state": next, "events": [event]}

static func set_loadout_command(state: Dictionary, engine: Dictionary, character_id: String, loadout: Array) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member: Variant = null
	for candidate in state.get("party", []):
		if candidate.get("id", "") == character_id:
			member = candidate
			break
	if typeof(member) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var next_vocation := set_loadout(resolve_vocation_state(member, engine), loadout, engine)
	var next: Dictionary = state.duplicate(true)
	var party := []
	for candidate in next.get("party", []):
		if candidate.get("id", "") == character_id:
			var m: Dictionary = candidate.duplicate(true)
			m["vocation"] = next_vocation
			party.append(m)
		else:
			party.append(candidate)
	next["party"] = party
	return {"state": next, "events": []}

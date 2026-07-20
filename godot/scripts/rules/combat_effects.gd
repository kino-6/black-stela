class_name CombatEffects
## The GDScript port of src/domain/combatEffects.ts — the LASTING half of a technique.
##
## Wards, buffs, debuffs and the Knight's cover, while they are still running. Strictly per-fight, so
## they live on `combat.effects` and never on a character: a character is persisted in saves, and a ward
## that outlived its battle would be a permanent stat gift that every future migration had to reason
## about. Combat state is discarded when the fight ends, which is exactly the lifetime a ward should have.
##
## An effect's subject is a plain id — a character id or an enemy group id — because a debuff on a pack
## and a buff on an adventurer are the same rule seen from two sides.

## Which effect kinds persist. Instant effects (heal, damage, cure) resolve and are gone.
static func is_lasting(effect: Dictionary) -> bool:
	var kind := String(effect.get("kind", ""))
	return kind == "ward" or kind == "buff" or kind == "debuff" or kind == "cover"

## What an effect is keyed by. Re-casting the same technique on the same subject REFRESHES rather than
## stacks — otherwise a chanter could spend a fight re-singing one ward and walk out with an unbounded
## bonus. Two DIFFERENT techniques touching one stat do stack; that is a composition reward.
static func _key(subject_id: String, source: String, effect: Dictionary) -> String:
	var kind := String(effect.get("kind", ""))
	var detail := String(effect.get("stat", "")) if (kind == "buff" or kind == "debuff") else kind
	return "%s %s %s %s" % [subject_id, source, kind, detail]

static func _duration_rounds(effect: Dictionary, technique: Dictionary) -> Variant:
	var duration: Variant = effect.get("duration", null)
	if typeof(duration) != TYPE_DICTIONARY:
		duration = technique.get("duration", {})
	if typeof(duration) == TYPE_DICTIONARY and String(duration.get("kind", "")) == "rounds":
		return int(duration.get("rounds", 0))
	return null

## Apply every lasting effect a technique carries to one subject, returning the new effect list.
static func apply_lasting(effects: Array, subject_id: String, technique: Dictionary) -> Array:
	var next: Array = effects.duplicate(true)
	for effect in technique.get("effects", []):
		if typeof(effect) != TYPE_DICTIONARY or not is_lasting(effect):
			continue
		var key := _key(subject_id, String(technique.get("id", "")), effect)
		next = next.filter(func(active): return _key(String(active.get("subjectId", "")), String(active.get("source", "")), active.get("effect", {})) != key)
		next.append({
			"subjectId": subject_id,
			"source": technique.get("id", ""),
			"effect": (effect as Dictionary).duplicate(true),
			"remaining": _duration_rounds(effect, technique)
		})
	return next

## Advance one round: fixed-round effects expire at zero; `combat` effects (remaining == null) run on.
static func tick(effects: Array) -> Array:
	var next := []
	for active in effects:
		var remaining: Variant = active.get("remaining", null)
		if remaining == null:
			next.append(active)
			continue
		var left := int(remaining) - 1
		if left > 0:
			var moved: Dictionary = (active as Dictionary).duplicate(true)
			moved["remaining"] = left
			next.append(moved)
	return next

## Net change to one stat on one subject: buffs add, debuffs subtract.
static func stat_modifier(effects: Array, subject_id: String, stat: String) -> int:
	var total := 0
	for active in effects:
		if String(active.get("subjectId", "")) != subject_id:
			continue
		var effect: Dictionary = active.get("effect", {})
		if String(effect.get("stat", "")) != stat:
			continue
		if String(effect.get("kind", "")) == "buff":
			total += int(effect.get("amount", 0))
		elif String(effect.get("kind", "")) == "debuff":
			total -= int(effect.get("amount", 0))
	return total

## Added status resistance from active wards, in the same percentage points gear `resistBonus` uses.
static func ward_status_resist(effects: Array, subject_id: String, status: String) -> int:
	var total := 0
	for active in effects:
		if String(active.get("subjectId", "")) != subject_id:
			continue
		var effect: Dictionary = active.get("effect", {})
		if String(effect.get("kind", "")) != "ward":
			continue
		total += int((effect.get("statusResist", {}) as Dictionary).get(status, 0))
	return total

## Element resistance from active wards, as a MULTIPLIER — matching how gear elementResist composes.
static func ward_element_resist(effects: Array, subject_id: String, element: String) -> float:
	var multiplier := 1.0
	for active in effects:
		if String(active.get("subjectId", "")) != subject_id:
			continue
		var effect: Dictionary = active.get("effect", {})
		if String(effect.get("kind", "")) != "ward":
			continue
		multiplier *= float((effect.get("elementResist", {}) as Dictionary).get(element, 1.0))
	return multiplier

## Every ward running on a subject — used to collect the statuses/elements a ward names.
static func effects_on(effects: Array, subject_id: String) -> Array:
	return effects.filter(func(active): return String(active.get("subjectId", "")) == subject_id)

## The party member currently covering, if any — who an enemy's BASIC attack must strike instead of its
## own choice. Ties go to the first still standing, so two knights are redundancy, not a puzzle.
static func covering_member_id(effects: Array, standing_ids: Array) -> String:
	for active in effects:
		if String((active.get("effect", {}) as Dictionary).get("kind", "")) == "cover" and standing_ids.has(String(active.get("subjectId", ""))):
			return String(active.get("subjectId", ""))
	return ""

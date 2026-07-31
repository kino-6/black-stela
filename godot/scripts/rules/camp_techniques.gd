class_name CampTechniques
## Port of the TypeScript `use_technique` command. This owns the non-combat subset of the technique
## catalog: recovery and cures. Battle-duration effects are intentionally refused; they belong to combat.

const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const CombatHelpers := preload("res://scripts/rules/combat_helpers.gd")
const RosterUtil := preload("res://scripts/rules/roster_util.gd")
const Techniques := preload("res://scripts/rules/techniques.gd")
const Vocations := preload("res://scripts/rules/vocations.gd")

static func use_technique(state: Dictionary, world: Dictionary, engine: Dictionary, character_id: String, technique_id: String, target_id: String = "") -> Dictionary:
	if String(state.get("phase", "")) == "combat":
		return {"state": state, "events": []}
	var actor := RosterUtil.find_by_id(state.get("party", []), character_id)
	var technique: Dictionary = (engine.get("techniques", {}) as Dictionary).get(technique_id, {})
	if actor.is_empty() or technique.is_empty() or not Techniques.is_camp_usable(technique_id, engine):
		return {"state": state, "events": []}
	if not (Vocations.resolve_vocation_state(actor, engine).get("learned", []) as Array).has(technique_id):
		return {"state": state, "events": []}
	var statuses: Array = actor.get("status", [])
	if int(actor.get("hp", 0)) <= 0 or actor.get("injury", null) != null or statuses.has("sleep"):
		return {"state": state, "events": []}
	if String(technique.get("kind", "")) == "spell" and statuses.has("silence"):
		return {"state": state, "events": []}
	var cost := int((technique.get("cost", {}) as Dictionary).get("mp", 0))
	if int(actor.get("mp", 0)) < cost:
		return {"state": state, "events": []}

	var able := []
	for member_v in state.get("party", []):
		var member: Dictionary = member_v
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null:
			able.append(member)
	var targets := []
	match String(technique.get("target", "")):
		"self":
			targets = [actor]
		"party":
			targets = able
		"ally":
			for member in able:
				if String(member.get("id", "")) == target_id:
					targets.append(member)
	if targets.is_empty():
		return {"state": state, "events": []}

	var target_ids := {}
	var target_names := []
	for target in targets:
		target_ids[String(target.get("id", ""))] = true
		target_names.append(String(target.get("name", "")))
	var spell_power := CombatHelpers.get_spell_power_bonus(actor) if String(technique.get("kind", "")) == "spell" else 0
	var healed := 0
	var cured_statuses := []
	var party := []
	for member_v in state.get("party", []):
		var next: Dictionary = (member_v as Dictionary).duplicate(true)
		if String(next.get("id", "")) == character_id:
			next["mp"] = int(next.get("mp", 0)) - cost
		if target_ids.has(String(next.get("id", ""))):
			for effect_v in technique.get("effects", []):
				var effect: Dictionary = effect_v
				if String(effect.get("kind", "")) == "heal":
					var amount := int(effect.get("amount", 0)) + (spell_power if bool(effect.get("scalesWithSpellPower", false)) else 0)
					var hp := mini(int(CharacterStats.effective(next, world).get("maxHp", 1)), int(next.get("hp", 0)) + amount)
					healed += hp - int(next.get("hp", 0))
					next["hp"] = hp
				elif String(effect.get("kind", "")) == "cure":
					var cured := effect.get("statuses", []) as Array
					var kept := []
					for status in next.get("status", []):
						if cured.has(status):
							if not cured_statuses.has(status):
								cured_statuses.append(status)
						else:
							kept.append(status)
					next["status"] = kept
		party.append(next)
	var next_state: Dictionary = state.duplicate(true)
	next_state["party"] = party
	next_state["turn"] = int(state.get("turn", 0)) + 1
	return {"state": next_state, "events": [{"type": "technique_used", "techniqueId": technique_id, "characterId": character_id, "characterName": actor.get("name", ""), "targetCharacterIds": target_ids.keys(), "targetNames": target_names, "healAmount": healed, "curedStatuses": cured_statuses}]}

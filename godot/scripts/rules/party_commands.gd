extends RefCounted
## Roster lifecycle commands, extracted VERBATIM from slice_rules (IMP-050): row changes, bench / recall /
## retire / unretire / erase, identity edits, and reclass. Pure — each returns {state, events} and touches
## no scene, input, renderer or file system. Command ordering, event text, turn increments and dictionary
## shape are unchanged from the dispatcher; the roster golden trace (9 steps) proves byte-for-byte parity.

const RosterUtil := preload("res://scripts/rules/roster_util.gd")
const CharacterCreation := preload("res://scripts/rules/character_creation.gd")

const PARTY_SIZE_LIMIT := 6

static func set_member_row(state: Dictionary, char_id: String, row: String) -> Dictionary:
	if state.get("phase", "") == "combat":
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("party", []), char_id)
	if member.is_empty() or member.get("row", "") == row:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	for m in next["party"]:
		if String(m.get("id", "")) == char_id:
			m["row"] = row
	return {"state": next, "events": [{"type": "party_member_reformed", "characterName": member.get("name", ""), "row": row}]}

static func swap_member_rows(state: Dictionary, char_id: String, target_id: String) -> Dictionary:
	if state.get("phase", "") == "combat":
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("party", []), char_id)
	var target := RosterUtil.find_by_id(state.get("party", []), target_id)
	if member.is_empty() or target.is_empty() or member.get("row", "") == target.get("row", ""):
		return {"state": state, "events": []}
	var member_row: String = member.get("row", "front")
	var target_row: String = target.get("row", "front")
	var next: Dictionary = state.duplicate(true)
	for m in next["party"]:
		if String(m.get("id", "")) == char_id:
			m["row"] = target_row
		elif String(m.get("id", "")) == target_id:
			m["row"] = member_row
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [
		{"type": "party_member_reformed", "characterName": member.get("name", ""), "row": target_row},
		{"type": "party_member_reformed", "characterName": target.get("name", ""), "row": member_row},
	]}

static func bench_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = RosterUtil.without_id(next.get("party", []), char_id)
	next["reserve"] = (next.get("reserve", []) as Array) + [member]
	return {"state": next, "events": [{"type": "party_member_benched", "characterName": member.get("name", "")}]}

static func recall_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town" or (state.get("party", []) as Array).size() >= PARTY_SIZE_LIMIT:
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("reserve", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = (next.get("party", []) as Array) + [member]
	next["reserve"] = RosterUtil.without_id(next.get("reserve", []), char_id)
	return {"state": next, "events": [{"type": "party_member_recalled", "characterName": member.get("name", "")}]}

static func retire_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		member = RosterUtil.find_by_id(state.get("reserve", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = RosterUtil.without_id(next.get("party", []), char_id)
	next["reserve"] = RosterUtil.without_id(next.get("reserve", []), char_id)
	next["retired"] = (next.get("retired", []) as Array) + [member]
	return {"state": next, "events": [{"type": "party_member_retired", "characterName": member.get("name", "")}]}

static func unretire_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("retired", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["retired"] = RosterUtil.without_id(next.get("retired", []), char_id)
	next["reserve"] = (next.get("reserve", []) as Array) + [member]
	return {"state": next, "events": [{"type": "party_member_unretired", "characterName": member.get("name", "")}]}

static func erase_member(state: Dictionary, char_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		member = RosterUtil.find_by_id(state.get("reserve", []), char_id)
	if member.is_empty():
		member = RosterUtil.find_by_id(state.get("retired", []), char_id)
	if member.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["party"] = RosterUtil.without_id(next.get("party", []), char_id)
	next["reserve"] = RosterUtil.without_id(next.get("reserve", []), char_id)
	next["retired"] = RosterUtil.without_id(next.get("retired", []), char_id)
	return {"state": next, "events": [{"type": "party_member_erased", "characterName": member.get("name", "")}]}

# Revise name/title/notes/accent across every roster (town-only; name required).
static func edit_member_identity(state: Dictionary, cmd: Dictionary) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var char_id: String = cmd.get("characterId", "")
	var name: String = String(cmd.get("name", "")).strip_edges()
	if name == "":
		return {"state": state, "events": []}
	var edited := false
	var next: Dictionary = state.duplicate(true)
	for roster in ["party", "reserve", "retired"]:
		for m in next.get(roster, []):
			if String(m.get("id", "")) == char_id:
				m["name"] = name
				m["title"] = String(cmd.get("title", "")).strip_edges()
				m["notes"] = String(cmd.get("notes", "")).strip_edges()
				m["accentColor"] = cmd.get("accentColor", "")
				edited = true
	if not edited:
		return {"state": state, "events": []}
	return {"state": next, "events": [{"type": "party_member_edited", "characterName": name}]}

# Reclass an active or benched adventurer to a basic class (reclassCharacter re-derives the base at the
# retained level). Town-only; no-op if already that class. No turn cost (a roster edit, not an action).
static func reclass_member(state: Dictionary, world: Dictionary, engine: Dictionary, char_id: String, class_id: String) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var member := RosterUtil.find_by_id(state.get("party", []), char_id)
	if member.is_empty():
		member = RosterUtil.find_by_id(state.get("reserve", []), char_id)
	if member.is_empty() or String(member.get("classId", "")) == class_id:
		return {"state": state, "events": []}
	var reclassed := CharacterCreation.reclass_character(member, class_id, world, engine)
	var next: Dictionary = state.duplicate(true)
	var party := []
	for c in next.get("party", []):
		party.append(reclassed if String(c.get("id", "")) == char_id else c)
	next["party"] = party
	var reserve := []
	for c in next.get("reserve", []):
		reserve.append(reclassed if String(c.get("id", "")) == char_id else c)
	next["reserve"] = reserve
	var cls_name := char_id
	for def in engine.get("classes", []):
		if def.get("id", "") == class_id:
			cls_name = String((def.get("label", {}) as Dictionary).get("en", class_id))
			break
	return {"state": next, "events": [{"type": "party_member_reclassed", "characterName": reclassed.get("name", ""), "className": cls_name}]}

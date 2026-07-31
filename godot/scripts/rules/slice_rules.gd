class_name SliceRules
## The GDScript port of the vertical slice's command RULES (mirrors src/domain/rulesEngine.ts). It
## operates directly on the JSON-shaped state Dictionary so the result hashes identically to the TS
## oracle. resolve() returns { "state": Dictionary, "events": Array } — the same CommandResult shape.
##
## After IMP-050 this is a thin DISPATCHER + the combat exits: the command families live in leaf modules
## (ExplorationCommands = the crawl, PartyCommands, ItemCommands, Economy/Quests/Loot/Vocations/Chests, …).

const ExplorationCommands := preload("res://scripts/rules/exploration_commands.gd")
const CombatRound := preload("res://scripts/rules/combat_round.gd")
const Economy := preload("res://scripts/rules/economy.gd")
const Quests := preload("res://scripts/rules/quests.gd")
const Loot := preload("res://scripts/rules/loot.gd")
const Vocations := preload("res://scripts/rules/vocations.gd")
const CharacterCreation := preload("res://scripts/rules/character_creation.gd")
const Encounters := preload("res://scripts/rules/encounters.gd")
const Chests := preload("res://scripts/rules/chests.gd")
const Exploration := preload("res://scripts/rules/exploration.gd")
const PartyCommands := preload("res://scripts/rules/party_commands.gd")
const RosterUtil := preload("res://scripts/rules/roster_util.gd")
const ItemCommands := preload("res://scripts/rules/item_commands.gd")
const CampTechniques := preload("res://scripts/rules/camp_techniques.gd")
const RulesUtil := preload("res://scripts/rules/rules_util.gd")
const Leveling := preload("res://scripts/rules/leveling.gd")

# Exploration commands that a downed party must never be able to issue (mirrors rulesEngine.ts).
const DUNGEON_EXPLORE_COMMANDS := ["turn_left", "turn_right", "move_forward", "move_backward", "strafe_left", "strafe_right", "open_door", "search"]


static func resolve(state: Dictionary, command: Dictionary, world: Dictionary = {}, engine: Dictionary = {}) -> Dictionary:
	var cmd_type := String(command.get("type", ""))
	# Safety net (playtest 2026-07-29): a party with no able member can never explore — evacuate to town
	# rather than let a wiped run wander the floor. Mirrors rulesEngine.ts resolveCommand.
	if String(state.get("phase", "")) == "dungeon" and DUNGEON_EXPLORE_COMMANDS.has(cmd_type) and Exploration.able_members(state.get("party", [])).is_empty():
		return _evacuate_downed_party(state)
	match cmd_type:
		"turn_left":
			return ExplorationCommands._turn(state, "left")
		"turn_right":
			return ExplorationCommands._turn(state, "right")
		"listen":
			return RulesUtil.log_only(state, {"type": "inspection_made", "mode": "listen"})
		"search":
			return ExplorationCommands._search(state, world, engine, String(command.get("characterId", "")), String(command.get("itemId", "")))
		"move_forward":
			return ExplorationCommands._move_forward(state, world, engine)
		"move_backward":
			return ExplorationCommands._move_forward(state, world, engine, ExplorationCommands._facing_of(state, ExplorationCommands.OPPOSITE_OF), "backward")
		"strafe_left":
			return ExplorationCommands._move_forward(state, world, engine, ExplorationCommands._facing_of(state, ExplorationCommands.LEFT_OF), "left")
		"strafe_right":
			return ExplorationCommands._move_forward(state, world, engine, ExplorationCommands._facing_of(state, ExplorationCommands.RIGHT_OF), "right")
		"inspect_wall":
			return RulesUtil.log_only(state, {"type": "inspection_made", "mode": "inspect_wall"})
		"open_door":
			return ExplorationCommands.open_door(state, world)
		"use_stairs":
			return ExplorationCommands._use_stairs(state, world)
		"return_to_town":
			return ExplorationCommands._return_to_town(state, world)
		"disarm_trap":
			# §9.4d: the command has carried characterId / itemId all along and this ignored both.
			return ExplorationCommands._disarm_trap(state, world, engine, String(command.get("characterId", "")), String(command.get("itemId", "")))
		"investigate_chest":
			return Chests.investigate(state, world, engine, String(command.get("characterId", "")), String(command.get("itemId", "")))
		"disarm_chest":
			return Chests.disarm(state, world, engine, String(command.get("characterId", "")), String(command.get("itemId", "")))
		"unlock_chest":
			return Chests.unlock(state, world, engine, String(command.get("characterId", "")), String(command.get("itemId", "")))
		"open_chest":
			return Chests.open_chest(state, world, engine)
		"enter_dungeon":
			return ExplorationCommands._enter_dungeon(state, world)
		"resume_at_checkpoint":
			return ExplorationCommands._resume_at_checkpoint(state, world, command.get("roomId", ""))
		"use_item":
			return ItemCommands.use_item(state, world, command.get("itemId", ""), command.get("targetCharacterId", ""))
		"use_technique":
			return CampTechniques.use_technique(state, world, engine, command.get("characterId", ""), command.get("techniqueId", ""), command.get("targetCharacterId", ""))
		"attack":
			return _attack(state, world, engine)
		"defend":
			return _defend(state)
		"import_member":
			return _import_member(state, world, engine, command.get("adventurer", {}))
		"debug_revive_party":
			return _debug_revive_party(state)
		"debug_force_victory":
			return CombatRound.debug_force_victory(state, world, engine)
		"retreat":
			return _retreat(state, world)
		"continue_after_combat":
			return _continue_after_combat(state)
		"declare_round":
			return CombatRound.declare_round(state, world, command.get("actions", []), engine)
		"set_member_row":
			return PartyCommands.set_member_row(state, command.get("characterId", ""), command.get("row", "front"))
		"swap_member_rows":
			return PartyCommands.swap_member_rows(state, command.get("characterId", ""), command.get("targetCharacterId", ""))
		"bench_member":
			return PartyCommands.bench_member(state, command.get("characterId", ""))
		"recall_member":
			return PartyCommands.recall_member(state, command.get("characterId", ""))
		"retire_member":
			return PartyCommands.retire_member(state, command.get("characterId", ""))
		"unretire_member":
			return PartyCommands.unretire_member(state, command.get("characterId", ""))
		"erase_member":
			return PartyCommands.erase_member(state, command.get("characterId", ""))
		"edit_member_identity":
			return PartyCommands.edit_member_identity(state, command)
		"reclass_member":
			return PartyCommands.reclass_member(state, world, engine, command.get("characterId", ""), command.get("classId", ""))
		"buy_item":
			return Economy.buy(state, world, command.get("shopId", ""), command.get("itemId", ""))
		"sell_item":
			return Economy.sell(state, world, command.get("itemId", ""), command.get("plus", null), command.get("affix", null))
		"equip_item":
			return Economy.equip(state, world, command.get("characterId", ""), command.get("equipmentId", ""), command.get("plus", null), command.get("affix", null))
		"discard_item":
			return Economy.discard(state, command.get("itemId", ""), command.get("plus", null), command.get("affix", null))
		"recover_party":
			return Economy.recover(state, world)
		"accept_quest":
			return Quests.accept(state, world, command.get("questId", ""))
		"claim_quest":
			return Quests.claim(state, world, command.get("questId", ""))
		"appraise_item":
			return Loot.appraise(state, command.get("instanceId", ""))
		"toggle_item_lock":
			return Loot.toggle_flag(state, command.get("instanceId", ""), "locked")
		"toggle_item_favorite":
			return Loot.toggle_flag(state, command.get("instanceId", ""), "favorite")
		"reinforce_equipment":
			return Loot.reinforce(state, world, command.get("characterId", ""), command.get("slot", ""))
		"bulk_convert":
			return Loot.bulk_convert(state, command.get("mode", ""), command.get("rarities", null))
		"change_vocation":
			return Vocations.change_vocation(state, world, engine, command.get("characterId", ""), command.get("vocationId", ""))
		"set_loadout":
			return Vocations.set_loadout_command(state, engine, command.get("characterId", ""), command.get("loadout", []))
		_:
			# Not yet ported — a no-op keeps the replay honest (the harness will flag the hash mismatch).
			return {"state": state, "events": []}



# --- combat exits -----------------------------------------------------------------------------------
# Retreat: the fight is abandoned; every member remembers it (memory.retreats is part of who they are).
# Drag a fully-downed party out of the dungeon and back to town — the failed-expedition landing a combat
# wipe produces, reused as a safety net for any explore command issued while every member is down. No extra
# rescue fee (the combat wipe already charged it). Mirrors rulesEngine.ts evacuateDownedParty.
static func _evacuate_downed_party(state: Dictionary) -> Dictionary:
	var s: Dictionary = state.duplicate(true)
	s["phase"] = "town"
	s["position"] = null
	s["combat"] = null
	s["map"]["currentRoomId"] = null
	s["map"]["currentCellId"] = null
	s["map"]["currentFacing"] = null
	s["turn"] = int(state.get("turn", 0)) + 1
	return {"state": s, "events": [{"type": "party_wiped", "rescueFee": 0}]}


static func _retreat(state: Dictionary, world: Dictionary) -> Dictionary:
	if state.get("phase", "") != "combat":
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["phase"] = "dungeon"
	# 退却 pulls the party BACK to the cell they stepped in from, so a fled fight is not simply
	# walked past (playtest: retreat left them on the fight cell).
	var back: Variant = (state.get("combat", {}) as Dictionary).get("retreatPosition", null)
	var cur_cell := ""
	if typeof(state.get("position", null)) == TYPE_DICTIONARY:
		cur_cell = String((state["position"] as Dictionary).get("cellId", ""))
	var moved_back := false
	if typeof(back) == TYPE_DICTIONARY:
		var back_cell := String((back as Dictionary).get("cellId", ""))
		moved_back = back_cell != "" and back_cell != cur_cell
	next["combat"] = null
	if moved_back:
		next["position"] = (back as Dictionary).duplicate(true)
		var map_next: Dictionary = (next.get("map", {}) as Dictionary).duplicate(true)
		map_next["currentRoomId"] = (back as Dictionary).get("roomId", map_next.get("currentRoomId", null))
		map_next["currentCellId"] = (back as Dictionary).get("cellId", map_next.get("currentCellId", null))
		next["map"] = map_next
	var party := []
	for member in next.get("party", []):
		var m: Dictionary = member.duplicate(true)
		var memory: Dictionary = (m.get("memory", {}) as Dictionary).duplicate(true)
		memory["retreats"] = int(memory.get("retreats", 0)) + 1
		m["memory"] = memory
		party.append(m)
	next["party"] = party
	next["turn"] = int(next.get("turn", 0)) + 1
	var events: Array = [{"type": "party_retreated"}]
	if moved_back:
		var rid := String((back as Dictionary).get("roomId", ""))
		var rname := rid
		for dungeon in world.get("dungeons", []):
			for room in dungeon.get("rooms", []):
				if String(room.get("id", "")) == rid:
					rname = String(room.get("name", rid))
		events.append({"type": "room_entered", "roomId": rid, "roomName": rname, "motion": "backward"})
	return {"state": next, "events": events}


# The victory RESULT screen is a state: until it is dismissed, resolveCommand answers nothing else.
# Continuing clears it and puts the party back where the fight interrupted them.
static func _continue_after_combat(state: Dictionary) -> Dictionary:
	var conclusion: Variant = state.get("combatConclusion", null)
	if typeof(conclusion) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	next["phase"] = "dungeon"
	next["combatConclusion"] = null
	var resume: Variant = conclusion.get("resumePosition", null)
	if typeof(resume) == TYPE_DICTIONARY:
		next["position"] = (resume as Dictionary).duplicate(true)
		next["map"]["currentRoomId"] = resume.get("roomId", null)
		var cell: Variant = resume.get("cellId", null)
		next["map"]["currentCellId"] = cell if cell != null else next["map"].get("currentCellId", null)
		next["map"]["currentFacing"] = resume.get("facing", null)
	return {"state": next, "events": []}


# --- legacy single-action combat verbs + roster import + debug --------------------------------------
# attack: the one-button melee. Lands on the front line first; the back line only once it is exposed.
static func _attack(state: Dictionary, world: Dictionary, engine: Dictionary) -> Dictionary:
	if state.get("phase", "") != "combat" or typeof(state.get("combat", null)) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var combat: Dictionary = state["combat"]
	var groups: Array = combat.get("enemyGroups", [])
	var actor: Variant = null
	for member in state.get("party", []):
		if int(member.get("hp", 0)) > 0 and member.get("injury", null) == null and String(member.get("row", "front")) == "front":
			actor = member
			break
	if actor == null and not (state.get("party", []) as Array).is_empty():
		actor = state["party"][0]
	var target: Variant = null
	for group in groups:
		if Encounters._melee_targetable(group, groups):
			target = group
			break
	if target == null:
		for group in groups:
			if int(group.get("count", 0)) > 0:
				target = group
				break
	if typeof(actor) != TYPE_DICTIONARY or typeof(target) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	return CombatRound.declare_round(state, world, [{"actorId": actor.get("id", ""), "action": "attack", "targetGroupId": target.get("id", "")}], engine)


# defend: the legacy whole-party brace — the enemy's blow lands softened on everyone.
static func _defend(state: Dictionary) -> Dictionary:
	if state.get("phase", "") != "combat" or typeof(state.get("combat", null)) != TYPE_DICTIONARY:
		return {"state": state, "events": []}
	var enemy: Dictionary = (state["combat"] as Dictionary).get("enemy", {})
	var damage := maxi(0, int(enemy.get("attack", 0)) - 2)
	var next: Dictionary = state.duplicate(true)
	var party := []
	for member in next.get("party", []):
		var m: Dictionary = member.duplicate(true)
		m["hp"] = maxi(1, int(m.get("hp", 0)) - damage)
		party.append(m)
	next["party"] = party
	next["turn"] = int(next.get("turn", 0)) + 1
	return {"state": next, "events": [{"type": "party_defended", "enemyId": enemy.get("id", ""), "enemyName": enemy.get("name", ""), "damage": damage}]}


# import_member: a PORTABLE adventurer joins the bench, re-derived under this scenario's import policy.
static func _import_member(state: Dictionary, world: Dictionary, engine: Dictionary, adventurer: Dictionary) -> Dictionary:
	if state.get("phase", "") != "town":
		return {"state": state, "events": []}
	var imported := CharacterCreation.import_adventurer(adventurer, world, engine)
	if imported.is_empty():
		return {"state": state, "events": []}
	var next: Dictionary = state.duplicate(true)
	var reserve: Array = (next.get("reserve", []) as Array).duplicate(true)
	reserve.append(imported["character"])
	next["reserve"] = reserve
	return {"state": next, "events": [{"type": "party_member_imported", "characterName": (imported["character"] as Dictionary).get("name", ""), "adjustments": imported["adjustments"]}]}


# DEBUG ONLY — never surfaced in normal play (AGENTS.md); ported so the command set is complete.
static func _debug_revive_party(state: Dictionary) -> Dictionary:
	var next: Dictionary = state.duplicate(true)
	var party := []
	for member in next.get("party", []):
		var m: Dictionary = member.duplicate(true)
		m["hp"] = int(m.get("maxHp", 0))
		m["mp"] = int(m.get("maxMp", 0))
		m.erase("injury")
		m["status"] = []
		party.append(m)
	next["party"] = party
	return {"state": next, "events": [{"type": "debug_started", "text": "Debug: party fully revived and restored."}]}

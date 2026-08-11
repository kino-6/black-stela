extends RefCounted
## Current-cell chest controls: choose an operation, then confirm who takes the risk. The highest chance
## is focused first, but another standing member can deliberately be sent instead.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Chests := preload("res://scripts/rules/chests.gd")
const Exploration := preload("res://scripts/rules/exploration.gd")

static func build(chest: Dictionary, party: Array, inventory: Array, world: Dictionary, engine: Dictionary, pending_action: String, on_begin: Callable, on_command: Callable, on_back: Callable, on_leave: Callable, closed_tex: Texture2D = null) -> Dictionary:
	var result := String(chest.get("investigateResult", "")) if chest.get("investigateResult", null) != null else ""
	var known_trapped := result == "trapped"
	var locked := typeof(chest.get("lock", null)) == TYPE_DICTIONARY and not bool(chest.get("unlocked", false))
	var root := UI.col(8)
	root.add_child(UI.label(I18n.t("play.chestHeading"), 20, UI.GOLD))
	if closed_tex != null:
		var img := TextureRect.new()
		img.texture = closed_tex
		img.custom_minimum_size = Vector2(232, 150)
		img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		root.add_child(img)
	root.add_child(UI.label(_note(chest, result, locked), 17, UI.INK))

	var actions := UI.col(6)
	var focus: Button = null
	if pending_action != "":
		root.add_child(UI.label(I18n.t("play.chestChooseHandler", {"action": _action_label(pending_action)}), 17, UI.GOLD))
		var best: Button = null
		var best_chance := -1
		var best_member := {}
		var aids := _aids_for_action(inventory, world, pending_action)
		# One row per member — the bare attempt. The carried tools are NOT repeated per member (that stacked a
		# nameless「…で試す」after every name); they are offered once below, applied to the recommended handler.
		for member in party:
			var able := int(member.get("hp", 0)) > 0 and member.get("injury", null) == null
			var chance := _chance(member, engine, chest, pending_action) if able else 0
			var member_id := String(member.get("id", ""))
			var button := UI.button("%s　%s %d%%" % [String(member.get("name", "?")), I18n.t("play.chestChance"), chance], func(): on_command.call({"type": _command_for(pending_action), "characterId": member_id}), Vector2(360, 40), 16)
			button.disabled = not able
			actions.add_child(button)
			if able and chance > best_chance:
				best_chance = chance
				best = button
				best_member = member
		# Tools are alternatives to a specialist, not an invisible bonus — offered ONCE, spent only when chosen,
		# and applied to the recommended handler so the row names who wields it and its improved chance.
		if not best_member.is_empty():
			var best_id := String(best_member.get("id", ""))
			var best_name := String(best_member.get("name", "?"))
			for aid in aids:
				var bonus := int(aid.get("bonus", 0))
				var aided_chance := _chance(best_member, engine, chest, pending_action, bonus)
				var aid_name := Fmt.localized_catalog_name(world, String(aid.get("id", "")))
				var aid_command := {"type": _command_for(pending_action), "characterId": best_id, "itemId": String(aid.get("id", ""))}
				# Tool name FIRST (a gate matches on the「…で試す」prefix), the recommended wielder named in parens.
				var aid_label := "%s（%s）" % [I18n.t("play.chestUseAid", {"item": aid_name, "chance": I18n.t("play.chestChance"), "rate": aided_chance}), best_name]
				actions.add_child(UI.button(aid_label, func(): on_command.call(aid_command), Vector2(420, 38), 15))
		focus = best
		var back := UI.button(I18n.t("play.chestBack"), on_back, Vector2(300, 40), 16)
		actions.add_child(back)
		if focus == null: focus = back
	else:
		# Start with the safe information check. Once it finds a trap, the next rebuild moves focus straight to
		# disarming it; otherwise a visible lock is the next concern. The player only needs Confirm to accept
		# the recommended path, but can still choose another member for either risky action.
		if not bool(chest.get("investigated", false)):
			focus = _action_button(actions, "investigate", on_begin)
		if known_trapped and not bool(chest.get("disarmAttempted", false)):
			var disarm := _action_button(actions, "disarm", on_begin)
			if focus == null: focus = disarm
		if locked and not bool(chest.get("unlockAttempted", false)):
			var unlock := _action_button(actions, "unlock", on_begin)
			if focus == null: focus = unlock
		# A locked chest is FORCED open, not blocked — 「こじ開ける」 always works, springing any undisarmed
		# trap as its cost, so a failed lockpick is never a dead-end. Picking the lock cleanly avoids the trap.
		var open := UI.button(I18n.t("play.chestForceOpen") if locked else I18n.t("play.chestOpen"), func(): on_command.call({"type": "open_chest"}), Vector2(300, 42), 17)
		actions.add_child(open)
		if focus == null: focus = open
		actions.add_child(UI.button(I18n.t("play.chestLeave"), on_leave, Vector2(300, 42), 17))
	root.add_child(actions)
	return {"control": UI.card(root, UI.GOLD), "focus": focus}

## The opening result remains in the centre of the stage long enough to be read. It is not a second chest
## interaction: the only command is to acknowledge the clearly shown reward and return to exploration.
static func build_opened_result(chest: Dictionary, events: Array, on_dismiss: Callable, opened_tex: Texture2D = null, world: Dictionary = {}) -> Dictionary:
	var root := UI.col(10)
	root.add_child(UI.label(I18n.t("play.chestHeading"), 20, UI.GOLD))
	if opened_tex != null:
		var img := TextureRect.new()
		img.texture = opened_tex
		# This is the reward still, rather than an interaction icon: give it enough presence for the
		# discovered contents to read before the exact acquired-item list below.
		img.custom_minimum_size = Vector2(300, 190)
		img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		root.add_child(img)
	root.add_child(UI.label(_opened_note(chest, events), 17, UI.INK))

	var loot := _loot_events(events)
	if loot.is_empty():
		root.add_child(UI.label(I18n.t("play.chestNoLoot"), 16, UI.DIM))
	else:
		root.add_child(UI.label(I18n.t("play.chestLootHeading"), 17, UI.GOLD))
		for gained in loot:
			root.add_child(UI.label("・%s" % _loot_name(gained, world), 18, UI.INK))
	var dismiss := UI.button(I18n.t("play.chestResume"), on_dismiss, Vector2(300, 42), 17)
	root.add_child(dismiss)
	return {"control": UI.card(root, UI.GOLD), "focus": dismiss}

static func _action_button(actions: VBoxContainer, action: String, on_begin: Callable) -> Button:
	var button := UI.button(_action_label(action), func(): on_begin.call(action), Vector2(300, 42), 17)
	actions.add_child(button)
	return button

static func _action_label(action: String) -> String:
	match action:
		"investigate": return I18n.t("play.chestInvestigate")
		"disarm": return I18n.t("play.chestDisarm")
		"unlock": return I18n.t("play.chestUnlock")
	return action

static func _command_for(action: String) -> String:
	return {"investigate": "investigate_chest", "disarm": "disarm_chest", "unlock": "unlock_chest"}.get(action, "")

static func _difficulty(chest: Dictionary, action: String) -> int:
	var source: Variant = chest.get("lock", {}) if action == "unlock" else chest.get("trap", {})
	return int((source as Dictionary).get("difficulty", 0)) if typeof(source) == TYPE_DICTIONARY else 0

static func _chance(member: Dictionary, engine: Dictionary, chest: Dictionary, action: String, bonus: int = 0) -> int:
	var skill := Exploration.attempt_skill(member, engine, action) + bonus
	var difficulty := _difficulty(chest, action)
	return Chests.unlock_chance(skill, difficulty) if action == "unlock" else Chests.success_chance(skill, difficulty, 55 if action == "investigate" else 45)

static func _aids_for_action(inventory: Array, world: Dictionary, action: String) -> Array:
	var found := []
	for carried in inventory:
		if int((carried as Dictionary).get("quantity", 0)) <= 0:
			continue
		var id := String((carried as Dictionary).get("id", ""))
		for catalog in world.get("items", []):
			if String((catalog as Dictionary).get("id", "")) != id:
				continue
			var aid: Variant = (catalog as Dictionary).get("explorationAid", null)
			if typeof(aid) == TYPE_DICTIONARY and (aid as Dictionary).get("actions", []).has(action):
				found.append({"id": id, "bonus": int((aid as Dictionary).get("bonus", 0))})
			break
	return found

static func _note(chest: Dictionary, result: String, locked: bool) -> String:
	# T3 — a successful investigation IDENTIFIES the specific trap ("毒針の罠を見抜いた"), not a flat
	# "罠が仕掛けられている". Wiz-style: the skill result is whether you can NAME what you face.
	if result == "trapped":
		var kind := String((chest.get("trap", {}) as Dictionary).get("kind", "")) if typeof(chest.get("trap", null)) == TYPE_DICTIONARY else ""
		return I18n.t("play.chestTrappedKnown", {"trap": _trap_name(kind)}) if kind != "" else I18n.t("play.chestTrappedNote")
	if result == "uncertain": return I18n.t("play.chestUncertainNote")
	if result == "clear": return I18n.t("play.chestClearNote")
	if locked: return I18n.t("play.chestLockedNote")
	return I18n.t("play.chestClosedNote")

static func _opened_note(chest: Dictionary, events: Array) -> String:
	for event in events:
		if typeof(event) == TYPE_DICTIONARY and String((event as Dictionary).get("type", "")) == "chest_trap_sprung":
			# Name the trap kind and the damage — a bare "罠が作動した" left the player unsure what sprang or
			# whether it cost anything (playtest 2026-07-31 IMP-061; the penalty is real, feedback was missing).
			var opened_status := String((event as Dictionary).get("status", ""))
			if opened_status != "":
				return I18n.t("play.chestTrapOpenedAiled", {"trap": _trap_name(String((event as Dictionary).get("trapKind", ""))), "damage": int((event as Dictionary).get("damage", 0)), "ailment": I18n.t("partyMenu.status.%s" % opened_status)})
			return I18n.t("play.chestTrapOpened", {"trap": _trap_name(String((event as Dictionary).get("trapKind", ""))), "damage": int((event as Dictionary).get("damage", 0))})
	if bool(chest.get("disarmed", false)):
		return I18n.t("play.chestDisarmedOpened")
	if bool(chest.get("unlocked", false)) and typeof(chest.get("lock", null)) == TYPE_DICTIONARY:
		return I18n.t("play.chestUnlockedOpened")
	return I18n.t("play.chestOpenedNote")

static func _loot_events(events: Array) -> Array:
	var loot: Array = []
	for event in events:
		if typeof(event) == TYPE_DICTIONARY and String((event as Dictionary).get("type", "")) == "inventory_item_gained":
			loot.append(event)
	return loot

# The localized name of a sprung trap kind (needle / gas / rune / snare), mirroring React's replayLog map.
static func _trap_name(kind: String) -> String:
	match kind:
		"needle": return I18n.t("play.trapNeedle")
		"gas": return I18n.t("play.trapGas")
		"rune": return I18n.t("play.trapRune")
		"snare": return I18n.t("play.trapSnare")
		_: return I18n.t("play.trapUnknown")

static func _loot_name(gained: Dictionary, world: Dictionary = {}) -> String:
	# Localize by item id (the dungeon log already does) so the reward never leaks the base English name
	# like "Sap Draught" (playtest 2026-07-31 IMP-060; same class as the combat 道具 leak IMP-055).
	var item_id := String(gained.get("itemId", ""))
	var item := Fmt.localized_catalog_name(world, item_id) if item_id != "" and not world.is_empty() else String(gained.get("itemName", ""))
	if gained.get("affix", null) != null:
		item = "%s %s" % [Fmt.localized_affix_label(world, String(gained.get("affix", ""))), item]
	if gained.get("plus", null) != null:
		item = "%s +%d" % [item, int(gained.get("plus", 0))]
	return I18n.t("play.chestLootReceived", {"item": item, "quantity": int(gained.get("quantity", 1))})

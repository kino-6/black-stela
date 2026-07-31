extends RefCounted
## Current-cell chest controls: choose an operation, then confirm who takes the risk. The highest chance
## is focused first, but another standing member can deliberately be sent instead.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Chests := preload("res://scripts/rules/chests.gd")
const Exploration := preload("res://scripts/rules/exploration.gd")

static func build(chest: Dictionary, party: Array, engine: Dictionary, pending_action: String, on_begin: Callable, on_command: Callable, on_back: Callable, on_leave: Callable, closed_tex: Texture2D = null) -> Dictionary:
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
	root.add_child(UI.label(_note(result, locked), 17, UI.INK))

	var actions := UI.col(6)
	var focus: Button = null
	if pending_action != "":
		root.add_child(UI.label(I18n.t("play.chestChooseHandler", {"action": _action_label(pending_action)}), 17, UI.GOLD))
		var best: Button = null
		var best_chance := -1
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
		var open := UI.button(I18n.t("play.chestOpen"), func(): on_command.call({"type": "open_chest"}), Vector2(300, 42), 17)
		open.disabled = locked
		actions.add_child(open)
		if focus == null and not open.disabled: focus = open
		actions.add_child(UI.button(I18n.t("play.chestLeave"), on_leave, Vector2(300, 42), 17))
	root.add_child(actions)
	return {"control": UI.card(root, UI.GOLD), "focus": focus}

## The opening result remains in the centre of the stage long enough to be read. It is not a second chest
## interaction: the only command is to acknowledge the clearly shown reward and return to exploration.
static func build_opened_result(chest: Dictionary, events: Array, on_dismiss: Callable, opened_tex: Texture2D = null) -> Dictionary:
	var root := UI.col(10)
	root.add_child(UI.label(I18n.t("play.chestHeading"), 20, UI.GOLD))
	if opened_tex != null:
		var img := TextureRect.new()
		img.texture = opened_tex
		img.custom_minimum_size = Vector2(232, 150)
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
			root.add_child(UI.label("・%s" % _loot_name(gained), 18, UI.INK))
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

static func _chance(member: Dictionary, engine: Dictionary, chest: Dictionary, action: String) -> int:
	return Chests.success_chance(Exploration.attempt_skill(member, engine, action), _difficulty(chest, action), 55 if action == "investigate" else 45)

static func _note(result: String, locked: bool) -> String:
	if result == "trapped": return I18n.t("play.chestTrappedNote")
	if result == "uncertain": return I18n.t("play.chestUncertainNote")
	if result == "clear": return I18n.t("play.chestClearNote")
	if locked: return I18n.t("play.chestLockedNote")
	return I18n.t("play.chestClosedNote")

static func _opened_note(chest: Dictionary, events: Array) -> String:
	for event in events:
		if typeof(event) == TYPE_DICTIONARY and String((event as Dictionary).get("type", "")) == "chest_trap_sprung":
			return I18n.t("play.chestTrapOpened")
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

static func _loot_name(gained: Dictionary) -> String:
	var item := String(gained.get("itemName", ""))
	if gained.get("affix", null) != null:
		item = "%s %s" % [I18n.t("affix.%s" % String(gained.get("affix", ""))), item]
	if gained.get("plus", null) != null:
		item = "%s +%d" % [item, int(gained.get("plus", 0))]
	return I18n.t("play.chestLootReceived", {"item": item, "quantity": int(gained.get("quantity", 1))})

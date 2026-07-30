extends RefCounted
## Current-cell chest controls: choose an operation, then confirm who takes the risk. The highest chance
## is focused first, but another standing member can deliberately be sent instead.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const Chests := preload("res://scripts/rules/chests.gd")
const Exploration := preload("res://scripts/rules/exploration.gd")

static func build(chest: Dictionary, party: Array, engine: Dictionary, pending_action: String, on_begin: Callable, on_command: Callable, on_back: Callable, on_leave: Callable, loot_line: String = "", closed_tex: Texture2D = null, open_tex: Texture2D = null) -> Dictionary:
	var opened := String(chest.get("phase", "")) == "opened"
	var result := String(chest.get("investigateResult", "")) if chest.get("investigateResult", null) != null else ""
	var known_trapped := result == "trapped"
	var locked := typeof(chest.get("lock", null)) == TYPE_DICTIONARY and not bool(chest.get("unlocked", false))
	var root := UI.col(8)
	root.add_child(UI.label(I18n.t("play.chestHeading"), 20, UI.GOLD))
	var chest_tex: Texture2D = open_tex if opened else closed_tex
	if chest_tex != null:
		var img := TextureRect.new()
		img.texture = chest_tex
		img.custom_minimum_size = Vector2(232, 150)
		img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		root.add_child(img)
	root.add_child(UI.label(_note(opened, result, locked), 17, UI.INK))
	if opened and loot_line != "": root.add_child(UI.label(loot_line, 16, UI.GOLD))

	var actions := UI.col(6)
	var focus: Button = null
	if opened:
		focus = UI.button(I18n.t("play.chestResume"), on_leave, Vector2(300, 42), 17)
		actions.add_child(focus)
	elif pending_action != "":
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

static func _note(opened: bool, result: String, locked: bool) -> String:
	if opened: return I18n.t("play.chestOpenedNote")
	if result == "trapped": return I18n.t("play.chestTrappedNote")
	if result == "uncertain": return I18n.t("play.chestUncertainNote")
	if result == "clear": return I18n.t("play.chestClearNote")
	if locked: return I18n.t("play.chestLockedNote")
	return I18n.t("play.chestClosedNote")

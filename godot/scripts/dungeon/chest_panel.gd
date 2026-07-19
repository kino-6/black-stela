extends RefCounted
## Faithful port of src/components/ChestPanel.tsx — the current-cell chest surface.
##
## The design rule this preserves: a chest HOLDS the cell it sits on (Wizardry prompt model). While it
## is here the panel OWNS the command region — the arrows drive its actions instead of walking the party
## off the chest — and it shows only what the party can actually SEE: closed, found-a-trap, "can't tell",
## or opened. It never shows a success RATE, and 罠を外す only appears once an investigation actually
## detected a trap.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

## Returns { control, focus } — `focus` is the button the cursor must land on.
static func build(chest: Dictionary, on_command: Callable, on_leave: Callable) -> Dictionary:
	var opened := String(chest.get("phase", "")) == "opened"
	var result := String(chest.get("investigateResult", "")) if chest.get("investigateResult", null) != null else ""
	var known_trapped := result == "trapped"

	var note := I18n.t("play.chestClosedNote")
	if opened:
		note = I18n.t("play.chestOpenedNote")
	elif result == "trapped":
		note = I18n.t("play.chestTrappedNote")
	elif result == "uncertain":
		note = I18n.t("play.chestUncertainNote")
	elif result == "clear":
		note = I18n.t("play.chestClearNote")

	var root := UI.col(8)
	root.add_child(UI.label(I18n.t("play.chestHeading"), 20, UI.GOLD))
	root.add_child(UI.label(note, 17, UI.INK))

	var actions := UI.row()
	var focus: Button = null
	if opened:
		focus = UI.button(I18n.t("play.chestResume"), on_leave, Vector2(200, 44), 17)
		actions.add_child(focus)
	else:
		if not bool(chest.get("investigated", false)):
			focus = UI.button(I18n.t("play.chestInvestigate"), func(): on_command.call({"type": "investigate_chest"}), Vector2(160, 44), 17)
			actions.add_child(focus)
		# Disarm surfaces ONLY when an investigation actually detected a trap — never as a blind guess.
		if known_trapped and not bool(chest.get("disarmAttempted", false)):
			var disarm := UI.button(I18n.t("play.chestDisarm"), func(): on_command.call({"type": "disarm_chest"}), Vector2(160, 44), 17)
			actions.add_child(disarm)
			if focus == null:
				focus = disarm
		var open_button := UI.button(I18n.t("play.chestOpen"), func(): on_command.call({"type": "open_chest"}), Vector2(160, 44), 17)
		actions.add_child(open_button)
		if focus == null:
			focus = open_button
		actions.add_child(UI.button(I18n.t("play.chestLeave"), on_leave, Vector2(160, 44), 17))
	root.add_child(actions)
	return {"control": UI.card(root, UI.GOLD), "focus": focus}

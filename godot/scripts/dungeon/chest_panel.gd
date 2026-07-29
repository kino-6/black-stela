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
## `loot_line` is the "◯◯ を N 個見つけた。" text from the just-fired loot event, shown INSIDE the panel on
## open so the reward is visible where the player is looking (playtest: the panel only said "宝箱は開いた。").
static func build(chest: Dictionary, on_command: Callable, on_leave: Callable, loot_line: String = "", closed_tex: Texture2D = null, open_tex: Texture2D = null) -> Dictionary:
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
	# The chest itself — the prepared still, sprung open once looted (playtest 2026-07-30: the panel used
	# the art nowhere and read as a bare text prompt). Sits above the note so the player sees WHAT it is.
	var chest_tex: Texture2D = open_tex if opened else closed_tex
	if chest_tex != null:
		var img := TextureRect.new()
		img.texture = chest_tex
		img.custom_minimum_size = Vector2(232, 150)
		img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		root.add_child(img)
	root.add_child(UI.label(note, 17, UI.INK))
	# The reward, shown right where the chest was opened — not only in the far-off message band.
	if opened and loot_line != "":
		root.add_child(UI.label(loot_line, 16, UI.GOLD))

	# The chest dock is a NARROW right-hand column (≈260px of usable width), so the actions STACK vertically —
	# a row of 調べる / 開ける / 立ち去る ran off the right edge (playtest: 開ける was clipped). Buttons fill the
	# column width so the stack reads as one menu.
	var button_size := Vector2(232, 42)
	var actions := UI.col(6)
	var focus: Button = null
	if opened:
		focus = UI.button(I18n.t("play.chestResume"), on_leave, button_size, 17)
		actions.add_child(focus)
	else:
		if not bool(chest.get("investigated", false)):
			focus = UI.button(I18n.t("play.chestInvestigate"), func(): on_command.call({"type": "investigate_chest"}), button_size, 17)
			actions.add_child(focus)
		# Disarm surfaces ONLY when an investigation actually detected a trap — never as a blind guess.
		if known_trapped and not bool(chest.get("disarmAttempted", false)):
			var disarm := UI.button(I18n.t("play.chestDisarm"), func(): on_command.call({"type": "disarm_chest"}), button_size, 17)
			actions.add_child(disarm)
			if focus == null:
				focus = disarm
		var open_button := UI.button(I18n.t("play.chestOpen"), func(): on_command.call({"type": "open_chest"}), button_size, 17)
		actions.add_child(open_button)
		if focus == null:
			focus = open_button
		actions.add_child(UI.button(I18n.t("play.chestLeave"), on_leave, button_size, 17))
	root.add_child(actions)
	return {"control": UI.card(root, UI.GOLD), "focus": focus}

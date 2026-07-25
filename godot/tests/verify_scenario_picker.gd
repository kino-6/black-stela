extends SceneTree
## Controller gate for the scenario picker — the FIRST real choice a player makes on a new run (IMP-048).
## The screen must hand the cursor a card, NAME its controls (select / confirm / back), let Down/Up move
## the selection, advance on Confirm with the chosen world, and offer a back affordance (Cancel resolves
## to 戻る via _unhandled_input). Usage: godot --headless --path godot/ --script res://tests/verify_scenario_picker.gd

const I18n := preload("res://scripts/i18n.gd")

var _fail := 0

func _initialize() -> void:
	await _run()
	print("[scenario-picker] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _run() -> void:
	var picker := (load("res://scenes/scenario_picker.tscn") as PackedScene).instantiate()
	get_root().add_child(picker)
	for i in 8:
		await process_frame

	# A controller lands on a choosable card — never a dead screen.
	var focused := get_root().gui_get_focus_owner()
	_check(focused != null and focused is Button, "the cursor lands on a scenario card")

	# The first screen names its controls, so a new player sees select / confirm / back.
	_check(_tree_has_text(picker, I18n.t("play.menuHint")), "the input legend (select / confirm / back) is shown")

	# There is a real list to choose from — at least two worlds, each a focusable card.
	var buttons := _buttons(picker)
	_check(buttons.size() >= 3, "the picker offers ≥2 scenario cards plus a back control")

	# Down / Up move the SELECTION (focus) through the cards — the choice is navigable by controller.
	var start := get_root().gui_get_focus_owner()
	get_root().push_input(_action("ui_down"))
	await process_frame
	var after_down := get_root().gui_get_focus_owner()
	_check(after_down != null and after_down != start, "Down moves the selection to another card")
	get_root().push_input(_action("ui_up"))
	await process_frame
	var after_up := get_root().gui_get_focus_owner()
	_check(after_up == start, "Up moves the selection back")

	# A back affordance exists and a controller can reach it.
	var back := _button_with_text(picker, I18n.t("scenario.pick.back"))
	_check(back != null and back.focus_mode != Control.FOCUS_NONE, "a focusable 戻る control is present")

	# Confirm advances with the CHOSEN world: selecting sets Run.world_id before the guild builds a party.
	# (change_scene_to_file is deferred; we assert the selection then quit before it fires.)
	var run := get_root().get_node_or_null("Run")
	_check(run != null, "the Run autoload is available")
	if run != null:
		run.world_id = ""
		picker._on_select("verdant")
		_check(String(run.world_id) == "verdant", "Confirm records the chosen world (advances to the guild for it)")

func _action(name: String) -> InputEventAction:
	var ev := InputEventAction.new()
	ev.action = name
	ev.pressed = true
	return ev

func _buttons(node: Node) -> Array:
	var out := []
	if node is Button:
		out.append(node)
	for c in node.get_children():
		out.append_array(_buttons(c))
	return out

func _button_with_text(node: Node, needle: String) -> Button:
	for b in _buttons(node):
		if String((b as Button).text).find(needle) != -1:
			return b
	return null

func _tree_has_text(node: Node, needle: String) -> bool:
	if node is Label and String((node as Label).text).find(needle) != -1:
		return true
	for c in node.get_children():
		if _tree_has_text(c, needle):
			return true
	return false

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[scenario-picker] ok: %s" % label)
	else:
		push_error("[scenario-picker] FAIL: %s" % label)
		print("[scenario-picker] FAIL: %s" % label)
		_fail += 1

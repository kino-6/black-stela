extends SceneTree
## Controller gate for combat — a controller must be able to issue a command, and the command menu must
## name its controls (select / confirm / back). Behaviour-level, so it survives the combat visual rework:
## it asserts a focusable command and the legend, not any layout. Moves combat.tscn from todo to covered
## (the last one), so the controller registry has no debt.
## Usage: godot --headless --path godot/ --script res://tests/verify_combat_controller.gd

const I18n := preload("res://scripts/i18n.gd")

var _fail := 0

func _initialize() -> void:
	# Give combat a real 6-member party to command; combat.tscn then synthesises the slice encounter.
	var run := get_root().get_node_or_null("/root/Run")
	if run:
		run.ensure_loaded()
	var combat := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(combat)
	for i in 12:
		await process_frame

	_check(_has_focusable_button(combat), "the command menu offers a focusable command a controller can act on")
	_check(_tree_has_text(combat, I18n.t("play.menuHint")), "the command menu names its controls (select / confirm / back)")

	combat.free()
	print("[combat-controller] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _has_focusable_button(node: Node) -> bool:
	for c in node.get_children():
		if c is Button and (c as Button).focus_mode != Control.FOCUS_NONE:
			return true
		if _has_focusable_button(c):
			return true
	return false

func _tree_has_text(node: Node, needle: String) -> bool:
	if node is Label and String((node as Label).text).find(needle) != -1:
		return true
	for c in node.get_children():
		if _tree_has_text(c, needle):
			return true
	return false

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[combat-controller] ok: %s" % label)
	else:
		push_error("[combat-controller] FAIL: %s" % label)
		_fail += 1

extends SceneTree
## Controller gate for the scenario picker — the FIRST real choice a player makes on a new run. It must
## hand the cursor a card, and (screen contract, IMP-048) NAME its controls: select / confirm / back.
## Cancel already resolves to 戻る (scenario_picker._unhandled_input). Moves scenario_picker.tscn from
## todo to covered. Usage: godot --headless --path godot/ --script res://tests/verify_scenario_picker.gd

const I18n := preload("res://scripts/i18n.gd")

var _fail := 0

func _initialize() -> void:
	var picker := (load("res://scenes/scenario_picker.tscn") as PackedScene).instantiate()
	get_root().add_child(picker)
	for i in 8:
		await process_frame

	# A controller lands on a choosable card — never a dead screen.
	var focused := get_root().gui_get_focus_owner()
	_check(focused != null and focused is Button, "the cursor lands on a scenario card")

	# The first screen names its controls, so a new player sees select / confirm / back.
	_check(_tree_has_text(picker, I18n.t("play.menuHint")), "the input legend (select / confirm / back) is shown")

	picker.free()
	print("[scenario-picker] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

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
		_fail += 1

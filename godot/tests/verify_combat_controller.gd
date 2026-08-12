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

	# T15: a resolved round emits per-hit BEATS naming WHO struck each target for HOW much, so playback can
	# show 誰が→何に→どれだけ (not just a per-group total). Resolve an all-out round off the live state.
	var CombatRound := preload("res://scripts/rules/combat_round.gd")
	var actions: Array = combat.call("_all_out_actions")
	if actions.is_empty():
		_check(false, "the synthesised encounter yields no all-out actions to resolve")
	else:
		var res: Dictionary = CombatRound.declare_round(combat.get("_state"), combat.get("_world"), actions, combat.get("_engine"))
		var beats: Array = []
		for e in res.get("events", []):
			if String((e as Dictionary).get("type", "")) == "combat_round_resolved":
				var b: Variant = (e as Dictionary).get("beats", [])
				beats = b if typeof(b) == TYPE_ARRAY else []
				break
		_check(not beats.is_empty(), "a resolved round emits per-hit beats (誰が→何に→どれだけ)")
		if not beats.is_empty():
			var first: Dictionary = beats[0]
			_check(String(first.get("actorName", "")) != "" and int(first.get("damage", 0)) > 0 and String(first.get("targetGroupId", "")) != "",
				"a beat names the acting member, its target, and its damage (T15)")

	# #21: while オート runs, the command dock (and its 停止 button) is hidden through playback — so the
	# interrupt key must live on a PERSISTENT banner. It is absent before オート starts and present once it does.
	_check(not _tree_has_text(combat, I18n.t("tempo.autoStopHint")), "the auto-stop hint stays hidden before オート runs (#21)")
	combat.call("set_ui_state", {"tempo_auto": true})
	for i in 3:
		await process_frame
	_check(_tree_has_text(combat, I18n.t("tempo.autoStopHint")), "オート puts its stop key (Backspace) on screen (#21)")

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

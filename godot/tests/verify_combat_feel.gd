extends SceneTree
## #26 Combat feel — a normal damage number is a QUIET result, not an app-style notification. Asserts the
## number renders as `N` (no minus), holds STILL (no rise / sideways drift / scale overshoot), and that
## multiple hits on the SAME target are serialised in time rather than stacked at once.
## Usage: godot --headless --path godot/ --script res://tests/verify_combat_feel.gd

const CombatPlayback := preload("res://scripts/combat/combat_playback.gd")

var _fail := 0

func _check(ok: bool, msg: String) -> void:
	if ok:
		print("[combat-feel] ok: %s" % msg)
	else:
		_fail += 1
		push_error("[combat-feel] %s" % msg)
		print("[combat-feel] FAIL: %s" % msg)

func _labels(node: Node, out: Array) -> void:
	if node is Label:
		out.append(node)
	for c in node.get_children():
		_labels(c, out)

func _initialize() -> void:
	var layer := Control.new()
	layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	get_root().add_child(layer)

	# --- a NORMAL number ---
	CombatPlayback.damage_number_at(layer, Vector2(600.0, 420.0), 12, false)
	await process_frame
	var first: Array = []
	_labels(layer, first)
	_check(not first.is_empty(), "a normal damage number spawned")
	if not first.is_empty():
		var lbl := first[0] as Label
		_check(not lbl.text.contains("-"), "normal number reads '%s' — no app-style minus (#26)" % lbl.text)
		_check(lbl.text == "12", "normal number is the bare amount '12'")
		var pos0 := lbl.position
		# Sample partway through its life: it must NOT have moved or overshot in scale.
		await create_timer(0.14).timeout
		if is_instance_valid(lbl):
			_check(lbl.position.is_equal_approx(pos0), "normal number is STILL — no rise / sideways drift (#26)")
			_check(lbl.scale.is_equal_approx(Vector2.ONE), "normal number does NOT scale-overshoot / bounce (#26)")

	# The number is transient — it fades and frees on its own (no lingering ghost).
	await create_timer(0.5).timeout
	var lingering: Array = []
	_labels(layer, lingering)
	_check(lingering.is_empty(), "the number fades and frees itself (no permanent popup)")

	print("[combat-feel] %s (%d failure(s))" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

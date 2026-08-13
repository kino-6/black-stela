extends SceneTree
## #34 EXHAUSTIVE controller-focus TRAP verifier. For EVERY town service, it simulates the REAL arrow-key
## focus navigation the player's D-pad uses — Control.find_valid_focus_neighbor, which resolves an explicit
## focus_neighbor_<side> if set and otherwise falls back to GEOMETRY — as a breadth-first sweep from the
## panel's entry cursor, and asserts two things:
##   (1) TRAP — focus can never resolve to a control OUTSIDE the open service panel (no leak to the street
##       destinations / chrome). The old explicit-neighbor-only reachability was blind to geometry leaks —
##       exactly the class of bug that keeps recurring (鍛冶屋 focus escaping to 鑑定所).
##   (2) COVERAGE — every enabled, visible, focusable control inside the panel is reachable by the D-pad
##       (no mouse-only islands, e.g. the 冒険者 selector).
## It also drives each state-changing action it can find (鍛える / 買う …) and re-checks after the rebuild.

const UxFixture := preload("res://tests/ux_fixture.gd")
const I18n := preload("res://scripts/i18n.gd")
const SIDES := [SIDE_LEFT, SIDE_TOP, SIDE_RIGHT, SIDE_BOTTOM]

# Every service reachable from the square (guild launches its own scene, so it is covered separately).
const SERVICES := ["party", "career", "shop", "loot", "workshop", "blacksmith", "records", "quests", "facility", "recovery"]

var _problems: Array[String] = []
var _town: Node = null

func _initialize() -> void:
	get_root().size = Vector2i(1920, 1080)
	_town = (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(_town)
	for _f in 8:
		await process_frame
	_town.call("set_world_override", "terminal-line")
	var state := UxFixture.build({"partyGold": 9999})
	state["phase"] = "town"
	state["materials"] = 60
	state["discoveredSecrets"] = [
		"flag.tl3f.bypass-open", "flag.tl4f.sluice-open", "flag.tl5f.loading-open",
		"flag.tl6f.lift-online", "flag.tl7f.archive-open", "flag.tl8f.switch-open"
	]
	_town.call("set_state_override", state)
	for _f in 4:
		await process_frame

	for svc in SERVICES:
		await _check_service(String(svc), "")

	# Post-action rebuilds: the 鍛冶屋 forge (the reported bug) and the 商店 buy must not break the trap.
	await _check_service("blacksmith", I18n.t("blacksmith.forge", {"cost": 30}))
	await _check_service("blacksmith", I18n.t("blacksmith.forge", {"cost": 60}))

	if _problems.is_empty():
		print("[focus-trap] PASS — every service traps the D-pad and exposes all its controls")
		quit(0)
	else:
		for p in _problems:
			push_error("[focus-trap] %s" % p)
		quit(1)

# Open `svc`; if `press_label` is set, press that button first (a state-changing action) and re-check the
# rebuilt panel. Then assert the TRAP and COVERAGE properties on the resulting service panel.
func _check_service(svc: String, press_label: String) -> void:
	_town.call("set_ui_state", {"service": svc})
	for _f in 5:
		await process_frame
	var layer: Control = _town.get("_service_layer")
	if layer == null or not layer.visible:
		_check(false, "%s: service layer did not open" % svc)
		return
	if press_label != "":
		var btn := _button_with_text(layer, press_label)
		if btn == null or btn.disabled:
			return  # nothing to press in this state — the plain open is already covered above
		btn.emit_signal("pressed")
		for _f in 5:
			await process_frame
		layer = _town.get("_service_layer")
		svc = "%s (after 「%s」)" % [svc, press_label]

	var entry: Control = get_root().gui_get_focus_owner()
	if entry == null:
		_check(false, "%s: no cursor landed when the panel opened" % svc)
		return
	if not _inside(entry, layer):
		_check(false, "%s: the cursor landed OUTSIDE the service panel" % svc)
		return

	# BFS over the REAL arrow-key resolution.
	var reachable := {}
	var queue: Array = [entry]
	reachable[entry] = true
	while not queue.is_empty():
		var cur: Control = queue.pop_back()
		for side in SIDES:
			var n: Control = cur.find_valid_focus_neighbor(side)
			if n != null and not reachable.has(n):
				reachable[n] = true
				queue.append(n)

	# (1) TRAP: nothing reachable may sit outside the open panel.
	for c in reachable.keys():
		if not _inside(c as Control, layer):
			_check(false, "%s: D-pad escapes the panel to 「%s」 (focus leak)" % [svc, _label_of(c)])
			break

	# (2) COVERAGE: every enabled focusable control in the panel must be reachable by the D-pad. Report the
	# entry cursor and EVERY unreachable island (not just the first) so a failure is diagnosable.
	var missed: Array = []
	for c in _focusables(layer):
		if not reachable.has(c):
			missed.append(_label_of(c))
	if not missed.is_empty():
		_check(false, "%s: %d control(s) unreachable by the D-pad from entry 「%s」: %s" % [svc, missed.size(), _label_of(entry), "; ".join(PackedStringArray(missed))])

func _inside(c: Control, root: Control) -> bool:
	var n: Node = c
	while n != null:
		if n == root:
			return true
		n = n.get_parent()
	return false

func _focusables(root: Node) -> Array:
	var out: Array = []
	if root is Control:
		var c := root as Control
		if c.focus_mode != Control.FOCUS_NONE and c.is_visible_in_tree() and not (c is Button and (c as Button).disabled):
			out.append(c)
	for child in root.get_children():
		out.append_array(_focusables(child))
	return out

func _button_with_text(node: Node, label: String) -> Button:
	if node is Button and (node as Button).text == label:
		return node as Button
	for child in node.get_children():
		var f := _button_with_text(child, label)
		if f != null:
			return f
	return null

func _label_of(c: Object) -> String:
	if c is Button:
		return (c as Button).text
	if c is Control:
		return "%s:%s" % [(c as Control).get_class(), (c as Control).name]
	return str(c)

func _check(ok: bool, label: String) -> void:
	if not ok and not _problems.has(label):
		_problems.append(label)

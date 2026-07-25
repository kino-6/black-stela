extends SceneTree
## gate:status-overlay (IMP-042) — the party-status glance must open from ANY scene by hotkey, show the
## party's vitals read-only, block the scene beneath while it is up, and hand focus to a controller. It
## must also refuse to open when there is no party (title / boot / picker), so the key never opens an
## empty box. This locks the wiring the player asked for ("見れるようにして, any time") without a pointer.
## Run: godot --headless --path godot/ --script res://tests/verify_status_overlay.gd

const I18n := preload("res://scripts/i18n.gd")

var _fail := 0

func _initialize() -> void:
	await _run()
	paused = false
	print("[status-overlay] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _run() -> void:
	# _initialize runs before the autoloads' _ready fires — wait a frame so InputActions has registered
	# the named actions and StatusOverlay has built its root.
	await process_frame
	var overlay := get_root().get_node_or_null("StatusOverlay")
	var run := get_root().get_node_or_null("Run")
	_check(overlay != null, "the StatusOverlay autoload is live in every scene")
	_check(run != null, "the Run autoload is available")
	if overlay == null or run == null:
		return

	# The hotkey is registered, so the same key opens the glance in any scene.
	_check(InputMap.has_action("status"), "the 'status' hotkey action is registered")

	# --- with NO party the key must do nothing (title / boot / scenario picker) ---
	run.state = {"party": []}
	run.world = {}
	_check(not overlay._can_open(), "refuses to open with an empty party")
	overlay.open()
	_check(not overlay.is_open(), "open() is a no-op with no party")

	# --- a real party: one healthy front-row, one wounded back-row ---
	run.state = {
		"phase": "combat",
		"partyGold": 75,
		"party": [
			{"id": "a", "name": "Rook", "level": 3, "row": "front", "hp": 14, "maxHp": 14, "mp": 9, "maxMp": 9},
			{"id": "b", "name": "Mira", "level": 2, "row": "back", "hp": 1, "maxHp": 12, "mp": 4, "maxMp": 6, "injury": {"kind": "wound"}},
		],
	}
	_check(overlay._can_open(), "opens once a party exists")

	# The hotkey opens it — exercise the real handler with a synthesized 'status' key press.
	overlay._unhandled_input(_key(KEY_C))
	_check(overlay.is_open(), "the status hotkey opens the overlay")
	_check(paused, "the scene beneath is paused while the glance is up")
	await process_frame
	await process_frame

	var text := _all_text(overlay._content_host)
	_check(text.contains(I18n.t("statusOverlay.title")), "renders its title")
	_check(text.contains("Rook") and text.contains("Mira"), "lists every party member by name")
	_check(text.contains("HP 14/14") and text.contains("HP 1/12"), "shows each member's vitals read-only")
	_check(text.contains(I18n.t("partyMenu.wounded")), "the wounded member reads as wounded (reused condition copy)")
	_check(text.contains(I18n.t("play.combat")), "names the scene the party is in")
	_check(_first_button(overlay._content_host) != null, "offers a focusable control")
	_check(get_root().gui_get_focus_owner() is Button, "hands the cursor to a controller (a button holds focus)")

	# Esc closes and un-pauses the scene.
	overlay._unhandled_input(_key(KEY_ESCAPE))
	_check(not overlay.is_open(), "Esc closes the glance")
	_check(not paused, "closing un-pauses the scene")

	# The same hotkey toggles it shut (open, then status key again).
	overlay.open()
	_check(overlay.is_open(), "re-opens on the hotkey")
	overlay._unhandled_input(_key(KEY_C))
	_check(not overlay.is_open(), "the status hotkey toggles it shut")

func _key(code: Key) -> InputEventKey:
	var ev := InputEventKey.new()
	ev.physical_keycode = code
	ev.pressed = true
	return ev

func _all_text(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	for child in node.get_children():
		out += _all_text(child)
	return out

func _first_button(node: Node) -> Button:
	if node is Button and not (node as Button).disabled:
		return node
	for child in node.get_children():
		var deeper := _first_button(child)
		if deeper:
			return deeper
	return null

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[status-overlay] ok: %s" % label)
	else:
		push_error("[status-overlay] FAIL: %s" % label)
		print("[status-overlay] FAIL: %s" % label)
		_fail += 1

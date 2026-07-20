extends SceneTree
## Controller gate for the TITLE and the RESULT — the two ends of a run.
##
## The UX-parity gate proves they SAY what the React panels say. This proves they WORK: the title lands
## the cursor on the command a player came to give, the settings open under the menu and Cancel closes
## them (not the game), a save that cannot be read is REPORTED, and the result hands the cursor to the
## way on while showing the growth the fight actually produced.
##
## Usage: godot --headless --path godot/ --script res://tests/verify_front_controller.gd

var _failures := 0

func _initialize() -> void:
	await _check_title()
	await _check_result()

	print("")
	if _failures == 0:
		print("[front-controller] PASS — the title and the result are operable by controller and report what they hold")
		quit(0)
	else:
		print("[front-controller] FAIL — %d problem(s)" % _failures)
		quit(1)

func _check_title() -> void:
	var title := (load("res://scenes/title.tscn") as PackedScene).instantiate()
	get_root().add_child(title)
	for i in 8:
		await process_frame

	var focused := _focused()
	if focused == null:
		_fail("title: no focus surface — a controller is stuck on the front door")
	elif focused is Button and (focused as Button).text != "新たな探索":
		_fail("title: cursor landed on '%s', expected 新たな探索" % (focused as Button).text)
	else:
		print("[front-controller] title: cursor on 新たな探索")

	# The settings are a STATE of the title (React renders them inside it), and Cancel closes them.
	title.call("_toggle_config")
	for i in 3:
		await process_frame
	if not bool(title.get("_config_open")):
		_fail("title: 設定 did not open")
	if _find_text(title, "オートを危険時に停止する（ボス／低HP）") == null:
		_fail("title: the settings opened without the toggles React shows")
	_press_cancel(title)
	for i in 3:
		await process_frame
	if bool(title.get("_config_open")):
		_fail("title: Cancel did not close the settings")
	else:
		print("[front-controller] title: 設定 opens under the menu and Cancel closes it")

	# A save that will not load must be REPORTED — a silently-hidden slot reads as "no save", and the
	# player concludes their run is gone rather than broken.
	title.call("set_ui_state", {"corrupt": true})
	for i in 3:
		await process_frame
	if _find_text(title, "破損した保存") == null:
		_fail("title: an unreadable save was not reported")
	else:
		print("[front-controller] title: an unreadable save is reported, not hidden")
	title.queue_free()
	for i in 3:
		await process_frame

func _check_result() -> void:
	var result := (load("res://scenes/result.tscn") as PackedScene).instantiate()
	get_root().add_child(result)
	for i in 8:
		await process_frame

	var focused := _focused()
	if focused == null or not (focused is Button) or (focused as Button).text != "探索へ戻る":
		_fail("result: the way on does not hold the cursor (got %s)" % ("nothing" if focused == null else String(focused.name)))
	else:
		print("[front-controller] result: cursor on 探索へ戻る")

	# Growth is why the fight was worth having: when someone levelled, the result must name them.
	if _find_text(result, "成長") == null or _find_text(result, "レベルアップ") == null:
		_fail("result: a level-up produced no 成長 section")
	else:
		print("[front-controller] result: the level-up is named under 成長")

	# The creature is named in the world's own words — the conclusion carries raw English catalog names.
	if _find_text(result, "灰泥を倒した。") == null:
		_fail("result: the defeated creature was not named in Japanese")
	else:
		print("[front-controller] result: the defeated creature is named from the world catalog")

	# ...and the un-levelled result drops the section rather than showing an empty box.
	result.call("set_ui_state", {"no_growth": true})
	for i in 3:
		await process_frame
	if _find_text(result, "成長") != null:
		_fail("result: 成長 was shown with nothing in it")
	if _find_text(result, "戦果") == null:
		_fail("result: the spoils vanished with the growth section")
	else:
		print("[front-controller] result: no level-up = no empty 成長 box, spoils still shown")
	result.queue_free()
	for i in 3:
		await process_frame

func _find_text(node: Node, needle: String) -> Node:
	if node is Label and (node as Label).text.find(needle) != -1:
		return node
	if node is Button and (node as Button).text.find(needle) != -1:
		return node
	for child in node.get_children():
		var found := _find_text(child, needle)
		if found:
			return found
	return null

func _press_cancel(node: Node) -> void:
	var event := InputEventAction.new()
	event.action = "cancel"
	event.pressed = true
	node.call("_unhandled_input", event)

func _focused() -> Control:
	return get_root().gui_get_focus_owner()

func _fail(message: String) -> void:
	_failures += 1
	push_error("[front-controller] %s" % message)
	print("[front-controller] FAIL: %s" % message)

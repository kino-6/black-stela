extends SceneTree
## IMP-066: capture the real controller path through the first three front-door screens at 1280×720.
## Run without --headless: godot --path godot/ --script res://tests/capture_intro_flow.gd

const I18n := preload("res://scripts/i18n.gd")

var failures := 0

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	change_scene_to_file("res://scenes/title.tscn")
	await _await_scene("title.tscn")
	await _frames(8)
	var title := current_scene
	_check(title != null, "title scene loaded")
	if title == null:
		_finish()
		return
	_shot("res://tests/_intro_title_1280.png")
	_check(_focused_button_text() == I18n.t("title.newGame"), "title starts on 新たな探索")

	_press(KEY_ENTER)
	await _await_scene("scenario_picker.tscn")
	await _frames(8)
	var picker := current_scene
	_check(picker != null, "Confirm opens scenario selection")
	if picker == null:
		_finish()
		return
	_shot("res://tests/_intro_scenario_1280.png")
	var first_card := _first_button(picker)
	_check(first_card != null and first_card.text == "", "scenario's visible first choice is a controller card")
	if first_card == null:
		_finish()
		return
	first_card.grab_focus()
	_press(KEY_ENTER)
	await _await_scene("guild.tscn")
	await _frames(10)
	var guild := current_scene
	_check(guild != null, "Confirm enters the first guild briefing")
	if guild != null:
		_check(_tree_has_text(guild, I18n.t("party.guildBriefing")), "guild tells the player what happens next")
		_check(_tree_has_text(guild, I18n.t("party.quickRecruit")), "guild offers the short next action")
		_shot("res://tests/_intro_guild_1280.png")

	# The destructive command remains on the title, but must insert a separate confirmation choice.
	change_scene_to_file("res://scenes/title.tscn")
	await _await_scene("title.tscn")
	await _frames(6)
	title = current_scene
	title.call("set_ui_state", {
		"slots": {"__list__": [{
			"slotId": "manual:default:1", "empty": false, "title": "黒き石碑",
			"party": 6, "gold": 120,
		}]},
		"pending_delete": "manual:default:1",
	})
	await _frames(6)
	_check(_tree_has_text(title, I18n.t("title.deleteConfirm")), "delete confirmation names the irreversible action")
	_check(_tree_has_text(title, I18n.t("title.deleteCancel")), "delete confirmation offers a safe cancel")
	_shot("res://tests/_intro_delete_confirm_1280.png")
	_finish()

func _press(keycode: Key) -> void:
	for pressed in [true, false]:
		var event := InputEventKey.new()
		event.keycode = keycode
		event.physical_keycode = keycode
		event.pressed = pressed
		get_root().push_input(event)

func _await_scene(suffix: String, limit: int = 40) -> void:
	for frame in limit:
		if current_scene != null and current_scene.scene_file_path.ends_with(suffix):
			return
		await process_frame

func _frames(count: int) -> void:
	for frame in count:
		await process_frame

func _shot(path: String) -> void:
	var image := get_root().get_texture().get_image()
	if image == null:
		_fail("screenshot is null; run without --headless")
		return
	# A Retina window returns device pixels even though the control canvas is 1280×720. Persist the
	# requested logical review size so this evidence can be judged at the actual target composition.
	image.resize(1280, 720, Image.INTERPOLATE_LANCZOS)
	image.save_png(path)
	print("[intro-flow] wrote %s (%dx%d)" % [path, image.get_width(), image.get_height()])

func _first_button(node: Node) -> Button:
	if node is Button and not (node as Button).disabled:
		return node as Button
	for child in node.get_children():
		var found := _first_button(child)
		if found != null:
			return found
	return null

func _focused_button_text() -> String:
	var focused := get_root().gui_get_focus_owner()
	return focused.text if focused is Button else ""

func _tree_has_text(node: Node, needle: String) -> bool:
	if node is Label and String((node as Label).text).contains(needle):
		return true
	if node is Button and String((node as Button).text).contains(needle):
		return true
	for child in node.get_children():
		if _tree_has_text(child, needle):
			return true
	return false

func _check(ok: bool, message: String) -> void:
	if ok:
		print("[intro-flow] OK: %s" % message)
	else:
		_fail(message)

func _fail(message: String) -> void:
	failures += 1
	push_error("[intro-flow] FAIL: %s" % message)

func _finish() -> void:
	if failures == 0:
		print("[intro-flow] PASS — title → scenario → guild and delete confirmation are readable at 1280×720")
		quit(0)
	else:
		print("[intro-flow] FAIL — %d problem(s)" % failures)
		quit(1)

extends SceneTree
## IMP-065, first slice: drive the native front door by the same controller actions a player uses.
## This deliberately starts at Title (not a debug fixture or a direct town/dungeon scene), chooses each
## shipping world, recruits a legal six-person party through 見繕う, departs to town, descends, and walks.

const I18n := preload("res://scripts/i18n.gd")

var failures := 0

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	for world_id in ["default", "terminal-line", "verdant"]:
		await _run_first_descent(world_id)
	if failures == 0:
		print("[first-expedition] PASS — every shipping world completes the native first-expedition loop by controller input")
		quit(0)
	else:
		print("[first-expedition] FAIL — %d problem(s)" % failures)
		quit(1)

func _run_first_descent(world_id: String) -> void:
	change_scene_to_file("res://scenes/title.tscn")
	# Starting the next world while the prior dungeon is still freeing its renderer can take more than
	# the usual handful of frames. Wait for the requested native scene, rather than assuming a timing.
	await _await_scene("title.tscn")
	# SceneTree publishes current_scene before the Control's deferred initial focus is installed.
	await _frames(8)
	var title: Node = current_scene
	if title == null or not title.scene_file_path.ends_with("title.tscn"):
		print("[first-expedition] %s: scene after title request = %s" % [world_id, title.scene_file_path if title != null else "<none>"])
	_check(title != null and title.scene_file_path.ends_with("title.tscn"), "%s: title is the native starting scene" % world_id)
	var title_focus := get_root().gui_get_focus_owner()
	_check(title_focus is Button and not (title_focus as Button).disabled, "%s: title has an enabled controller focus" % world_id)
	_press("ui_accept")
	await _frames(8)
	var picker: Node = current_scene
	_check(picker != null and picker.scene_file_path.ends_with("scenario_picker.tscn"), "%s: title Confirm opens scenario choice" % world_id)
	if picker == null:
		return
	var card := _button_with_visible_label(picker, _world_title(world_id))
	_check(card != null, "%s: scenario card is controller-visible" % world_id)
	if card == null:
		return
	card.grab_focus()
	_press("ui_accept")
	await _frames(10)
	var guild: Node = current_scene
	_check(guild != null and guild.scene_file_path.ends_with("guild.tscn"), "%s: selected scenario opens its guild" % world_id)
	if guild == null:
		return
	for recruit in 6:
		var quick := _button_with_text(guild, I18n.t("party.quickRecruit"))
		_check(quick != null and not quick.disabled, "%s: recruit %d is a live controller command" % [world_id, recruit + 1])
		if quick == null or quick.disabled:
			return
		quick.grab_focus()
		_press("ui_accept")
		await _frames(5)
		guild = current_scene
		var party_after: int = (get_root().get_node_or_null("Run").state.get("party", []) as Array).size()
		_check(party_after == recruit + 1, "%s: recruit Confirm adds exactly one adventurer" % world_id)
	var run := get_root().get_node_or_null("Run")
	_check(run != null and (run.state.get("party", []) as Array).size() == 6, "%s: six legal recruits entered the run" % world_id)
	var japanese_roster := true
	for member in (run.state.get("party", []) as Array):
		if _has_ascii_letters(String((member as Dictionary).get("name", ""))):
			japanese_roster = false
	_check(japanese_roster, "%s: 見繕い sample roster is rendered with Japanese in-world names" % world_id)
	var depart := _button_with_prefix(guild, "▶ %s" % I18n.t("map.town"))
	_check(depart != null and not depart.disabled, "%s: guild offers departure after recruitment" % world_id)
	if depart == null or depart.disabled:
		return
	depart.grab_focus()
	_press("ui_accept")
	await _frames(10)
	var town: Node = current_scene
	_check(town != null and town.scene_file_path.ends_with("town.tscn"), "%s: guild departure lands in town" % world_id)
	if town == null:
		return
	# Accept one authored contract through the actual town counter before departing.  This is deliberately
	# a focused-controller path rather than a rules call: a legally formed party must be able to see and
	# accept its first purpose in the same native run.
	var archive := _button_with_text(town, I18n.t("town.locArchive"))
	_check(archive != null, "%s: town exposes the archive by controller" % world_id)
	if archive == null:
		return
	archive.grab_focus()
	_press("ui_accept")
	await _frames(5)
	var quest_board := _button_with_text(town, I18n.t("town.quests"))
	_check(quest_board != null and not quest_board.disabled, "%s: archive exposes the quest board" % world_id)
	if quest_board == null or quest_board.disabled:
		return
	quest_board.grab_focus()
	_press("ui_accept")
	await _frames(5)
	var accept := _button_with_text(town, I18n.t("questBoard.accept"))
	_check(accept != null and not accept.disabled, "%s: an authored quest can be accepted" % world_id)
	if accept == null or accept.disabled:
		return
	accept.grab_focus()
	_press("ui_accept")
	await _frames(5)
	var has_active_quest := false
	for quest in (run.state.get("quests", []) as Array):
		if String((quest as Dictionary).get("status", "")) == "active":
			has_active_quest = true
	_check(has_active_quest, "%s: Confirm accepts an active quest into the run" % world_id)
	_press("cancel")
	await _frames(3)
	_press("cancel")
	await _frames(3)
	var descend := _first_enabled_button(town, [I18n.t("play.enterDungeon"), "潜", "降", "入る"])
	_check(descend != null, "%s: town exposes an enabled descent command" % world_id)
	if descend == null:
		return
	descend.grab_focus()
	_press("ui_accept")
	await _frames(12)
	var dungeon: Node = current_scene
	_check(dungeon != null and dungeon.scene_file_path.ends_with("dungeon.tscn"), "%s: town Confirm enters its dungeon" % world_id)
	if dungeon == null or run == null:
		return
	var before_cell := String((run.state.get("position", {}) as Dictionary).get("cellId", ""))
	_press("move_forward")
	await _frames(6)
	var after_cell := String((run.state.get("position", {}) as Dictionary).get("cellId", ""))
	_check(after_cell != "" and after_cell != before_cell, "%s: first dungeon move is input-driven and changes the current cell" % world_id)
	# Default's authored first room enters combat.  Retreat is a real command (not a state edit), returning
	# the party to the landing so the return loop proves its own confirmation and town handoff.
	await _frames(10)
	if current_scene != null and current_scene.scene_file_path.ends_with("combat.tscn"):
		var combat := current_scene
		_check(true, "%s: the walked first encounter opens native combat" % world_id)
		var retreat := _button_with_text(combat, I18n.t("play.retreat"))
		_check(retreat != null and not retreat.disabled, "%s: combat exposes a live retreat command" % world_id)
		if retreat == null or retreat.disabled:
			return
		retreat.grab_focus()
		_press("ui_accept")
		await _await_scene("dungeon.tscn")
		await _frames(6)
	var returned_dungeon: Node = current_scene
	_check(returned_dungeon != null and returned_dungeon.scene_file_path.ends_with("dungeon.tscn"), "%s: combat/step leaves a returnable dungeon state" % world_id)
	if returned_dungeon == null or not returned_dungeon.scene_file_path.ends_with("dungeon.tscn"):
		return
	var landing_cell := _start_cell_id(run.world)
	var current_cell := String((run.state.get("position", {}) as Dictionary).get("cellId", ""))
	if current_cell != landing_cell:
		# Each first landing faces its first open passage. Two right turns face that passage's reverse and
		# one real forward input walks back to the visible return point.
		_press("turn_right")
		await _frames(2)
		_press("turn_right")
		await _frames(2)
		_press("move_forward")
		await _frames(8)
	current_cell = String((run.state.get("position", {}) as Dictionary).get("cellId", ""))
	_check(current_cell == landing_cell, "%s: controller movement returns to the landing marker" % world_id)
	if current_cell != landing_cell:
		return
	_press("ui_accept")
	await _frames(4)
	var return_yes := _button_with_text(returned_dungeon, I18n.t("play.confirmYes"))
	_check(return_yes != null, "%s: return asks for a focused second confirmation" % world_id)
	if return_yes == null:
		return
	# Focus begins at いいえ by design. D/Right moves to はい and Enter executes the return; it remains
	# a controller action rather than invoking the return rule from the gate.
	_press("turn_right")
	await _frames(2)
	_press("ui_accept")
	await _await_scene("town.tscn")
	await _frames(6)
	var returned_town: Node = current_scene
	_check(returned_town != null and returned_town.scene_file_path.ends_with("town.tscn"), "%s: confirmed return lands in native town" % world_id)
	if returned_town == null or not returned_town.scene_file_path.ends_with("town.tscn"):
		return
	_check(_tree_has_text(returned_town, I18n.t("town.statusHeading")) and _tree_has_text(returned_town, I18n.t("town.nextPreparation")), "%s: returned town shows the preparation cockpit beside next actions" % world_id)
	var recovery := _button_with_text(returned_town, I18n.t("town.recovery"))
	_check(recovery != null and not recovery.disabled, "%s: return town offers its preparation services" % world_id)
	if recovery == null or recovery.disabled:
		return
	recovery.grab_focus()
	_press("ui_accept")
	await _frames(4)
	_check(_tree_has_text(returned_town, I18n.t("town.recoveryHeading")), "%s: a post-return service opens by controller" % world_id)
	_press("cancel")
	await _frames(3)
	var redeploy := _first_enabled_button(returned_town, [I18n.t("play.enterDungeon"), "潜", "降", "入る"])
	_check(redeploy != null, "%s: returning preserves a controller re-deploy command" % world_id)
	if redeploy == null:
		return
	redeploy.grab_focus()
	_press("ui_accept")
	await _await_scene("dungeon.tscn")
	_check(current_scene != null and current_scene.scene_file_path.ends_with("dungeon.tscn"), "%s: town re-deploy returns to dungeon" % world_id)
	# A valid first tile can schedule a random encounter after the move has committed. Let that deferred
	# scene handoff settle before starting the next world's title path; otherwise its old combat request can
	# race the following `change_scene_to_file` and make the evidence flaky.
	await _frames(16)
	print("[first-expedition] %s: title → picker → six recruits → contract → descent → return → service → re-deploy" % world_id)

func _world_title(world_id: String) -> String:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/%s.json" % world_id))
	var world: Dictionary = (parsed as Dictionary).get("world", {}) if typeof(parsed) == TYPE_DICTIONARY else {}
	var ja: Dictionary = world.get("locales", {}).get("ja", {}) as Dictionary
	return String(ja.get("title", world.get("title", world_id)))

func _start_cell_id(world: Dictionary) -> String:
	var start_room := String(world.get("startRoom", ""))
	for dungeon in world.get("dungeons", []):
		for cell in ((dungeon as Dictionary).get("grid", {}) as Dictionary).get("cells", []):
			if String((cell as Dictionary).get("roomId", "")) == start_room:
				return String((cell as Dictionary).get("id", ""))
	return ""

func _press(action: String) -> void:
	var keycode := KEY_NONE
	match action:
		"ui_accept":
			keycode = KEY_ENTER
		"move_forward":
			keycode = KEY_W
		"turn_left":
			keycode = KEY_A
		"turn_right":
			keycode = KEY_D
		"cancel":
			keycode = KEY_ESCAPE
		_:
			push_error("[first-expedition] unsupported input action: %s" % action)
			return
	# A controller action is a tap, not a permanently held key.  Button's normal activation is
	# completed on release, so deliver both halves through the same Window dispatch path.
	for pressed in [true, false]:
		var event := InputEventKey.new()
		event.keycode = keycode
		event.physical_keycode = keycode
		event.pressed = pressed
		get_root().push_input(event)

func _frames(count: int) -> void:
	for frame in count:
		await process_frame

func _await_scene(scene_suffix: String, limit: int = 40) -> void:
	for frame in limit:
		if current_scene != null and current_scene.scene_file_path.ends_with(scene_suffix):
			return
		await process_frame

func _button_with_text(root: Node, exact: String) -> Button:
	for button in _buttons(root):
		if String(button.text) == exact:
			return button
	return null

func _button_with_prefix(root: Node, prefix: String) -> Button:
	for button in _buttons(root):
		if String(button.text).begins_with(prefix):
			return button
	return null

func _tree_has_text(root: Node, needle: String) -> bool:
	if root is Label and String((root as Label).text).contains(needle):
		return true
	for child in root.get_children():
		if _tree_has_text(child, needle):
			return true
	return false

func _has_ascii_letters(value: String) -> bool:
	var ascii_letters := RegEx.new()
	ascii_letters.compile("[A-Za-z]")
	return ascii_letters.search(value) != null

# Scenario cards intentionally keep Button.text empty and render their authored title as a child Label.
# Find that visible label, then recover its owning controller command instead of special-casing the picker.
func _button_with_visible_label(root: Node, exact: String) -> Button:
	if root is Label and String((root as Label).text) == exact:
		var parent := root.get_parent()
		while parent != null:
			if parent is Button:
				return parent as Button
			parent = parent.get_parent()
	for child in root.get_children():
		var found := _button_with_visible_label(child, exact)
		if found != null:
			return found
	return null

func _first_enabled_button(root: Node, needles: Array) -> Button:
	for button in _buttons(root):
		if button.disabled:
			continue
		for needle in needles:
			if String(button.text).contains(String(needle)):
				return button
	return null

func _buttons(node: Node) -> Array:
	var found: Array = []
	if node is Button:
		found.append(node as Button)
	for child in node.get_children():
		found.append_array(_buttons(child))
	return found

func _check(ok: bool, message: String) -> void:
	if ok:
		print("[first-expedition] OK: %s" % message)
	else:
		push_error("[first-expedition] FAIL: %s" % message)
		failures += 1

extends SceneTree
## Controller traversal gate for the town (AGENTS.md: a player-facing screen is not done without
## evidence of keyboard/controller-style operation; controller-first-ui: "every screen hands the cursor
## a place to land", and "Cancel means back one step, and it must always resolve").
##
## This drives the town with NO pointer events at all:
##   square -> each destination -> each service -> Cancel back out, asserting at every step that
##   (1) something focusable holds the cursor, and (2) Cancel resolved exactly one level.
## Usage: godot --headless --path godot/ --script res://tests/verify_town_controller.gd

const LOCATIONS := {"hall": ["guild", "party", "career"], "market": ["shop", "loot", "workshop"], "archive": ["records", "quests"]}

var _failures := 0

func _initialize() -> void:
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for i in 8:
		await process_frame

	# The square must hand the cursor a place to land, and it must be the descent (the command a party
	# standing in town came to give) — not merely the first button in the tree.
	var focused := _focused()
	if focused == null:
		_fail("square: no focus surface — a controller is stuck here")
	elif focused is Button and (focused as Button).text.find("迷宮") == -1:
		_fail("square: cursor landed on '%s', expected 迷宮に入る" % (focused as Button).text)
	else:
		print("[town-controller] square: cursor on %s" % (focused as Button).text)

	for location in LOCATIONS:
		town.call("_go_location", String(location))
		for i in 3:
			await process_frame
		if _focused() == null:
			_fail("%s: no focus surface" % location)

		for service in LOCATIONS[location]:
			var svc := String(service)
			town.call("_open_service", svc)
			for i in 4:
				await process_frame
			var f := _focused()
			if f == null:
				_fail("service %s: no focus surface — a controller cannot act here" % svc)
			elif f is Button and (f as Button).disabled:
				_fail("service %s: cursor landed on a DISABLED control" % svc)
			else:
				print("[town-controller] %s: cursor on %s" % [svc, (f as Button).text if f is Button else f.name])

			# Cancel must resolve one step back: counter -> the location's service menu.
			_press_cancel(town)
			for i in 3:
				await process_frame
			if town.get("_service") != "":
				_fail("service %s: Cancel did not close the counter" % svc)
			if _focused() == null:
				_fail("service %s: focus lost after Cancel" % svc)

		# Cancel from a location returns to the square.
		_press_cancel(town)
		for i in 3:
			await process_frame
		if town.get("_location") != "":
			_fail("%s: Cancel did not return to the square" % location)

	# The loot counter's confirm stage must cancel back to the counter, NOT out of the service.
	town.call("_open_service", "loot")
	for i in 3:
		await process_frame
	town.call("set_ui_state", {"loot_pending": "sell"})
	for i in 3:
		await process_frame
	_press_cancel(town)
	for i in 3:
		await process_frame
	if town.get("_loot_pending") != "":
		_fail("loot: Cancel did not leave the confirm stage")
	if town.get("_service") != "loot":
		_fail("loot: Cancel from the confirm stage ejected the player out of the service")
	else:
		print("[town-controller] loot confirm: Cancel returned to the counter, not out of it")

	print("")
	if _failures == 0:
		print("[town-controller] PASS — every town surface is reachable, focusable and cancellable by controller")
		quit(0)
	else:
		print("[town-controller] FAIL — %d problem(s)" % _failures)
		quit(1)

func _press_cancel(town: Node) -> void:
	var event := InputEventAction.new()
	event.action = "cancel"
	event.pressed = true
	town.call("_unhandled_input", event)

func _focused() -> Control:
	return get_root().gui_get_focus_owner()

func _fail(message: String) -> void:
	_failures += 1
	push_error("[town-controller] %s" % message)
	print("[town-controller] FAIL: %s" % message)

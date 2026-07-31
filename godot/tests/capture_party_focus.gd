extends SceneTree
## Visual proof for roster inspection: moving focus onto a member changes the right-hand sheet immediately
## and leaves the controller cursor on that member. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_party_focus.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 12:
		await process_frame
	dungeon.call("_toggle_party_menu")
	for i in 4:
		await process_frame
	get_root().push_input(_action("ui_down"))
	for i in 8:
		await process_frame
	var focused: Control = get_root().gui_get_focus_owner()
	if not (focused is Button):
		push_error("[party-focus] controller focus did not land on a roster member")
		quit(1)
		return
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[party-focus] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_ux_party-focus.png")
	print("[party-focus] wrote tests/_ux_party-focus.png for %s" % (focused as Button).text)
	quit(0)

func _action(name: String) -> InputEventAction:
	var event := InputEventAction.new()
	event.action = name
	event.pressed = true
	return event

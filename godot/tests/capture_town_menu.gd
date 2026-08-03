extends SceneTree
## Quick visual check of the town MENU overlay (T27): opens it and shots the settings toggles, to confirm
## the state labels read オン/オフ (not the old オート/停止) and the menu renders. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_town_menu.gd -- /absolute/out.png

const UxFixture := preload("res://tests/ux_fixture.gd")

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out := String(args[0]) if not args.is_empty() else "res://tests/_town_menu.png"
	var packed: Variant = load("res://scenes/town.tscn")
	var root: Node = (packed as PackedScene).instantiate()
	get_root().add_child(root)
	for _f in 8:
		await process_frame
	if root.has_method("set_state_override"):
		root.call("set_state_override", UxFixture.build({"partyGold": 200}))
		for _f in 4:
			await process_frame
	if root.has_method("_open_menu"):
		root.call("_open_menu")
		for _f in 6:
			await process_frame
	var img := get_root().get_texture().get_image()
	if img == null:
		push_error("[town-menu] null image — run WITHOUT --headless")
		quit(1)
		return
	var err := img.save_png(out)
	if err != OK:
		push_error("[town-menu] save failed %s" % error_string(err))
		quit(1)
		return
	print("[town-menu] %s (%dx%d)" % [out, img.get_width(), img.get_height()])
	quit(0)

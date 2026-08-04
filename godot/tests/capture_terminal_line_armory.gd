extends SceneTree
## Visual evidence for Terminal Line's fictional firearm selection. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_terminal_line_armory.gd -- /absolute/out.png
## The state unlocks the full armory catalog and selects the late-game DMR, while the stable controller
## focus remains on the weapon list. This captures the normal service surface, not a debug overlay.

const UxFixture := preload("res://tests/ux_fixture.gd")

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out_path := String(args[0]) if not args.is_empty() else "res://tests/_terminal-line-armory.png"
	get_root().size = Vector2i(1920, 1080)
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for _frame in 8:
		await process_frame
	town.call("set_world_override", "terminal-line")
	var state := UxFixture.build({"partyGold": 600})
	state["discoveredSecrets"] = [
		"flag.tl3f.bypass-open", "flag.tl4f.sluice-open", "flag.tl5f.loading-open",
		"flag.tl6f.lift-online", "flag.tl7f.archive-open", "flag.tl8f.switch-open"
	]
	town.call("set_state_override", state)
	town.call("set_ui_state", {
		"service": "shop",
		"shop_mode": "buy",
		"shop_category": "weapon",
		"shop_item_id": "equip.tl-quarantine-62-dmr"
	})
	for _frame in 10:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[terminal-line-armory] NULL image — run WITHOUT --headless")
		quit(1)
		return
	var error := image.save_png(out_path)
	if error != OK:
		push_error("[terminal-line-armory] could not save %s (%s)" % [out_path, error_string(error)])
		quit(1)
		return
	print("[terminal-line-armory] -> %s (%dx%d)" % [out_path, image.get_width(), image.get_height()])
	quit(0)

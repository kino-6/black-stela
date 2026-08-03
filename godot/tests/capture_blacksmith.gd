extends SceneTree
## Real-build visual capture of the 鍛冶屋 (blacksmith) service screen, for Codex art-lane review (T9 —
## the controller/rules were signed off, but no blacksmith screenshot was in the evidence set). Mirrors
## capture_ux_evidence.gd exactly: instantiate town.tscn, inject a UX fixture, open the blacksmith service,
## grab the frame. MUST run WITHOUT --headless (a headless viewport yields a null image):
##   godot --path godot/ --script res://tests/capture_blacksmith.gd -- /absolute/out-dir [world_id]
## Writes <dir>/_blacksmith-<state>.png for three representative states.

const UxFixture := preload("res://tests/ux_fixture.gd")

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out_dir := String(args[0]) if not args.is_empty() else "res://tests"
	var world_id := String(args[1]) if args.size() > 1 else ""
	var states := [
		# a populated, affordable screen — every member wears all six slots, 400g covers each 30g forge
		{"tag": "affordable", "fixture": {"partyGold": 400, "__wearAll": true}},
		# every slot already at +5 — the at-cap presentation (blacksmith.atCap)
		{"tag": "atcap", "fixture": {"partyGold": 400, "__wearMaxed": true}},
		# no gold — the can't-afford / noGold presentation
		{"tag": "nogold", "fixture": {"partyGold": 0, "__wearAll": true}},
	]
	for st in states:
		var packed: Variant = load("res://scenes/town.tscn")
		if packed == null:
			push_error("[blacksmith-capture] missing town.tscn")
			quit(1)
			return
		var root: Node = (packed as PackedScene).instantiate()
		get_root().add_child(root)
		for _f in 8:
			await process_frame
		if world_id != "" and root.has_method("set_world_override"):
			root.call("set_world_override", world_id)
			for _f in 4:
				await process_frame
		if root.has_method("set_state_override"):
			root.call("set_state_override", UxFixture.build(st["fixture"]))
			for _f in 4:
				await process_frame
		if root.has_method("_open_service"):
			root.call("_open_service", "blacksmith")
			for _f in 6:
				await process_frame
		var img := get_root().get_texture().get_image()
		if img == null:
			push_error("[blacksmith-capture] null image — run WITHOUT --headless")
			quit(1)
			return
		var path := "%s/_blacksmith-%s.png" % [out_dir, String(st["tag"])]
		var err := img.save_png(path)
		root.queue_free()
		for _f in 3:
			await process_frame
		if err != OK:
			push_error("[blacksmith-capture] could not save %s (%s)" % [path, error_string(err)])
			quit(1)
			return
		print("[blacksmith-capture] %s (%dx%d)" % [path, img.get_width(), img.get_height()])
	quit(0)

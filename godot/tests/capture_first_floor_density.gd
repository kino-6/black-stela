extends SceneTree
## IMP-069 visual companion. Run without --headless to capture each fresh first-floor landing and its
## first real movement: godot --path godot/ --script res://tests/capture_first_floor_density.gd

const WORLD_IDS := ["default", "terminal-line", "verdant"]

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[first-floor-capture] missing Run autoload")
		quit(1)
		return
	for world_id in WORLD_IDS:
		run.world_id = world_id
		run.reset()
		# Make this a fresh descent, never a trace's mid-floor resume.
		run.state["phase"] = "town"
		run.state["position"] = null
		run.state["map"] = {}
		change_scene_to_file("res://scenes/dungeon.tscn")
		await _await_scene("dungeon.tscn")
		await _frames(12)
		_print_state(world_id, "before", run.state)
		_shot("res://tests/_density-%s-before.png" % world_id)
		# Use the production movement binding, not Dungeon.step_forward's test seam. The default world's
		# first step may hand off to combat; the other two stay in the crawl, and both outcomes are evidence.
		_press_forward()
		await _frames(12)
		_print_state(world_id, "after", run.state)
		_shot("res://tests/_density-%s-after.png" % world_id)
		if current_scene != null:
			current_scene.queue_free()
		await _frames(5)
	print("[first-floor-capture] PASS — wrote before/after evidence for every first floor")
	quit(0)

func _print_state(world_id: String, phase: String, state: Dictionary) -> void:
	var position: Dictionary = state.get("position", {}) as Dictionary
	print("[first-floor-capture] %s %s: phase=%s floor=%s cell=%s room=%s" % [
		world_id, phase, state.get("phase", ""), position.get("floorId", ""),
		position.get("cellId", ""), position.get("roomId", "")
	])

func _await_scene(suffix: String, limit: int = 50) -> void:
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
		push_error("[first-floor-capture] null image; run without --headless")
		return
	image.resize(1280, 720, Image.INTERPOLATE_LANCZOS)
	image.save_png(path)
	print("[first-floor-capture] wrote %s" % path)

func _press_forward() -> void:
	for pressed in [true, false]:
		var event := InputEventKey.new()
		event.keycode = KEY_W
		event.physical_keycode = KEY_W
		event.pressed = pressed
		get_root().push_input(event)

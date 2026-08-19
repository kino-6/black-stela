extends SceneTree
## Visual evidence for IMP-068: a real return-shaped state must show the compact preparation cockpit
## immediately beside its next town commands. Usage: godot --path godot/ --script res://tests/capture_return_cockpit.gd

func _initialize() -> void:
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture-return-cockpit] Run autoload is unavailable")
		quit(1)
		return
	run.ensure_loaded()
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/traces/b1f-return.json"))
	if typeof(doc) != TYPE_DICTIONARY:
		push_error("[capture-return-cockpit] b1f-return trace could not be read")
		quit(1)
		return
	var state: Dictionary = ((doc as Dictionary).get("initialState", {}) as Dictionary).duplicate(true)
	state["phase"] = "town"
	state["position"] = null
	state["combat"] = null
	state["log"] = [{"text": "灰の門から無事に帰還した。", "event": {"type": "returned"}}]
	run.state = state
	change_scene_to_file("res://scenes/town.tscn")
	for frame in 12:
		await process_frame
	var image := get_root().get_texture().get_image()
	image.save_png("res://tests/_return_cockpit.png")
	print("[capture-return-cockpit] -> res://tests/_return_cockpit.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)

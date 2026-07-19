extends SceneTree
## M2 hands-on-style check: build a party at the guild, then walk it into the first chamber fight — the
## SELF-MADE party must be the party that fights (not the debug fixture). Shoots the combat stage.
## Usage: godot --path godot/ --script res://tests/capture_m2_flow.gd

func _initialize() -> void:
	var guild := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
	get_root().add_child(guild)
	for i in 6:
		await process_frame
	for cls in ["vanguard", "duelist", "bulwark", "arcanist", "mender", "chanter"]:
		guild._on_class(cls)
		guild._on_register()
		await process_frame
	guild.queue_free()
	await process_frame

	# Into the dungeon with the self-made party, then step into the authored ash-slime chamber.
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 8:
		await process_frame
	if dungeon.has_method("step_forward"):
		dungeon.step_forward()
	for i in 40:
		await process_frame

	var img := get_root().get_texture().get_image()
	img.save_png("res://tests/_m2_combat.png")
	var run := get_root().get_node_or_null("Run")
	var names := []
	for m in (run.state.get("party", []) if run else []):
		names.append(m.get("name", "?"))
	print("[m2] combat party: %s" % str(names))
	quit(0)

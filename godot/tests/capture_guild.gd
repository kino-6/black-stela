extends SceneTree
## Drive the guild: register a 3+3-ish party through the ported create() and screenshot the built roster,
## proving the self-made party lands in the shared Run. Usage:
##   godot --path godot/ --script res://tests/capture_guild.gd

func _initialize() -> void:
	var guild := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
	get_root().add_child(guild)
	for i in 8:
		await process_frame

	for cls in ["vanguard", "duelist", "bulwark", "arcanist", "mender", "chanter"]:
		guild._on_class(cls)
		guild._on_register()
		await process_frame

	_shot("res://tests/_guild_built.png")

	var run := get_root().get_node_or_null("Run")
	var party: Array = run.state.get("party", []) if run else []
	print("[capture_guild] party size=%d" % party.size())

	# Depart to town — proves the self-made party carries into the loop (town purse reads it).
	guild._on_depart()
	for i in 14:
		await process_frame
	_shot("res://tests/_guild_to_town.png")
	quit(0)

func _shot(out_path: String) -> void:
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[capture_guild] -> %s (%dx%d)" % [out_path, img.get_width(), img.get_height()])

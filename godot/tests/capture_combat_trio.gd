extends SceneTree
## Visual evidence for IMP-024: a THREE-group fight, so the pack that used to spill under the command panel
## can be reviewed. Usage: godot --path godot/ --script res://tests/capture_combat_trio.gd

func _initialize() -> void:
	var run := get_root().get_node_or_null("Run")
	run.ensure_loaded()
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/traces/b1f-combat-victory.json"))
	var state: Dictionary = ((doc as Dictionary).get("initialState", {}) as Dictionary).duplicate(true)
	var groups: Array = ((state.get("combat", {}) as Dictionary).get("enemyGroups", []) as Array)
	var trio := []
	for k in 3:
		var g: Dictionary = (groups[0] as Dictionary).duplicate(true)
		g["id"] = "group.test.%d" % k
		trio.append(g)
	state["combat"]["enemyGroups"] = trio
	state["phase"] = "combat"
	run.state = state

	var combat: Node = (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(combat)
	for i in 10:
		await process_frame
	var img := get_root().get_texture().get_image()
	img.save_png("res://tests/_combat_trio.png")
	print("[capture_combat_trio] -> res://tests/_combat_trio.png (%dx%d)" % [img.get_width(), img.get_height()])
	quit(0)

extends SceneTree
## §9.5 — screenshot the 特技 menu at a level where the whole line is learned, so the ported catalog
## wiring is verifiable rather than asserted. Every technique must show its NAME and its real MP cost;
## a raw id or "MP 0" means the menu has fallen back to a hardcoded table again.
func _initialize() -> void:
	var root := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(root)
	for i in 8:
		await process_frame
	# Raise the party so the full six-technique lines are available, then rebuild the menu.
	if root.has_method("debug_set_party_level"):
		root.debug_set_party_level(9)
	else:
		var state: Dictionary = root.get("_state")
		var party: Array = []
		for member in state.get("party", []):
			var m: Dictionary = (member as Dictionary).duplicate(true)
			m["level"] = 9
			m["mp"] = 60
			m["maxMp"] = 60
			m.erase("vocation")
			party.append(m)
		state["party"] = party
		root.set("_state", state)
		root.call("_rebuild_command_menu")
	for i in 8:
		await process_frame
	# Open 特技 for the first actor.
	root.call("_on_menu_choice", "stage", {"stage": "skill"})
	for i in 8:
		await process_frame
	var img := get_root().get_texture().get_image()
	img.save_png("res://tests/_technique_menu.png")
	print("[capture_techniques] -> _technique_menu.png (%dx%d)" % [img.get_width(), img.get_height()])
	quit(0)

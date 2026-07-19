extends SceneTree
## End-to-end VISUAL proof of the loop's spine: load the dungeon, step forward through the ported rules
## into the authored ash-slime room, and screenshot AFTER the scene hands off — the shot should show the
## combat stage with the same six-member party. Under this SceneTree the autoloads aren't started, so the
## combat scene rebuilds the encounter from the fixture (the same Encounter.begin path the dungeon fires).
## Usage: godot --path godot/ --script res://tests/capture_flow.gd

func _initialize() -> void:
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 8:
		await process_frame
	_shot("res://tests/_flow_dungeon.png")

	if dungeon.has_method("step_forward"):
		dungeon.step_forward()   # walks into room.002 -> phase=combat -> change_scene_to_file(combat)
	else:
		push_error("[capture_flow] dungeon has no step_forward()")
	for i in 40:                 # wait out the 0.35s read-delay + the scene change
		await process_frame
	_shot("res://tests/_flow_combat.png")
	quit(0)

func _shot(out_path: String) -> void:
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[capture_flow] -> %s (%dx%d)" % [out_path, img.get_width(), img.get_height()])

extends Node
## Navigation between the scene roots (Boot → Title → Town → Dungeon → Combat → Result → …). A thin
## wrapper over change_scene_to_file keeps a single seam for the transition/animation layer S4 adds.

func goto(scene_path: String) -> void:
	var err := get_tree().change_scene_to_file(scene_path)
	if err != OK:
		push_error("scene change failed (%d): %s" % [err, scene_path])

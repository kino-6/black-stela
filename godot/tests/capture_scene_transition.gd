extends SceneTree
## Renderer evidence for the encounter handoff. Run without --headless so the midpoint proves that the
## dungeon is covered by a dark veil rather than a bright flash or an empty frame.

func _initialize() -> void:
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 12:
		await process_frame
	var manager := preload("res://scripts/scene_manager.gd").new()
	get_root().add_child(manager)
	manager.call_deferred("fade_to_dark", "res://scenes/combat.tscn")
	await create_timer(0.06).timeout
	_shot("res://tests/_scene-transition-dark.png")
	await create_timer(0.55).timeout
	_shot("res://tests/_scene-transition-combat.png")
	quit(0)

func _shot(path: String) -> void:
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[capture-scene-transition] NULL image — run without --headless")
		return
	image.save_png(path)
	print("[capture-scene-transition] -> %s (%dx%d)" % [path, image.get_width(), image.get_height()])

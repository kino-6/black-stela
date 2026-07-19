extends SceneTree
## Render a scene and save a PNG for visual review. Usage:
##   godot --path godot/ --script res://tests/capture.gd -- <scene> <out.png>
func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var scene_path: String = args[0] if args.size() > 0 else "res://scenes/combat.tscn"
	var out_path: String = args[1] if args.size() > 1 else "res://tests/_shot.png"
	var root := (load(scene_path) as PackedScene).instantiate()
	get_root().add_child(root)
	for i in 6:
		await process_frame
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[capture] %s -> %s (%dx%d)" % [scene_path, out_path, img.get_width(), img.get_height()])
	quit(0)

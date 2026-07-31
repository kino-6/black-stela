extends SceneTree
## Screenshot the mid/late floors a reviewer otherwise never reaches (IMP-062) — first-person view AND the
## full map (M) — for both worlds, using the same deep-floor fixtures the debug panel offers. Writes
## res://tests/_deep_<world>_<floor>.png and _deep_<world>_<floor>_map.png.
## Usage: godot --path godot/ --script res://tests/capture_deep_floors.gd

const Fixtures := preload("res://scripts/debug_fixtures.gd")

# (world, floor_n, label) — representative mid and late floors of each world.
const SHOTS := [
	["default", "floor_5", "default_b5f"],
	["default", "floor_8", "default_b8f"],
	["verdant", "floor_2", "verdant_g2f"],
	["verdant", "floor_3", "verdant_g3f"],
]

func _initialize() -> void:
	for i in 4:
		await process_frame
	var run := get_root().get_node_or_null("/root/Run")
	if run == null:
		push_error("[deep-floors] no Run autoload")
		quit(1)
		return

	for shot in SHOTS:
		var world_id: String = shot[0]
		var fixture: String = shot[1]
		var label: String = shot[2]
		run.world_id = world_id
		run.reset()
		var scene_path := String(Fixtures.load_into(run, fixture))
		if not scene_path.ends_with("dungeon.tscn"):
			push_error("[deep-floors] %s did not land in the dungeon" % label)
			continue
		var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
		get_root().add_child(dungeon)
		for i in 14:
			await process_frame
		await _shot("res://tests/_deep_%s.png" % label)
		# Open the full map (M) and shoot it too — deep-floor map/geometry is the thing never reviewed.
		if dungeon.has_method("_toggle_full_map"):
			dungeon.call("_toggle_full_map")
			for i in 6:
				await process_frame
			await _shot("res://tests/_deep_%s_map.png" % label)
		dungeon.free()
		for i in 2:
			await process_frame

	quit(0)

func _shot(out_path: String) -> void:
	await process_frame
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[deep-floors] -> %s (%dx%d)" % [out_path, img.get_width(), img.get_height()])

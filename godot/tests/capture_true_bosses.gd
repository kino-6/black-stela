extends SceneTree
## T31 visual evidence: bring a depth-appropriate party into the REAL combat scene against each
## true-clear boss. This goes through DebugFixtures' floor_10 party and Encounter.begin rather than
## manufacturing a render-only enemy card, so sprite resolution, boss labels, HP state and combat-lane
## grounding are the same paths normal play uses. Run without --headless.

const Fixtures := preload("res://scripts/debug_fixtures.gd")
const Encounter := preload("res://scripts/encounter.gd")

const BOSSES := [
	["default", "room.b10f.keep", "enemy.b10.dark-stela", "default_b10_dark_stela"],
	["verdant", "room.verdant.g10f.keep", "enemy.verdant.g10.worldheart", "verdant_g10_worldheart"],
]

func _initialize() -> void:
	for i in 4:
		await process_frame
	var run := get_root().get_node_or_null("/root/Run")
	if run == null:
		push_error("[true-bosses] no Run autoload")
		quit(1)
		return

	for entry in BOSSES:
		var world_id := String(entry[0])
		var room_id := String(entry[1])
		var enemy_id := String(entry[2])
		var label := String(entry[3])
		run.world_id = world_id
		run.reset()
		if not String(Fixtures.load_into(run, "floor_10")).ends_with("dungeon.tscn"):
			push_error("[true-bosses] floor_10 fixture did not load for %s" % world_id)
			continue
		Encounter.begin(run.state, run.world, room_id, enemy_id)
		var combat := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
		get_root().add_child(combat)
		for i in 14:
			await process_frame
		_shot("res://tests/_true_boss_%s.png" % label)
		combat.free()
		for i in 2:
			await process_frame

	quit(0)

func _shot(out_path: String) -> void:
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[true-bosses] -> %s (%dx%d)" % [out_path, img.get_width(), img.get_height()])

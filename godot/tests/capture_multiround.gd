extends SceneTree
## Visual proof of the LIVE multi-round combat: the 6-party vs. a 50-HP rootheart survives round 1, the
## enemy counter-attacks, the command menu is handed back, and round 2 wins. Shoots after each round.
## Usage: godot --path godot/ --script res://tests/capture_multiround.gd

const RunScript := preload("res://scripts/run_state.gd")
const Encounter := preload("res://scripts/encounter.gd")

func _initialize() -> void:
	var run := get_root().get_node_or_null("Run")
	if run == null:
		run = RunScript.new(); run.name = "Run"; get_root().add_child(run)
	run.world_id = "verdant"
	run.reset()
	Encounter.begin(run.state, run.world, "room.verdant.g1f.001", "enemy.verdant.g8.rootheart")

	var combat := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(combat)
	for i in 10:
		await process_frame

	combat.force_resolve()   # round 1 — rootheart survives, counter-attacks, command handed back
	for i in 12:
		await process_frame
	_shot("res://tests/_multiround_r1.png")

	if not combat.get("_resolved"):
		combat.force_resolve()   # round 2 (or more) — press until it ends
		for i in 12:
			await process_frame
	_shot("res://tests/_multiround_r2.png")
	quit(0)

func _shot(out_path: String) -> void:
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[capture_multiround] -> %s" % out_path)

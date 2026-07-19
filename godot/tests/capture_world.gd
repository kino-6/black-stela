extends SceneTree
## S5 Go/No-Go evidence: render the SAME scene code on a chosen world's data + assets, proving the slice
## is not hardcoded to one scenario. Manually stands up the Run autoload with a world_id, then shoots
## title / town / dungeon / combat for that world.
## Usage: godot --path godot/ --script res://tests/capture_world.gd -- <world_id>

const RunScript := preload("res://scripts/run_state.gd")

func _initialize() -> void:
	var user_args := OS.get_cmdline_user_args()
	var world_id: String = user_args[0] if user_args.size() > 0 else "default"

	# The Run autoload is live even under --script here, so drive IT (a manually-added node collides on
	# the "Run" name and the scenes read the autoload). Point it at the requested world and reload.
	var run := get_root().get_node_or_null("Run")
	if run == null:
		run = RunScript.new()
		run.name = "Run"
		get_root().add_child(run)
	run.world_id = world_id
	run.reset()

	# Combat before the 3D dungeon: freeing the dungeon's SubViewport can leave the very next frame
	# uncomposited, so keep the 2D scenes together and shoot the 3D dungeon last.
	await _shoot(world_id, "title")
	await _shoot(world_id, "town")
	# combat.tscn injects this world's first-fight enemy from the fresh run (verdant has no authored
	# encounter, so this is how its combat is demoed).
	await _shoot(world_id, "combat")
	await _shoot(world_id, "dungeon")
	quit(0)

func _shoot(world_id: String, scene: String) -> void:
	var node := (load("res://scenes/%s.tscn" % scene) as PackedScene).instantiate()
	get_root().add_child(node)
	for i in 10:
		await process_frame
	var img := get_root().get_texture().get_image()
	var out := "res://tests/_%s_%s.png" % [world_id, scene]
	img.save_png(out)
	print("[capture_world] %s/%s -> %s" % [world_id, scene, out])
	node.queue_free()
	await process_frame

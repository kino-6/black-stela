extends SceneTree
## Visual evidence for Terminal Line firearm playback. This captures the short overlap where the
## enemy-local arrival trace and impact are visible without an ally-card muzzle overlay.
## Usage: godot --path godot/ --script res://tests/capture_firearm_fx.gd

const Encounter := preload("res://scripts/encounter.gd")

func _initialize() -> void:
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture_firearm_fx] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var enemy: Dictionary = (run.world.get("enemies", []) as Array)[0]
	Encounter.begin(run.state, run.world, "room.tl1f.entrance", String(enemy.get("id", "")))

	var combat := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(combat)
	for i in 12:
		await process_frame
	var group_id := String((combat.call("_combat").get("enemyGroups", []) as Array)[0].get("id", ""))
	combat.call("_spawn_gun_fx", group_id, "pistol")
	# The impact begins after 55ms. Capture at 95ms: the arrival trace and impact coexist.
	await create_timer(0.095).timeout
	var image := get_root().get_texture().get_image()
	image.save_png("res://tests/_firearm_fx_pistol.png")
	print("[capture_firearm_fx] -> res://tests/_firearm_fx_pistol.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)

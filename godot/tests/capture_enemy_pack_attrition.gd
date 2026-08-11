extends SceneTree
## Visual review for D4.  Captures one terminal-line five-body pack before and after it loses three
## members; the remaining front bodies must retain their original size and floor height.
## Usage: godot --path godot/ --script res://tests/capture_enemy_pack_attrition.gd

const Encounter := preload("res://scripts/encounter.gd")

func _initialize() -> void:
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture_enemy_pack_attrition] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var enemy: Dictionary = (run.world.get("enemies", []) as Array)[0]
	Encounter.begin(run.state, run.world, "room.tl1f.entrance", String(enemy.get("id", "")))
	var live_group: Dictionary = (run.state["combat"] as Dictionary)["enemyGroups"][0]
	live_group["count"] = 5
	live_group["initialCount"] = 5
	live_group["hpEach"] = int(live_group.get("maxHpEach", 1))

	var combat := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(combat)
	for i in 12:
		await process_frame
	_shot("res://tests/_enemy_pack_5.png")

	var depleted: Dictionary = run.state.duplicate(true)
	var depleted_group: Dictionary = ((depleted["combat"] as Dictionary)["enemyGroups"] as Array)[0]
	depleted_group["count"] = 2
	depleted_group["hpEach"] = int(depleted_group.get("maxHpEach", 1))
	combat.call("set_state_override", depleted)
	for i in 4:
		await process_frame
	_shot("res://tests/_enemy_pack_2.png")
	quit(0)

func _shot(path: String) -> void:
	var image := get_root().get_texture().get_image()
	image.save_png(path)
	print("[capture_enemy_pack_attrition] -> %s (%dx%d)" % [path, image.get_width(), image.get_height()])

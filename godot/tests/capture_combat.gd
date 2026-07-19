extends SceneTree
## Drive the interactive combat scene through the ported rules and screenshot the result, so the
## rules->UI wiring is verifiable headlessly. Renders two shots:
##   res://tests/_combat_start.png   — the live stage before any command
##   res://tests/_combat_victory.png — after force_resolve() runs one all-out round (the parity route)
## Usage: godot --path godot/ --script res://tests/capture_combat.gd

func _initialize() -> void:
	var root := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(root)
	# Let _ready() load data and build the stage.
	for i in 8:
		await process_frame
	_shot("res://tests/_combat_start.png")

	# Trigger one round through CombatRound.declare_round (the same call verify_parity proves).
	if root.has_method("force_resolve"):
		root.force_resolve()
	else:
		push_error("[capture_combat] combat scene has no force_resolve()")
	for i in 8:
		await process_frame
	_shot("res://tests/_combat_victory.png")
	quit(0)

func _shot(out_path: String) -> void:
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[capture_combat] -> %s (%dx%d)" % [out_path, img.get_width(), img.get_height()])

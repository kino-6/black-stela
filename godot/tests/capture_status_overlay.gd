extends SceneTree
## Visual evidence for IMP-042: open the global party-status glance OVER a real scene (combat) and shoot
## it, so the fit and legibility of the overlay — not just its Control tree — can be reviewed.
## Usage: godot --path godot/ --script res://tests/capture_status_overlay.gd

func _initialize() -> void:
	# Stand a real combat scene up as the backdrop the player would be looking at when they glance.
	var root := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(root)
	for i in 10:
		await process_frame

	# Give the overlay a coherent six-person party to show (names match the combat demo party).
	var run := get_root().get_node_or_null("Run")
	run.state = {
		"phase": "combat",
		"partyGold": 75,
		"party": [
			{"id": "a", "name": "Rook", "level": 3, "row": "front", "hp": 14, "maxHp": 14, "mp": 9, "maxMp": 9},
			{"id": "b", "name": "Vale", "level": 3, "row": "front", "hp": 7, "maxHp": 10, "mp": 3, "maxMp": 4},
			{"id": "c", "name": "Bran", "level": 3, "row": "front", "hp": 13, "maxHp": 13, "mp": 2, "maxMp": 2},
			{"id": "d", "name": "Mira", "level": 2, "row": "back", "hp": 1, "maxHp": 12, "mp": 4, "maxMp": 6, "injury": {"kind": "wound"}},
			{"id": "e", "name": "Sei", "level": 2, "row": "back", "hp": 11, "maxHp": 11, "mp": 8, "maxMp": 8, "status": ["poison"]},
			{"id": "f", "name": "Lio", "level": 2, "row": "back", "hp": 11, "maxHp": 11, "mp": 7, "maxMp": 7},
		],
	}

	var overlay := get_root().get_node_or_null("StatusOverlay")
	overlay.open()
	for i in 6:
		await process_frame

	var img := get_root().get_texture().get_image()
	img.save_png("res://tests/_status_overlay.png")
	print("[capture_status_overlay] -> res://tests/_status_overlay.png (%dx%d)" % [img.get_width(), img.get_height()])
	paused = false
	quit(0)

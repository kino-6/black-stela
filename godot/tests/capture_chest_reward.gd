extends SceneTree
## Visual evidence for the opened-chest reward state. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_chest_reward.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 12:
		await process_frame
	var state: Dictionary = (dungeon.get("_state") as Dictionary).duplicate(true)
	var cell_id := String((dungeon.call("_position") as Dictionary).get("cellId", ""))
	state["chests"] = [{"cellId": cell_id, "phase": "opened", "disarmed": true}]
	dungeon.set("_state", state)
	dungeon.call("_show_chest_result", [
		{"type": "chest_opened"},
		{"type": "inventory_item_gained", "itemId": "item.healing-draught", "itemName": "Healing Draught", "quantity": 1},
	])
	for i in 8:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[capture-chest-reward] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_chest_reward-1280.png")
	print("[capture-chest-reward] -> res://tests/_chest_reward-1280.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)

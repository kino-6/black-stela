extends SceneTree
## Visual evidence for the carried-item decision surface. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_item_use_menu.gd

func _initialize() -> void:
	get_root().size = Vector2i(1920, 1080)
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 12:
		await process_frame
	var state: Dictionary = (dungeon.get("_state") as Dictionary).duplicate(true)
	var party: Array = state.get("party", []).duplicate(true)
	if party.is_empty():
		push_error("[capture-item-use] fixture has no party")
		quit(1)
		return
	var target: Dictionary = (party[0] as Dictionary).duplicate(true)
	target["hp"] = maxi(1, int(target.get("maxHp", 1)) - 7)
	party[0] = target
	state["party"] = party
	state["inventory"] = [{"id": "item.healing-draught", "name": "Healing Draught", "kind": "healing", "quantity": 2, "healAmount": 11}]
	dungeon.set("_state", state)
	dungeon.set("_party_member_id", String(target.get("id", "")))
	dungeon.set("_party_page", "items")
	dungeon.set("_party_item", "item.healing-draught||")
	dungeon.set("_party_item_target_id", String(target.get("id", "")))
	dungeon.call("_toggle_party_menu")
	for i in 8:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[capture-item-use] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_item_use_menu-1920.png")
	print("[capture-item-use] -> res://tests/_item_use_menu-1920.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)

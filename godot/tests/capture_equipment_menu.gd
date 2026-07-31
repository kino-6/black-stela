extends SceneTree
## Visual evidence for the shared equipment decision surface. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_equipment_menu.gd
## It captures the controller-visible comparison state (slot → candidate → explicit confirmation),
## including the exact reinforced instance rather than a bare catalog entry.

const Economy := preload("res://scripts/rules/economy.gd")

func _initialize() -> void:
	get_root().size = Vector2i(1920, 1080)
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 12:
		await process_frame
	var cap: Dictionary = Economy.create_inventory_item(dungeon.get("_world"), "equip.iron-cap", 1)
	cap["plus"] = 1
	var catalog: Variant = Economy.find_equipment(dungeon.get("_world"), "equip.iron-cap")
	var state: Dictionary = (dungeon.get("_state") as Dictionary).duplicate(true)
	var wearer: Dictionary = {}
	for member in state.get("party", []):
		if typeof(catalog) == TYPE_DICTIONARY and Economy.is_equipment_usable_by(catalog, member):
			wearer = member
			break
	if wearer.is_empty():
		push_error("[capture-equipment] fixture has no compatible wearer")
		quit(1)
		return
	state["inventory"] = [cap]
	dungeon.set("_state", state)
	dungeon.set("_party_member_id", String(wearer.get("id", "")))
	dungeon.set("_party_page", "equipment")
	dungeon.set("_party_equipment_slot", "head")
	dungeon.set("_party_equipment_candidate", "")
	dungeon.call("_toggle_party_menu")
	for i in 6:
		await process_frame
	var candidate := _button_with_text(dungeon.get("_party_menu"), "凹み鉄帽 +1")
	if candidate == null:
		push_error("[capture-equipment] candidate was not rendered")
		quit(1)
		return
	candidate.emit_signal("pressed")
	for i in 8:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[capture-equipment] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_equipment_menu-1920.png")
	print("[capture-equipment] -> res://tests/_equipment_menu-1920.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)

func _button_with_text(node: Node, text: String) -> Button:
	if node is Button and (node as Button).text == text:
		return node as Button
	for child in node.get_children():
		var found := _button_with_text(child, text)
		if found != null:
			return found
	return null

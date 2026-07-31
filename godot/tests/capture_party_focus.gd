extends SceneTree
## Visual proof for roster inspection: moving focus onto a member changes the right-hand sheet immediately
## and leaves the controller cursor on that member. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_party_focus.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 12:
		await process_frame
	dungeon.call("_toggle_party_menu")
	for i in 4:
		await process_frame
	var selected: Dictionary = dungeon.call("_party_selected")
	var target: Dictionary = {}
	for candidate in dungeon.get("_state").get("party", []):
		if String(candidate.get("id", "")) != String(selected.get("id", "")):
			target = candidate
			break
	var roster_button := _button_with_text(dungeon.get("_party_menu"), String(target.get("name", "")))
	if roster_button == null:
		push_error("[party-focus] no alternate roster entry")
		quit(1)
		return
	roster_button.grab_focus()
	for i in 8:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[party-focus] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_ux_party-focus.png")
	print("[party-focus] wrote tests/_ux_party-focus.png for %s" % String(target.get("name", "?")))
	quit(0)

func _button_with_text(node: Node, text: String) -> Button:
	if node is Button and (node as Button).text == text:
		return node as Button
	for child in node.get_children():
		var found := _button_with_text(child, text)
		if found != null:
			return found
	return null

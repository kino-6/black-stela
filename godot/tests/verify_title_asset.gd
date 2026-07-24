extends SceneTree
## gate:title-asset — the title background must survive an export. Image.load_from_file read the RAW
## file, which export strips (only the imported texture ships), so a packaged macOS/Web app lost the
## backdrop (IMP-047). This asserts the asset resolves as an IMPORTED Texture2D and that the title scene
## actually renders it through the fixed loader.
## Usage: godot --headless --path godot/ --script res://tests/verify_title_asset.gd

const TITLE_BACKDROP := "res://assets/worlds/default/title/black-stela-title.jpg"

func _initialize() -> void:
	var fail := 0

	if not ResourceLoader.exists(TITLE_BACKDROP):
		push_error("[title-asset] %s is not an imported resource — export would drop it" % TITLE_BACKDROP)
		fail += 1
	elif not (load(TITLE_BACKDROP) is Texture2D):
		push_error("[title-asset] %s does not load as a Texture2D" % TITLE_BACKDROP)
		fail += 1

	# End to end: the title scene must render a non-null backdrop through the fixed loader.
	var title := (load("res://scenes/title.tscn") as PackedScene).instantiate()
	get_root().add_child(title)
	for i in 8:
		await process_frame
	if _find_textured_rect(title) == null:
		push_error("[title-asset] the title scene rendered no background texture")
		fail += 1
	title.free()

	print("[title-asset] %s (%d failures)" % ["PASS" if fail == 0 else "FAIL", fail])
	quit(fail)

func _find_textured_rect(node: Node) -> TextureRect:
	for c in node.get_children():
		if c is TextureRect and (c as TextureRect).texture != null:
			return c
		var r := _find_textured_rect(c)
		if r != null:
			return r
	return null

extends SceneTree
## Regression lock for T10 (playtest 2026-08-02): 「画像を取り込む」 could not select the user's prepared
## image — the image-only filter greyed out files with odd/upper-case extensions. The importer now falls
## back to an all-files filter AND decodes by CONTENT, so a real PNG/JPG/WEBP imports regardless of its
## extension. This proves the content-fallback: a PNG saved with a NON-image extension still becomes a
## data-URL portrait.
## Usage: godot --headless --path godot/ --script res://tests/verify_portrait_import.gd

var _fail := 0

func _initialize() -> void:
	await _run()
	print("[portrait-import] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _run() -> void:
	for i in 4:
		await process_frame
	var img := Image.create(8, 8, false, Image.FORMAT_RGBA8)
	img.fill(Color(1, 0, 0, 1))
	var f := FileAccess.open("user://verify_portrait.dat", FileAccess.WRITE)
	f.store_buffer(img.save_png_to_buffer())
	f.close()

	var guild := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
	get_root().add_child(guild)
	for i in 8:
		await process_frame
	var url := String(guild.call("_image_file_to_data_url", "user://verify_portrait.dat"))
	_check(url.begins_with("data:image/png;base64,") and url.length() > 40, "a PNG with a non-image extension still imports as a data-URL portrait (T10)")

	# A genuinely non-image file is still rejected (empty), never a broken portrait.
	var bad := FileAccess.open("user://verify_portrait_bad.txt", FileAccess.WRITE)
	bad.store_string("not an image")
	bad.close()
	_check(String(guild.call("_image_file_to_data_url", "user://verify_portrait_bad.txt")) == "", "a non-image file imports as empty, not a broken portrait")

	DirAccess.open("user://").remove("verify_portrait.dat")
	DirAccess.open("user://").remove("verify_portrait_bad.txt")
	guild.queue_free()

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[portrait-import] ok: %s" % label)
	else:
		push_error("[portrait-import] FAIL: %s" % label)
		_fail += 1

extends SceneTree
## §9.6 — screenshot the class step, where the promise has to be legible: what this calling can do NOW,
## what it grows into, the exploration it is trusted with, and the thing it cannot answer.
func _initialize() -> void:
	var guild := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
	get_root().add_child(guild)
	for i in 8:
		await process_frame
	guild.set("_step", "class")
	var draft: Dictionary = guild.get("_draft")
	draft["classId"] = "thief"
	guild.set("_draft", draft)
	guild.call("_rebuild")
	for i in 10:
		await process_frame
	var img := get_root().get_texture().get_image()
	img.save_png("res://tests/_guild_class.png")
	print("[capture_guild_class] -> _guild_class.png (%dx%d)" % [img.get_width(), img.get_height()])
	quit(0)

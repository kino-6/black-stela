extends SceneTree
## D7 visual proof. Captures Terminal Line's six-person level-up result at the smallest supported
## desktop viewport. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_result_growth.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var sfx := get_root().get_node_or_null("Sfx")
	if sfx != null and sfx.has_method("set_enabled"):
		sfx.call("set_enabled", false)
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture-result-growth] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var state: Dictionary = run.state.duplicate(true)
	var party: Array = state.get("party", [])
	if party.size() < 6:
		push_error("[capture-result-growth] terminal-line fixture needs six party members")
		quit(1)
		return
	# Names are player-authored in normal play. Use a Japanese party fixture so the screenshot checks the
	# actual locale's line rhythm, rather than leaking the generic test roster's romanized placeholder names.
	var fixture_names := ["ミラ", "セイ", "ルーク", "ヴェイル", "ブラン", "リオ"]
	for index in range(0, 6):
		party[index]["name"] = fixture_names[index]
	state["party"] = party
	run.state = state
	var level_ups := []
	for member in party.slice(0, 6):
		level_ups.append({
			"characterId": String(member.get("id", "")),
			"name": String(member.get("name", "")),
			"level": 3,
		})
	run.last_rewards = {
		"enemyIds": ["enemy.tl2f.cable-hound"],
		"enemyNames": ["Cable Hound"],
		"xp": 18,
		"gold": 21,
		"levelUps": level_ups,
	}
	var result := (load("res://scenes/result.tscn") as PackedScene).instantiate()
	get_root().add_child(result)
	for i in 12:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[capture-result-growth] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_result-growth-1280.png")
	print("[capture-result-growth] -> res://tests/_result-growth-1280.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)

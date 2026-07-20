extends SceneTree
## Drive the guild: register a 3+3-ish party through the ported create() and screenshot the built roster,
## proving the self-made party lands in the shared Run. Usage:
##   godot --path godot/ --script res://tests/capture_guild.gd

const Draft := preload("res://scripts/guild_draft.gd")

func _initialize() -> void:
	var guild := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
	get_root().add_child(guild)
	for i in 8:
		await process_frame

	# The EIGHT consolidated classes (§9.3), by their real method names. This harness previously called
	# `_on_class` / `_on_register` — neither of which exists — with the twelve pre-consolidation ids, so
	# it errored on its first line and nothing noticed.
	for cls in ["warrior", "knight", "swordmaster", "thief", "priest", "chanter"]:
		guild.call("_select_class", cls)
		# `_register` REFUSES while bonus points remain (Draft.remaining > 0) — the same rule the
		# controller gate proves. Spend the pool the way the bonus step does before submitting, or the
		# harness silently builds a party of nobody, which is exactly what it used to do.
		var draft: Dictionary = guild.get("_draft")
		var pool := int(Draft.remaining(draft))
		var spent: Dictionary = draft.get("bonusAptitude", {})
		spent["might"] = int(spent.get("might", 0)) + pool
		draft["bonusAptitude"] = spent
		guild.set("_draft", draft)
		guild.call("_register")
		await process_frame

	_shot("res://tests/_guild_built.png")

	var run := get_root().get_node_or_null("Run")
	var party: Array = run.state.get("party", []) if run else []
	print("[capture_guild] party size=%d" % party.size())

	# Depart to town — proves the self-made party carries into the loop (town purse reads it).
	guild.call("_depart")
	for i in 14:
		await process_frame
	_shot("res://tests/_guild_to_town.png")
	quit(0)

func _shot(out_path: String) -> void:
	var img := get_root().get_texture().get_image()
	img.save_png(out_path)
	print("[capture_guild] -> %s (%dx%d)" % [out_path, img.get_width(), img.get_height()])

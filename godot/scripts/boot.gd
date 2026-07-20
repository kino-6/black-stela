extends Control
## Boot: prove the S1 JSON bridge by loading the default world pack, then advance to Title. In headless
## verification it loads, prints a one-line summary, and quits(0) — no window required, so it doubles
## as a CI smoke check that the exported data parses in Godot.

func _ready() -> void:
	var pack := WorldLoader.load_world("default")
	var world: Dictionary = pack.get("world", {})
	print("[boot] schemaVersion=%s worldId=%s title=%s enemies=%d dungeons=%d" % [
		str(pack.get("schemaVersion", "?")),
		str(pack.get("worldId", "?")),
		str(world.get("title", "?")),
		(world.get("enemies", []) as Array).size(),
		(world.get("dungeons", []) as Array).size(),
	])
	print("[boot] worlds available: %s" % str(WorldLoader.list_worlds()))
	if DisplayServer.get_name() == "headless":
		get_tree().quit(0)
	else:
		# Deferred: changing scene DURING _ready (while the tree is still adding Boot) trips
		# "Parent node is busy adding/removing children". Defer it to the end of the frame.
		# Developer tooling only — AGENTS.md keeps debug UI out of normal play, so this mounts ONLY when
		# asked for (`godot --path godot/ -- --debug-mode`, or F12 once mounted).
		# The build stamp rides every screen (the React build has always shown one).
		get_tree().root.add_child.call_deferred(preload("res://scripts/build_stamp.gd").new())
		var DebugOverlay := preload("res://scripts/debug_overlay.gd")
		if DebugOverlay.enabled():
			get_tree().root.add_child.call_deferred(DebugOverlay.new())
		SceneManager.goto.call_deferred("res://scenes/title.tscn")

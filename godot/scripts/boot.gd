extends Control
## Boot: prove the S1 JSON bridge by loading the default world pack, then advance to Title. In headless
## verification it loads, prints a one-line summary, and quits(0) — no window required, so it doubles
## as a CI smoke check that the exported data parses in Godot.

func _ready() -> void:
	_install_ui_font()
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
		# `-- --fixture <name>` boots straight into a named QA state, so a reviewer reaches the held-input /
		# return / loot routes without mouse-picking the debug panel (Codex could not select it). #29.
		var fixture := _fixture_arg()
		if fixture != "":
			var scene: String = preload("res://scripts/debug_fixtures.gd").load_into(get_node_or_null("/root/Run"), fixture)
			if scene != "":
				SceneManager.goto.call_deferred(scene)
				return
		SceneManager.goto.call_deferred("res://scenes/title.tscn")

## The value after `--fixture` in either the engine or user argument list (see debug_fixtures.gd).
func _fixture_arg() -> String:
	var args := OS.get_cmdline_args() + OS.get_cmdline_user_args()
	var i := args.find("--fixture")
	return String(args[i + 1]) if i >= 0 and i + 1 < args.size() else ""

# The Web export has NO OS font fallback, so Japanese renders as tofu unless a JA-capable font is
# EMBEDDED. Native only works because Godot falls back to a system font (Hiragino) that the browser
# cannot reach. Drop an OFL Japanese font at res://assets/fonts/ui.ttf (see the README there) and it
# becomes the whole game's font — Web included. Absent → current behaviour (fine on native, tofu on Web).
func _install_ui_font() -> void:
	const UI_FONT := "res://assets/fonts/ui.ttf"
	if not ResourceLoader.exists(UI_FONT):
		return
	var base: Variant = load(UI_FONT)
	if base is FontFile:
		# Noto Sans JP ships as a VARIABLE font whose default instance is Thin; pin Regular so UI text is
		# readable, not hairline. (A static font ignores the wght axis harmlessly.)
		var fv := FontVariation.new()
		fv.base_font = base
		fv.variation_opentype = {"wght": 400}
		ThemeDB.fallback_font = fv
	elif base is Font:
		ThemeDB.fallback_font = base

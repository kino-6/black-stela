extends SceneTree
## gate:prefs — the play-affecting settings must persist and expose #14's spotlight preference. The combat
## screen reads ConfigPanel.spotlight_actor() to decide whether to feature the acting character during
## command select; this locks that the toggle exists, defaults ON, survives a save/load round-trip, and is
## rendered (by its localized label) in the settings body a controller can reach.
## Run: godot --headless --path godot/ --script res://tests/verify_config_prefs.gd

const ConfigPanel := preload("res://scripts/config_panel.gd")
const I18n := preload("res://scripts/i18n.gd")

var _fail := 0

func _initialize() -> void:
	# Default ON — a fresh player sees the acting character featured until they opt out.
	var settings := ConfigPanel.load_settings()
	_check(bool(settings.get("spotlightActor", false)) == true, "spotlightActor defaults ON")
	_check(ConfigPanel.spotlight_actor() == true, "the spotlight_actor() accessor reports the default")

	# Round-trip: turning it off persists and reloads OFF (the whole point of a preference).
	settings["spotlightActor"] = false
	ConfigPanel.save_settings(settings)
	_check(ConfigPanel.spotlight_actor() == false, "turning the spotlight off persists and reloads")
	# Restore the default so a dev machine is not left with the toggle stuck off.
	settings["spotlightActor"] = true
	ConfigPanel.save_settings(settings)

	# The toggle is actually on the settings screen (localized label present), reachable by controller.
	var built: Dictionary = ConfigPanel.build(ConfigPanel.load_settings(), func(): pass, true)
	var text := _all_text(built["control"])
	_check(text.contains(I18n.t("config.spotlightActor")), "the spotlight toggle is rendered on the settings screen")
	_check(built["first"] is Button, "the settings screen hands the cursor a focusable control")

	print("[config-prefs] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _all_text(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	for child in node.get_children():
		out += _all_text(child)
	return out

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[config-prefs] ok: %s" % label)
	else:
		push_error("[config-prefs] FAIL: %s" % label)
		print("[config-prefs] FAIL: %s" % label)
		_fail += 1

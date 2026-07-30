extends SceneTree
## A battle handoff is a deliberate dark fade, never the brief empty interval a raw scene cut exposes.
## It also locks the accessibility rule: transition screens may dim to black, but may not flash bright.

var _fail := 0

func _initialize() -> void:
	var manager := preload("res://scripts/scene_manager.gd").new()
	get_root().add_child(manager)
	manager.call_deferred("fade_to_dark", "res://scenes/combat.tscn")
	for i in 2:
		await process_frame
	var veil := manager.get_node_or_null("DarkTransition/Veil")
	_check(veil is ColorRect, "combat handoff mounts a transition veil")
	if veil is ColorRect:
		var color := (veil as ColorRect).color
		_check(color.r <= 0.02 and color.g <= 0.02 and color.b <= 0.02, "transition only fades toward black — never a bright flash")
	await create_timer(0.65).timeout
	_check(current_scene != null and current_scene.scene_file_path.ends_with("combat.tscn"), "dark transition hands the player to combat")
	print("[scene-transition] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[scene-transition] ok: %s" % label)
	else:
		push_error("[scene-transition] FAIL: %s" % label)
		_fail += 1

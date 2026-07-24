extends SceneTree
## gate:debug-start — proves the documented debug launch actually arms the developer panel. Run WITH the
## user flag: godot --headless --path godot/ --script res://tests/verify_debug_start.gd -- --debug-mode
## The flag lands in get_cmdline_user_args(); DebugOverlay.enabled() must see it (IMP-046: it read only
## get_cmdline_args(), so `-- --debug-mode` was ignored and the panel — and F12 — never mounted).

const DebugOverlay := preload("res://scripts/debug_overlay.gd")

func _initialize() -> void:
	var fail := 0
	var has_flag := OS.get_cmdline_user_args().has("--debug-mode")
	var on := DebugOverlay.enabled()

	if not has_flag:
		push_error("[debug-start] run this gate with `-- --debug-mode`; the user flag was not present")
		fail += 1
	elif not on:
		push_error("[debug-start] `-- --debug-mode` was passed but DebugOverlay.enabled() is false — the panel would not mount (IMP-046)")
		fail += 1

	# The panel, once mounted, builds a Control tree a developer can actually use.
	var overlay := DebugOverlay.new()
	get_root().add_child(overlay)
	await process_frame
	var built := _has_control(overlay)
	overlay.free()
	if not built:
		push_error("[debug-start] the mounted debug overlay rendered no Control")
		fail += 1

	print("[debug-start] %s (user flag=%s, enabled=%s)" % ["PASS" if fail == 0 else "FAIL", has_flag, on])
	quit(fail)

func _has_control(node: Node) -> bool:
	for c in node.get_children():
		if c is Control or _has_control(c):
			return true
	return false

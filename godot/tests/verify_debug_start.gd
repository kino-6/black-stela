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

	# Give the run a small state so the in-mode diagnostics have a real scene/phase/hash to report (#46).
	var run := get_root().get_node_or_null("Run")
	if run != null:
		run.state = {"phase": "dungeon", "map": {"visitedRooms": ["room.b1f.001"]}, "party": []}

	# The panel, once mounted, builds a Control tree a developer can actually use.
	var overlay := DebugOverlay.new()
	get_root().add_child(overlay)
	await process_frame
	var built := _has_control(overlay)
	# In-mode diagnostics: the panel must report the scene, the state hash, and the focused control, so a
	# script error can be reproduced from what it shows (IMP-046).
	var text := _all_text(overlay)
	var has_diag := text.contains("hash") and text.contains("scene") and text.contains("focus")
	overlay.free()
	if not built:
		push_error("[debug-start] the mounted debug overlay rendered no Control")
		fail += 1
	if run != null and not has_diag:
		push_error("[debug-start] the debug overlay does not show scene/hash/focus diagnostics (IMP-046)")
		fail += 1

	print("[debug-start] %s (user flag=%s, enabled=%s, diagnostics=%s)" % ["PASS" if fail == 0 else "FAIL", has_flag, on, has_diag])
	quit(fail)

func _has_control(node: Node) -> bool:
	for c in node.get_children():
		if c is Control or _has_control(c):
			return true
	return false

func _all_text(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	for c in node.get_children():
		out += _all_text(c)
	return out

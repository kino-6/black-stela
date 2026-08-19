extends Node
## `--background`: the automated windowed harnesses (captures, the visibility gates) must NOT take the
## screen or the keyboard focus away from the human at the machine (user 2026-08-20: 「自動プレイのたびに
## PCのフォーカスと画面を奪うのはやめて」). A capture still needs a REAL window — headless renders nothing,
## and this project's rule is that pixels are the evidence — so instead of hiding the window we make it
## polite: never focusable, never maximized, parked at the edge of the screen.
##
## Normal play (`./run.sh play`) passes no such flag and is untouched: that window SHOULD come to the front.

var active := false
var _frames_left := 0

func _ready() -> void:
	var args := OS.get_cmdline_args() + OS.get_cmdline_user_args()
	active = args.has("--background") and DisplayServer.get_name() != "headless"
	if not active:
		set_process(false)
		return
	print("[harness] background mode — the window stays unfocused and off to the edge")
	# Deferred: touching the window mode while the autoloads are still being added to the tree fails
	# ("parent node is busy setting up children").
	_apply.call_deferred()
	# A harness sets its own window size a few frames in (get_root().size), which can re-centre or
	# re-maximize the window. Re-assert for a short while rather than trusting one call at boot.
	_frames_left = 30

func _process(_delta: float) -> void:
	if _frames_left <= 0:
		set_process(false)
		return
	_frames_left -= 1
	_apply()

func _apply() -> void:
	DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_NO_FOCUS, true)
	if DisplayServer.window_get_mode() != DisplayServer.WINDOW_MODE_WINDOWED:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
	# Park it past the bottom-right corner. The OS may clamp it back on-screen; what matters is that it
	# never covers the work in front of the user and never steals the keystrokes meant for their editor.
	var screen := DisplayServer.screen_get_size()
	var want := Vector2i(screen.x - 24, screen.y - 24)
	if DisplayServer.window_get_position() != want:
		DisplayServer.window_set_position(want)

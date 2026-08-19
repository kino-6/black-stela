extends Node
## Local, explicit playtest telemetry. This is intentionally not player UI, not an analytics service, and
## not a save extension: it writes small local JSONL records — one per expedition, each carrying the step
## trail of the commands that were actually played.
##
## Recording is AUTOMATIC in a developer build (user 2026-08-20: 「開発中は貴重な人間のプレイ」— a human
## play session is the scarcest evidence this project has, and an opt-in flag meant it was routinely lost).
## It stays off in an exported release build, and off for headless / `--script` tool runs, so the gates and
## capture harnesses never bury the human sessions under machine noise. `--no-playtest-record` opts out;
## `--playtest-record` forces it on anywhere; `--playtest-log <path>` redirects the file (run.sh points it
## at the repo's .tmp/ so a session is readable without digging through user://).

const DEFAULT_PATH := "user://black-stela-playtest-records.jsonl"
const MAX_STEPS := 600   # bound the file: a very long session keeps its first 600 commands, then counts

var enabled := false
var output_path := DEFAULT_PATH
var _active := false
var _started_msec := 0
var _world_id := ""
var _families: Array[String] = []
var _last_visible_state := {}
var _last_phase := ""
var _result := "unfinished"
var _return_reason := ""
var _steps: Array = []
var _step_count := 0

func _ready() -> void:
	var args := OS.get_cmdline_args() + OS.get_cmdline_user_args()
	var custom := _arg_value(args, "--playtest-log")
	if custom != "":
		output_path = custom
	# A tool run is a gate, a capture harness, or any headless invocation — never a human playing.
	var tool_run := args.has("--script") or DisplayServer.get_name() == "headless"
	if args.has("--no-playtest-record"):
		enabled = false
	else:
		enabled = args.has("--playtest-record") or (OS.is_debug_build() and not tool_run)
	if enabled:
		_ensure_dir(output_path)
		print("[playtest-record] recording this session → %s" % _display_path(output_path))

## `--playtest-log <path>` and `--playtest-log=<path>` both work; "" when the switch is absent.
func _arg_value(args: Array, switch: String) -> String:
	for i in range(args.size()):
		var arg := String(args[i])
		if arg == switch and i + 1 < args.size():
			return String(args[i + 1])
		if arg.begins_with(switch + "="):
			return arg.substr(switch.length() + 1)
	return ""

func _ensure_dir(path: String) -> void:
	if path.begins_with("user://") or path.begins_with("res://"):
		return
	var dir := path.get_base_dir()
	if dir != "" and not DirAccess.dir_exists_absolute(dir):
		DirAccess.make_dir_recursive_absolute(dir)

func _display_path(path: String) -> String:
	return ProjectSettings.globalize_path(path) if path.begins_with("user://") else path

## A session that ends by closing the window is still evidence — flush the expedition in progress rather
## than dropping the only human play of the day because it did not end in town.
func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_EXIT_TREE:
		if _active and _step_count > 0:
			_result = "quit" if _result == "unfinished" else _result
			_write_summary()

## Called after a gameplay rule resolution. It observes a narrow summary and never changes GameState.
func observe(command: Dictionary, state: Dictionary, events: Array = [], world_id: String = "") -> void:
	if not enabled:
		return
	if not _active:
		_begin(world_id)
	var family := _family(String(command.get("type", "")))
	if family != "" and not _families.has(family):
		_families.append(family)
	for event in events:
		_match_result(String((event as Dictionary).get("type", "")))
	var phase := String(state.get("phase", ""))
	var kind := String(command.get("type", ""))
	if kind == "retreat":
		_result = "retreated"
	elif kind == "return_to_town":
		_result = "returned"
		_return_reason = "return_marker"
	elif kind == "use_stairs" and phase == "town":
		_result = "returned"
		_return_reason = "stairs"
	var visible := _visible_state(state)
	# The step trail is what makes this a play LOG and not just a tally: what was actually pressed, where,
	# and when. It is the record a later review reads to see how the session really went.
	if kind != "":
		_step_count += 1
		if _steps.size() < MAX_STEPS:
			_steps.append({
				"t": snappedf(float(Time.get_ticks_msec() - _started_msec) / 1000.0, 0.1),
				"cmd": kind,
				"phase": phase,
				"cell": String(visible.get("cellId", "")),
			})
	# Returning to town intentionally clears position. Preserve the last dungeon floor/cell/room rather
	# than replacing the requested location evidence with three empty strings; phase still tells the review
	# that the currently visible screen is town.
	if String(visible.get("cellId", "")) == "" and not _last_visible_state.is_empty():
		visible["floorId"] = _last_visible_state.get("floorId", "")
		visible["cellId"] = _last_visible_state.get("cellId", "")
		visible["roomId"] = _last_visible_state.get("roomId", "")
	_last_visible_state = visible
	# A finished expedition is a return to town from a played dungeon/combat state. A command can also
	# explicitly end it (return marker / stair) before the scene has rebuilt, so use both facts.
	if ((_last_phase == "dungeon" or _last_phase == "combat") and phase == "town") or (_result == "returned" and phase == "town"):
		_write_summary()
	_last_phase = phase

func _begin(world_id: String) -> void:
	_active = true
	_started_msec = Time.get_ticks_msec()
	_world_id = world_id
	_families = []
	_last_visible_state = {}
	_last_phase = ""
	_result = "unfinished"
	_return_reason = ""
	_steps = []
	_step_count = 0

func _match_result(event_type: String) -> void:
	if event_type in ["combat_won", "enemy_defeated", "victory"]:
		_result = "victory"
	elif event_type in ["party_defeated", "defeat"]:
		_result = "defeated"

func _family(kind: String) -> String:
	if kind in ["move_forward", "turn_left", "turn_right", "search", "listen", "disarm_trap", "use_stairs"]:
		return "exploration"
	if kind in ["attack", "cast", "defend", "retreat", "combat_round"]:
		return "combat"
	if kind in ["return_to_town"]:
		return "return"
	if kind in ["use_item", "equip", "unequip"]:
		return "inventory"
	return "town" if kind != "" else ""

func _visible_state(state: Dictionary) -> Dictionary:
	# Town states carry `position: null`, not an empty dictionary. Casting that to Dictionary threw an
	# invalid-cast error mid-function and the record silently lost its `phase` on every real return.
	var raw: Variant = state.get("position", {})
	var position: Dictionary = raw if typeof(raw) == TYPE_DICTIONARY else {}
	return {
		"phase": String(state.get("phase", "")),
		"floorId": String(position.get("floorId", "")),
		"cellId": String(position.get("cellId", "")),
		"roomId": String(position.get("roomId", "")),
	}

func _write_summary() -> void:
	if not _active:
		return
	var record := {
		"elapsedSeconds": snappedf(float(Time.get_ticks_msec() - _started_msec) / 1000.0, 0.1),
		"worldId": _world_id,
		"result": _result,
		"returnReason": _return_reason,
		"commandFamilies": _families,
		"lastVisibleState": _last_visible_state,
		"stepCount": _step_count,
		"steps": _steps,
	}
	var file := FileAccess.open(output_path, FileAccess.READ_WRITE) if FileAccess.file_exists(output_path) else FileAccess.open(output_path, FileAccess.WRITE)
	if file == null:
		push_error("[playtest-record] could not write local record")
		return
	file.seek_end()
	file.store_string(JSON.stringify(record) + "\n")
	file.close()
	print("[playtest-record] wrote one expedition (%s, %d commands) → %s" % [_result, _step_count, _display_path(output_path)])
	_active = false

## Test seam: no CLI switch or player-facing setting is needed to validate the schema.
func enable_for_test(path: String) -> void:
	enabled = true
	output_path = path
	_active = false

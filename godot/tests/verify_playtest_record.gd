extends SceneTree
## Schema gate for IMP-071 — the local PlayLog. No normal screen ever exposes telemetry controls, and the
## record stays a bounded local summary: an expedition, its step trail, and where it ended.

const Record := preload("res://scripts/playtest_record.gd")
const TEST_PATH := "user://black-stela-playtest-record-schema-test.jsonl"
const QUIT_PATH := "user://black-stela-playtest-record-quit-test.jsonl"
var failures := 0

func _initialize() -> void:
	var record := Record.new()
	record.enable_for_test(TEST_PATH)
	var dungeon_state := {
		"phase": "dungeon",
		"position": {"floorId": "dungeon.b1f", "cellId": "cell.b1f.002", "roomId": "room.b1f.002"},
	}
	record.observe({"type": "move_forward"}, dungeon_state, [], "default")
	# Real town states carry `position: null` (an expedition ends by clearing it), NOT an empty dictionary.
	record.observe({"type": "return_to_town"}, {"phase": "town", "position": null}, [], "default")
	var lines := FileAccess.get_file_as_string(TEST_PATH).strip_edges().split("\n", false)
	_check(lines.size() == 1, "one return produces one local JSONL record")
	var parsed: Variant = JSON.parse_string(String(lines[0])) if not lines.is_empty() else null
	var entry: Dictionary = parsed as Dictionary if typeof(parsed) == TYPE_DICTIONARY else {}
	_check(entry.has("elapsedSeconds") and typeof(entry.get("elapsedSeconds")) == TYPE_FLOAT, "record stores elapsed seconds")
	_check(String(entry.get("worldId", "")) == "default", "record stores world")
	_check(String(entry.get("result", "")) == "returned" and String(entry.get("returnReason", "")) == "return_marker", "record stores result and return reason")
	_check((entry.get("commandFamilies", []) as Array).has("exploration") and (entry.get("commandFamilies", []) as Array).has("return"), "record stores command families")
	var visible: Dictionary = entry.get("lastVisibleState", {}) as Dictionary
	_check(visible.keys().all(func(key): return String(key) in ["phase", "floorId", "cellId", "roomId"]), "record keeps only the last visible state summary")
	_check(String(visible.get("phase", "")) == "town" and String(visible.get("cellId", "")) == "cell.b1f.002", "return preserves the last dungeon cell beside the town outcome")
	# The play LOG half: what was actually pressed, in order, with where and when (user 2026-08-20 —
	# a human session is scarce evidence, so a record that only tallies families throws most of it away).
	var steps: Array = entry.get("steps", []) as Array
	_check(int(entry.get("stepCount", 0)) == 2 and steps.size() == 2, "record stores the step trail of the commands played")
	var first: Dictionary = steps[0] as Dictionary if not steps.is_empty() else {}
	_check(first.keys().all(func(key): return String(key) in ["t", "cmd", "phase", "cell"]), "a step stays a bounded summary (t/cmd/phase/cell)")
	_check(String(first.get("cmd", "")) == "move_forward" and String(first.get("cell", "")) == "cell.b1f.002", "a step keeps the command and where it happened")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(TEST_PATH))
	record.free()

	# Closing the window mid-dungeon must still leave evidence: the commonest way a dev session ends is
	# quitting, and the old build wrote nothing at all unless the party walked back to town.
	var quit_record := Record.new()
	quit_record.enable_for_test(QUIT_PATH)
	quit_record.observe({"type": "move_forward"}, dungeon_state, [], "default")
	quit_record.notification(Node.NOTIFICATION_WM_CLOSE_REQUEST)
	var quit_lines := FileAccess.get_file_as_string(QUIT_PATH).strip_edges().split("\n", false)
	_check(quit_lines.size() == 1, "quitting mid-expedition flushes exactly one record")
	var quit_parsed: Variant = JSON.parse_string(String(quit_lines[0])) if not quit_lines.is_empty() else null
	var quit_entry: Dictionary = quit_parsed as Dictionary if typeof(quit_parsed) == TYPE_DICTIONARY else {}
	_check(String(quit_entry.get("result", "")) == "quit", "an interrupted session is recorded as quit, not lost")
	_check(int(quit_entry.get("stepCount", 0)) == 1, "the interrupted session keeps its step trail")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(QUIT_PATH))
	quit_record.free()
	if failures == 0:
		print("[playtest-record] PASS — the PlayLog is local, bounded, and survives a quit")
		quit(0)
	else:
		print("[playtest-record] FAIL — %d problem(s)" % failures)
		quit(1)

func _check(ok: bool, message: String) -> void:
	if ok:
		print("[playtest-record] OK: %s" % message)
	else:
		failures += 1
		push_error("[playtest-record] FAIL: %s" % message)

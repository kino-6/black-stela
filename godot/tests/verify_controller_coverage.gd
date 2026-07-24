extends SceneTree
## G2 — the controller-coverage backstop (2026-07-25 playtest: "forbid screens that cannot be operated
## by keyboard/controller, and set up a Gate"). Every scene the build ships must be classified in
## godot/gates/controller-registry.json as:
##   covered — a controller verify drives it (the named verify must exist),
##   exempt  — with a reason (a transient loader, or a panel already covered elsewhere),
##   todo    — reachable + interactive but not verified yet: VISIBLE, tracked debt.
## A scene on disk that is not classified FAILS, so a screen a controller cannot operate can never ship
## unnoticed. Run: godot --headless --path godot/ --script res://tests/verify_controller_coverage.gd

const REGISTRY := "res://gates/controller-registry.json"
const SCENES_DIR := "res://scenes/"

var _fail := 0

func _initialize() -> void:
	var registry: Dictionary = _read(REGISTRY).get("scenes", {})
	var on_disk := _scene_files()

	# 1) Every scene on disk must be classified — this is the "no un-operable screen ships" teeth.
	for scene in on_disk:
		if not registry.has(scene):
			_fail_msg("scene '%s' ships but is UNCLASSIFIED in controller-registry.json — classify it as covered / exempt / todo" % scene)

	# 2) No stale entries; 'covered' must name a verify that exists; 'exempt' needs a reason.
	var todo := []
	for scene in registry:
		if not on_disk.has(scene):
			_fail_msg("controller-registry lists '%s' but no such scene exists" % scene)
			continue
		var entry: Dictionary = registry[scene]
		var status := String(entry.get("status", ""))
		match status:
			"covered":
				var verify := String(entry.get("verify", ""))
				if verify == "" or not FileAccess.file_exists("res://tests/%s" % verify):
					_fail_msg("scene '%s' is marked covered by '%s', which does not exist" % [scene, verify])
			"exempt":
				if String(entry.get("reason", "")) == "":
					_fail_msg("scene '%s' is exempt without a reason" % scene)
			"todo":
				todo.append(scene)
			_:
				_fail_msg("scene '%s' has status '%s' (want covered/exempt/todo)" % [scene, status])

	# 3) The debt is printed, never silently shipped.
	if not todo.is_empty():
		print("[controller-coverage] TODO — %d screen(s) still need a controller verify: %s" % [todo.size(), ", ".join(PackedStringArray(todo))])

	print("[controller-coverage] %s (%d scenes on disk, %d todo, %d failures)" % [
		"PASS" if _fail == 0 else "FAIL", on_disk.size(), todo.size(), _fail])
	quit(_fail)

func _scene_files() -> Array:
	var out := []
	var dir := DirAccess.open(SCENES_DIR)
	if dir == null:
		_fail_msg("cannot open %s" % SCENES_DIR)
		return out
	for f in dir.get_files():
		if f.ends_with(".tscn"):
			out.append(f)
	return out

func _fail_msg(msg: String) -> void:
	push_error("[controller-coverage] FAIL: %s" % msg)
	_fail += 1

func _read(path: String) -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

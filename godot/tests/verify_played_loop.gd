extends SceneTree
## gate:play (foundation) — locks the core-loop flow decisions the 2026-07-25 playtest found broken,
## asserted against the REAL Godot scripts (not the React reference the truth-gate runs). See
## docs/gates/played-build-gate.md. This first slice covers the two entangled core-loop bugs:
##
##   #11 auto-return after combat  → DungeonEntry.continue_scene(phase) + a victory-state resume
##   #12 map resets on return      → DungeonEntry.plan keeps the explored automap on re-entry
##
## It exercises the pure decider AND the dungeon scene script that delegates to it, so reverting either
## goes red. Run: godot --headless --path godot/ --script res://tests/verify_played_loop.gd

const DungeonEntry := preload("res://scripts/rules/dungeon_entry.gd")
const Dungeon := preload("res://scripts/dungeon.gd")

var _fail := 0

func _initialize() -> void:
	var world: Dictionary = _read("res://data/worlds/default.json").get("world", {})
	var landing := String(DungeonEntry.cell_for_room(world, world.get("startRoom", "")).get("id", ""))
	_check(landing != "", "world exposes a landing cell for its startRoom")

	_test_fresh_seeds_at_landing(world, landing)
	_test_victory_resume_keeps_position_and_map(world)
	_test_town_redescend_keeps_automap(world, landing)
	_test_continue_routes_by_phase()
	_test_dungeon_script_delegates(world)
	_test_null_position_is_safe(world)

	print("[played-loop] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

# A brand-new expedition (no prior position/map) lands at the stair and seeds a one-cell automap.
func _test_fresh_seeds_at_landing(world: Dictionary, landing: String) -> void:
	var plan: Dictionary = DungeonEntry.plan({}, world)
	_check(String((plan["position"] as Dictionary).get("cellId", "")) == landing, "fresh: placed at landing")
	_check((plan["map"] as Dictionary).get("visitedCells", []) == [landing], "fresh: automap seeded with the landing only")

# #11 — after a victory, position is left on the fight cell; resuming must NOT move the party or wipe the map.
func _test_victory_resume_keeps_position_and_map(world: Dictionary) -> void:
	var explored := ["cell.b1f.001", "cell.b1f.002", "cell.b1f.003"]
	var state := {
		"position": {"cellId": "cell.b1f.003", "roomId": "room.b1f.003", "facing": "north"},
		"map": {"floorId": world.get("startDungeon", ""), "visitedCells": explored.duplicate(), "visitedRooms": ["room.b1f.003"], "knownExits": {}},
	}
	var plan: Dictionary = DungeonEntry.plan(state, world)
	_check(String((plan["position"] as Dictionary).get("cellId", "")) == "cell.b1f.003", "victory: party stays on the fight cell (no teleport to the entrance)")
	_check((plan["map"] as Dictionary).get("visitedCells", []) == explored, "victory: the automap is untouched on resume")

# #12 — returning to town nulls the position but the rules keep visitedCells; re-descending must land at
# the stair yet PRESERVE the explored automap instead of wiping it to the single landing cell.
func _test_town_redescend_keeps_automap(world: Dictionary, landing: String) -> void:
	var explored := ["cell.b1f.001", "cell.b1f.002", "cell.b1f.explored"]
	var state := {
		"position": null,  # rulesEngine.returnToTown leaves position null but keeps the map
		"map": {"floorId": world.get("startDungeon", ""), "visitedCells": explored.duplicate(), "visitedRooms": ["room.b1f.002"], "knownExits": {}},
	}
	var plan: Dictionary = DungeonEntry.plan(state, world)
	_check(String((plan["position"] as Dictionary).get("cellId", "")) == landing, "re-descend: placed back at the stair landing")
	var visited: Array = (plan["map"] as Dictionary).get("visitedCells", [])
	_check(visited.has("cell.b1f.explored"), "re-descend: the explored automap is KEPT, not reset (#12)")
	_check(visited.has(landing), "re-descend: the landing is marked too")

# #11 — the post-combat destination follows the phase: victory=dungeon (resume), otherwise town.
func _test_continue_routes_by_phase() -> void:
	_check(DungeonEntry.continue_scene("dungeon").ends_with("dungeon.tscn"), "victory (phase=dungeon) resumes exploration, not town (#11)")
	_check(DungeonEntry.continue_scene("town").ends_with("town.tscn"), "wipe/return (phase=town) goes to town")

# The dungeon SCENE SCRIPT must actually delegate to the decider — instantiate it and drive _enter_at_landing.
func _test_dungeon_script_delegates(world: Dictionary) -> void:
	var d: Object = Dungeon.new()
	d.set("_world", world)
	d.set("_state", {
		"position": null,
		"map": {"floorId": world.get("startDungeon", ""), "visitedCells": ["cell.b1f.kept"], "visitedRooms": [], "knownExits": {}},
	})
	d.call("_enter_at_landing")
	var st: Dictionary = d.get("_state")
	_check(String(st.get("phase", "")) == "dungeon", "dungeon: entry sets phase=dungeon")
	_check((st.get("map", {}) as Dictionary).get("visitedCells", []).has("cell.b1f.kept"), "dungeon: _enter_at_landing keeps the automap via DungeonEntry (#12 lock)")
	if d is Node:
		(d as Node).free()

# IMP-044 — a return-to-town command sets position to NULL (not missing). Dictionary.get returns its
# default only for a MISSING key, so the dungeon's position readers must go through _position(), not
# `_state.get("position", {}).get(...)` which calls .get() on null and crashes _current_cell.
func _test_null_position_is_safe(world: Dictionary) -> void:
	var d: Object = Dungeon.new()
	d.set("_world", world)
	d.set("_state", {"phase": "town", "position": null})
	_check((d.call("_position") as Dictionary).is_empty(), "null position: _position() yields {} (IMP-044 guard)")
	_check((d.call("_current_cell") as Dictionary).is_empty(), "null position: _current_cell() is safe with a nulled position (IMP-044)")
	d.set("_state", {"phase": "dungeon", "position": {"cellId": "cell.b1f.001", "roomId": "room.b1f.001", "facing": "south"}})
	_check(String((d.call("_position") as Dictionary).get("cellId", "")) == "cell.b1f.001", "valid position: _position() returns the live cell")
	if d is Node:
		(d as Node).free()

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[played-loop] ok: %s" % label)
	else:
		push_error("[played-loop] FAIL: %s" % label)
		_fail += 1

func _read(path: String) -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

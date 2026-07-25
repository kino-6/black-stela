extends SceneTree
## gate:chambers (#19) — the SHIPPED Verdant pack must contain real open halls, and the engine's own
## chamber rule must fire on them. The played build reads godot/data/worlds/verdant.json, not the React
## source, so this asserts against the pack the game actually loads: every Verdant floor has at least one
## 2×2 open block (a hall a 1-wide corridor can never form), and at least one cell the chamber renderer
## (dungeon.gd _is_chamber: 3+ open/door/one_way edges) lifts into a hall. Mirrors verdantChambers.test.ts
## on the Godot side of the seam.
## Run: godot --headless --path godot/ --script res://tests/verify_verdant_chambers.gd

const PASSAGE_KINDS := ["open", "door", "one_way"]

var _fail := 0

func _initialize() -> void:
	var raw := FileAccess.get_file_as_string("res://data/worlds/verdant.json")
	var world: Variant = JSON.parse_string(raw)
	if typeof(world) != TYPE_DICTIONARY:
		_report(false, "verdant.json parses")
		_finish()
		return
	# The pack wraps the scenario under `world` (schemaVersion / worldId / world), as the Godot loader reads it.
	var scenario: Dictionary = (world as Dictionary).get("world", world)
	var dungeons: Array = scenario.get("dungeons", [])
	_report(dungeons.size() >= 8, "verdant ships %d floors (>= 8)" % dungeons.size())

	for dungeon in dungeons:
		var floor_id := String((dungeon as Dictionary).get("id", "?"))
		var cells: Array = ((dungeon as Dictionary).get("grid", {}) as Dictionary).get("cells", [])
		var present := {}
		for cell in cells:
			present["%d,%d" % [int(cell.get("x", 0)), int(cell.get("y", 0))]] = true

		# A genuine hall: four mutually-adjacent walkable cells in a square.
		var halls := 0
		for cell in cells:
			var x := int(cell.get("x", 0))
			var y := int(cell.get("y", 0))
			if present.has("%d,%d" % [x + 1, y]) and present.has("%d,%d" % [x, y + 1]) and present.has("%d,%d" % [x + 1, y + 1]):
				halls += 1

		# Cells the engine will render as a chamber (dungeon.gd _is_chamber): 3+ real passages.
		var chamber_cells := 0
		for cell in cells:
			var openings := 0
			var edges: Dictionary = cell.get("edges", {})
			for dir in ["north", "south", "east", "west"]:
				var edge: Variant = edges.get(dir, null)
				if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) in PASSAGE_KINDS:
					openings += 1
			if openings >= 3:
				chamber_cells += 1

		_report(halls >= 1, "%s has an open hall (%d 2×2 block(s))" % [floor_id, halls])
		_report(chamber_cells >= 1, "%s renders %d chamber cell(s)" % [floor_id, chamber_cells])

		# The real #19 fix: a room the scenario NAMES as a chamber (a fight room) must sit in an open hall,
		# not on a bare corridor cell — checked against the SHIPPED pack the engine loads.
		var cell_for := {}
		for cell in cells:
			var rid := String(cell.get("roomId", ""))
			if not cell_for.has(rid):
				cell_for[rid] = cell
		var fight_rooms := 0
		var seated := 0
		for room in (dungeon as Dictionary).get("rooms", []):
			var r: Dictionary = room
			if not (r.has("encounterTable") or r.has("encounter")):
				continue
			fight_rooms += 1
			var cell: Variant = cell_for.get(String(r.get("id", "")), null)
			if typeof(cell) == TYPE_DICTIONARY and _in_hall(int(cell.get("x", 0)), int(cell.get("y", 0)), present):
				seated += 1
		_report(fight_rooms > 0 and seated == fight_rooms, "%s seats every fight room in a hall (%d/%d)" % [floor_id, seated, fight_rooms])

	_finish()

# (ax,ay) is a corner of some 2×2 all-walkable block.
func _in_hall(ax: int, ay: int, present: Dictionary) -> bool:
	for ox in [-1, 0]:
		for oy in [-1, 0]:
			var x: int = ax + int(ox)
			var y: int = ay + int(oy)
			if present.has("%d,%d" % [x, y]) and present.has("%d,%d" % [x + 1, y]) and present.has("%d,%d" % [x, y + 1]) and present.has("%d,%d" % [x + 1, y + 1]):
				return true
	return false

func _report(ok: bool, label: String) -> void:
	if ok:
		print("[verdant-chambers] ok: %s" % label)
	else:
		push_error("[verdant-chambers] FAIL: %s" % label)
		print("[verdant-chambers] FAIL: %s" % label)
		_fail += 1

func _finish() -> void:
	print("[verdant-chambers] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

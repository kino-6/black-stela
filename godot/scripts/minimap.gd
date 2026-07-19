extends Control
## The dungeon automap — a Wizardry-style grid drawn from the LIVE state: only visited cells appear,
## each with bright wall segments on its non-passage sides, the party cell carries a facing arrow, and
## stair cells are marked. Redrawn on every move/turn via `refresh()`. Purely a view of state.map +
## the world grid; it owns no truth.

const CELL := 22.0
const RADIUS := 5   # cells shown each way around the party
const FLOOR_COL := Color("2a3320")
const WALL_COL := Color("c9a765")
const PARTY_COL := Color("e6e2d4")
const STAIR_COL := Color("7fb0d8")
const BG_COL := Color("0c0e08ee")
const BORDER_COL := Color("3a4326")

var _world: Dictionary = {}
var _state: Dictionary = {}
var _cells_by_id: Dictionary = {}

func setup(world: Dictionary, state: Dictionary) -> void:
	_world = world
	_state = state
	_cells_by_id.clear()
	for dungeon in world.get("dungeons", []):
		for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
			_cells_by_id[cell.get("id", "")] = cell
	queue_redraw()

func refresh(state: Dictionary) -> void:
	_state = state
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), BG_COL, true)
	draw_rect(Rect2(Vector2.ZERO, size), BORDER_COL, false, 2.0)
	if _cells_by_id.is_empty():
		return

	var pos: Dictionary = _state.get("position", {})
	var cur: Variant = _cells_by_id.get(pos.get("cellId", ""), null)
	if typeof(cur) != TYPE_DICTIONARY:
		return
	var cx := int(cur.get("x", 0))
	var cy := int(cur.get("y", 0))
	var origin := size / 2.0 - Vector2(CELL, CELL) / 2.0

	var visited: Array = _state.get("map", {}).get("visitedCells", [])
	for cell_id in visited:
		var cell: Variant = _cells_by_id.get(cell_id, null)
		if typeof(cell) != TYPE_DICTIONARY:
			continue
		var dx := int(cell.get("x", 0)) - cx
		var dy := int(cell.get("y", 0)) - cy
		if abs(dx) > RADIUS or abs(dy) > RADIUS:
			continue
		var top_left := origin + Vector2(dx, dy) * CELL
		draw_rect(Rect2(top_left, Vector2(CELL, CELL) - Vector2(2, 2)), FLOOR_COL, true)
		_draw_walls(cell, top_left)
		var room: Variant = _room(cell.get("roomId", ""))
		if typeof(room) == TYPE_DICTIONARY and room.get("stairsToTown", false):
			draw_rect(Rect2(top_left + Vector2(6, 6), Vector2(CELL, CELL) - Vector2(14, 14)), STAIR_COL, true)

	# party marker + facing arrow at centre
	var centre := origin + Vector2(CELL, CELL) / 2.0
	_draw_facing(centre, pos.get("facing", "north"))

func _draw_walls(cell: Dictionary, top_left: Vector2) -> void:
	var edges: Dictionary = cell.get("edges", {})
	var w := CELL - 2.0
	# a side is a WALL unless it has a walkable edge (open/door/one_way)
	var sides := {
		"north": [top_left, top_left + Vector2(w, 0)],
		"south": [top_left + Vector2(0, w), top_left + Vector2(w, w)],
		"west": [top_left, top_left + Vector2(0, w)],
		"east": [top_left + Vector2(w, 0), top_left + Vector2(w, w)],
	}
	for dir in sides:
		if not _is_passage(edges.get(dir, null)):
			var seg: Array = sides[dir]
			draw_line(seg[0], seg[1], WALL_COL, 2.0)

func _draw_facing(centre: Vector2, facing: String) -> void:
	var dir: Vector2 = {
		"north": Vector2(0, -1), "south": Vector2(0, 1),
		"east": Vector2(1, 0), "west": Vector2(-1, 0),
	}.get(facing, Vector2(0, -1))
	var perp := Vector2(-dir.y, dir.x)
	var tip := centre + dir * 8.0
	var a := centre - dir * 5.0 + perp * 5.0
	var b := centre - dir * 5.0 - perp * 5.0
	draw_colored_polygon(PackedVector2Array([tip, a, b]), PARTY_COL)

func _is_passage(edge: Variant) -> bool:
	if typeof(edge) != TYPE_DICTIONARY:
		return false
	return edge.get("kind", "") in ["open", "door", "one_way"]

func _room(room_id: String) -> Variant:
	for dungeon in _world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if room.get("id", "") == room_id:
				return room
	return null

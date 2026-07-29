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
const FloorMap := preload("res://scripts/dungeon/floor_map.gd")
# Same marker vocabulary the FULL map uses, drawn here as small dots so the minimap reflects the map chips
# (playtest: only the town-return stair showed). Colours read at a glance; the full map spells them out.
const MARKER_COL := {
	"return_stair": Color("7fb0d8"), "stairs": Color("e8c15a"), "treasure": Color("f0d060"),
	"gather": Color("8fd06a"), "event": Color("d6a0e6"), "trap": Color("d07a6a"),
	"spinner": Color("6ab0d0"), "teleporter": Color("9a6ad0"), "blade": Color("d06a6a"),
}

var _world: Dictionary = {}
var _state: Dictionary = {}
var _dungeons_by_id: Dictionary = {}

func setup(world: Dictionary, state: Dictionary) -> void:
	_world = world
	_state = state
	_dungeons_by_id.clear()
	for dungeon in world.get("dungeons", []):
		_dungeons_by_id[String(dungeon.get("id", ""))] = dungeon
	queue_redraw()

func refresh(state: Dictionary) -> void:
	_state = state
	queue_redraw()

# The current floor's cells ONLY — never the whole world. Floors share the same (x,y) coordinate space,
# so mixing them (the old bug: iterate the global visitedCells across every dungeon) stamped 2F's rooms onto
# the 1F minimap, and walking back to 1F showed 2F's map. Mirrors the full map's _floor_cells scoping.
func _floor_cells() -> Array:
	return _floor_cells_of(_state)

func _floor_cells_of(state: Dictionary) -> Array:
	var floor_id := String(state.get("map", {}).get("floorId", ""))
	var dungeon: Variant = _dungeons_by_id.get(floor_id, null)
	if typeof(dungeon) != TYPE_DICTIONARY:
		return []
	return (dungeon.get("grid", {}) as Dictionary).get("cells", [])

## The cell ids the minimap will actually draw for `state`. Exposed so a gate can PROVE the map never bleeds
## another floor's cells onto this one (playtest 2026-07-30: walking back to 1F showed 2F's map, because the
## draw iterated the global visitedCells across every dungeon). The draw loop below uses the same predicate.
func visible_cell_ids(state: Dictionary) -> Array:
	var cells := _floor_cells_of(state)
	if cells.is_empty():
		return []
	var by_id := {}
	for cell in cells:
		by_id[String(cell.get("id", ""))] = cell
	var cur: Variant = by_id.get(String(state.get("position", {}).get("cellId", "")), null)
	if typeof(cur) != TYPE_DICTIONARY:
		return []
	var cur_id := String(cur.get("id", ""))
	var cx := int(cur.get("x", 0))
	var cy := int(cur.get("y", 0))
	var visited := {}
	for vid in state.get("map", {}).get("visitedCells", []):
		visited[String(vid)] = true
	var out: Array = []
	for cell in cells:
		var cid := String(cell.get("id", ""))
		if cid != cur_id and not visited.has(cid):
			continue
		if abs(int(cell.get("x", 0)) - cx) > RADIUS or abs(int(cell.get("y", 0)) - cy) > RADIUS:
			continue
		out.append(cid)
	return out

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), BG_COL, true)
	draw_rect(Rect2(Vector2.ZERO, size), BORDER_COL, false, 2.0)

	var cells := _floor_cells()
	if cells.is_empty():
		return
	var by_id := {}
	for cell in cells:
		by_id[String(cell.get("id", ""))] = cell

	var pos: Dictionary = _state.get("position", {})
	var cur: Variant = by_id.get(String(pos.get("cellId", "")), null)
	if typeof(cur) != TYPE_DICTIONARY:
		return
	var cur_id := String(cur.get("id", ""))
	var cx := int(cur.get("x", 0))
	var cy := int(cur.get("y", 0))
	var origin := size / 2.0 - Vector2(CELL, CELL) / 2.0

	var visited := {}
	for vid in _state.get("map", {}).get("visitedCells", []):
		visited[String(vid)] = true

	# Only THIS floor's cells, and only ones the party has actually walked (or the cell they stand on).
	for cell in cells:
		var cell_id := String(cell.get("id", ""))
		if cell_id != cur_id and not visited.has(cell_id):
			continue
		var dx := int(cell.get("x", 0)) - cx
		var dy := int(cell.get("y", 0)) - cy
		if abs(dx) > RADIUS or abs(dy) > RADIUS:
			continue
		var top_left := origin + Vector2(dx, dy) * CELL
		draw_rect(Rect2(top_left, Vector2(CELL, CELL) - Vector2(2, 2)), FLOOR_COL, true)
		_draw_walls(cell, top_left)
		var marker := String(FloorMap._marker(cell, _world, _state))
		if marker != "":
			draw_circle(top_left + (Vector2(CELL, CELL) - Vector2(2, 2)) / 2.0, 3.5, MARKER_COL.get(marker, PARTY_COL))

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

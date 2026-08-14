extends RefCounted
## THE FLOOR MAP — a port of src/components/MapPanel.tsx's FloorMapView (and the marker vocabulary it
## renders through aria-labels).
##
## What was here before was an ASCII block of "@" and "." — it showed WHERE the party had been and
## nothing else. React draws each visited cell with its WALLS and the mark of what is on it (a stair, a
## rest, a spinner, a teleporter, a blade floor, a gathering point, an event, a cleared trap, treasure),
## which is the difference between a breadcrumb trail and a map you can plan a descent on.
##
## React names the marks in aria-labels, which a Godot screen has no equivalent for — so the marks are
## named in a LEGEND instead. Same information, reachable by a player who is not using a screen reader.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

const CELL_PX := 26
const DIRECTIONS := ["north", "east", "south", "west"]
const FACING_GLYPH := {"north": "▲", "east": "▶", "south": "▼", "west": "◀"}

# marker id -> glyph. The i18n key is "map.marker.<id>", so the legend and the cell cannot disagree.
const MARKERS := {
	"return": "⌂", "spinner": "◎", "teleporter": "✧", "hazard": "✖",
	"gather": "❦", "stairs": "≡", "descend": "▼", "event": "!", "trap": "✓", "treasure": "◆"
}

const VISITED_BG := Color("1c2314")
const CURRENT_BG := Color("3a4a22")
const UNSEEN_BG := Color("0e1009")
const WALL := Color("6d7a4a")
const LOCK := Color("d07a6a")   # a way SEALED by a gate — the same lock colour the minimap draws (#39g)
const GRID_LINE := Color("39421f")   # the faint マス目 seen between cells (1px separation reveals it)
const COORD_COL := Color("8a9a5a")    # the A1 ruler letters/numbers down the edges

static func build(state: Dictionary, world: Dictionary) -> Control:
	var map: Dictionary = state.get("map", {})
	var floor_id: Variant = map.get("floorId", null)
	var col := UI.col(10)

	# What floor, and where the party is standing. Outside a room there IS no room name — that is town.
	var head := UI.row()
	head.add_child(UI.label(I18n.t("play.fullMapTitle"), 26, UI.GOLD))
	head.add_child(UI.label(_floor_name(world, floor_id), 17, UI.DIM))
	col.add_child(head)

	var current_room: Variant = map.get("currentRoomId", null)
	var here := UI.row()
	here.add_child(UI.label(I18n.t("map.current"), 15, UI.DIM))
	here.add_child(UI.label(_room_name(world, current_room) if typeof(current_room) == TYPE_STRING and current_room != "" else I18n.t("map.town"), 18, UI.INK))
	var facing: Variant = map.get("currentFacing", (state.get("position", {}) as Dictionary).get("facing", null))
	if typeof(facing) == TYPE_STRING and DIRECTIONS.has(facing):
		here.add_child(UI.label("%s %s" % [FACING_GLYPH[facing], I18n.t("direction.%s" % facing)], 16, UI.GOLD))
	# The party's grid coordinate (Wizardry-style), so a spot can be named — "B4", not "over there".
	var coord := _current_coord(world, floor_id, map)
	if coord != "":
		here.add_child(UI.label(coord, 16, COORD_COL))
	col.add_child(here)

	# A dark zone is the one place the map cannot help: it says so rather than drawing a lie.
	if _in_dark_zone(world, current_room, state):
		col.add_child(UI.label(I18n.t("map.darkness"), 16, UI.BAD))

	var cells := _floor_cells(world, floor_id)
	if cells.is_empty():
		col.add_child(UI.label(I18n.t("map.noFloor"), 18, UI.DIM))
		return col

	# The grid under a compass. A Wizardry map is read by direction — "the corridor runs east" is the
	# sentence a player says to themselves — so the four ways are named around it, not implied by shape.
	var plotted := UI.col(2)
	plotted.add_child(_compass_label("north"))
	var middle := UI.row()
	middle.add_child(_compass_label("west"))
	middle.add_child(_grid(state, world, cells))
	middle.add_child(_compass_label("east"))
	plotted.add_child(middle)
	plotted.add_child(_compass_label("south"))

	var body := UI.row()
	body.add_child(plotted)
	body.add_child(_legend())
	col.add_child(body)
	return col

static func _compass_label(direction: String) -> Control:
	var label := UI.label("%s %s" % [FACING_GLYPH[direction], I18n.t("direction.%s" % direction)], 14, UI.DIM)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label

# --- the grid -------------------------------------------------------------------------------------
static func _grid(state: Dictionary, world: Dictionary, cells: Array) -> Control:
	var map: Dictionary = state.get("map", {})
	var visited: Array = map.get("visitedCells", [])
	var current := String(map.get("currentCellId", ""))

	var min_x := 1 << 30
	var min_y := 1 << 30
	var max_x := -(1 << 30)
	var max_y := -(1 << 30)
	var by_pos := {}
	for cell in cells:
		if not visited.has(cell.get("id", "")) and String(cell.get("id", "")) != current:
			continue
		var x := int(cell.get("x", 0))
		var y := int(cell.get("y", 0))
		by_pos[Vector2i(x, y)] = cell
		min_x = mini(min_x, x); max_x = maxi(max_x, x)
		min_y = mini(min_y, y); max_y = maxi(max_y, y)
	if by_pos.is_empty():
		return UI.label(I18n.t("map.unseen"), 18, UI.DIM)

	# Coordinates are ABSOLUTE to the floor's own origin (its min x/y across ALL cells), not the visited
	# box — so a cell's A1 label is stable no matter how much has been explored, the way a Wizardry map reads.
	var floor_min_x := 1 << 30
	var floor_min_y := 1 << 30
	for cell in cells:
		floor_min_x = mini(floor_min_x, int(cell.get("x", 0)))
		floor_min_y = mini(floor_min_y, int(cell.get("y", 0)))

	var grid := GridContainer.new()
	grid.columns = (max_x - min_x + 1) + 1   # +1 for the row-number ruler down the left
	# A 1px gap between cells, filled by the faint GRID_LINE behind the grid — the マス目 the player counts.
	grid.add_theme_constant_override("h_separation", 1)
	grid.add_theme_constant_override("v_separation", 1)
	# Header row: a blank corner, then a column letter (A, B, …) over each visited column.
	grid.add_child(_ruler_cell(""))
	for x in range(min_x, max_x + 1):
		grid.add_child(_ruler_cell(_col_letter(x - floor_min_x)))
	for y in range(min_y, max_y + 1):
		grid.add_child(_ruler_cell(str(y - floor_min_y + 1)))   # row number down the left
		for x in range(min_x, max_x + 1):
			var pos := Vector2i(x, y)
			if by_pos.has(pos):
				grid.add_child(_cell(by_pos[pos], String(by_pos[pos].get("id", "")) == current, world, state))
			else:
				# Never walked, never seen — the map is the party's RECORD, not the floor's truth.
				grid.add_child(_blank())

	# The faint grid showing through the 1px separations.
	var frame := PanelContainer.new()
	var frame_style := StyleBoxFlat.new()
	frame_style.bg_color = GRID_LINE
	frame_style.set_content_margin_all(0)
	frame.add_theme_stylebox_override("panel", frame_style)
	frame.add_child(grid)
	return frame

# A ruler square carrying an A1 coordinate letter/number (or the empty top-left corner).
static func _ruler_cell(text: String) -> Control:
	var label := UI.label(text, 13, COORD_COL)
	label.custom_minimum_size = Vector2(CELL_PX, CELL_PX)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label

# Column index → spreadsheet-style letters (0→A … 25→Z, 26→AA), so wide floors never collide.
static func _col_letter(index: int) -> String:
	var out := ""
	var n := index
	while true:
		out = String.chr(65 + (n % 26)) + out
		n = n / 26 - 1
		if n < 0:
			break
	return out

# The party's current cell as an A1 coordinate on the floor's absolute grid, or "" when off the floor.
static func _current_coord(world: Dictionary, floor_id: Variant, map: Dictionary) -> String:
	var current := String(map.get("currentCellId", ""))
	if current == "":
		return ""
	var cells := _floor_cells(world, floor_id)
	if cells.is_empty():
		return ""
	var floor_min_x := 1 << 30
	var floor_min_y := 1 << 30
	var here: Variant = null
	for cell in cells:
		floor_min_x = mini(floor_min_x, int(cell.get("x", 0)))
		floor_min_y = mini(floor_min_y, int(cell.get("y", 0)))
		if String(cell.get("id", "")) == current:
			here = cell
	if here == null:
		return ""
	return "%s%d" % [_col_letter(int(here.get("x", 0)) - floor_min_x), int(here.get("y", 0)) - floor_min_y + 1]

static func _cell(cell: Dictionary, is_current: bool, world: Dictionary, state: Dictionary) -> Control:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(CELL_PX, CELL_PX)

	# The WALLS are the map: a border where there is no way through, nothing where there is.
	var style := StyleBoxFlat.new()
	style.bg_color = CURRENT_BG if is_current else VISITED_BG
	style.border_color = WALL
	var edges: Dictionary = cell.get("edges", {})
	var rid := String(cell.get("roomId", ""))
	# A DISCOVERED secret is a way through (rulesEngine.secretRevealed), so the map must drop its wall too —
	# else a found passage still reads solid on the map (playtest 2026-07-29). Both minimap and full map share
	# this, so they stay in agreement.
	style.border_width_top = 0 if _is_way(edges.get("north", null), state, rid, "north") else 2
	style.border_width_right = 0 if _is_way(edges.get("east", null), state, rid, "east") else 2
	style.border_width_bottom = 0 if _is_way(edges.get("south", null), state, rid, "south") else 2
	style.border_width_left = 0 if _is_way(edges.get("west", null), state, rid, "west") else 2
	style.set_content_margin_all(0)
	panel.add_theme_stylebox_override("panel", style)

	var glyph := ""
	var colour := UI.DIM
	if is_current:
		var facing := String((state.get("map", {}) as Dictionary).get("currentFacing", "north"))
		glyph = String(FACING_GLYPH.get(facing, "●"))
		colour = UI.GOLD
	else:
		var marker := _marker(cell, world, state)
		if marker != "":
			glyph = String(MARKERS[marker])
			colour = UI.OK
	var label := UI.label(glyph, 15, colour)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	panel.add_child(label)

	# A way SEALED by a gate draws a lock bar on that side — the planning map must not show it as an open
	# gap either (#39g, same as the minimap/3D). Mirrors the rules gate predicate. Only wrap cells that need it.
	var locked_sides: Array = []
	for dir in ["north", "east", "south", "west"]:
		if _gate_closed(world, rid, dir, state):
			locked_sides.append(dir)
	if locked_sides.is_empty():
		return panel
	var root := Control.new()
	root.custom_minimum_size = Vector2(CELL_PX, CELL_PX)
	panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(panel)
	for dir in locked_sides:
		root.add_child(_lock_bar(dir))
	return root

# A thin LOCK-coloured bar hugging one side of a cell, for a sealed gate on that boundary.
static func _lock_bar(dir: String) -> ColorRect:
	var bar := ColorRect.new()
	bar.color = LOCK
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var t := 3.0
	match dir:
		"north":
			bar.anchor_left = 0; bar.anchor_right = 1; bar.anchor_top = 0; bar.anchor_bottom = 0
			bar.offset_bottom = t
		"south":
			bar.anchor_left = 0; bar.anchor_right = 1; bar.anchor_top = 1; bar.anchor_bottom = 1
			bar.offset_top = -t
		"west":
			bar.anchor_left = 0; bar.anchor_right = 0; bar.anchor_top = 0; bar.anchor_bottom = 1
			bar.offset_right = t
		"east":
			bar.anchor_left = 1; bar.anchor_right = 1; bar.anchor_top = 0; bar.anchor_bottom = 1
			bar.offset_left = -t
	return bar

# A sealed gate on `dir` (key/flag unmet) — the rules' _find_gate/_is_gate_open predicate, shared with
# the minimap and the 3D barrier so all three views agree.
static func _gate_closed(world: Dictionary, room_id: String, dir: String, state: Dictionary) -> bool:
	for gate in _room(world, room_id).get("gates", []):
		if typeof(gate) != TYPE_DICTIONARY or String(gate.get("direction", "")) != dir:
			continue
		if String(gate.get("kind", "")) == "shortcut":
			continue
		var key_id: Variant = gate.get("requiredKeyId", null)
		if typeof(key_id) == TYPE_STRING and key_id != "":
			var held := false
			for item in state.get("inventory", []):
				if String(item.get("id", "")) == key_id and int(item.get("quantity", 0)) > 0:
					held = true
					break
			if not held:
				return true
		var flag: Variant = gate.get("requiredFlag", null)
		if typeof(flag) == TYPE_STRING and flag != "" and not (state.get("discoveredSecrets", []) as Array).has(flag):
			return true
	return false

static func _blank() -> Control:
	# A dark square (not transparent) so an unseen cell reads as a void with only the faint マス目 around it,
	# instead of being filled by the grid-line colour showing through.
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(CELL_PX, CELL_PX)
	var style := StyleBoxFlat.new()
	style.bg_color = UNSEEN_BG
	style.set_content_margin_all(0)
	panel.add_theme_stylebox_override("panel", style)
	return panel

## Marker precedence, in React's order (cellMarker): the first thing true about a cell is what it is.
# Down = the stairs' target floor sits LATER in the world's dungeon order than the floor being mapped.
static func _stairs_descends(world: Dictionary, state: Dictionary, target_floor_id: String) -> bool:
	if target_floor_id == "":
		return true
	var current := String((state.get("map", {}) as Dictionary).get("floorId", ""))
	var dungeons: Array = world.get("dungeons", [])
	var ci := -1
	var ti := -1
	for i in dungeons.size():
		var id := String((dungeons[i] as Dictionary).get("id", ""))
		if id == current:
			ci = i
		if id == target_floor_id:
			ti = i
	if ci < 0 or ti < 0:
		return true
	return ti > ci

static func _marker(cell: Dictionary, world: Dictionary, state: Dictionary) -> String:
	var room := _room(world, String(cell.get("roomId", "")))
	if room.is_empty():
		return ""
	var secrets: Array = state.get("discoveredSecrets", [])
	if bool(room.get("stairsToTown", false)):
		return "return"
	if room.get("spinner", null) != null:
		return "spinner"
	if room.get("teleportTo", null) != null:
		return "teleporter"
	if room.get("damageTile", null) != null:
		return "hazard"
	if room.get("gatherItem", null) != null and not secrets.has("gather:%s" % room.get("id", "")):
		return "gather"
	for dir in DIRECTIONS:
		var edge: Variant = (cell.get("edges", {}) as Dictionary).get(dir, null)
		if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "stairs":
			# Down (descend) and up (back to the previous floor) both used the same ≡ so the descent could not be
			# picked out on a fully-explored map (playtest 2026-08-03「階段が探せない」). Split by target depth.
			return "descend" if _stairs_descends(world, state, String(edge.get("targetFloorId", ""))) else "stairs"
	if room.get("event", null) != null:
		return "event"
	var trap: Variant = room.get("trap", null)
	if typeof(trap) == TYPE_DICTIONARY and (state.get("resolvedTraps", []) as Array).has(trap.get("id", "")):
		return "trap"
	if room.get("treasureTable", null) != null and not (state.get("floorClaimedTreasures", []) as Array).has(room.get("id", "")):
		return "treasure"
	return ""

# --- the legend -----------------------------------------------------------------------------------
## React puts this vocabulary in aria-labels; here it is on the screen, because a mark nobody can read
## is decoration.
static func _legend() -> Control:
	var col := UI.col(4)
	col.custom_minimum_size = Vector2(320, 0)
	col.add_child(UI.label(I18n.t("map.heading"), 17, UI.GOLD))

	var cells := UI.col(2)
	cells.add_child(_legend_row("▲", I18n.t("map.current"), UI.GOLD))
	cells.add_child(_legend_row("■", I18n.t("map.visited"), UI.INK))
	cells.add_child(_legend_row("□", I18n.t("map.unseen"), UI.DIM))
	col.add_child(UI.card(cells))

	# How a cell's SIDES read — the walls are drawn as borders, so the vocabulary for them is its own group.
	var ways := UI.col(2)
	ways.add_child(UI.label(I18n.t("map.paths"), 15, UI.DIM))
	ways.add_child(_legend_row("│", I18n.t("map.wall"), UI.DIM))
	ways.add_child(_legend_row("　", I18n.t("map.open"), UI.DIM))
	ways.add_child(_legend_row("?", I18n.t("map.unknown"), UI.DIM))
	col.add_child(UI.card(ways))

	var marks := UI.col(2)
	for id in MARKERS:
		marks.add_child(_legend_row(String(MARKERS[id]), I18n.t("map.marker.%s" % id), UI.OK))
	col.add_child(UI.card(marks))
	return col

static func _legend_row(glyph: String, text: String, colour: Color) -> Control:
	var row := UI.row()
	var g := UI.label(glyph, 15, colour)
	g.custom_minimum_size = Vector2(24, 0)
	g.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	row.add_child(g)
	row.add_child(UI.label(text, 14, UI.INK))
	return row

# --- lookups --------------------------------------------------------------------------------------
static func _floor_cells(world: Dictionary, floor_id: Variant) -> Array:
	if typeof(floor_id) != TYPE_STRING:
		return []
	for dungeon in world.get("dungeons", []):
		if String(dungeon.get("id", "")) == floor_id:
			return (dungeon.get("grid", {}) as Dictionary).get("cells", [])
	return []

static func _room(world: Dictionary, room_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if String(room.get("id", "")) == room_id:
				return room
	return {}

## The floor's authored NAME — "dungeon.verdant.g1f" is an implementation identifier and must never
## reach the player (AGENTS.md).
static func _floor_name(world: Dictionary, floor_id: Variant) -> String:
	if typeof(floor_id) != TYPE_STRING:
		return I18n.t("map.noFloor")
	for dungeon in world.get("dungeons", []):
		if String(dungeon.get("id", "")) == floor_id:
			var locales: Variant = dungeon.get("locales", {})
			var ja: Dictionary = (locales as Dictionary).get("ja", {}) if typeof(locales) == TYPE_DICTIONARY else {}
			return String(ja.get("name", dungeon.get("name", I18n.t("map.noFloor"))))
	return I18n.t("map.noFloor")

static func _room_name(world: Dictionary, room_id: Variant) -> String:
	if typeof(room_id) != TYPE_STRING:
		return I18n.t("map.town")
	var room := _room(world, room_id)
	var locales: Variant = room.get("locales", {})
	var ja: Dictionary = (locales as Dictionary).get("ja", {}) if typeof(locales) == TYPE_DICTIONARY else {}
	return String(ja.get("name", room.get("name", I18n.t("map.unknown"))))

static func _in_dark_zone(world: Dictionary, room_id: Variant, _state: Dictionary) -> bool:
	if typeof(room_id) != TYPE_STRING:
		return false
	for gate in _room(world, room_id).get("gates", []):
		if typeof(gate) == TYPE_DICTIONARY and String(gate.get("kind", "")) == "dark_zone":
			return true
	return false

# A way through THIS floor: an open/door/one_way edge, or a secret the party has already searched out.
static func _is_way(edge: Variant, state: Dictionary, room_id: String, dir: String) -> bool:
	if _is_passage(edge):
		return true
	if typeof(edge) == TYPE_DICTIONARY and String(edge.get("kind", "")) == "secret":
		return (state.get("discoveredSecrets", []) as Array).has("secret:%s:%s" % [room_id, dir])
	return false

static func _is_passage(edge: Variant) -> bool:
	# ONLY a walkable neighbour on THIS floor counts as a passage (matches the minimap). A `stairs` edge
	# leads to ANOTHER floor and a `shortcut`/`secret` is not an open way, so those sides are WALLS — the
	# full map used to erase the wall on a stairs cell while the minimap drew it, a jarring mismatch (playtest).
	if typeof(edge) != TYPE_DICTIONARY:
		return false
	return ["open", "door", "one_way"].has(String(edge.get("kind", "")))

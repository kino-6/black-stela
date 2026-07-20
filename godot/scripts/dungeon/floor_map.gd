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
	"gather": "❦", "stairs": "≡", "event": "!", "trap": "✓", "treasure": "◆"
}

const VISITED_BG := Color("1c2314")
const CURRENT_BG := Color("3a4a22")
const UNSEEN_BG := Color("0e1009")
const WALL := Color("6d7a4a")

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

	var grid := GridContainer.new()
	grid.columns = max_x - min_x + 1
	grid.add_theme_constant_override("h_separation", 0)
	grid.add_theme_constant_override("v_separation", 0)
	for y in range(min_y, max_y + 1):
		for x in range(min_x, max_x + 1):
			var pos := Vector2i(x, y)
			if by_pos.has(pos):
				grid.add_child(_cell(by_pos[pos], String(by_pos[pos].get("id", "")) == current, world, state))
			else:
				# Never walked, never seen — the map is the party's RECORD, not the floor's truth.
				grid.add_child(_blank())
	return grid

static func _cell(cell: Dictionary, is_current: bool, world: Dictionary, state: Dictionary) -> Control:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(CELL_PX, CELL_PX)

	# The WALLS are the map: a border where there is no way through, nothing where there is.
	var style := StyleBoxFlat.new()
	style.bg_color = CURRENT_BG if is_current else VISITED_BG
	style.border_color = WALL
	var edges: Dictionary = cell.get("edges", {})
	style.border_width_top = 0 if _is_passage(edges.get("north", null)) else 2
	style.border_width_right = 0 if _is_passage(edges.get("east", null)) else 2
	style.border_width_bottom = 0 if _is_passage(edges.get("south", null)) else 2
	style.border_width_left = 0 if _is_passage(edges.get("west", null)) else 2
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
	return panel

static func _blank() -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(CELL_PX, CELL_PX)
	return c

## Marker precedence, in React's order (cellMarker): the first thing true about a cell is what it is.
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
			return "stairs"
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

static func _is_passage(edge: Variant) -> bool:
	if typeof(edge) != TYPE_DICTIONARY:
		return false
	return ["open", "door", "one_way", "shortcut", "stairs"].has(String(edge.get("kind", "")))

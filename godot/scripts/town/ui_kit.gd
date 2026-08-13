extends RefCounted
## Shared widgets for the town service screens. React gets this consistency from styles.css; in Godot
## the panels share these builders so every service reads as the same counter you stand at.
##
## Focus discipline (controller-first-ui skill): GOLD MEANS FOCUS and nothing else — a "recommended"
## command must never be painted with the focus colour, or the player presses Confirm on the thing that
## looks chosen and gets something else.

const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const DIM := Color("bcb49e")   # secondary text — raised from 9a927e for contrast (menus read too faint, 2026-08-11)
const OK := Color("aec37a")
const BAD := Color("d47a68")
const PANEL_BG := Color("14180ff9")
const ROW_BG := Color("11140dcc")

# A global font scale. Held at 1.0: a blanket enlargement pushed fixed-layout screens (title menu, the combat
# command panel's 退却) off-screen — the real readability fix is REDUCING information density per screen so
# text can grow WITH room, not scaling every screen blindly (user 2026-08-11「情報が多すぎ」). Kept as a single
# knob for any future calibrated bump, but not used to paper over crowding.
const FONT_SCALE := 1.0
static func _sz(size: int) -> int:
	return int(round(size * FONT_SCALE))

static func label(text: String, size: int, col: Color = INK) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", _sz(size))
	l.add_theme_color_override("font_color", col)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

## A label that wraps instead of stretching a row — Japanese copy is written with its breaks in mind
## (AGENTS.md), so service prose gets a real width and word-smart wrapping rather than one long line.
static func prose(text: String, size: int, col: Color = DIM, width: int = 720) -> Label:
	var l := label(text, size, col)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(width, 0)
	return l

static func button(text: String, cb: Callable, min_size: Vector2 = Vector2(150, 40), size: int = 16) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = min_size
	b.add_theme_font_size_override("font_size", _sz(size))
	b.add_theme_stylebox_override("normal", panel_style(ROW_BG, Color("3a4326")))
	b.add_theme_stylebox_override("hover", panel_style(Color("1c2314e0"), Color("5a6a3a")))
	b.add_theme_stylebox_override("focus", panel_style(Color("22301aef"), GOLD))
	b.add_theme_stylebox_override("pressed", panel_style(Color("22301aef"), GOLD))
	# A row action must not be stretched by its row — a button that fills the row's height reads as a
	# broken box rather than a command.
	b.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	if cb.is_valid():
		b.pressed.connect(cb)
	return b

static func row() -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	return h

static func col(separation: int = 6) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", separation)
	return v

static func grow(control: Control) -> Control:
	control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return control

static func gap(px: int) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(0, px)
	return c

# --- controller focus wiring (controller-first-ui) -----------------------------------------------
# Chain a vertical list of controls with EXPLICIT top/bottom focus_neighbors so the D-pad walks it in
# order. Geometry focus nav is unreliable across scrollers and columns (the recurring focus-island bug —
# a shop's 詳しく見る rows were mutually unreachable), so any list the cursor must traverse is wired here.
# The ends optionally link to a control above / below the list. Every control must share a common ancestor
# with its neighbour (attached or not) so get_path_to resolves.
static func chain_column(controls: Array, above: Control = null, below: Control = null) -> void:
	var items: Array = []
	for c in controls:
		if c is Control:
			items.append(c)
	for i in items.size():
		var c: Control = items[i]
		if i > 0:
			c.focus_neighbor_top = c.get_path_to(items[i - 1])
		elif above != null:
			c.focus_neighbor_top = c.get_path_to(above)
		if i < items.size() - 1:
			c.focus_neighbor_bottom = c.get_path_to(items[i + 1])
		elif below != null:
			c.focus_neighbor_bottom = c.get_path_to(below)

# Link two controls left↔right (left.right → right, right.left → left).
static func link_lr(left_ctrl: Control, right_ctrl: Control) -> void:
	if left_ctrl != null and right_ctrl != null:
		left_ctrl.focus_neighbor_right = left_ctrl.get_path_to(right_ctrl)
		right_ctrl.focus_neighbor_left = right_ctrl.get_path_to(left_ctrl)

## A service heading: title on the left, the purse on the right (every React service shows the gold
## it is about to spend, so the player never has to leave to check affordability).
static func service_heading(title: String, gold_text: String) -> Control:
	var h := row()
	h.add_child(grow(label(title, 28, GOLD)))
	h.add_child(label(gold_text, 20, INK))
	return h

## The event window: the one line telling the player what just happened. React renders it aria-live
## and ONLY for this service's own event types, so a stale line from another counter never shows.
static func event_window(text: String) -> Control:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", panel_style(Color("1c2314cc"), Color("3a4326")))
	p.add_child(label(text, 17, OK))
	return p

## A bordered card used for list rows so a row reads as an object, not a table line.
static func card(child: Control, border: Color = Color("3a4326")) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", panel_style(ROW_BG, border))
	p.add_child(child)
	return p

static func scroller(child: Control, min_size: Vector2) -> ScrollContainer:
	var s := ScrollContainer.new()
	s.custom_minimum_size = min_size
	s.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	s.size_flags_vertical = Control.SIZE_EXPAND_FILL
	s.add_child(child)
	child.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return s

static func hsep() -> HSeparator:
	return HSeparator.new()

static func panel_style(bg: Color, border: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_content_margin_all(12)
	s.set_corner_radius_all(4)
	if border.a > 0:
		s.border_color = border
		s.set_border_width_all(2)
	return s

## The first ENABLED button in a subtree — where a screen hands the cursor when it opens.
static func first_focusable(node: Node) -> Button:
	for child in node.get_children():
		if child is Button and not (child as Button).disabled:
			return child
		var deeper := first_focusable(child)
		if deeper:
			return deeper
	return null

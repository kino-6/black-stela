extends Control
## S4 vertical-slice COMBAT stage, built procedurally so the layout is one readable place. Demonstrates
## the composition the React version fought over (IMP-024): a full-frame enemy stage on top, a compact
## 3+3 formation band, and a command window overlay — controller-first, no pointer. Uses the real
## delivered art (res://assets). Data would come from the ported rules; here it is the slice's known
## b1f fight (Rook the vanguard vs. the Ash Slime).

const BG := Color("0b0d09")
const PANEL := Color("14171055", 0.0) # unused; panels styled inline
const GOLD := Color("c9a765")
const INK := Color("e6e2d4")

const FRONT := [
	{"name": "Rook", "cls": "vanguard", "hp": 22, "max": 22, "row": "front"},
	{"name": "Sella", "cls": "mender", "hp": 10, "max": 10, "row": "front"},
	{"name": "Vex", "cls": "arcanist", "hp": 9, "max": 9, "row": "back"},
]

func _ready() -> void:
	# Wait one frame so full-rect layout has run and `size` is the real 1920x1080 viewport.
	await get_tree().process_frame
	_build()

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# --- Enemy stage (owns the upper frame) ---
	var enemy_name := _label("灰泥  ·  Ash Slime", 34, GOLD)
	enemy_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	enemy_name.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	enemy_name.offset_top = 40
	add_child(enemy_name)

	var cond := ProgressBar.new()
	cond.max_value = 4
	cond.value = 4
	cond.show_percentage = false
	cond.custom_minimum_size = Vector2(280, 10)
	cond.position = Vector2(size.x / 2 - 140, 92)
	cond.add_theme_color_override("font_color", INK)
	add_child(cond)

	var slime := TextureRect.new()
	slime.texture = _texture("res://assets/enemies/ash-slime.png")
	slime.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	slime.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	slime.custom_minimum_size = Vector2(460, 460)
	slime.size = Vector2(460, 460)
	slime.position = Vector2(size.x / 2 - 230, 150)
	add_child(slime)

	# --- 3+3 formation band ---
	var strip := PanelContainer.new()
	strip.position = Vector2(0, 620)
	strip.custom_minimum_size = Vector2(size.x, 170)
	strip.add_theme_stylebox_override("panel", _panel_style(Color("11140dcc")))
	add_child(strip)
	var strip_box := VBoxContainer.new()
	strip.add_child(strip_box)
	strip_box.add_child(_row_label("前衛  FRONT"))
	strip_box.add_child(_party_row(["front"]))
	strip_box.add_child(_row_label("後衛  BACK"))
	strip_box.add_child(_party_row(["back"]))

	# --- Command window overlay (controller-first) ---
	var cmd := PanelContainer.new()
	cmd.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	cmd.offset_top = -240
	cmd.offset_left = size.x - 520
	cmd.offset_right = -40
	cmd.offset_bottom = -40
	cmd.add_theme_stylebox_override("panel", _panel_style(Color("1b1e14f2"), GOLD))
	add_child(cmd)
	var cmd_box := VBoxContainer.new()
	cmd_box.add_theme_constant_override("separation", 8)
	cmd.add_child(cmd_box)
	cmd_box.add_child(_label("Rook の行動", 22, GOLD))
	var first: Button = null
	for entry in [["攻撃", "Attack"], ["防御", "Defend"], ["特技", "Skill"], ["道具", "Item"]]:
		var b := _command_button("%s   %s" % [entry[0], entry[1]])
		cmd_box.add_child(b)
		if first == null:
			first = b
	if first:
		first.grab_focus()

func _party_row(rows: Array) -> HBoxContainer:
	var box := HBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	for member in FRONT:
		if not rows.has(member["row"]):
			continue
		box.add_child(_party_slot(member))
	# pad to three slots so 3+3 reads as a formation grid
	while box.get_child_count() < 3:
		var pad := Control.new()
		pad.custom_minimum_size = Vector2(150, 64)
		box.add_child(pad)
	return box

func _party_slot(member: Dictionary) -> Control:
	var slot := PanelContainer.new()
	slot.custom_minimum_size = Vector2(196, 68)
	slot.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	slot.clip_contents = true
	slot.add_theme_stylebox_override("panel", _panel_style(Color("1c2013e6"), Color("3a4326")))
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 8)
	slot.add_child(h)
	# A fixed portrait box that crops the full-body sprite to a bust (EXPAND_IGNORE_SIZE lets the
	# container size it; COVERED fills+crops; clip keeps it inside).
	var frame := Control.new()
	frame.custom_minimum_size = Vector2(52, 60)
	frame.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	frame.clip_contents = true
	var portrait := TextureRect.new()
	portrait.texture = _texture("res://assets/characters/adventurer-%s-base.png" % member["cls"])
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	frame.add_child(portrait)
	h.add_child(frame)
	var v := VBoxContainer.new()
	h.add_child(v)
	v.add_child(_label(member["name"], 18, INK))
	var hp := ProgressBar.new()
	hp.max_value = member["max"]
	hp.value = member["hp"]
	hp.show_percentage = false
	hp.custom_minimum_size = Vector2(84, 8)
	v.add_child(hp)
	v.add_child(_label("HP %d/%d" % [member["hp"], member["max"]], 13, Color("9db06a")))
	return slot

func _command_button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(420, 44)
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.add_theme_font_size_override("font_size", 22)
	return b

# Load an image at runtime (no editor .import needed) — the art is copied in from content/ at build.
func _texture(path: String) -> Texture2D:
	var img := Image.load_from_file(path)
	if img == null:
		return null
	return ImageTexture.create_from_image(img)

func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	return l

func _row_label(text: String) -> Label:
	return _label(text, 14, GOLD)

func _panel_style(bg: Color, border: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.content_margin_left = 12
	s.content_margin_right = 12
	s.content_margin_top = 8
	s.content_margin_bottom = 8
	s.corner_radius_top_left = 4
	s.corner_radius_top_right = 4
	s.corner_radius_bottom_left = 4
	s.corner_radius_bottom_right = 4
	if border.a > 0:
		s.border_color = border
		s.set_border_width_all(1)
	return s

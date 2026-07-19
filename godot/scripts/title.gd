extends Control
## S4 TITLE — the loop's front door. The delivered key art fills the frame; one focused prompt starts
## a run into the town hub. Controller-first (confirm starts; the button is focused on load).

const GOLD := Color("c9a765")
const DIM := Color("b8ad92")

var _run: Node = null
var _world_id: String = "default"
var _world_title: String = "Black Stela"

func _ready() -> void:
	await get_tree().process_frame
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_world_title = _run.world.get("title", _world_title)
	_build()

func _asset(sub: String) -> String:
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = Color("06070500")
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var art := TextureRect.new()
	art.texture = _texture(_asset("title/black-stela-title.jpg"))
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	art.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(art)
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.25)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 16)
	box.position = Vector2(size.x / 2 - 240, size.y - 300)
	box.custom_minimum_size = Vector2(480, 0)
	add_child(box)
	box.add_child(_center(_label(_world_title, 22, DIM)))
	var start := Button.new()
	start.text = "はじめる  ▶"
	start.custom_minimum_size = Vector2(360, 60)
	start.add_theme_font_size_override("font_size", 28)
	start.add_theme_color_override("font_color", GOLD)
	start.pressed.connect(_on_start)
	box.add_child(_center(start))
	box.add_child(_center(_label("Enter / A で始める", 15, DIM)))
	start.grab_focus()

func _on_start() -> void:
	var run := get_node_or_null("/root/Run")
	if run:
		run.reset()   # fresh run each time from the title
	get_tree().change_scene_to_file("res://scenes/town.tscn")

func _center(control: Control) -> Control:
	var c := CenterContainer.new()
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(control)
	return c

func _texture(path: String) -> Texture2D:
	var img := Image.load_from_file(path)
	return ImageTexture.create_from_image(img) if img != null else null

func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

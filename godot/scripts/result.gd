extends Control
## S4 RESULT — the beat between a won fight and the walk back to town. Reads the rewards the combat
## scene stashed on the run (Run.last_rewards) and the live party, shows a short after-action summary,
## and 帰還する returns to the town hub — closing the loop. Controller-first (the continue button is
## focused). Falls back to a sample under the headless capture SceneTree.

const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const OK := Color("9db06a")
const DIM := Color("9a927e")
const BG := Color("0b0d09")

var _rewards: Dictionary = {}
var _party: Array = []
var _run: Node = null

func _ready() -> void:
	await get_tree().process_frame
	_acquire()
	_build()

var _world_id: String = "default"

func _asset(sub: String) -> String:
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

func _acquire() -> void:
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_rewards = _run.last_rewards
		_party = _run.state.get("party", [])
	if _rewards.is_empty():
		_rewards = {"xp": 1, "gold": 2, "enemyNames": ["Ash Slime"]}
	if _party.is_empty():
		var init: Dictionary = _read_json("res://data/traces/b1f-exploration.json").get("initialState", {})
		_party = init.get("party", [])

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var back := TextureRect.new()
	back.texture = _texture(_asset("ui/combat-vignette.jpg"))
	back.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	back.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	back.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	back.modulate = Color(1, 1, 1, 0.5)
	add_child(back)
	var scrim := ColorRect.new()
	scrim.color = Color(0.043, 0.051, 0.035, 0.6)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 18)
	box.position = Vector2(size.x / 2 - 420, 150)
	box.custom_minimum_size = Vector2(840, 0)
	add_child(box)

	box.add_child(_center(_label("探索の記録", 44, GOLD)))
	box.add_child(_center(_label("灰の道で退けたもの", 18, DIM)))

	var names: Array = _rewards.get("enemyNames", [])
	box.add_child(_row("撃破", ", ".join(_strs(names))))
	box.add_child(_row("獲得 経験値", "%d" % int(_rewards.get("xp", 0))))
	box.add_child(_row("獲得 ゴールド", "%d G" % int(_rewards.get("gold", 0))))

	# party status — everyone walked out
	var strip := HBoxContainer.new()
	strip.add_theme_constant_override("separation", 14)
	strip.alignment = BoxContainer.ALIGNMENT_CENTER
	for member in _party:
		strip.add_child(_member_chip(member))
	box.add_child(_center(strip))

	var cont := Button.new()
	cont.text = "帰還する  ▶  拠点へ"
	cont.custom_minimum_size = Vector2(360, 56)
	cont.add_theme_font_size_override("font_size", 24)
	cont.pressed.connect(_on_return)
	box.add_child(_center(cont))
	cont.grab_focus()

func _member_chip(member: Dictionary) -> Control:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _panel_style(Color("14180fe0"), Color("3a4326")))
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 2)
	panel.add_child(v)
	v.add_child(_center(_label(member.get("name", "?"), 18, INK)))
	v.add_child(_center(_label("HP %d/%d" % [int(member.get("hp", 0)), int(member.get("maxHp", 0))], 13, OK)))
	return panel

func _on_return() -> void:
	get_tree().change_scene_to_file("res://scenes/town.tscn")

# --- widgets --------------------------------------------------------------------------------------
func _row(label: String, value: String) -> Control:
	var h := HBoxContainer.new()
	h.custom_minimum_size = Vector2(560, 0)
	h.add_theme_constant_override("separation", 20)
	var l := _label(label, 22, DIM)
	l.custom_minimum_size = Vector2(280, 0)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	h.add_child(l)
	h.add_child(_label(value, 24, INK))
	return _center(h)

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

func _strs(arr: Array) -> Array:
	var out := []
	for v in arr:
		out.append(str(v))
	return out

func _panel_style(bg: Color, border: Color) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_content_margin_all(12)
	s.set_corner_radius_all(4)
	s.border_color = border
	s.set_border_width_all(1)
	return s

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

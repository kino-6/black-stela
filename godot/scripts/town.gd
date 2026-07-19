extends Control
## S4 TOWN hub — the preparation location the loop returns to (IMP-025's two-level diegetic hub, rebuilt
## in Godot). A full-frame town backdrop, the party/purse read from the LIVE run state, four service
## destinations (each an NPC you walk up to), and one prominent descent into the ash gate. Controller-
## first: the four destinations + the descent form one focus ring; a destination opens a service card
## (NPC portrait + greeting + 戻る); the descent enters the dungeon. Reads the shared Run autoload in
## continuous play, or the exploration fixture directly under the headless capture SceneTree.

const BG := Color("0b0d09")
const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const OK := Color("9db06a")
const DIM := Color("9a927e")

const DESTINATIONS := [
	{"key": "guild", "ja": "冒険者ギルド", "en": "Guild Hall", "npc": "npc-guild-master",
		"greet": "灰の門は誰も待たん。準備を整えてから潜れ。"},
	{"key": "market", "ja": "市場", "en": "Market Row", "npc": "npc-merchant",
		"greet": "松明も、塩の刃も揃っている。灰には塩がよく効く。"},
	{"key": "records", "ja": "記録の間", "en": "Records Hall", "npc": "npc-archivist",
		"greet": "潜った者の記録はここに。読んでから行け。"},
	{"key": "infirmary", "ja": "施療院", "en": "Infirmary", "npc": "npc-healer",
		"greet": "傷は灰の下では膿む。今のうちに癒しておきなさい。"},
]

var _state: Dictionary = {}
var _world: Dictionary = {}
var _run: Node = null
var _world_id: String = "default"
var _service_layer: Control = null
var _ring: Array = []   # focusable controls in the hub ring (for restoring focus after a service closes)

func _ready() -> void:
	await get_tree().process_frame
	_acquire_state()
	_build()

func _acquire_state() -> void:
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_state = _run.state
		_world = _run.world
	else:
		_state = (_read_json("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary)
		_world = _read_json("res://data/worlds/default.json").get("world", {})

func _asset(sub: String) -> String:
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var back := TextureRect.new()
	back.texture = _texture(_asset("ui/town-hub.jpg"))
	back.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	back.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	back.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(back)
	# Dark scrim so text and cards read over the art.
	var scrim := ColorRect.new()
	scrim.color = Color(0.043, 0.051, 0.035, 0.55)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	# --- header ---
	var header := VBoxContainer.new()
	header.position = Vector2(64, 48)
	add_child(header)
	header.add_child(_label("拠点  —  %s" % _world.get("title", "Black Stela"), 40, GOLD))
	header.add_child(_label(_world.get("tagline", "潜る前に、ここで備えよ。"), 18, DIM))

	# --- party / purse strip (from live state) ---
	var purse := _label("パーティ %d名   ・   所持金 %d G" % [_state.get("party", []).size(), int(_state.get("partyGold", 0))], 20, INK)
	purse.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	purse.offset_left = -520
	purse.offset_right = -64
	purse.offset_top = 60
	purse.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(purse)

	# --- four service destinations (the focus ring) ---
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 24)
	grid.position = Vector2(64, 360)
	add_child(grid)
	var first: Button = null
	for dest in DESTINATIONS:
		var card := _destination_card(dest)
		grid.add_child(card)
		_ring.append(card)
		if first == null:
			first = card

	# --- the descent (distinct, ends the ring) ---
	var descend := Button.new()
	descend.text = "▶  地下へ潜る   —   ダンジョンへ"
	descend.custom_minimum_size = Vector2(560, 64)
	descend.add_theme_font_size_override("font_size", 26)
	descend.position = Vector2(64, 760)
	descend.add_theme_color_override("font_color", GOLD)
	descend.pressed.connect(_on_descend)
	add_child(descend)
	_ring.append(descend)

	# a service overlay layer, hidden until a destination is chosen
	_service_layer = Control.new()
	_service_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.visible = false
	add_child(_service_layer)

	if first:
		first.grab_focus()

func _destination_card(dest: Dictionary) -> Button:
	var card := Button.new()
	card.custom_minimum_size = Vector2(300, 360)
	card.pressed.connect(_on_destination.bind(dest))
	card.add_theme_stylebox_override("normal", _panel_style(Color("11140dcc"), Color("3a4326")))
	card.add_theme_stylebox_override("hover", _panel_style(Color("1c2314e0"), GOLD))
	card.add_theme_stylebox_override("focus", _panel_style(Color("22301aef"), GOLD))
	card.add_theme_stylebox_override("pressed", _panel_style(Color("22301aef"), GOLD))
	# contents
	var v := VBoxContainer.new()
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.add_theme_constant_override("separation", 6)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(v)
	var portrait := TextureRect.new()
	portrait.texture = _texture(_asset("npc/%s.png" % dest["npc"]))
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.custom_minimum_size = Vector2(280, 270)
	portrait.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(portrait)
	v.add_child(_centered(_label(dest["ja"], 24, GOLD)))
	v.add_child(_centered(_label(dest["en"], 14, DIM)))
	return card

# --- service card (level 2 of the hub) ------------------------------------------------------------
func _on_destination(dest: Dictionary) -> void:
	for child in _service_layer.get_children():
		child.queue_free()
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.6)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.add_child(scrim)

	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(720, 420)
	panel.size = Vector2(720, 420)
	panel.position = Vector2(size.x / 2 - 360, size.y / 2 - 210)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("14180ff7"), GOLD))
	_service_layer.add_child(panel)
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 20)
	panel.add_child(h)
	var portrait := TextureRect.new()
	portrait.texture = _texture(_asset("npc/%s.png" % dest["npc"]))
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.custom_minimum_size = Vector2(280, 380)
	h.add_child(portrait)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 16)
	v.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	h.add_child(v)
	v.add_child(_label(dest["ja"], 30, GOLD))
	var greet := _label("「%s」" % dest["greet"], 20, INK)
	greet.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	greet.custom_minimum_size = Vector2(380, 0)
	v.add_child(greet)
	v.add_child(_label("（この拠点は準備の場。潜る支度はここで整う）", 14, DIM))
	var close := Button.new()
	close.text = "戻る  ✕"
	close.custom_minimum_size = Vector2(200, 48)
	close.add_theme_font_size_override("font_size", 20)
	close.pressed.connect(_close_service.bind(dest))
	v.add_child(close)

	_service_layer.visible = true
	close.grab_focus()

func _close_service(dest: Dictionary) -> void:
	_service_layer.visible = false
	# restore focus to the destination we came from
	for i in DESTINATIONS.size():
		if DESTINATIONS[i]["key"] == dest["key"] and i < _ring.size():
			(_ring[i] as Control).grab_focus()
			return

func _unhandled_input(event: InputEvent) -> void:
	if _service_layer and _service_layer.visible and event.is_action_pressed("cancel"):
		_service_layer.visible = false
		if not _ring.is_empty():
			(_ring[0] as Control).grab_focus()

func _on_descend() -> void:
	get_tree().change_scene_to_file("res://scenes/dungeon.tscn")

# --- widgets --------------------------------------------------------------------------------------
func _centered(control: Control) -> Control:
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

func _panel_style(bg: Color, border: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_content_margin_all(14)
	s.set_corner_radius_all(4)
	if border.a > 0:
		s.border_color = border
		s.set_border_width_all(2)
	return s

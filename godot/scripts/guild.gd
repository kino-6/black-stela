extends Control

const Fmt := preload("res://scripts/town_format.gd")
## M2 — the adventurer guild: build a 3+3 party by hand before descending. Pick a class + aptitude
## focus + name, see the exact adventurer the PORTED create() will mint (character_creation.gd, proven
## byte-identical to TS), register it, repeat up to six, then depart to town. Controller-first: the class
## list + focus chips + name cycler + register + depart form one focus ring. Reads the shared Run.

const CharacterCreation := preload("res://scripts/rules/character_creation.gd")

const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const DIM := Color("9a927e")
const OK := Color("9db06a")
const BG := Color("0b0d09")

const FOCUSES := ["balanced", "might", "agility", "spirit", "wit", "luck"]
const FOCUS_JA := {"balanced": "均等", "might": "力", "agility": "敏", "spirit": "精", "wit": "知", "luck": "運"}
const NAMES := ["ミラ", "ルーク", "ヴェイル", "セイ", "ブラン", "ケスト", "リオ", "アッシュ", "ネラ", "オルン", "テス", "ガルト"]
const PARTY_MAX := 6

var _run: Node = null
var _world: Dictionary = {}
var _data: Dictionary = {}
var _class_id: String = "vanguard"
var _focus: String = "balanced"
var _name_index: int = 0

var _preview_box: VBoxContainer
var _party_box: VBoxContainer
var _depart: Button

func _ready() -> void:
	await get_tree().process_frame
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world = _run.world
	if _world.is_empty():
		var pack: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/default.json"))
		_world = (pack as Dictionary).get("world", {}) if typeof(pack) == TYPE_DICTIONARY else {}
	if _run:
		_run.start_guild()
		_data = _run.character_data
	else:
		_data = _read_json("res://data/character-data.json")
	_build()
	_refresh_preview()
	_refresh_party()

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	add_child(_label_at("冒険者ギルド  —  隊を編成する", 36, GOLD, Vector2(56, 40)))
	add_child(_label_at("六人まで。先鋒は前衛、術者は後衛に就く。整えたら地下へ。", 16, DIM, Vector2(56, 92)))

	# --- class list (left) ---
	var list := VBoxContainer.new()
	list.position = Vector2(56, 150)
	list.add_theme_constant_override("separation", 4)
	add_child(list)
	list.add_child(_label("職を選ぶ", 16, GOLD))
	var first: Button = null
	for cls in _data.get("classes", []):
		var b := Button.new()
		var ja: String = cls.get("label", {}).get("ja", cls.get("id", ""))
		var en: String = cls.get("label", {}).get("en", "")
		b.text = "%s   %s" % [ja, en]
		b.custom_minimum_size = Vector2(300, 34)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.add_theme_font_size_override("font_size", 17)
		b.pressed.connect(_on_class.bind(cls.get("id", "")))
		b.focus_entered.connect(_on_class.bind(cls.get("id", "")))
		list.add_child(b)
		if first == null:
			first = b

	# --- preview (centre) ---
	var panel := PanelContainer.new()
	panel.position = Vector2(400, 150)
	panel.custom_minimum_size = Vector2(560, 560)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("14180fe6"), Color("3a4326")))
	add_child(panel)
	_preview_box = VBoxContainer.new()
	_preview_box.add_theme_constant_override("separation", 6)
	panel.add_child(_preview_box)

	# --- focus chips + name cycler + register (under preview) ---
	var controls := VBoxContainer.new()
	controls.position = Vector2(400, 730)
	controls.add_theme_constant_override("separation", 8)
	add_child(controls)
	var focus_row := HBoxContainer.new()
	focus_row.add_theme_constant_override("separation", 6)
	focus_row.add_child(_label("適性重視:", 15, DIM))
	for f in FOCUSES:
		var c := Button.new()
		c.text = FOCUS_JA[f]
		c.custom_minimum_size = Vector2(56, 32)
		c.pressed.connect(_on_focus.bind(f))
		focus_row.add_child(c)
	controls.add_child(focus_row)

	var name_row := HBoxContainer.new()
	name_row.add_theme_constant_override("separation", 6)
	var prev := Button.new(); prev.text = "◀"; prev.custom_minimum_size = Vector2(44, 32)
	prev.pressed.connect(_cycle_name.bind(-1)); name_row.add_child(prev)
	var reg := Button.new(); reg.text = "この冒険者を登録する"; reg.custom_minimum_size = Vector2(280, 40)
	reg.add_theme_font_size_override("font_size", 18); reg.add_theme_color_override("font_color", GOLD)
	reg.pressed.connect(_on_register); name_row.add_child(reg)
	var nxt := Button.new(); nxt.text = "▶"; nxt.custom_minimum_size = Vector2(44, 32)
	nxt.pressed.connect(_cycle_name.bind(1)); name_row.add_child(nxt)
	controls.add_child(name_row)

	# --- party being built (right) ---
	var right := VBoxContainer.new()
	right.position = Vector2(1000, 150)
	right.add_theme_constant_override("separation", 6)
	right.custom_minimum_size = Vector2(360, 0)
	add_child(right)
	right.add_child(_label("編成中の隊", 16, GOLD))
	_party_box = VBoxContainer.new()
	_party_box.add_theme_constant_override("separation", 6)
	right.add_child(_party_box)
	_depart = Button.new()
	_depart.text = "▶  編成完了  —  拠点へ"
	_depart.custom_minimum_size = Vector2(360, 52)
	_depart.add_theme_font_size_override("font_size", 22)
	_depart.add_theme_color_override("font_color", GOLD)
	_depart.pressed.connect(_on_depart)
	right.add_child(_depart)

	if first:
		first.grab_focus()

# --- selection handlers ---------------------------------------------------------------------------
func _on_class(id: String) -> void:
	_class_id = id
	_refresh_preview()

func _on_focus(f: String) -> void:
	_focus = f
	_refresh_preview()

func _cycle_name(step: int) -> void:
	_name_index = (_name_index + step + NAMES.size()) % NAMES.size()
	_refresh_preview()

func _preview_input() -> Dictionary:
	return {"name": NAMES[_name_index], "classId": _class_id, "aptitudeFocus": _focus, "seed": "guild"}

func _refresh_preview() -> void:
	if _preview_box == null:
		return
	for child in _preview_box.get_children():
		child.queue_free()
	var c := CharacterCreation.create(_preview_input(), _data)
	var cls := _class_id
	_preview_box.add_child(_label("%s  ·  %s" % [c.get("name", "?"), _class_ja(cls)], 26, GOLD))
	_preview_box.add_child(_label("%s（%s）" % [_row_ja(c.get("row", "front")), ", ".join(_role_tags(c))], 15, DIM))
	_preview_box.add_child(_hsep())
	var apt: Dictionary = c.get("aptitude", {})
	_preview_box.add_child(_label("適性  力%d 敏%d 精%d 知%d 運%d" % [apt.get("might", 0), apt.get("agility", 0), apt.get("spirit", 0), apt.get("wit", 0), apt.get("luck", 0)], 18, INK))
	_preview_box.add_child(_label("HP %d    %s %d" % [c.get("maxHp", 0), ("気力" if c.get("maxMp", 0) > 0 else "MP"), c.get("maxMp", 0)], 18, OK))
	_preview_box.add_child(_label("攻撃 %d    ダメージ %d-%d" % [c.get("attack", 0), c.get("damageMin", 0), c.get("damageMax", 0)], 18, INK))
	_preview_box.add_child(_label("命中 %d    防御 %d    速さ %d" % [c.get("accuracy", 0), c.get("armor", 0), c.get("speed", 0)], 18, INK))
	_preview_box.add_child(_hsep())
	_preview_box.add_child(_label("初期装備: %s" % ", ".join(_short_equip(c)), 14, DIM))

func _refresh_party() -> void:
	if _party_box == null:
		return
	for child in _party_box.get_children():
		child.queue_free()
	var party: Array = _run.state.get("party", []) if _run else []
	for row in ["front", "back"]:
		_party_box.add_child(_label(_row_ja(row), 14, GOLD))
		var any := false
		for m in party:
			if m.get("row", "front") == row:
				any = true
				_party_box.add_child(_label("  %s  ·  %s  ·  HP%d" % [m.get("name", "?"), _class_ja(m.get("classId", "")), m.get("maxHp", 0)], 16, INK))
		if not any:
			_party_box.add_child(_label("  —", 16, DIM))
	_depart.disabled = party.is_empty()

# --- register / depart ----------------------------------------------------------------------------
func _on_register() -> void:
	if _run == null:
		return
	var party: Array = _run.state.get("party", [])
	if party.size() >= PARTY_MAX:
		return
	var input := _preview_input()
	input["id"] = _run.mint_id()
	var c := CharacterCreation.create(input, _data)
	c["memory"] = {"deeds": [], "injuries": 0, "notableVictories": [], "retreats": 0}
	party.append(c)
	_run.state["party"] = party
	# auto-advance the name so the next recruit differs
	_name_index = (_name_index + 1) % NAMES.size()
	_refresh_preview()
	_refresh_party()

func _on_depart() -> void:
	get_tree().change_scene_to_file("res://scenes/town.tscn")

# --- helpers --------------------------------------------------------------------------------------
func _class_ja(id: String) -> String:
	for cls in _data.get("classes", []):
		if cls.get("id", "") == id:
			return cls.get("label", {}).get("ja", id)
	return id

func _role_tags(c: Dictionary) -> Array:
	var out := []
	for t in c.get("roleTags", []):
		out.append(str(t))
	return out

# The player reads NAMES, never ids. Stripping "equip." off the id and showing the slug ("militia-sabre")
# is the raw-identifier leak AGENTS.md bars from normal play.
func _short_equip(c: Dictionary) -> Array:
	var out := []
	for eid in c.get("startingEquipment", []):
		out.append(Fmt.localized_catalog_name(_world, eid))
	return out

func _row_ja(row: String) -> String:
	return "前衛" if row == "front" else "後衛"

func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _label_at(text: String, sz: int, col: Color, pos: Vector2) -> Label:
	var l := _label(text, sz, col)
	l.position = pos
	return l

func _hsep() -> Control:
	var s := ColorRect.new()
	s.color = Color("3a4326")
	s.custom_minimum_size = Vector2(0, 1)
	return s

func _panel_style(bg: Color, border: Color) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_content_margin_all(16)
	s.set_corner_radius_all(4)
	s.border_color = border
	s.set_border_width_all(1)
	return s

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

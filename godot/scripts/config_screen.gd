extends Control
## M1's config screen — the play-affecting toggles the React build exposes (src/i18n `config.*`).
##
## Deliberately NOT here: AI provider settings and arbitrary save/load. AGENTS.md bars debug UI,
## implementation wording and AI configuration from normal play; those belong to developer tooling.
## Every toggle states what it DOES to play, not which flag it sets.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

const BG := Color("0b0d09")
const SETTINGS_PATH := "user://config.json"

# key -> i18n label. Each one changes how a fight or a message reads, never a developer switch.
const TOGGLES := [
	{"key": "autoBattleSafety", "label": "config.autoBattleSafety", "default": true},
	{"key": "confirmRound", "label": "config.confirmRound", "default": false},
	{"key": "instantCombatLog", "label": "config.instantCombatLog", "default": false}
]

var _settings: Dictionary = {}
var _host: VBoxContainer = null

static func load_settings() -> Dictionary:
	var out := {}
	for toggle in TOGGLES:
		out[toggle["key"]] = toggle["default"]
	if FileAccess.file_exists(SETTINGS_PATH):
		var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(SETTINGS_PATH))
		if typeof(parsed) == TYPE_DICTIONARY:
			for key in parsed:
				out[key] = parsed[key]
	return out

static func save_settings(settings: Dictionary) -> void:
	var file := FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(settings, "  "))
		file.close()

func _ready() -> void:
	await get_tree().process_frame
	_settings = load_settings()
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_host = UI.col(14)
	_host.position = Vector2(size.x / 2 - 460, 220)
	_host.custom_minimum_size = Vector2(920, 0)
	add_child(_host)
	_rebuild()

func _rebuild() -> void:
	for child in _host.get_children():
		child.queue_free()
	_host.add_child(UI.label(I18n.t("title.config"), 38, UI.GOLD))
	_host.add_child(UI.gap(8))

	var first: Button = null
	for toggle in TOGGLES:
		var key := String(toggle["key"])
		var on := bool(_settings.get(key, toggle["default"]))
		var row := UI.row()
		# The state is spelled out, not implied by a colour — a controller player reads it, not hovers it.
		row.add_child(UI.grow(UI.label(I18n.t(String(toggle["label"])), 18, UI.INK)))
		var b := UI.button(I18n.t("tempo.auto") if on else I18n.t("tempo.stop"), func(): _toggle(key), Vector2(140, 42), 16)
		b.add_theme_color_override("font_color", UI.OK if on else UI.DIM)
		row.add_child(b)
		_host.add_child(UI.card(row))
		if first == null:
			first = b

	_host.add_child(UI.gap(12))
	var foot := UI.row()
	var back := UI.button(I18n.t("scenario.pick.back"), func(): _on_back(), Vector2(180, 46), 17)
	foot.add_child(back)
	_host.add_child(foot)
	if first:
		first.call_deferred("grab_focus")
	else:
		back.call_deferred("grab_focus")

func _toggle(key: String) -> void:
	_settings[key] = not bool(_settings.get(key, false))
	save_settings(_settings)
	_rebuild()

func _on_back() -> void:
	get_tree().change_scene_to_file("res://scenes/title.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("cancel"):
		_on_back()
		get_viewport().set_input_as_handled()

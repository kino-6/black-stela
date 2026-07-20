extends Control
## The standalone settings route. The settings themselves live in scripts/config_panel.gd, which the
## TITLE screen also builds inline (React renders config inside TitleScreen) — one implementation, two
## ways in, so the two can never say different things.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const ConfigPanel := preload("res://scripts/config_panel.gd")

const BG := Color("0b0d09")

var _settings: Dictionary = {}
var _host: VBoxContainer = null

func _ready() -> void:
	await get_tree().process_frame
	_settings = ConfigPanel.load_settings()
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
		_host.remove_child(child)
	_host.add_child(UI.label(I18n.t("title.config"), 38, UI.GOLD))
	_host.add_child(UI.gap(8))

	var built := ConfigPanel.build(_settings, func(): _rebuild(), false)
	_host.add_child(built["control"])
	_host.add_child(UI.gap(12))

	var back := UI.button(I18n.t("scenario.pick.back"), func(): _on_back(), Vector2(180, 46), 17)
	var foot := UI.row()
	foot.add_child(back)
	_host.add_child(foot)
	var focus_target: Control = built["first"] if built["first"] != null else back
	focus_target.call_deferred("grab_focus")

func _on_back() -> void:
	get_tree().change_scene_to_file("res://scenes/title.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("cancel"):
		_on_back()
		get_viewport().set_input_as_handled()

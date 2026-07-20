extends Control
## THE TITLE — a faithful port of src/components/TitleScreen.tsx: the key art, then the menu the React
## build offers under one heading (新たな探索 / 続きから / 設定), with the settings opening UNDER the menu
## rather than on another screen, and the save status line that tells the player when a save cannot be
## read. Controller-first: 新たな探索 holds the cursor on load, Cancel closes the settings.
##
## 続きから lists one row per NON-EMPTY slot, described by what it holds (scenario, party, purse) — never
## a raw id or a file name. A slot that exists but will not parse is reported (save.corrupt) instead of
## being silently hidden, because a player whose save broke needs to be told.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const SaveGame := preload("res://scripts/rules/save_game.gd")
const ConfigPanel := preload("res://scripts/config_panel.gd")

const GOLD := Color("c9a765")
const DIM := Color("b8ad92")

var _run: Node = null
var _world_id: String = "default"
var _world_title: String = "Black Stela"
var _config_open: bool = false
var _settings: Dictionary = {}
var _status: String = ""
var _force_corrupt: bool = false   # gate seam: render the unreadable-save line without breaking a real slot

func _ready() -> void:
	await get_tree().process_frame
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_world_title = _run.world.get("title", _world_title)
	_settings = ConfigPanel.load_settings()
	_rebuild()

## Test seam for the UX-parity gate: the settings are a STATE of this screen (as in React), so the gate
## has to be able to open them.
func set_ui_state(ui: Dictionary) -> void:
	if ui.has("config"):
		_config_open = bool(ui["config"])
	if ui.has("corrupt"):
		_force_corrupt = bool(ui["corrupt"])
	_rebuild()

func set_world_override(world_id: String) -> void:
	_run = null
	_world_id = world_id
	_world_title = _read_json("res://data/worlds/%s.json" % world_id).get("world", {}).get("title", _world_title)
	_rebuild()

func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
		remove_child(child)

	var bg := ColorRect.new()
	bg.color = Color("060705")
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var art := TextureRect.new()
	art.texture = _texture(_asset("title/black-stela-title.jpg"))
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	art.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(art)
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.35 if _config_open else 0.25)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	# The menu sits on its own plate: white-on-art is legible only until the art changes under it, and the
	# save-status line has to be readable on the worst frame, not the best one.
	var plate := PanelContainer.new()
	plate.position = Vector2(size.x / 2 - 340, (180 if _config_open else size.y - 430))
	plate.custom_minimum_size = Vector2(680, 0)
	plate.add_theme_stylebox_override("panel", UI.panel_style(Color("0b0d09cc")))
	add_child(plate)

	var box := UI.col(12)
	plate.add_child(box)

	box.add_child(_centered(UI.label(I18n.t("app.title"), 44, GOLD)))
	# No scenario name here: the world is CHOSEN after 新たな探索 (M1's picker), so naming whichever pack
	# happens to be loaded would promise the player a place they have not picked yet.
	box.add_child(UI.gap(6))
	# The menu names itself, as React's nav does — the player is looking at the title MENU, not at three
	# loose buttons over the art.
	box.add_child(_centered(UI.label(I18n.t("title.menu"), 15, DIM)))

	var start := UI.button(I18n.t("title.newGame"), func(): _on_start(), Vector2(420, 58), 26)
	box.add_child(_centered(start))

	# 続きから: one row per non-empty slot, plus the corrupt ones reported rather than hidden.
	var corrupt := _force_corrupt
	var continues := 0
	for slot in [1, 2, 3]:
		var summary: Dictionary = SaveGame.slot_summary(slot)
		if bool(summary.get("empty", true)):
			corrupt = corrupt or bool(summary.get("corrupt", false))
			continue
		continues += 1
		var b := UI.button("%s %s %d — %s ・ %s ・ %s" % [
			I18n.t("title.continue"), I18n.t("save.slot"), slot, String(summary.get("title", "")),
			I18n.t("town.partyReady", {"count": int(summary.get("party", 0))}),
			I18n.t("town.gold", {"gold": int(summary.get("gold", 0))})
		], func(): _on_continue(slot), Vector2(560, 48), 18)
		box.add_child(_centered(b))
	if continues == 0:
		# The command still has to be VISIBLE and legible as unavailable — React renders it disabled
		# rather than removing it, so a first-time player learns the game has a continue at all.
		var none := UI.button(I18n.t("title.continue"), Callable(), Vector2(420, 48), 20)
		none.disabled = true
		box.add_child(_centered(none))

	var config := UI.button(I18n.t("title.config"), func(): _toggle_config(), Vector2(420, 48), 20)
	box.add_child(_centered(config))

	if _config_open:
		var built := ConfigPanel.build(_settings, func(): _rebuild())
		var panel := UI.card(built["control"])
		panel.custom_minimum_size = Vector2(600, 0)
		box.add_child(panel)
		box.add_child(_centered(UI.button(I18n.t("scenario.pick.back"), func(): _toggle_config(), Vector2(200, 44), 17)))

	if _status != "" or corrupt:
		box.add_child(_centered(UI.label(_status if _status != "" else I18n.t("save.corrupt"), 16, UI.BAD if corrupt else DIM)))

	box.add_child(_centered(UI.label(I18n.t("play.menuHint"), 15, DIM)))
	start.call_deferred("grab_focus")

func _toggle_config() -> void:
	_config_open = not _config_open
	_rebuild()

# Continue: load the slot into the shared run and drop the party back where they stood.
func _on_continue(slot: int) -> void:
	var loaded: Dictionary = SaveGame.read_slot(slot)
	if not bool(loaded.get("ok", false)):
		_status = I18n.t("save.corrupt")
		_rebuild()
		return
	var run := get_node_or_null("/root/Run")
	if run:
		run.ensure_loaded()
		run.state = loaded["state"]
	var phase := String((loaded["state"] as Dictionary).get("phase", "town"))
	get_tree().change_scene_to_file("res://scenes/dungeon.tscn" if phase == "dungeon" else "res://scenes/town.tscn")

func _on_start() -> void:
	# M1 — a new run starts by choosing WHICH WORLD to enter; the guild then builds a party for it.
	get_tree().change_scene_to_file("res://scenes/scenario_picker.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("cancel") and _config_open:
		_toggle_config()
		get_viewport().set_input_as_handled()

# --- widgets --------------------------------------------------------------------------------------
func _centered(control: Control) -> Control:
	var c := CenterContainer.new()
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(control)
	return c

func _asset(sub: String) -> String:
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

func _texture(path: String) -> Texture2D:
	if not FileAccess.file_exists(path):
		return null
	var img := Image.load_from_file(path)
	return ImageTexture.create_from_image(img) if img != null else null

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

extends Control
## THE RESULT — a faithful port of src/components/CombatResultPanel.tsx.
##
## React holds victory as a game-state TRANSITION, not a floating notification: 勝利, what was defeated,
## the spoils, then GROWTH — every level-up named, with the adventurer's face, because a level is the
## thing a player came back for. The port had a hand-written "探索の記録" summary with its own copy
## ("撃破 / 獲得 経験値 / 獲得 ゴールド"), no growth section at all, and it named the creatures in raw
## English straight off the combat group.
##
## The whole conclusion is read from Run.last_rewards, which the combat scene now stashes as the full
## CombatConclusion (xp / gold / enemyIds / enemyNames / levelUps) — the same object React is handed.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

const BG := Color("0b0d09")

var _result: Dictionary = {}
var _party: Array = []
var _run: Node = null
var _world: Dictionary = {}
var _world_id: String = "default"
var _backgrounds: Array = []

func _ready() -> void:
	await get_tree().process_frame
	_acquire()
	_rebuild()

func _acquire() -> void:
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_world = _run.world
		_result = _run.last_rewards
		_party = _run.state.get("party", [])
	if _world.is_empty():
		_world = _read_json("res://data/worlds/%s.json" % _world_id).get("world", {})
	if _party.is_empty():
		_party = _read_json("res://data/traces/b1f-exploration.json").get("initialState", {}).get("party", [])
	if _result.is_empty():
		# Standalone (capture / gate) fallback: the b1f chamber kill this route actually produces, with a
		# level-up, so the GROWTH section is exercised rather than quietly skipped.
		_result = {
			"enemyIds": ["enemy.b1f.ash-slime"],
			"enemyNames": ["Ash Slime"],
			"xp": 1,
			"gold": 2,
			"levelUps": [{"characterId": String(_party[0].get("id", "")) if not _party.is_empty() else "", "name": String(_party[0].get("name", "")) if not _party.is_empty() else "", "level": 2}]
		}

## Test seam for the UX-parity gate: drive the conclusion so the GROWTH section (and a no-growth result)
## can both be asserted instead of assumed.
func set_ui_state(ui: Dictionary) -> void:
	if ui.has("result"):
		_result = ui["result"]
	if ui.has("no_growth") and bool(ui["no_growth"]):
		_result = _result.duplicate(true)
		_result["levelUps"] = []
	_rebuild()

func set_world_override(world_id: String) -> void:
	_run = null
	_world_id = world_id
	_world = _read_json("res://data/worlds/%s.json" % world_id).get("world", {})
	_rebuild()

func set_state_override(patched: Dictionary) -> void:
	_run = null
	_party = patched.get("party", [])
	_rebuild()

func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
		remove_child(child)

	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var backdrop := TextureRect.new()
	backdrop.texture = _texture(_asset("ui/combat-vignette.jpg"))
	backdrop.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	backdrop.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	backdrop.modulate = Color(1, 1, 1, 0.45)
	add_child(backdrop)
	var scrim := ColorRect.new()
	scrim.color = Color(0.043, 0.051, 0.035, 0.62)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	var centre := CenterContainer.new()
	centre.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(centre)

	var col := UI.col(16)
	col.custom_minimum_size = Vector2(920, 0)
	centre.add_child(col)

	col.add_child(_centered(UI.label(I18n.t("result.title"), 46, UI.GOLD)))
	var names := _defeated_names()
	if not names.is_empty():
		col.add_child(_centered(UI.label(I18n.t("result.defeated", {"names": "・".join(PackedStringArray(names))}), 20, UI.INK)))

	# 戦果 — what the fight paid.
	var spoils := UI.col(6)
	spoils.add_child(UI.label(I18n.t("result.spoils"), 20, UI.GOLD))
	var rewards := UI.row()
	rewards.add_child(_reward(I18n.t("result.xp"), "+%d" % int(_result.get("xp", 0))))
	rewards.add_child(_reward(I18n.t("result.gold"), "+%d" % int(_result.get("gold", 0))))
	spoils.add_child(rewards)
	col.add_child(UI.card(spoils))

	# 成長 — the section React only renders when someone actually levelled.
	var level_ups: Array = _result.get("levelUps", [])
	if not level_ups.is_empty():
		var growth := UI.col(8)
		growth.add_child(UI.label(I18n.t("result.growth"), 20, UI.GOLD))
		for entry in level_ups:
			growth.add_child(_level_up_row(entry))
		col.add_child(UI.card(growth))

	var cont := UI.button(I18n.t("result.continue"), func(): _on_return(), Vector2(360, 56), 24)
	col.add_child(_centered(cont))
	cont.call_deferred("grab_focus")

func _level_up_row(entry: Dictionary) -> Control:
	var member := _find_member(entry)
	var row := UI.row()

	var portrait := TextureRect.new()
	portrait.custom_minimum_size = Vector2(64, 76)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.texture = _texture(_asset("portraits/%s.png" % _portrait_key(member)))
	row.add_child(UI.card(portrait, Color(String(member.get("accentColor", "#c9a765")))))

	var copy := UI.col(2)
	copy.add_child(UI.label(String(entry.get("name", member.get("name", "?"))), 20, UI.INK))
	copy.add_child(UI.label(I18n.t("result.levelUp"), 16, UI.OK))
	row.add_child(UI.grow(copy))
	row.add_child(UI.label(I18n.t("result.level", {"level": int(entry.get("level", 1))}), 22, UI.GOLD))
	return row

## The creatures are named from the WORLD catalog by id — the conclusion's `enemyNames` are the engine's
## raw English catalog names (they are part of the state, so they cannot be localized there).
func _defeated_names() -> Array:
	var ids: Array = _result.get("enemyIds", [])
	var raw: Array = _result.get("enemyNames", [])
	var out := []
	for i in maxi(ids.size(), raw.size()):
		var id := String(ids[i]) if i < ids.size() else ""
		var fallback := String(raw[i]) if i < raw.size() else ""
		out.append(_enemy_ja(id, fallback))
	return out

func _enemy_ja(enemy_id: String, fallback: String) -> String:
	for enemy in _world.get("enemies", []):
		if String(enemy.get("id", "")) == enemy_id:
			var locales: Variant = enemy.get("locales", {})
			var ja: Dictionary = (locales as Dictionary).get("ja", {}) if typeof(locales) == TYPE_DICTIONARY else {}
			return String(ja.get("name", enemy.get("name", fallback)))
	return fallback

func _find_member(entry: Dictionary) -> Dictionary:
	var id := String(entry.get("characterId", ""))
	for member in _party:
		if id != "" and String(member.get("id", "")) == id:
			return member
		if id == "" and String(member.get("name", "")) == String(entry.get("name", "")):
			return member
	return {}

## The face an adventurer wears when they carry no imported portrait — the origin's, exactly as React's
## renderPortraitContent falls back.
func _portrait_key(member: Dictionary) -> String:
	# Read from the exported background catalog rather than a copy of it — a second table here is a table
	# that drifts the first time a background is added.
	if _backgrounds.is_empty():
		_backgrounds = (_run.character_data if _run else _read_json("res://data/character-data.json")).get("backgrounds", [])
	var id := String(member.get("backgroundId", "watch"))
	for background in _backgrounds:
		if String(background.get("id", "")) == id:
			return String(background.get("portraitKey", "gate"))
	return "gate"

func _on_return() -> void:
	get_tree().change_scene_to_file("res://scenes/town.tscn")

func _unhandled_input(event: InputEvent) -> void:
	# There is nothing behind a result but the walk back, so Cancel resolves the same way Confirm does
	# rather than leaving the player pressing a key that does nothing.
	if event.is_action_pressed("cancel"):
		_on_return()
		get_viewport().set_input_as_handled()

# --- widgets --------------------------------------------------------------------------------------
func _reward(term: String, value: String) -> Control:
	var col := UI.col(2)
	col.custom_minimum_size = Vector2(200, 0)
	col.add_child(UI.label(term, 16, UI.DIM))
	col.add_child(UI.label(value, 30, UI.INK))
	return col

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

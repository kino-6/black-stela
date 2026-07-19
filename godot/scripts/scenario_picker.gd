extends Control
## Port of src/components/ScenarioPicker.tsx — M1's front door.
##
## Each scenario is its own WORLD (dungeons, enemies, atmosphere), so the list is read as places, not
## as a config dropdown: every card carries the world's own title and tagline in the player's language.
## Picking one sets Run.world_id before the guild builds a party for it.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

const BG := Color("0b0d09")

var _worlds: Array = []

func _ready() -> void:
	await get_tree().process_frame
	_worlds = _load_index()
	_build()

func _load_index() -> Array:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/index.json"))
	if typeof(parsed) != TYPE_DICTIONARY:
		return []
	var out := []
	for entry in parsed.get("worlds", []):
		var world_id := String(entry) if typeof(entry) == TYPE_STRING else String((entry as Dictionary).get("worldId", ""))
		if world_id == "":
			continue
		# Read the pack itself for the authored title/tagline (the index is only a manifest).
		var pack: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/%s.json" % world_id))
		var world: Dictionary = (pack as Dictionary).get("world", {}) if typeof(pack) == TYPE_DICTIONARY else {}
		var ja: Dictionary = (world.get("locales", {}) as Dictionary).get("ja", {})
		out.append({
			"worldId": world_id,
			"title": String(ja.get("title", world.get("title", world_id))),
			"tagline": String(ja.get("tagline", world.get("tagline", "")))
		})
	return out

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var root := UI.col(16)
	root.position = Vector2(size.x / 2 - 460, 200)
	root.custom_minimum_size = Vector2(920, 0)
	add_child(root)
	root.add_child(UI.label(I18n.t("scenario.pick.title"), 40, UI.GOLD))
	root.add_child(UI.prose(I18n.t("scenario.pick.subtitle"), 18, UI.DIM, 900))
	root.add_child(UI.gap(12))

	var first: Button = null
	for entry in _worlds:
		var world_id := String(entry["worldId"])
		var card := UI.button("", func(): _on_select(world_id), Vector2(900, 96), 20)
		# The card reads as a PLACE: its own name, then the line that world uses to describe itself.
		var box := UI.col(4)
		box.mouse_filter = Control.MOUSE_FILTER_IGNORE
		box.add_child(UI.label(String(entry["title"]), 24, UI.GOLD))
		if String(entry["tagline"]) != "":
			box.add_child(UI.label(String(entry["tagline"]), 15, UI.DIM))
		card.add_child(box)
		root.add_child(card)
		if first == null:
			first = card

	root.add_child(UI.gap(12))
	var foot := UI.row()
	var back := UI.button(I18n.t("scenario.pick.back"), func(): _on_back(), Vector2(180, 46), 17)
	foot.add_child(back)
	root.add_child(foot)
	if first:
		first.call_deferred("grab_focus")
	else:
		back.call_deferred("grab_focus")

func _on_select(world_id: String) -> void:
	var run := get_node_or_null("/root/Run")
	if run:
		run.world_id = world_id
		run.reset()
		run.start_guild()
	get_tree().change_scene_to_file("res://scenes/guild.tscn")

func _on_back() -> void:
	get_tree().change_scene_to_file("res://scenes/title.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("cancel"):
		_on_back()
		get_viewport().set_input_as_handled()

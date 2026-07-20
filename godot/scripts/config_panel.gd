extends RefCounted
## The play-affecting settings, in ONE place.
##
## React renders these INSIDE the title screen (TitleScreen.tsx, screen === "config"), and the Godot port
## had built a separate config scene instead — so the title screen offered a way OUT to settings rather
## than opening them under the menu. Both surfaces now build from here, which is also why they cannot
## drift into two different settings screens.
##
## Deliberately NOT here: AI provider settings and arbitrary save/load. AGENTS.md bars developer tooling
## from normal play. Every toggle states what it DOES to a fight, never which flag it sets.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

const SETTINGS_PATH := "user://config.json"

const TOGGLES := [
	{"key": "autoBattleSafety", "label": "config.autoBattleSafety", "default": true},
	{"key": "confirmRound", "label": "config.confirmRound", "default": false},
	{"key": "instantCombatLog", "label": "config.instantCombatLog", "default": false}
]

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

## Build the settings body. `on_change` is called after a toggle flips (the caller rebuilds), and the
## first control is returned so the caller can hand it the cursor.
static func build(settings: Dictionary, on_change: Callable, heading: bool = true) -> Dictionary:
	var col := UI.col(10)
	if heading:
		col.add_child(UI.label(I18n.t("title.config"), 26, UI.GOLD))

	var first: Button = null
	for toggle in TOGGLES:
		var key := String(toggle["key"])
		var on := bool(settings.get(key, toggle["default"]))
		var row := UI.row()
		# The state is spelled out, not implied by a colour — a controller player reads it, never hovers.
		row.add_child(UI.grow(UI.label(I18n.t(String(toggle["label"])), 18, UI.INK)))
		var b := UI.button(I18n.t("tempo.auto") if on else I18n.t("tempo.stop"), func(): _flip(settings, key, on_change), Vector2(140, 42), 16)
		b.add_theme_color_override("font_color", UI.OK if on else UI.DIM)
		row.add_child(b)
		col.add_child(UI.card(row))
		if first == null:
			first = b

	return {"control": col, "first": first}

static func _flip(settings: Dictionary, key: String, on_change: Callable) -> void:
	settings[key] = not bool(settings.get(key, false))
	save_settings(settings)
	if on_change.is_valid():
		on_change.call()

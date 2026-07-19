extends RefCounted
## The Godot side of Black Stela's copy. It reads `res://data/i18n-ja.json` — the SAME ja.ts the React
## screens read, flattened by `npm run export:i18n` — so a ported screen says exactly what the screen it
## replaces says, and follows it when the writing changes. This is what makes the UX-parity gate
## satisfiable by construction rather than by hand-copying strings into GDScript.
##
## Mirrors the React Translator: t("town.gold", {"gold": 120}) -> "120G".

const COPY_PATH := "res://data/i18n-ja.json"

static var _copy: Dictionary = {}
static var _loaded: bool = false

static func _ensure() -> void:
	if _loaded:
		return
	_loaded = true
	if not FileAccess.file_exists(COPY_PATH):
		push_error("[i18n] missing %s — run `npm run export:i18n`" % COPY_PATH)
		return
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(COPY_PATH))
	if typeof(parsed) == TYPE_DICTIONARY:
		_copy = parsed

## Translate `key`, interpolating {name} placeholders from `vars`. An unknown key returns the key
## itself (visible in play, so a missing string is found rather than silently blank).
static func t(key: String, vars: Dictionary = {}) -> String:
	_ensure()
	var template: Variant = _copy.get(key, null)
	if typeof(template) != TYPE_STRING:
		return key
	var out := String(template)
	for name in vars:
		out = out.replace("{%s}" % name, str(vars[name]))
	return out

## True when the key exists — for optional copy a screen only shows in some states.
static func has(key: String) -> bool:
	_ensure()
	return _copy.has(key)

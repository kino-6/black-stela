extends RefCounted
## The Godot side of Black Stela's copy. It reads `res://data/i18n-<locale>.json` — the SAME ja.ts / en.ts
## the React screens read, flattened by `npm run export:i18n` — so a ported screen says exactly what the
## screen it replaces says, and follows it when the writing changes. This is what makes the UX-parity gate
## satisfiable by construction rather than by hand-copying strings into GDScript.
##
## Locale is SWITCHABLE BY DESIGN: set_locale("en") loads res://data/i18n-en.json. Japanese is the dev
## default and the only locale the UI exposes for now, but the machinery ships from the start, so an
## English release is a drop-in (a language selector + the en pack) rather than a retrofit (IMP-043 / #22).
##
## Mirrors the React Translator: t("town.gold", {"gold": 120}) -> "120G".

const DEFAULT_LOCALE := "ja"
const LOCALES := ["ja", "en"]

static var _copy: Dictionary = {}
static var _locale: String = DEFAULT_LOCALE
static var _loaded: bool = false

static func _path(locale: String) -> String:
	return "res://data/i18n-%s.json" % locale

static func _ensure() -> void:
	if _loaded:
		return
	_loaded = true
	var path := _path(_locale)
	if not FileAccess.file_exists(path):
		# A missing pack must never blank the whole UI — fall back to the default locale.
		if _locale != DEFAULT_LOCALE and FileAccess.file_exists(_path(DEFAULT_LOCALE)):
			_locale = DEFAULT_LOCALE
			path = _path(_locale)
		else:
			push_error("[i18n] missing %s — run `npm run export:i18n`" % path)
			return
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		_copy = parsed

## Switch the active language, reloading its pack. Returns true if the pack loaded. The UI does not expose
## this yet (dev is Japanese-only); the capability exists from the start so English is a drop-in.
static func set_locale(locale: String) -> bool:
	if not FileAccess.file_exists(_path(locale)):
		return false
	_locale = locale
	_loaded = false
	_ensure()
	return true

static func locale() -> String:
	return _locale

## The locales whose packs actually shipped (so a selector only offers real choices).
static func available_locales() -> Array:
	var out := []
	for l in LOCALES:
		if FileAccess.file_exists(_path(l)):
			out.append(l)
	return out

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

extends RefCounted
## IMP-053 — the one runtime resource boundary. Every scene used to compose `res://assets/worlds/%s/...`
## paths itself and re-implement the export-safe texture load, with divergent world-id fallbacks; a correct
## fix (the IMP-047 imported-vs-raw rule) then had to be repeated on each screen. This centralises the three
## primitives so a scene REQUESTS a resource and the packaging rule lives in one place.

## Parse a JSON document to a Dictionary ({} if missing or not an object).
static func read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

## Load a texture EXPORT-SAFELY: the imported resource first (the only form export ships), and the raw file
## only as a last resort for a runtime/user:// asset that was never imported (IMP-047).
static func texture(path: String) -> Texture2D:
	if ResourceLoader.exists(path):
		var res := load(path)
		if res is Texture2D:
			return res as Texture2D
	if FileAccess.file_exists(path):
		var img := Image.load_from_file(path)
		if img != null:
			return ImageTexture.create_from_image(img)
	return null

## A world-relative asset path, falling back to the Default world's copy when this world does not ship it —
## one fallback rule for every scene, instead of some using the bare world path and others the fallback.
static func world_asset(world_id: String, sub: String) -> String:
	var path := "res://assets/worlds/%s/%s" % [world_id, sub]
	return path if FileAccess.file_exists(path) else "res://assets/worlds/default/%s" % sub

## The portrait KEY for a member (mirror of React portrait.tsx / result.gd _portrait_key): an explicit
## builtin face pick wins, else the background's default key, else "gate". `backgrounds` is the exported
## character-data.json "backgrounds" array — passed in so this stays a single table, never a copy.
static func portrait_key(member: Dictionary, backgrounds: Array) -> String:
	var ref := String(member.get("portraitRef", ""))
	const BUILTIN := "builtin://portrait/"
	if ref.begins_with(BUILTIN):
		return ref.trim_prefix(BUILTIN)
	var id := String(member.get("backgroundId", "watch"))
	for bg in backgrounds:
		if String((bg as Dictionary).get("id", "")) == id:
			return String((bg as Dictionary).get("portraitKey", "gate"))
	return "gate"

## The FACE: the square avatar art at portraits/<key>.png (this world, else Default's — which ships all
## twelve, so a face slot always resolves). Small tokens/cards use this so an avatar shows a FACE, never a
## tall standing figure squeezed into a token.
static func face_path(world_id: String, key: String) -> String:
	return world_asset(world_id, "portraits/%s.png" % (key if key != "" else "gate"))

## The FULL BODY: the tall standing art at bodies/<key>.png (this world, else Default's), or "" when no
## pack ships a body for this key. Used where a character OWNS the screen (combat spotlight); callers fall
## back to the class figure, then the face, so a body-less pack renders exactly as before.
static func body_path(world_id: String, key: String) -> String:
	if key == "":
		return ""
	var sub := "bodies/%s.png" % key
	var path := "res://assets/worlds/%s/%s" % [world_id, sub]
	if FileAccess.file_exists(path):
		return path
	var dflt := "res://assets/worlds/default/%s" % sub
	return dflt if FileAccess.file_exists(dflt) else ""

# Decoded imported portraits, cached by the data-URL's md5 so a scene rebuild never re-decodes.
static var _portrait_cache: Dictionary = {}

## Resolve an adventurer portrait to a Texture2D. A `data:image/...;base64,` portraitRef (an IMPORTED image,
## stored as a data URL exactly like the React build) is decoded ONCE and cached; anything else falls back to
## `fallback_path` (the art-pack portrait). This is the one place that understands imported portraits, so
## every screen renders them identically.
static func portrait_texture(portrait_ref: String, fallback_path: String) -> Texture2D:
	if portrait_ref.begins_with("data:image"):
		var key := portrait_ref.md5_text()
		if _portrait_cache.has(key):
			return _portrait_cache[key]
		var tex := _decode_portrait_data_url(portrait_ref)
		if tex != null:
			_portrait_cache[key] = tex
			return tex
	return texture(fallback_path)

static func _decode_portrait_data_url(data_url: String) -> Texture2D:
	var comma := data_url.find(",")
	if comma < 0:
		return null
	var header := data_url.substr(0, comma)
	var bytes := Marshalls.base64_to_raw(data_url.substr(comma + 1))
	if bytes.is_empty():
		return null
	var img := Image.new()
	var err := ERR_FILE_UNRECOGNIZED
	if header.contains("png"):
		err = img.load_png_from_buffer(bytes)
	elif header.contains("jpeg") or header.contains("jpg"):
		err = img.load_jpg_from_buffer(bytes)
	elif header.contains("webp"):
		err = img.load_webp_from_buffer(bytes)
	else:
		err = img.load_png_from_buffer(bytes)
		if err != OK:
			err = img.load_jpg_from_buffer(bytes)
	if err != OK:
		return null
	return ImageTexture.create_from_image(img)

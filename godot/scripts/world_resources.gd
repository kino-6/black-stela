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

extends Node
## Loads the versioned world-pack JSON exported by `npm run export:packs`. Godot never re-parses the
## authored Markdown/YAML — it reads the single normalized bridge under res://data/worlds
## (docs/archive/migration-execution-plan.s1-s5-spike.md, S1). Both runtimes therefore read the exact same world.

const WORLDS_DIR := "res://data/worlds/"

## The full pack envelope { schemaVersion, worldId, world } for one world, or {} if missing/invalid.
func load_world(world_id: String) -> Dictionary:
	var path := WORLDS_DIR + world_id + ".json"
	if not FileAccess.file_exists(path):
		push_error("world pack not found: %s (run `npm run export:packs`)" % path)
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("world pack is not a JSON object: %s" % path)
		return {}
	return parsed

## The ids of every exported world (from index.json).
func list_worlds() -> Array:
	return load_world_index().get("worlds", [])

func load_world_index() -> Dictionary:
	var path := WORLDS_DIR + "index.json"
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

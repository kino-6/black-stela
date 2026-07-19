extends SceneTree
## M2 parity: rebuild each exported createGuildCharacter sample from its INPUT via the GDScript port and
## assert the derived build matches TS byte-for-byte (every mechanical field except the minted id).
## Run: godot --headless --path godot/ --script res://tests/verify_character_creation.gd

const StateHash := preload("res://scripts/rules/state_hash.gd")
const CharacterCreation := preload("res://scripts/rules/character_creation.gd")

# The fields the creation MATH owns (id/name/notes/title/memory/creation/portrait are glue/presentation).
const COMPARE := [
	"aptitude", "maxHp", "hp", "mp", "maxMp", "attack", "damageMin", "damageMax", "accuracy", "armor",
	"speed", "roleTags", "rowPreference", "row", "classId", "backgroundId", "traitIds",
	"startingEquipment", "equipment", "accentColor", "level", "xp", "gold", "status"
]

func _initialize() -> void:
	var data: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/character-data.json"))
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/character-samples.json"))
	if typeof(data) != TYPE_DICTIONARY or typeof(doc) != TYPE_DICTIONARY:
		push_error("[charcreate] missing character-data / character-samples json")
		quit(1)
		return

	var failures := 0
	var samples: Array = doc.get("samples", [])
	for sample in samples:
		var input: Dictionary = sample.get("input", {})
		var expected: Dictionary = sample.get("character", {})
		var built := CharacterCreation.create(input, data)
		var got := _slice(built)
		var want := _slice(expected)
		if StateHash.canonical_json(got) != StateHash.canonical_json(want):
			failures += 1
			push_error("[charcreate] %s mismatch:\n got=%s\nwant=%s" % [input.get("classId", "?"), StateHash.canonical_json(got), StateHash.canonical_json(want)])
		else:
			print("[charcreate] %s (%s) OK" % [input.get("name", "?"), input.get("classId", "?")])

	print("[charcreate] %s (%d/%d)" % ["PASS" if failures == 0 else "FAIL", samples.size() - failures, samples.size()])
	quit(failures)

func _slice(character: Dictionary) -> Dictionary:
	var out := {}
	for key in COMPARE:
		out[key] = character.get(key, null)
	return out

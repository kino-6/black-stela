class_name Techniques
## The single reader of the exported TECHNIQUE CATALOG (engine-data.json `techniques` +
## `techniqueLabelKeys`). Mirrors src/domain/techniques.ts, and exists for one reason: §9.5 deleted FIVE
## GDScript literals that had each quietly fallen behind the rules — a four-spell table, a cost table,
## two label maps, and a skill-id list — and the same three-line "look the id up and localize it" lookup
## was then re-written in three scenes (combat menu, career panel, guild). A fourth copy is the sixth
## literal waiting to drift. Every scene that names a technique reads it through here.

const I18n := preload("res://scripts/i18n.gd")

static func _def(id: String, engine: Dictionary) -> Dictionary:
	var entry: Variant = (engine.get("techniques", {}) as Dictionary).get(id, null)
	return entry if typeof(entry) == TYPE_DICTIONARY else {}

## The player-visible name, localized. Falls back to the raw id — a bare id on screen means the label
## map is missing, which is the failure this module centralizes so it can only happen in one place.
static func label(id: String, engine: Dictionary) -> String:
	var keys: Dictionary = engine.get("techniqueLabelKeys", {})
	return I18n.t(String(keys[id])) if keys.has(id) else id

## MP cost (the only resource combat spends today).
static func cost(id: String, engine: Dictionary) -> int:
	return int((_def(id, engine).get("cost", {}) as Dictionary).get("mp", 0))

## 特技 (skill) vs 呪文 (spell), from the catalog's own `kind`.
static func is_skill(id: String, engine: Dictionary) -> bool:
	return String(_def(id, engine).get("kind", "")) == "skill"

## What the PLAYER must choose before this technique can be queued — "none", "ally" or "group".
## self / party / allEnemies need no choice at all: the resolver derives the subjects from the scope.
static func targeting(id: String, engine: Dictionary) -> String:
	match String(_def(id, engine).get("target", "")):
		"ally":
			return "ally"
		"enemyGroup":
			return "group"
		_:
			return "none"

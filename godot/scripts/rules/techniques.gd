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

## A class-selection screen needs the player-facing consequence before the technique's proper noun.
## This derives a short explanation from the same exported effect data the combat resolver consumes;
## it intentionally does not introduce a second per-technique description table in the Godot UI.
static func summary(id: String, engine: Dictionary) -> String:
	var definition := _def(id, engine)
	var target := String(definition.get("target", ""))
	var phrases := []
	for effect in definition.get("effects", []):
		var phrase := _effect_summary(effect as Dictionary, target)
		if phrase != "" and not phrases.has(phrase):
			phrases.append(phrase)
	return "・".join(PackedStringArray(phrases))

static func _effect_summary(effect: Dictionary, target: String) -> String:
	var target_label := _target_label(target)
	match String(effect.get("kind", "")):
		"damage":
			return I18n.t("party.techniqueSummary.attack", {"target": target_label})
		"heal":
			return I18n.t("party.techniqueSummary.heal", {"target": target_label})
		"buff":
			return I18n.t("party.techniqueSummary.buff", {
				"target": target_label, "stat": _stat_label(String(effect.get("stat", "")))
			})
		"debuff":
			return I18n.t("party.techniqueSummary.debuff", {
				"target": target_label, "stat": _stat_label(String(effect.get("stat", "")))
			})
		"cover":
			return I18n.t("party.techniqueSummary.cover")
		"cure":
			return I18n.t("party.techniqueSummary.cure", {"target": target_label})
		"ward":
			return I18n.t("party.techniqueSummary.ward", {"target": target_label})
		"status":
			return I18n.t("party.techniqueSummary.status", {
				"target": target_label, "status": _status_label(String(effect.get("status", "")))
			})
		_:
			return ""

static func _target_label(target: String) -> String:
	match target:
		"self": return I18n.t("party.techniqueSummary.targetSelf")
		"ally": return I18n.t("party.techniqueSummary.targetAlly")
		"party": return I18n.t("party.techniqueSummary.targetParty")
		_: return I18n.t("party.techniqueSummary.targetEnemy")

static func _stat_label(stat: String) -> String:
	var keys := {
		"attack": "party.techniqueSummary.statAttack", "damage": "party.techniqueSummary.statDamage",
		"armor": "party.techniqueSummary.statArmor", "accuracy": "party.techniqueSummary.statAccuracy",
		"evasion": "party.techniqueSummary.statEvasion", "speed": "party.techniqueSummary.statSpeed"
	}
	return I18n.t(String(keys.get(stat, "party.techniqueSummary.statAttack")))

static func _status_label(status: String) -> String:
	var keys := {
		"sleep": "party.techniqueSummary.statusSleep", "fear": "party.techniqueSummary.statusFear",
		"silence": "party.techniqueSummary.statusSilence"
	}
	return I18n.t(String(keys.get(status, "party.techniqueSummary.statusFear")))

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

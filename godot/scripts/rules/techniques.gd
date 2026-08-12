class_name Techniques
## The single reader of the exported TECHNIQUE CATALOG (engine-data.json `techniques` +
## `techniqueLabelKeys`). Mirrors src/domain/techniques.ts, and exists for one reason: §9.5 deleted FIVE
## GDScript literals that had each quietly fallen behind the rules — a four-spell table, a cost table,
## two label maps, and a skill-id list — and the same three-line "look the id up and localize it" lookup
## was then re-written in three scenes (combat menu, career panel, guild). A fourth copy is the sixth
## literal waiting to drift. Every scene that names a technique reads it through here.

const I18n := preload("res://scripts/i18n.gd")

## The techniques usable this run: the exported built-in catalog (engine.techniques) with the active
## world's AUTHORED techniques (world.techniques) layered on top — authored wins on a shared id. Mirrors
## src/domain/techniques.ts resolveTechniqueCatalog and the affix/vocation merges. A world that authors
## nothing returns the built-in catalog unchanged, so parity replays are byte-identical.
static func _resolve_technique_catalog(engine: Dictionary, world: Dictionary) -> Dictionary:
	var base: Dictionary = engine.get("techniques", {})
	var authored: Array = world.get("techniques", [])
	if authored.is_empty():
		return base
	var merged: Dictionary = base.duplicate()
	for technique in authored:
		if typeof(technique) == TYPE_DICTIONARY:
			merged[String((technique as Dictionary).get("id", ""))] = technique
	return merged

static func _def(id: String, engine: Dictionary, world: Dictionary = {}) -> Dictionary:
	var entry: Variant = _resolve_technique_catalog(engine, world).get(id, null)
	return entry if typeof(entry) == TYPE_DICTIONARY else {}

## The class's LEARNED line for this run: a world's re-skin (world.classTechniques) over the exported
## engine.classAbilities. Mirrors src/domain/spells.ts resolveClassAbilities — authored wins on classId,
## castable-filtered (drop passive / item-or-hp-cost, like resolveCastableCatalog). A world that authors no
## class line returns engine.classAbilities[class_id] unchanged, so base worlds replay byte-identically.
static func class_line(class_id: String, engine: Dictionary, world: Dictionary = {}) -> Array:
	for entry in world.get("classTechniques", []):
		if typeof(entry) == TYPE_DICTIONARY and String((entry as Dictionary).get("classId", "")) == class_id:
			var catalog := _resolve_technique_catalog(engine, world)
			var out := []
			for grant in (entry as Dictionary).get("combatTechniques", []):
				var id := String((grant as Dictionary).get("techniqueId", ""))
				var definition: Dictionary = catalog.get(id, {})
				if definition.is_empty() or String(definition.get("kind", "")) == "passive":
					continue
				var cost: Dictionary = definition.get("cost", {})
				if cost.has("itemId") or cost.has("hp") or cost.has("usesPerExpedition"):
					continue
				out.append({"level": int((grant as Dictionary).get("level", 0)), "spellId": id})
			return out
	return (engine.get("classAbilities", {}) as Dictionary).get(class_id, [])

## The AUTHORED display name for id in the current locale, or "" if this world does not author one.
static func _authored_name(id: String, world: Dictionary) -> String:
	for technique in world.get("techniques", []):
		if typeof(technique) == TYPE_DICTIONARY and String((technique as Dictionary).get("id", "")) == id:
			var locales: Dictionary = (technique as Dictionary).get("locales", {})
			var loc: Dictionary = locales.get(I18n.locale(), {})
			return String(loc.get("name", ""))
	return ""

## The player-visible name, localized. An AUTHORED technique carries its own per-locale name (read
## straight from the world pack, exactly as vocations do); a built-in falls through to the exported
## label map, then the raw id — a bare id on screen means the label is missing, the failure this module
## centralizes so it can only happen in one place.
static func label(id: String, engine: Dictionary, world: Dictionary = {}) -> String:
	var authored := _authored_name(id, world)
	if authored != "":
		return authored
	var keys: Dictionary = engine.get("techniqueLabelKeys", {})
	return I18n.t(String(keys[id])) if keys.has(id) else id

## MP cost (the only resource combat spends today).
static func cost(id: String, engine: Dictionary, world: Dictionary = {}) -> int:
	return int((_def(id, engine, world).get("cost", {}) as Dictionary).get("mp", 0))

## Whether the technique restores HP — a pure-heal has nothing to give a full-HP ally, so the target
## picker disables full-HP recipients and lands the cursor on the most-wounded (T18).
static func heals(id: String, engine: Dictionary, world: Dictionary = {}) -> bool:
	for effect in _def(id, engine, world).get("effects", []):
		if String((effect as Dictionary).get("kind", "")) == "heal":
			return true
	return false

## A class-selection screen needs the player-facing consequence before the technique's proper noun.
## This derives a short explanation from the same exported effect data the combat resolver consumes;
## it intentionally does not introduce a second per-technique description table in the Godot UI.
static func summary(id: String, engine: Dictionary, world: Dictionary = {}) -> String:
	var definition := _def(id, engine, world)
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
			return I18n.t("party.techniqueSummary.attack", {
				"target": target_label, "mag": _damage_magnitude(effect)
			})
		"heal":
			return I18n.t("party.techniqueSummary.heal", {
				"target": target_label, "mag": _heal_magnitude(effect)
			})
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
		"allEnemies": return I18n.t("party.techniqueSummary.targetAllEnemies")
		_: return I18n.t("party.techniqueSummary.targetEnemy")

## Damage/heal potency, as a 小/中/大 tier off the authored base values (thresholds calibrated to the
## spread across all worlds' techniques). The base scales with spell power in play, so a coarse tier reads
## truer than a raw number that the resolver will inflate.
static func _damage_magnitude(effect: Dictionary) -> String:
	var mid := (float(effect.get("min", 0)) + float(effect.get("max", 0))) / 2.0
	if mid < 8.0:
		return I18n.t("party.techniqueSummary.magSmall")
	if mid < 14.0:
		return I18n.t("party.techniqueSummary.magMedium")
	return I18n.t("party.techniqueSummary.magLarge")

static func _heal_magnitude(effect: Dictionary) -> String:
	var amount := float(effect.get("amount", 0))
	if amount < 10.0:
		return I18n.t("party.techniqueSummary.magSmall")
	if amount < 18.0:
		return I18n.t("party.techniqueSummary.magMedium")
	return I18n.t("party.techniqueSummary.magLarge")

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
static func is_skill(id: String, engine: Dictionary, world: Dictionary = {}) -> bool:
	return String(_def(id, engine, world).get("kind", "")) == "skill"

## What the PLAYER must choose before this technique can be queued — "none", "ally" or "group".
## self / party / allEnemies need no choice at all: the resolver derives the subjects from the scope.
static func targeting(id: String, engine: Dictionary, world: Dictionary = {}) -> String:
	match String(_def(id, engine, world).get("target", "")):
		"ally":
			return "ally"
		"enemyGroup":
			return "group"
		_:
			return "none"

## The camp menu may only offer effects which have an out-of-combat state meaning. Combat-duration
## wards/buffs have no persistent store, so allowing them here would create Godot-only behavior.
static func is_camp_usable(id: String, engine: Dictionary, world: Dictionary = {}) -> bool:
	var definition := _def(id, engine, world)
	var scope := String(definition.get("target", ""))
	if not (scope == "self" or scope == "ally" or scope == "party"):
		return false
	var effects: Array = definition.get("effects", [])
	if effects.is_empty():
		return false
	for effect_v in effects:
		if typeof(effect_v) != TYPE_DICTIONARY:
			return false
		var kind := String((effect_v as Dictionary).get("kind", ""))
		if not (kind == "heal" or kind == "cure"):
			return false
	return true

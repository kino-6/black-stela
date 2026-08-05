extends RefCounted
## Port of the save DTO (src/domain/saveData.ts). One versioned envelope wraps the whole GameState:
##   { schemaVersion, savedAt, scenario:{worldId,title}, settings:{aiEnabled,locale}, state }
##
## The migration contract matters more than the shape: a save carries a numeric `schemaVersion`; an
## OLDER save is migrated FORWARD one version at a time before validation, and a save NEWER than this
## build supports is REFUSED with a clear message rather than silently losing the player's run.
##
## Round-trip requirement: a TS-written save must load here and re-save to the same canonical state, and
## vice-versa. The TS side validates with Zod, which fills DEFAULTS for absent optional fields — so this
## port applies exactly the same defaults on load, or the round-tripped state hash would drift.

const LATEST_SAVE_SCHEMA_VERSION := 1

# GameStateSchema's defaults, applied on load so a save written by either runtime normalizes identically.
# ONLY fields the schema actually `.default(...)`s belong here. `enemyRecord`, `materials` and
# `combatConclusion` are `.optional()` — Zod leaves them ABSENT, and materialising them as empty values
# changes the canonical state hash (that mistake is what this gate caught first).
const STATE_DEFAULTS := {
	"reserve": [], "retired": [], "floorClearedEnemies": [], "stepsSinceEncounter": 0,
	"expeditions": 0, "inventory": [], "partyGold": 75, "openedDoors": [],
	"claimedTreasures": [], "floorClaimedTreasures": [], "quests": [], "chests": []
}
const CHEST_DEFAULTS := {
	"trap": null, "phase": "closed", "investigated": false, "investigateResult": null,
	"disarmAttempted": false, "disarmed": false, "lock": null, "unlockAttempted": false, "unlocked": true,
	"sprung": false
}
const QUEST_DEFAULTS := {"status": "active", "killCount": 0, "claims": 0}

static func to_save_data(state: Dictionary, world: Dictionary, saved_at: String, locale: String = "ja") -> Dictionary:
	# Store the LOCALIZED world title so the title screen's continue row reads 翠碑 — 沈む樹心, not the English
	# authored name (IMP-056). Mirrors saveData.ts toSaveDataV1.
	var world_locales: Dictionary = (world.get("locales", {}) as Dictionary) if typeof(world.get("locales", {})) == TYPE_DICTIONARY else {}
	var locale_title := String((world_locales.get(locale, {}) as Dictionary).get("title", "")) if typeof(world_locales.get(locale, {})) == TYPE_DICTIONARY else ""
	var scenario_title := locale_title if locale_title != "" else String(world.get("title", ""))
	return {
		"schemaVersion": LATEST_SAVE_SCHEMA_VERSION,
		"savedAt": saved_at,
		"scenario": {"worldId": world.get("id", ""), "title": scenario_title},
		"settings": {"aiEnabled": bool(state.get("aiEnabled", true)), "locale": locale},
		"state": state.duplicate(true)
	}

## Migrate an incoming save forward, then normalize it. Returns { ok, state, error }.
static func parse_save_data(input: Variant) -> Dictionary:
	if typeof(input) != TYPE_DICTIONARY:
		return {"ok": false, "error": "save data is not an object"}
	var version_value: Variant = input.get("schemaVersion", null)
	if version_value == null:
		return {"ok": false, "error": "save data carries no schemaVersion"}
	var version := int(version_value)
	if version > LATEST_SAVE_SCHEMA_VERSION:
		# A newer build wrote it — refuse rather than silently dropping fields we do not understand.
		return {"ok": false, "error": "Save schema version %d is newer than this build supports (%d); update the app." % [version, LATEST_SAVE_SCHEMA_VERSION]}
	var data: Dictionary = (input as Dictionary).duplicate(true)
	while version < LATEST_SAVE_SCHEMA_VERSION:
		var next_version := version + 1
		var migrated: Variant = _migrate(data, next_version)
		if migrated == null:
			return {"ok": false, "error": "No migration registered to save schema version %d." % next_version}
		data = migrated
		version = next_version
	if typeof(data.get("state", null)) != TYPE_DICTIONARY:
		return {"ok": false, "error": "save data carries no state"}
	return {"ok": true, "state": normalize_state(data["state"]), "envelope": data}

# MIGRATIONS[n] upgrades a v(n-1) save to v(n). Empty until V2 lands — mirrors saveData.ts.
static func _migrate(_data: Dictionary, _to_version: int) -> Variant:
	return null

## Apply the schema's defaults so a save from either runtime normalizes to the same state.
static func normalize_state(raw: Dictionary) -> Dictionary:
	var state: Dictionary = raw.duplicate(true)
	for key in STATE_DEFAULTS:
		if state.get(key, null) == null:
			state[key] = STATE_DEFAULTS[key] if typeof(STATE_DEFAULTS[key]) != TYPE_ARRAY else (STATE_DEFAULTS[key] as Array).duplicate()
	var quests := []
	for quest in state.get("quests", []):
		var q: Dictionary = (quest as Dictionary).duplicate(true)
		for key in QUEST_DEFAULTS:
			if q.get(key, null) == null:
				q[key] = QUEST_DEFAULTS[key]
		quests.append(q)
	state["quests"] = quests
	var chests := []
	for chest in state.get("chests", []):
		var c: Dictionary = (chest as Dictionary).duplicate(true)
		for key in CHEST_DEFAULTS:
			if not c.has(key):
				c[key] = CHEST_DEFAULTS[key]
		chests.append(c)
	state["chests"] = chests
	return state

# --- slot ids (U4: per-scenario autosave + manual saves) --------------------------------------------
# Mirrors src/domain/saveData.ts. A slot id is a free-form string shared with the React build:
#   auto:<worldId>        — the one rolling autosave for a scenario
#   manual:<worldId>:<n>  — a player-made save, n = 1..MANUAL_SLOTS_PER_WORLD
const MANUAL_SLOTS_PER_WORLD := 3

static func autosave_slot_id(world_id: String) -> String:
	return "auto:%s" % world_id

static func manual_slot_id(world_id: String, index: int) -> String:
	return "manual:%s:%d" % [world_id, index]

static func is_autosave_slot(slot_id: String) -> bool:
	return slot_id.begins_with("auto:")

## The manual slot's 1-based number, or 0 if the id is not a manual slot.
static func manual_slot_index(slot_id: String) -> int:
	var parts := slot_id.split(":")
	return int(parts[parts.size() - 1]) if parts.size() >= 3 and parts[0] == "manual" else 0

# --- disk -------------------------------------------------------------------------------------------
# The slot id rides in the filename so a directory scan can list every save. Only ':' is unsafe in a
# filename, and it never appears in a worldId, so map it to '~' reversibly.
const _SLOT_PREFIX := "bs-save-"

static func slot_path(slot_id: String) -> String:
	return "user://%s%s.json" % [_SLOT_PREFIX, slot_id.replace(":", "~")]

static func _slot_id_from_file(file_name: String) -> String:
	return file_name.trim_prefix(_SLOT_PREFIX).trim_suffix(".json").replace("~", ":")

static func write_slot(slot_id: String, state: Dictionary, world: Dictionary, saved_at: String, locale: String = "ja") -> bool:
	var file := FileAccess.open(slot_path(slot_id), FileAccess.WRITE)
	if file == null:
		push_error("[save] cannot write slot %s" % slot_id)
		return false
	file.store_string(JSON.stringify(to_save_data(state, world, saved_at, locale), "  "))
	file.close()
	return true

static func read_slot(slot_id: String) -> Dictionary:
	var path := slot_path(slot_id)
	if not FileAccess.file_exists(path):
		return {"ok": false, "error": "empty"}
	return parse_save_data(JSON.parse_string(FileAccess.get_file_as_string(path)))

## Delete a save slot (T6). Irreversible — the caller confirms first. Returns true if the slot is now gone
## (removed, or already empty). An empty slot is a no-op success, never an error.
static func delete_slot(slot_id: String) -> bool:
	var path := slot_path(slot_id)
	if not FileAccess.file_exists(path):
		return true
	var dir := DirAccess.open("user://")
	if dir == null:
		return false
	return dir.remove(path.trim_prefix("user://")) == OK

## Slot headline for the title screen — never raw ids or implementation wording.
static func slot_summary(slot_id: String) -> Dictionary:
	var loaded := read_slot(slot_id)
	if not bool(loaded.get("ok", false)):
		# A slot that EXISTS but will not load is not the same as an empty one: the title says so
		# (save.corrupt) rather than silently offering an empty slot.
		return {"slotId": slot_id, "empty": true, "corrupt": String(loaded.get("error", "")) != "empty"}
	var envelope: Dictionary = loaded.get("envelope", {})
	var state: Dictionary = loaded.get("state", {})
	return {
		"slotId": slot_id,
		"empty": false,
		"title": String((envelope.get("scenario", {}) as Dictionary).get("title", "")),
		"savedAt": String(envelope.get("savedAt", "")),
		"party": (state.get("party", []) as Array).size(),
		"gold": int(state.get("partyGold", 0)),
		"turn": int(state.get("turn", 0))
	}

## Every valid save on disk, NEWEST FIRST — the title's Continue takes the head, the browser lists all.
static func list_slots() -> Array:
	var out: Array = []
	var dir := DirAccess.open("user://")
	if dir == null:
		return out
	dir.list_dir_begin()
	var name := dir.get_next()
	while name != "":
		if not dir.current_is_dir() and name.begins_with(_SLOT_PREFIX) and name.ends_with(".json"):
			var summary := slot_summary(_slot_id_from_file(name))
			# A valid save OR a corrupt one (a file that will not load) — never a phantom. The title lists
			# the valid ones and warns about corrupt ones, as React does; both must therefore surface here.
			if not bool(summary.get("empty", false)) or bool(summary.get("corrupt", false)):
				out.append(summary)
		name = dir.get_next()
	dir.list_dir_end()
	out.sort_custom(func(a, b): return String(a.get("savedAt", "")) > String(b.get("savedAt", "")))
	return out

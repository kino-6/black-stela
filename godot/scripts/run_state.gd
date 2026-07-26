extends Node
## The shared run state that PERSISTS across scene changes (autoload "Run") — this is what makes the
## vertical slice a continuous loop instead of six disconnected screens. It holds one GameState dict,
## the normalized world, and engine-data; town/dungeon/combat/result all read and mutate THIS one
## state through the ported rules (SliceRules / CombatRound), so the same 6-member party carries the
## whole loop. Loaded lazily from the b1f-exploration fixture (party in the dungeon at cell.b1f.002).
##
## Under the headless capture SceneTree the autoloads are NOT started, so each scene falls back to
## loading its own fixture — see `_acquire_state()` in the scene scripts. Run is the normal-play path.

var world_id: String = "default"   # set before ensure_loaded() to run the slice on another world
var state: Dictionary = {}
var world: Dictionary = {}
var engine: Dictionary = {}
var last_rewards: Dictionary = {}   # set by combat victory, read by the result screen
var loot_baseline: Dictionary = {}  # {itemId: qty} snapshot taken at descent so town shows loot GAINED
                                    # this expedition, not the supplies the party carried down (playtest #3).
                                    # Transient/presentation-only — deliberately NOT in the hashed run state.
var character_data: Dictionary = {} # class/background/trait catalogs (character-data.json)
var _loaded: bool = false
var _id_counter: int = 0

const SliceRules := preload("res://scripts/rules/slice_rules.gd")
const SaveGame := preload("res://scripts/rules/save_game.gd")

# --- persistence -----------------------------------------------------------------------------------
# Slots: 1 = town autosave, 2 = stairs autosave, 3 = manual save. The play scenes call these; the title
# lists every non-empty slot under 続きから. Nothing was ever written before (the build had the save RULES
# and the LOAD, but no scene ever CALLED write) — so every run started from the beginning (playtest).
func save_to_slot(slot: int) -> void:
	ensure_loaded()
	SaveGame.write_slot(slot, state, world, Time.get_datetime_string_from_system(), "ja")

# Load a slot into THIS run — restoring the world it was saved in (the old load kept only the state, so a
# non-default save loaded with the wrong world). Returns false if the slot is empty/corrupt.
func load_slot(slot: int) -> bool:
	var loaded: Dictionary = SaveGame.read_slot(slot)
	if not bool(loaded.get("ok", false)):
		return false
	var envelope: Dictionary = loaded.get("envelope", {})
	var saved_world := String((envelope.get("scenario", {}) as Dictionary).get("worldId", ""))
	if saved_world != "":
		world_id = saved_world
	world = read_json("res://data/worlds/%s.json" % world_id).get("world", {})
	engine = read_json("res://data/engine-data.json")
	character_data = read_json("res://data/character-data.json")
	last_rewards = {}
	_loaded = true
	state = loaded["state"]
	return true

# Run one command through the ported rules and commit the result to the shared state. Returns the
# emitted events (so a service screen can narrate what happened). This is the single mutation path town
# services use — the same rules the parity gate proves against, so town play stays oracle-faithful.
func dispatch(command: Dictionary) -> Array:
	ensure_loaded()
	var result: Dictionary = SliceRules.resolve(state, command, world, engine)
	state = result.get("state", state)
	return result.get("events", [])

# A unique-within-the-run character id (production ids need only in-run uniqueness for the slice).
func mint_id() -> String:
	_id_counter += 1
	return "char.%d" % _id_counter

# Start a fresh guild for a BRAND-NEW game (the only caller is the scenario picker). Keep the world/engine
# structure, but return the run to a true "nobody has descended yet" state. The shared state is seeded from
# a DEBUG mid-dungeon fixture (expeditions=1, a dungeon position, an explored automap, a debug log, and
# cleared-enemy/secret progress). Left in place, town reads it as a post-return state and shows 帰還後の支度
# / 持ち帰った物 before the first step down, and the first descent would resume mid-floor onto already-beaten
# enemies (playtest). Zero the expedition history so the first departure really is the first departure.
func start_guild() -> void:
	ensure_loaded()
	state["party"] = []
	state["reserve"] = []
	state["phase"] = "town"
	state["expeditions"] = 0
	state["log"] = []
	state["combat"] = null
	state["position"] = null            # nulled so the first descent seeds a FRESH landing at the entrance
	state["map"] = {}                   # drop the debug fixture's explored automap
	state["turn"] = 0
	state["stepsSinceEncounter"] = 0
	state["defeatedEnemies"] = []
	state["discoveredSecrets"] = []
	state["claimedTreasures"] = []
	state["floorClearedEnemies"] = []
	state["floorClaimedTreasures"] = []
	state["resolvedTraps"] = []
	state["retired"] = []
	loot_baseline = {}

func ensure_loaded() -> void:
	if _loaded:
		return
	reset()

func reset() -> void:
	world = read_json("res://data/worlds/%s.json" % world_id).get("world", {})
	engine = read_json("res://data/engine-data.json")
	character_data = read_json("res://data/character-data.json")
	# The adventurer party is world-agnostic (generic classes) — reuse the exploration fixture's six.
	state = (read_json("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary).duplicate(true)
	last_rewards = {}
	_loaded = true

# Per-world asset root (the same scene code, different data AND assets — the migration gate criterion).
func asset_path(sub: String) -> String:
	return "res://assets/worlds/%s/%s" % [world_id, sub]

# Return to town after a victory: drop combat, back to dungeon phase (the party stays as it is).
func return_to_town() -> void:
	state["phase"] = "dungeon"
	state["combat"] = null

static func read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("[run] missing data file: %s" % path)
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

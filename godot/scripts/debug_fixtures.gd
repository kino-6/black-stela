extends RefCounted
## Named QA fixtures, shared by the debug panel AND the `-- --fixture <name>` boot flag. Each drops the
## run into a known, PLAYABLE state that drives the SAME scenes and rules as normal play, so a reviewer
## can reach the input / return / loot states WITHOUT mouse-picking the debug panel (Codex could not
## select the panel's floor fixtures via OS input). #29 / IMP-046 named starts.
##
## The fixtures reuse the parity traces the oracle already agreed with, so a jump lands on a real state.

const TRACES := {
	"ready": "expedition",
	"return_ready": "b1f-return",      # party at the B1F return stair — return-loop / no-crash review (#44)
	"open_corridor": "b2f-hazard",     # cell.b2f.c1_2 faces a straight N/S corridor — held-move review (#17)
	"combat_victory": "b1f-combat-victory",  # mid-fight vs the ash slime — command flow / victory review (#46)
	"loot_delta": "b1f-return",        # the return stair + a gained item on top of the descent supply (#3)
	"floor_2": "b2f-hazard",
	"floor_3": "b3f-gather",
	"floor_4": "b4f-spinner",
}

## The fixture names offered — used by the panel and validated by the boot flag.
static func names() -> Array:
	return TRACES.keys()

## Load `name` into the run and return the scene to show ("" if the run is unavailable). The run is
## ensure_loaded first (so world/engine exist and the scene's own ensure_loaded is a no-op), THEN its
## state is overridden with the fixture — otherwise a scene would reload the trace and lose our edits.
static func load_into(run: Object, name: String) -> String:
	if run == null:
		return ""
	run.ensure_loaded()
	var trace: String = TRACES.get(name, "b1f-exploration")
	var path := "res://data/traces/%s.json" % trace
	if not FileAccess.file_exists(path):
		path = "res://data/traces/b1f-exploration.json"
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(doc) != TYPE_DICTIONARY:
		return ""
	var state: Dictionary = ((doc as Dictionary).get("initialState", {}) as Dictionary).duplicate(true)
	if name == "loot_delta":
		_seed_loot_delta(run, state)
	run.state = state
	return _scene_for_phase(String(state.get("phase", "town")))

## The scene each phase plays in — a fixture lands the reviewer in the RIGHT screen (a combat fixture in
## combat, a floor fixture in the dungeon, everything else in town), all driven by the ported rules.
static func _scene_for_phase(phase: String) -> String:
	match phase:
		"combat":
			return "res://scenes/combat.tscn"
		"dungeon":
			return "res://scenes/dungeon.tscn"
		_:
			return "res://scenes/town.tscn"

## loot_delta: the party stands at the return stair carrying its descent supply PLUS one item picked up
## below. loot_baseline is set to the descent inventory, so the return ledger shows ONLY the gained item
## (#3) — the contract Codex approves on the real 帰還後の支度 screen.
static func _seed_loot_delta(run: Object, state: Dictionary) -> void:
	var inv: Array = (state.get("inventory", []) as Array).duplicate(true)
	var baseline := {}
	for it in inv:
		var id := String((it as Dictionary).get("id", ""))
		baseline[id] = int(baseline.get(id, 0)) + int((it as Dictionary).get("quantity", 1))
	run.loot_baseline = baseline
	# A gained item found below — a real delta over the baseline the return ledger must surface.
	inv.append({"id": "item.lantern-oil", "quantity": 1})
	state["inventory"] = inv

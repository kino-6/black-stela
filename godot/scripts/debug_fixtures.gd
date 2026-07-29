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
	"shop_description": "economy",      # a town with a full purse — the market shows what a piece DOES (#46)
	"floor_2": "b2f-hazard",
	"floor_3": "b3f-gather",
	"floor_4": "b4f-spinner",
}

# IMP-057: constructed (non-trace) fixtures that land a reviewer at a Verdant 玄室 — one facing its CLOSED
# door, one at the SAME chamber cleared (door open + landmark calmed) — so the closed-threshold / special-room
# / cleared-contrast art can be judged without a blind long walk. Never mounted in normal play.
const VERDANT_CHAMBER_FIXTURES := ["verdant_chamber_closed", "verdant_chamber_cleared"]
const VERDANT_CHAMBER_FLOOR := "dungeon.verdant.g1f"

## The fixture names offered — used by the panel and validated by the boot flag.
static func names() -> Array:
	var all := TRACES.keys()
	all.append_array(VERDANT_CHAMBER_FIXTURES)
	return all

## Load `name` into the run and return the scene to show ("" if the run is unavailable). The run is
## ensure_loaded first (so world/engine exist and the scene's own ensure_loaded is a no-op), THEN its
## state is overridden with the fixture — otherwise a scene would reload the trace and lose our edits.
static func load_into(run: Object, name: String) -> String:
	if run == null:
		return ""
	if name in VERDANT_CHAMBER_FIXTURES:
		return _load_verdant_chamber(run, name)
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

## IMP-057: stand the party one cell outside G1F's centre guardian 玄室, facing its door. `closed` keeps the
## door shut and the landmark lit; `cleared` opens the door and marks the chest claimed so the landmark calms
## — the paired before/after a reviewer captures. Both open the REAL dungeon scene on the Verdant world.
static func _load_verdant_chamber(run: Object, name: String) -> String:
	run.world_id = "verdant"
	run.reset()
	var approach := _chamber_approach(run.world)
	if approach.is_empty():
		return ""
	var state: Dictionary = run.state
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": approach["cellId"], "roomId": approach["roomId"], "facing": approach["facing"]}
	state["map"] = {
		"floorId": VERDANT_CHAMBER_FLOOR,
		"currentCellId": approach["cellId"],
		"currentRoomId": approach["roomId"],
		"currentFacing": approach["facing"],
		"visitedCells": [approach["cellId"]],
		"visitedRooms": [approach["roomId"]],
		"knownExits": {},
	}
	if name == "verdant_chamber_cleared":
		# Swing the door and calm the landmark: the cleared-state contrast the review needs.
		var opened: Array = (state.get("openedDoors", []) as Array).duplicate()
		if String(approach["doorKey"]) != "" and not opened.has(approach["doorKey"]):
			opened.append(approach["doorKey"])
		state["openedDoors"] = opened
		var claimed: Array = (state.get("floorClaimedTreasures", []) as Array).duplicate()
		if String(approach["chamberRoomId"]) != "" and not claimed.has(approach["chamberRoomId"]):
			claimed.append(approach["chamberRoomId"])
		state["floorClaimedTreasures"] = claimed
	run.state = state
	return "res://scenes/dungeon.tscn"

## The committed G1F approach: cell c9_10 facing north into the centre guardian chamber (same framing as
## capture_verdant_chamber_visual.gd), plus the chamber room + door key derived from that cell's north edge.
static func _chamber_approach(world: Dictionary) -> Dictionary:
	var dungeon: Dictionary = {}
	for candidate in world.get("dungeons", []):
		if String((candidate as Dictionary).get("id", "")) == VERDANT_CHAMBER_FLOOR:
			dungeon = candidate
			break
	if dungeon.is_empty():
		return {}
	var cells := {}
	for cell in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
		cells[String((cell as Dictionary).get("id", ""))] = cell
	var approach_cell: Dictionary = cells.get("cell.verdant.g1f.c9_10", {})
	if approach_cell.is_empty():
		return {}
	var facing := "north"
	var approach_room := String(approach_cell.get("roomId", ""))
	var edge: Variant = (approach_cell.get("edges", {}) as Dictionary).get(facing, null)
	var chamber_room := String((edge as Dictionary).get("targetRoomId", "")) if typeof(edge) == TYPE_DICTIONARY else ""
	return {
		"cellId": String(approach_cell.get("id", "")),
		"roomId": approach_room,
		"facing": facing,
		"chamberRoomId": chamber_room,
		"doorKey": "door:%s:%s" % [approach_room, facing],
	}

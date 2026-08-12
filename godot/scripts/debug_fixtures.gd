extends RefCounted
## Named QA fixtures, shared by the debug panel AND the `-- --fixture <name>` boot flag. Each drops the
## run into a known, PLAYABLE state that drives the SAME scenes and rules as normal play, so a reviewer
## can reach the input / return / loot states WITHOUT mouse-picking the debug panel (Codex could not
## select the panel's floor fixtures via OS input). #29 / IMP-046 named starts.
##
## The fixtures reuse the parity traces the oracle already agreed with, so a jump lands on a real state.

const Leveling := preload("res://scripts/rules/leveling.gd")

const TRACES := {
	"ready": "expedition",
	"return_ready": "b1f-return",      # party at the B1F return stair — return-loop / no-crash review (#44)
	"open_corridor": "b2f-hazard",     # cell.b2f.c1_2 faces a straight N/S corridor — held-move review (#17)
	"combat_victory": "b1f-combat-victory",  # mid-fight vs the ash slime — command flow / victory review (#46)
	"loot_delta": "b1f-return",        # the return stair + a gained item on top of the descent supply (#3)
	"shop_description": "economy",      # a town with a full purse — the market shows what a piece DOES (#46)
}

# IMP-057: constructed (non-trace) fixtures that land a reviewer at a Verdant 玄室 — one facing its CLOSED
# door, one at the SAME chamber cleared (door open + landmark calmed) — so the closed-threshold / special-room
# / cleared-contrast art can be judged without a blind long walk. Never mounted in normal play.
const VERDANT_CHAMBER_FIXTURES := ["verdant_chamber_closed", "verdant_chamber_cleared"]
const VERDANT_CHAMBER_FLOOR := "dungeon.verdant.g1f"

# Constructed fixtures that stand the party ON a Terminal Line stair FACING it — so the descent/ascent art
# can be judged in one selection instead of walking the floor to find it (user 2026-08-11).
const STAIR_FIXTURES := ["terminal_line_down_stair", "terminal_line_up_stair"]

# A LIVE Terminal Line fight the reviewer drops straight into, with the front four each holding a different
# firearm family — so 全員でかかる [F] fires pistol / rifle / SMG / shotgun in ONE round and the #26 combat
# feel (quiet numbers, hit sink, per-gun tempo, defeat sink, log) is judged without walking to an encounter
# (user 2026-08-12: 「StateLoad くらい用意しない？」). Attack normally for a hit/crit, keep firing for a defeat.
const COMBAT_FIXTURES := ["terminal_line_combat"]
const Encounter := preload("res://scripts/encounter.gd")
const TL_GUNS := ["equip.tl-service-pistol", "equip.tl-platform-38-rifle", "equip.tl-drain-5-smg", "equip.tl-maintenance-10-shotgun"]

## The fixture names offered — used by the panel and validated by the boot flag.
static func names() -> Array:
	var all := TRACES.keys()
	all.append_array(VERDANT_CHAMBER_FIXTURES)
	all.append_array(STAIR_FIXTURES)
	all.append_array(COMBAT_FIXTURES)
	for n in range(2, 11):
		all.append("floor_%d" % n)   # deep-floor review starts (IMP-062)
	return all

## Load `name` into the run and return the scene to show ("" if the run is unavailable). The run is
## ensure_loaded first (so world/engine exist and the scene's own ensure_loaded is a no-op), THEN its
## state is overridden with the fixture — otherwise a scene would reload the trace and lose our edits.
static func load_into(run: Object, name: String) -> String:
	if run == null:
		return ""
	if name in VERDANT_CHAMBER_FIXTURES:
		return _load_verdant_chamber(run, name)
	if name in STAIR_FIXTURES:
		return _load_terminal_stair(run, name)
	if name in COMBAT_FIXTURES:
		return _load_terminal_combat(run)
	if name.begins_with("floor_"):
		return _load_deep_floor(run, name)
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

## terminal_line_combat: arm the front four with one of each firearm family, then begin a REAL Terminal Line
## encounter — the reviewer lands in combat and can judge the #26 feel live (全員でかかる [F] to see every
## gun's tempo in one round; a plain 攻撃 for a single quiet number; keep firing for the defeat sink).
static func _load_terminal_combat(run: Object) -> String:
	run.world_id = "terminal-line"
	run.reset()
	var state: Dictionary = run.state
	var party: Array = (state.get("party", []) as Array)
	for i in mini(party.size(), TL_GUNS.size()):
		var m: Dictionary = (party[i] as Dictionary)
		var eq: Dictionary = ((m.get("equipment", {}) as Dictionary)).duplicate(true)
		eq["weapon"] = {"id": TL_GUNS[i]}
		m["equipment"] = eq
		party[i] = m
	state["party"] = party
	run.state = state
	var enemies: Array = run.world.get("enemies", [])
	if enemies.is_empty():
		return ""
	Encounter.begin(run.state, run.world, "room.tl1f.entrance", String((enemies[0] as Dictionary).get("id", "")))
	return "res://scenes/combat.tscn"

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

## Stand the party ON a Terminal Line stair cell, FACING its stair edge, so a reviewer sees the descent/ascent
## art in one selection. Down = tl1f's platform stairs; up = tl2f's emergency stair.
static func _load_terminal_stair(run: Object, name: String) -> String:
	run.world_id = "terminal-line"
	run.reset()
	var is_down := name == "terminal_line_down_stair"
	var floor_id := "dungeon.tl1f" if is_down else "dungeon.tl2f"
	var room_id := "room.tl1f.down-stair" if is_down else "room.tl2f.up-stair"
	var target: Dictionary = {}
	for dungeon in run.world.get("dungeons", []):
		if String((dungeon as Dictionary).get("id", "")) != floor_id:
			continue
		for cell in ((dungeon as Dictionary).get("grid", {}) as Dictionary).get("cells", []):
			if String((cell as Dictionary).get("roomId", "")) == room_id:
				target = cell
	if target.is_empty():
		return ""
	var facing := "south"
	for dir in ["north", "south", "east", "west"]:
		var e: Variant = (target.get("edges", {}) as Dictionary).get(dir, null)
		if typeof(e) == TYPE_DICTIONARY and String((e as Dictionary).get("kind", "")) == "stairs":
			facing = dir
	var cid := String(target.get("id", ""))
	var state: Dictionary = run.state
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": cid, "roomId": room_id, "facing": facing}
	state["map"] = {
		"floorId": floor_id, "currentCellId": cid, "currentRoomId": room_id, "currentFacing": facing,
		"visitedCells": [cid], "visitedRooms": [room_id], "knownExits": {},
	}
	run.state = state
	return "res://scenes/dungeon.tscn"

## floor_N (N=2..10): stand a DEPTH-APPROPRIATE party on floor N of the CURRENT world so a reviewer can
## actually see mid/late floor geometry, the full map (M), and encounters — not just B1F (IMP-062, the user's
## "中盤・終盤のセーブがないので1Fしか確認できてない"). World-parametrized: pick the world in the debug panel
## first (default or verdant), then the floor. The generic review party is levelled via the ported Leveling so
## it survives the walk-through instead of being one-shot at depth. Never mounted in normal play.
static func _load_deep_floor(run: Object, name: String) -> String:
	var n := int(name.trim_prefix("floor_"))
	if n < 1:
		return ""
	run.ensure_loaded()
	var dungeons: Array = run.world.get("dungeons", [])
	if n - 1 < 0 or n - 1 >= dungeons.size():
		return ""
	var dungeon: Dictionary = dungeons[n - 1]
	var landing := _floor_landing(dungeon)
	if landing.is_empty():
		return ""
	var level := clampi(n + 2, 4, 12)   # a rough depth curve: floor 2 → Lv4 … floor 8 → Lv10
	var state: Dictionary = (run.state as Dictionary).duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	var party := []
	for m in state.get("party", []):
		var lm: Dictionary = (m as Dictionary).duplicate(true)
		lm["xp"] = Leveling.xp_for_level(level)
		lm = Leveling.apply_level_ups(lm)["character"]
		lm["hp"] = int(lm.get("maxHp", 1))   # walk in at full so a review isn't cut short by attrition
		lm["mp"] = int(lm.get("maxMp", 0))
		party.append(lm)
	state["party"] = party
	state["position"] = {"cellId": landing["cellId"], "roomId": landing["roomId"], "facing": landing["facing"]}
	# REVEAL the whole floor on the map — the review needs to see the entire layout at once (the user's
	# "Map含め評価"), not a 1%-explored fog. The party still stands at the landing in the first-person view;
	# this only fills the automap's visited sets so the full map (M) shows the complete floor.
	var all_cells := []
	var all_rooms := {}
	for c in (dungeon.get("grid", {}) as Dictionary).get("cells", []):
		all_cells.append(String((c as Dictionary).get("id", "")))
		var rid := String((c as Dictionary).get("roomId", ""))
		if rid != "":
			all_rooms[rid] = true
	state["map"] = {
		"floorId": String(dungeon.get("id", "")),
		"currentCellId": landing["cellId"],
		"currentRoomId": landing["roomId"],
		"currentFacing": landing["facing"],
		"visitedCells": all_cells,
		"visitedRooms": all_rooms.keys(),
		"knownExits": {},
	}
	run.state = state
	return "res://scenes/dungeon.tscn"

## The floor's landing: its `.001` cell (else the first cell), faced toward an actual opening so the
## first-person view isn't a blank wall (the reviewer can still turn to inspect every side).
static func _floor_landing(dungeon: Dictionary) -> Dictionary:
	var cells: Array = (dungeon.get("grid", {}) as Dictionary).get("cells", [])
	var chosen: Dictionary = {}
	for c in cells:
		if String((c as Dictionary).get("id", "")).ends_with(".001"):
			chosen = c
			break
	if chosen.is_empty() and not cells.is_empty():
		chosen = cells[0]
	if chosen.is_empty():
		return {}
	var facing := "south"
	for d in ["south", "east", "north", "west"]:
		if _is_passage((chosen.get("edges", {}) as Dictionary).get(d, null)):
			facing = d
			break
	return {"cellId": String(chosen.get("id", "")), "roomId": String(chosen.get("roomId", "")), "facing": facing}

static func _is_passage(edge: Variant) -> bool:
	if typeof(edge) != TYPE_DICTIONARY:
		return false
	return String((edge as Dictionary).get("kind", "")) in ["open", "door", "one_way", "stairs", "shortcut", "secret"]

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

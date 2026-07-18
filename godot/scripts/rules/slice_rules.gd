class_name SliceRules
## The GDScript port of the vertical slice's command rules (mirrors src/domain/rulesEngine.ts). It
## operates directly on the JSON-shaped state Dictionary so the result hashes identically to the TS
## oracle. Ported so far: turn_left / turn_right / listen. Movement, search, and combat follow.
##
## resolve() returns { "state": Dictionary, "events": Array } — the same CommandResult shape as TS.

const LEFT_OF := {"north": "west", "west": "south", "south": "east", "east": "north"}
const RIGHT_OF := {"north": "east", "east": "south", "south": "west", "west": "north"}

static func resolve(state: Dictionary, command: Dictionary) -> Dictionary:
	match command.get("type", ""):
		"turn_left":
			return _turn(state, "left")
		"turn_right":
			return _turn(state, "right")
		"listen":
			return _log_only(state, {"type": "inspection_made", "mode": "listen"})
		_:
			# Not yet ported — a no-op keeps the replay honest (the harness will flag the hash mismatch).
			return {"state": state, "events": []}

# turn(state, side): rotate facing, update position + map.currentFacing, +1 turn, party_turned event.
static func _turn(state: Dictionary, side: String) -> Dictionary:
	if state.get("position", null) == null or state.get("phase", "") != "dungeon":
		return {"state": state, "events": []}
	var facing: String = (LEFT_OF if side == "left" else RIGHT_OF)[state["position"]["facing"]]
	var next: Dictionary = state.duplicate(true)
	next["position"]["facing"] = facing
	if not next.has("map"):
		next["map"] = {}
	next["map"]["currentFacing"] = facing
	next["turn"] = int(next["turn"]) + 1
	return {"state": next, "events": [{"type": "party_turned", "side": side, "facing": facing}]}

# logOnly(state, event): +1 turn, emit the one event (no other state change).
static func _log_only(state: Dictionary, event: Dictionary) -> Dictionary:
	var next: Dictionary = state.duplicate(true)
	next["turn"] = int(next["turn"]) + 1
	return {"state": next, "events": [event]}

extends RefCounted
## IMP-051 — the dungeon's held-key AUTO-REPEAT. One press steps once; after HOLD_DELAY the party keeps
## stepping every HOLD_RATE while the key stays down. This collaborator owns only the TIMING and the held
## action — the scene supplies the move callback and the stop condition (a fight / chest / open modal /
## phase change blocks the repeat), and remains the sole command dispatcher.

const HOLD_DELAY := 0.30   # a held key waits this long before it starts repeating (so a tap is one step)
const HOLD_RATE := 0.16    # then repeats at this interval

var _held_action: String = ""
var _hold_elapsed: float = 0.0
var _repeat_accum: float = 0.0

## The action currently held ("" if none) — read by the controller gate.
func held() -> String:
	return _held_action

## Begin holding `action`: step once now (through the scene's move callback), then arm the repeat.
func begin(action: String, on_move: Callable) -> void:
	on_move.call(action)
	_held_action = action
	_hold_elapsed = 0.0
	_repeat_accum = 0.0

func stop() -> void:
	_held_action = ""

## Advance the repeat by `delta`. `blocked` is the scene's stop condition; the key being released also
## stops it. Steps (via on_move) each HOLD_RATE once HOLD_DELAY has passed.
func tick(delta: float, blocked: bool, on_move: Callable) -> void:
	if _held_action == "":
		return
	if blocked or not Input.is_action_pressed(_held_action):
		_held_action = ""
		return
	_hold_elapsed += delta
	if _hold_elapsed < HOLD_DELAY:
		return
	_repeat_accum += delta
	if _repeat_accum >= HOLD_RATE:
		_repeat_accum = 0.0
		on_move.call(_held_action)

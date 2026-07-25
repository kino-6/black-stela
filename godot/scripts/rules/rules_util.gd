extends RefCounted
## Tiny shared helpers for the command handlers, extracted so the dispatcher and the leaf command modules
## use ONE copy (IMP-050). `log_only` records an event AND advances the turn (it is NOT a bare wrapper —
## the turn increment is game truth), so a handler that only observes still costs a turn like the oracle.

static func log_only(state: Dictionary, event: Dictionary) -> Dictionary:
	var next: Dictionary = state.duplicate(true)
	next["turn"] = int(next["turn"]) + 1
	return {"state": next, "events": [event]}

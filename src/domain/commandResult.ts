import { appendEventLogs } from "./replayLog";
import type { GameEvent, GameState } from "./types";

// The shape every command handler returns: the next state plus the events that produced it. Kept in
// its own leaf module so command-handler modules (domain/commands/*) and the dispatcher (rulesEngine)
// can share it without a circular import.
export interface CommandResult {
  state: GameState;
  events: GameEvent[];
}

// A state change described by events — the log is projected from the same events, so state and log
// never drift.
export function withEvents(state: GameState, events: GameEvent[]): CommandResult {
  return {
    state: {
      ...state,
      log: appendEventLogs(state, events)
    },
    events
  };
}

// A command that legally does nothing (guard failed, nothing to do) — no state change, no events.
export function noChange(state: GameState): CommandResult {
  return { state, events: [] };
}

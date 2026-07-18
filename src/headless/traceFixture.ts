import { resolveCommand } from "../domain/rulesEngine";
import { withDeterministicIds } from "../domain/ids";
import type { Command, GameEvent, GameState, ScenarioWorld } from "../domain/types";

// Re-exported so a caller can build the INITIAL state under the same deterministic id sequence used to
// replay it — full-play golden traces (routes that mint character ids) then reproduce byte-for-byte.
export { withDeterministicIds } from "../domain/ids";

// Deterministic trace fixtures — the parity oracle for the Godot / Babylon migration comparison
// (docs/design/godot-migration-plan.md, Phase 0). A trace is an initial state, a command sequence,
// and — after each command — the emitted events plus a hash of the resulting state. Because the rules
// engine is deterministic (seeded RNG, no wall-clock), a candidate runtime replaying the same commands
// against the same start MUST reproduce the same events and hashes, or it has drifted.
//
// The hash is intentionally a trivial, well-specified function (canonical JSON → FNV-1a 32-bit) so a
// GDScript or other-language port can reimplement it byte-for-byte and compare. It is NOT a security
// hash; it is a cheap fingerprint of canonical state.

// Canonical JSON: object keys sorted, `undefined` dropped, arrays kept in order. Two states that are
// structurally equal serialize identically regardless of key insertion order.
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

// FNV-1a, 32-bit, lowercase 8-hex. Deterministic and trivially portable across languages.
export function traceHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime multiply, kept in unsigned 32-bit space.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// The adventure log is a DERIVED projection whose per-entry ids are `crypto.randomUUID()`
// (replayLog.ts) — non-semantic and non-deterministic. The parity hash fingerprints game *truth*, so
// it excludes the log; the semantic content (events) is captured per-step and compared directly.
//
// Migration note: a runtime port must reproduce the same EVENTS per command, not the same log ids. If
// a trace ever needs full-state reproducibility (e.g. commands that mint character ids via
// crypto.randomUUID), id generation should be made injectable/seedable first — see
// docs/design/godot-migration-plan.md.
export function hashState(state: GameState): string {
  const { log: _log, ...gameTruth } = state;
  return traceHash(stableStringify(gameTruth));
}

export interface TraceStep {
  command: Command;
  events: GameEvent[];
  stateHash: string;
}

export interface Trace {
  initialStateHash: string;
  steps: TraceStep[];
  finalStateHash: string;
}

// Fold a command sequence through the production rules, recording each step. Pure: it never mutates
// the input state. The fold runs under a deterministic id sequence (`seed`) so any ids minted along
// the route (log entries, mid-route character creation) reproduce across replays and runtimes — build
// the initial state under the same seed via `withDeterministicIds` for a fully reproducible route.
export function runTrace(world: ScenarioWorld, initial: GameState, commands: Command[], seed = "trace"): Trace {
  return withDeterministicIds(seed, () => {
    const initialStateHash = hashState(initial);
    const steps: TraceStep[] = [];
    let state = initial;
    for (const command of commands) {
      const result = resolveCommand(state, world, command);
      state = result.state;
      steps.push({ command, events: result.events, stateHash: hashState(state) });
    }
    return { initialStateHash, steps, finalStateHash: hashState(state) };
  });
}

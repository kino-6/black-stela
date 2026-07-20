import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Command, GameState } from "../src/domain/types";
import { hashState, runTrace, stableStringify, traceHash, withDeterministicIds } from "../src/headless/traceFixture";

// The deterministic trace fixture is the parity oracle for the Godot / Babylon migration comparison
// (docs/archive/godot-migration-plan.runtime-comparison.md, Phase 0). These tests lock the two properties the whole
// approach depends on: the engine is DETERMINISTIC (same start + commands → same events + hashes), and
// the state hash is CANONICAL (structurally equal states hash identically, whatever the key order).

function combatStart(): GameState {
  const hero = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "trace" }), row: "front" as const };
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime") ?? defaultWorld.enemies[0];
  const base = { ...createInitialGameState(), party: [hero] };
  return {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
}

// Three rounds of "the front line attacks the front group" — exercises the seeded combat RNG, which
// is exactly the path most likely to drift in a re-implementation.
function attackRounds(state: GameState, rounds: number): Command[] {
  const group = state.combat!.enemyGroups[0];
  const actions = state.party
    .filter((member) => member.hp > 0)
    .map((member) => ({ actorId: member.id, action: "attack" as const, targetGroupId: group.id }));
  return Array.from({ length: rounds }, () => ({ type: "declare_round", actions }) satisfies Command);
}

describe("deterministic trace fixture (migration parity oracle)", () => {
  it("replays a combat sequence to identical events and state hashes", () => {
    const start = combatStart();
    const commands = attackRounds(start, 3);

    const a = runTrace(defaultWorld, start, commands);
    const b = runTrace(defaultWorld, start, commands);

    // The seeded engine is deterministic: two replays of the same start + commands reproduce the
    // same events and the same state hashes (once the log's crypto.randomUUID ids are excluded).
    expect(a).toEqual(b);
    // The trace is non-trivial — every command is recorded, the first round changed the state and
    // emitted events, and every step carries a well-formed 8-hex fingerprint.
    expect(a.steps).toHaveLength(3);
    expect(a.steps[0].stateHash).not.toBe(a.initialStateHash);
    expect(a.steps[0].events.length).toBeGreaterThan(0);
    for (const step of a.steps) {
      expect(step.stateHash).toMatch(/^[0-9a-f]{8}$/);
    }
    // The fight resolves within the sequence (the weak slime falls), so a later round is a legal
    // no-op — captured deterministically, not an error.
    expect(a.steps.some((step) => step.events.length === 0)).toBe(true);
  });

  it("reproduces character ids across builds under deterministic ids (full-play parity prerequisite)", () => {
    // Building a party mints character ids via crypto.randomUUID by default — random every call, so two
    // fresh builds would never hash-match. Under withDeterministicIds they become a reproducible seeded
    // sequence, which is what lets a full-play golden trace (a route that mints ids) parity-check.
    const build = () =>
      withDeterministicIds("party", () => ({
        ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "x" })
      }));

    const a = build();
    const b = build();
    expect(a.id).toBe(b.id); // deterministic — same seeded id
    expect(a.id).toMatch(/^party-/); // from the seeded generator, not a random UUID

    // Outside the scope, ids are back to unique-per-call (production behaviour is preserved).
    const random1 = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "x" });
    const random2 = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "x" });
    expect(random1.id).not.toBe(random2.id);
  });

  it("hashes canonically — key order does not change the fingerprint, real differences do", () => {
    const start = combatStart();
    // Same state, different top-level key insertion order → identical canonical hash.
    const reordered = Object.fromEntries(Object.entries(start).reverse()) as unknown as GameState;
    expect(hashState(reordered)).toBe(hashState(start));

    // A genuine change (one extra turn elapsed) must change the hash.
    expect(hashState({ ...start, turn: start.turn + 1 })).not.toBe(hashState(start));

    // stableStringify drops undefined and sorts keys; the primitive hash is stable and portable.
    expect(stableStringify({ b: 1, a: undefined, c: [3, 2] })).toBe('{"b":1,"c":[3,2]}');
    expect(traceHash("black-stela")).toBe(traceHash("black-stela"));
    expect(traceHash("a")).not.toBe(traceHash("b"));
  });
});

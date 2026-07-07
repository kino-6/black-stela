import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function partyOf(count: number): GameState {
  let state = createInitialGameState();
  for (let index = 0; index < count; index += 1) {
    state = addCharacter(state, createCharacter({ name: `P${index}`, notes: "x" }));
  }
  return state;
}

describe("guild roster membership", () => {
  it("benches a party member to the reserve in town", () => {
    const state = partyOf(2);
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "bench_member", characterId: member.id });

    expect(after.party.some((candidate) => candidate.id === member.id)).toBe(false);
    expect(after.reserve.map((candidate) => candidate.id)).toContain(member.id);
  });

  it("recalls a benched adventurer back into the party", () => {
    const state = partyOf(2);
    const member = state.party[0];
    const afterBench = executeCommand(state, defaultWorld, { type: "bench_member", characterId: member.id });
    expect(afterBench.reserve).toHaveLength(1);

    const afterRecall = executeCommand(afterBench, defaultWorld, { type: "recall_member", characterId: member.id });
    expect(afterRecall.reserve).toHaveLength(0);
    expect(afterRecall.party.map((candidate) => candidate.id)).toContain(member.id);
  });

  it("refuses to bench mid-dungeon", () => {
    const state: GameState = { ...partyOf(2), phase: "dungeon" };
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "bench_member", characterId: member.id });

    expect(after.party.map((candidate) => candidate.id)).toContain(member.id);
    expect(after.reserve).toHaveLength(0);
  });

  it("refuses to recall when the party is already full", () => {
    const extra = createCharacter({ name: "R", notes: "x" });
    const state: GameState = { ...partyOf(6), reserve: [extra] };
    const after = executeCommand(state, defaultWorld, { type: "recall_member", characterId: extra.id });

    expect(after.party).toHaveLength(6);
    expect(after.reserve.map((candidate) => candidate.id)).toContain(extra.id);
  });
});

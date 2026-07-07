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

describe("guild retire lifecycle", () => {
  it("retires a member reversibly to the retired roll", () => {
    const state = partyOf(2);
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "retire_member", characterId: member.id });

    expect(after.party.some((c) => c.id === member.id)).toBe(false);
    expect(after.retired.map((c) => c.id)).toContain(member.id);
  });

  it("brings a retired adventurer back out of retirement", () => {
    const state = partyOf(2);
    const member = state.party[0];
    const retired = executeCommand(state, defaultWorld, { type: "retire_member", characterId: member.id });
    const back = executeCommand(retired, defaultWorld, { type: "unretire_member", characterId: member.id });

    expect(back.retired).toHaveLength(0);
    expect(back.reserve.map((c) => c.id)).toContain(member.id);
  });

  it("permanently erases a member from every roster", () => {
    const state = partyOf(2);
    const member = state.party[0];
    const retired = executeCommand(state, defaultWorld, { type: "retire_member", characterId: member.id });
    const erased = executeCommand(retired, defaultWorld, { type: "erase_member", characterId: member.id });

    expect(erased.party.some((c) => c.id === member.id)).toBe(false);
    expect(erased.reserve.some((c) => c.id === member.id)).toBe(false);
    expect(erased.retired.some((c) => c.id === member.id)).toBe(false);
  });

  it("refuses roster edits mid-dungeon", () => {
    const state: GameState = { ...partyOf(2), phase: "dungeon" };
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, { type: "retire_member", characterId: member.id });

    expect(after.party.map((c) => c.id)).toContain(member.id);
    expect(after.retired).toHaveLength(0);
  });
});

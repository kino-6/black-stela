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

const patch = (characterId: string, over: Partial<{ name: string; title: string; notes: string; accentColor: string }> = {}) => ({
  type: "edit_member_identity" as const,
  characterId,
  name: "Renamed",
  title: "the Rewritten",
  notes: "fresh record",
  accentColor: "#123456",
  ...over
});

describe("guild edit-identity lifecycle", () => {
  it("revises name, title, notes and accent for a party member", () => {
    const state = partyOf(2);
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, patch(member.id));
    const edited = after.party.find((c) => c.id === member.id);

    expect(edited?.name).toBe("Renamed");
    expect(edited?.title).toBe("the Rewritten");
    expect(edited?.notes).toBe("fresh record");
    expect(edited?.accentColor).toBe("#123456");
  });

  it("edits a retired adventurer in place", () => {
    const state = partyOf(2);
    const member = state.party[0];
    const retired = executeCommand(state, defaultWorld, { type: "retire_member", characterId: member.id });
    const after = executeCommand(retired, defaultWorld, patch(member.id, { name: "Ghost" }));

    expect(after.retired.find((c) => c.id === member.id)?.name).toBe("Ghost");
  });

  it("rejects a blank name", () => {
    const state = partyOf(1);
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, patch(member.id, { name: "   " }));

    expect(after.party.find((c) => c.id === member.id)?.name).toBe(member.name);
  });

  it("refuses identity edits mid-dungeon", () => {
    const state: GameState = { ...partyOf(1), phase: "dungeon" };
    const member = state.party[0];
    const after = executeCommand(state, defaultWorld, patch(member.id, { name: "NoChange" }));

    expect(after.party.find((c) => c.id === member.id)?.name).toBe(member.name);
  });
});

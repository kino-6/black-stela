import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { guardNarration, applyNarrationProposal } from "../src/services/aiPolicyGuard";
import { defaultWorld } from "../src/data/defaultWorld";

const state = addCharacter(createInitialGameState(), createCharacter({ name: "Rook", notes: "Quiet" }));

describe("AI policy guard", () => {
  it("rejects narration that speaks for a player character", () => {
    const guarded = guardNarration(state, defaultWorld, {
      source: "local_ai",
      prose: 'Rook says "I will open the door."'
    });

    expect(guarded.accepted).toBe(false);
    expect(guarded.reason).toMatch(/player character/i);
  });

  it("accepts environmental flavor that does not alter game truth", () => {
    const guarded = guardNarration(state, defaultWorld, {
      source: "local_ai",
      prose: "Water ticks somewhere behind the stone, counting the quiet."
    });

    expect(guarded.accepted).toBe(true);
  });

  it("never mutates canonical game state when applying a proposal", () => {
    const proposal = {
      source: "local_ai" as const,
      prose: "A new exit opens to the north."
    };

    expect(applyNarrationProposal(state, proposal)).toEqual(state);
    expect(applyNarrationProposal(state, proposal)).not.toBe(state);
  });
});

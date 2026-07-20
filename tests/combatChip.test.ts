import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { chooseAutoRoundActions } from "../src/domain/tempo";
import { getWorldById } from "../src/data/worldRegistry";
import type { Character, GameState } from "../src/domain/types";

// A CONNECTING attack that resistance rounds to 0 must still chip (65% chance of 1), so a heavily
// physical-resistant enemy (the metal-slime, physical ×0.1) is never STRICTLY un-damageable by a
// wrong-element party — a hard 0-wall reads as broken and stalls the fight. Bringing metal is still
// far better; this only removes the pure-zero floor.
describe("resisted-hit chip damage", () => {
  it("a physical party still wears down a physical-resistant metal-slime over time", () => {
    const world = getWorldById("verdant")!;
    const slime = world.enemies.find((e) => e.id === "enemy.verdant.rare.gilded-sporecloud")!; // physical 0.1
    expect((slime.weaknesses ?? {}).physical).toBeLessThan(1); // sanity: it resists physical

    let state = createInitialGameState();
    for (const name of ["Rook", "Vale", "Bran", "Mira", "Sei", "Lio"]) {
      state = addCharacter(state, createGuildCharacter({ name, classId: "warrior", seed: name }));
    }
    const party: Character[] = state.party.map((m, i) => ({ ...m, row: i < 3 ? "front" : "back", level: 3 }));
    state = { ...state, party, phase: "combat", combat: createCombatState("room.x", slime, 1) } as GameState;

    let rounds = 0;
    while (state.phase === "combat" && rounds < 40) {
      state = executeCommand(state, world, { type: "declare_round", actions: chooseAutoRoundActions(state, world) });
      rounds += 1;
    }
    expect(state.phase, `the physical-resistant enemy never died in 40 rounds (0-damage wall)`).not.toBe("combat");
    expect(rounds).toBeLessThan(40);
  });
});

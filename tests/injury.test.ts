import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import type { GameState } from "../src/domain/types";
import { defaultWorld } from "../src/data/defaultWorld";

function combatState(enemyAttack = 5): GameState {
  const member = createCharacter({ name: "Mira", notes: "Mapper" });
  return {
    ...addCharacter(createInitialGameState(), { ...member, hp: 2, maxHp: 12 }),
    phase: "combat",
    position: { roomId: "room.b1f.002", facing: "east" },
    combat: {
      roomId: "room.b1f.002",
      enemy: {
        id: "enemy.test",
        name: "Test Brute",
        hp: 20,
        attack: enemyAttack
      }
    }
  };
}

describe("injury, recovery, and combat choices", () => {
  it("marks severe damage as injury without deleting characters", () => {
    const next = executeCommand(combatState(), defaultWorld, { type: "attack" });

    expect(next.party).toHaveLength(1);
    expect(next.party[0]).toMatchObject({ hp: 1, injury: "wounded" });
    expect(next.log.map((entry) => entry.text)).toContain("Mira is wounded but remains in the party.");
  });

  it("recovers HP and clears injuries in town", () => {
    const state = {
      ...combatState(),
      phase: "town" as const,
      combat: null,
      party: combatState().party.map((member) => ({ ...member, hp: 1, injury: "wounded" as const }))
    };

    const recovered = executeCommand(state, defaultWorld, { type: "recover_party" });

    expect(recovered.party[0]).toMatchObject({ hp: 12, injury: undefined });
    expect(recovered.log.at(-1)?.text).toMatch(/rests in town/i);
  });

  it("defend reduces incoming damage deterministically", () => {
    const defended = executeCommand(combatState(4), defaultWorld, { type: "defend" });

    expect(defended.party[0].hp).toBe(1);
    expect(defended.party[0].injury).toBeUndefined();
    expect(defended.log.at(-1)?.tags).toContain("defend");
  });

  it("uses a healing item deterministically and persists inventory count", () => {
    const state = combatState(1);
    const healed = executeCommand(state, defaultWorld, {
      type: "use_item",
      itemId: "item.healing-draught",
      targetCharacterId: state.party[0].id
    });

    expect(healed.party[0].hp).toBe(8);
    expect(healed.inventory[0].quantity).toBe(0);
    expect(healed.log.at(-1)?.text).toContain("Healing Draught");
  });
});

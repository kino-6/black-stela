import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import { parseSaveDataV1, toSaveDataV1 } from "../src/domain/saveData";

function stateWithParty() {
  return addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" }));
}

describe("rosterMemory", () => {
  it("tracks first expedition, deepest floor, victories, and retreats", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    expect(entered.party[0].memory.firstExpeditionTurn).toBe(1);
    expect(entered.party[0].memory.deepestFloorId).toBe("dungeon.b1f");

    const firstFight = executeCommand(entered, defaultWorld, { type: "move_forward" });
    const retreated = executeCommand(firstFight, defaultWorld, { type: "retreat" });
    expect(retreated.party[0].memory.retreats).toBe(1);

    let current = executeCommand(entered, defaultWorld, { type: "move_forward" });
    for (let round = 0; round < 6 && current.phase === "combat"; round += 1) {
      current = executeCommand(current, defaultWorld, { type: "attack" });
    }

    expect(current.party[0].memory.notableVictories).toContain("Ash Slime");
  });

  it("migrates older saves with empty roster memory", () => {
    const save = toSaveDataV1(stateWithParty(), defaultWorld, { savedAt: "2026-07-03T00:00:00.000Z" });
    const legacyCharacter = { ...save.state.party[0] };
    delete (legacyCharacter as Partial<typeof legacyCharacter>).memory;

    const parsed = parseSaveDataV1({
      ...save,
      state: {
        ...save.state,
        party: [legacyCharacter]
      }
    });

    expect(parsed.state.party[0].memory).toEqual({
      injuries: 0,
      retreats: 0,
      notableVictories: [],
      deeds: []
    });
  });
});

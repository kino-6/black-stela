import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand, resolveCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";

function stateWithParty() {
  return addCharacter(
    createInitialGameState(),
    createCharacter({ name: "Mira", notes: "Mapper", portraitRef: "data:image/png;base64,AAA" })
  );
}

describe("rules engine", () => {
  it("requires a party before entering the dungeon", () => {
    const state = executeCommand(createInitialGameState(), defaultWorld, { type: "enter_dungeon" });

    expect(state.phase).toBe("town");
    expect(state.log.at(-1)?.text).toMatch(/party is required/i);
  });

  it("emits typed events and projects them into canonical log entries", () => {
    const result = resolveCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });

    expect(result.events).toContainEqual({
      type: "dungeon_entered",
      roomId: "room.b1f.001",
      facing: "east"
    });
    expect(result.state.log.at(-1)).toMatchObject({
      text: "The party descends beneath the black stela.",
      tags: ["dungeon"]
    });
  });

  it("enters the dungeon and triggers deterministic trap and combat on movement", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const moved = executeCommand(entered, defaultWorld, { type: "move_forward" });

    expect(moved.phase).toBe("combat");
    expect(moved.position?.roomId).toBe("room.b1f.002");
    expect(moved.resolvedTraps).toContain("trap.b1f.needle");
    expect(moved.party[0].hp).toBe(10);
    expect(moved.combat?.enemy.name).toBe("Ash Slime");
    expect(moved.log.map((entry) => entry.text)).toEqual(
      expect.arrayContaining([
        "The party advances into Hall of Old Dust.",
        "A hidden needle plate snaps shut. The party is injured, but nobody is erased.",
        "Ash Slime blocks the passage."
      ])
    );
  });

  it("resolves combat and allows a recovery return to town without deleting characters", () => {
    const entered = executeCommand(stateWithParty(), defaultWorld, { type: "enter_dungeon" });
    const moved = executeCommand(entered, defaultWorld, { type: "move_forward" });
    const afterAttack = executeCommand(moved, defaultWorld, { type: "attack" });
    const town = executeCommand(afterAttack, defaultWorld, { type: "return_to_town" });

    expect(afterAttack.phase).toBe("dungeon");
    expect(afterAttack.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(town.phase).toBe("town");
    expect(town.party).toHaveLength(1);
    expect(town.party[0].hp).toBe(town.party[0].maxHp);
  });
});

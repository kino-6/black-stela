import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function fightAgainst(enemyId: string): GameState {
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === enemyId)!;
  const base = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Cael", classId: "mender", seed: "ai" }));
  return {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
}

describe("enemy AI", () => {
  it("carries authored abilities in the world data", () => {
    const ward = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b4f.lantern-ward");
    expect(ward?.abilities?.length ?? 0).toBeGreaterThan(0);
  });

  it("uses an ability instead of a plain attack over a few rounds", () => {
    let state = fightAgainst("enemy.b4f.lantern-ward");
    let sawAbility = false;

    for (let round = 0; round < 8 && state.phase === "combat"; round += 1) {
      const actor = state.party[0];
      state = executeCommand(state, defaultWorld, {
        type: "declare_round",
        actions: [{ actorId: actor.id, action: "defend" }]
      });
      if (state.log.some((entry) => /Lantern Flare|Blinding Glare/.test(entry.text))) {
        sawAbility = true;
        break;
      }
    }

    expect(sawAbility).toBe(true);
  });
});

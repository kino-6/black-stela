import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { applyLevelUps, xpForLevel } from "../src/domain/leveling";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function fightAgainst(enemyId: string): GameState {
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === enemyId)!;
  // Level the defender up so it outlasts the (now hard-hitting) ward long enough for its 40%-chance
  // ability to roll — otherwise the test measures the new damage, not the AI.
  const raised = applyLevelUps({ ...createGuildCharacter({ name: "Cael", classId: "bulwark", seed: "ai" }), level: 1, xp: xpForLevel(8) }).character;
  const base = addCharacter(createInitialGameState(), { ...raised, hp: raised.maxHp });
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

import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function fightAgainst(enemyId: string): GameState {
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === enemyId)!;
  const base = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Cael", classId: "occultist", seed: "e" }));
  return {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
}

describe("elements & weakness", () => {
  it("firebolt hits a fire-weak enemy harder and flags it", () => {
    const combat = fightAgainst("enemy.b3f.bitter-mote"); // fire: 1.5
    const actor = combat.party[0];
    const group = combat.combat!.enemyGroups[0];

    const after = executeCommand(combat, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "firebolt", targetGroupId: group.id }]
    });

    expect(after.log.some((entry) => entry.text.includes("(weak!)"))).toBe(true);
    expect(after.defeatedEnemies).toContain("enemy.b3f.bitter-mote");
  });

  it("carries authored element weaknesses/resistances in the world data", () => {
    const mote = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b3f.bitter-mote");
    const keeper = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b5f.cinder-keeper");
    expect(mote?.weaknesses?.fire).toBeGreaterThan(1);
    expect(keeper?.weaknesses?.fire).toBeLessThan(1);
  });
});

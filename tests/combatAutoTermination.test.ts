import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createSquadCombatState, executeCommand } from "../src/domain/rulesEngine";
import { chooseAutoRoundActions } from "../src/domain/tempo";
import { getWorldById } from "../src/data/worldRegistry";
import { defaultWorld } from "../src/data/defaultWorld";
import type { Character, GameState, ScenarioWorld, Enemy } from "../src/domain/types";

// Regression: auto-battle used to hang FOREVER against a front-blocker / back-caster squad.
// chooseAutoRoundActions targeted `enemyGroups.find(count>0)` — the first LIVING group — but the
// enemy turn re-sorts the groups by speed, so after round one the faster (shielded, elevation=air)
// back caster became "first". Every auto swing then landed on a group a melee attack cannot reach
// (a front blocker still stood), was blocked, dealt no damage, and the fight never ended. Auto now
// targets the first MELEE-REACHABLE group, so it fells the front line, then the exposed back line.
function squadFight(world: ScenarioWorld, front: Enemy, back: Enemy): GameState {
  let state = createInitialGameState();
  const roster: { name: string; front: boolean }[] = [
    { name: "Rook", front: true },
    { name: "Vale", front: true },
    { name: "Bran", front: true },
    { name: "Mira", front: false },
    { name: "Sei", front: false },
    { name: "Lio", front: false }
  ];
  for (const { name } of roster) {
    state = addCharacter(state, createGuildCharacter({ name, classId: name === "Mira" || name === "Sei" || name === "Lio" ? "occultist" : "warrior", seed: name }));
  }
  const party: Character[] = state.party.map((member, index) => ({ ...member, row: roster[index].front ? "front" : "back", level: 2 }));
  return { ...state, party, phase: "combat", combat: createSquadCombatState("room.squad", [front, back]) } as GameState;
}

function runAuto(world: ScenarioWorld, state: GameState, cap = 40): { rounds: number; phase: GameState["phase"] } {
  let current = state;
  let rounds = 0;
  while (current.phase === "combat" && rounds < cap) {
    current = executeCommand(current, world, { type: "declare_round", actions: chooseAutoRoundActions(current, world) });
    rounds += 1;
  }
  return { rounds, phase: current.phase };
}

describe("auto-battle terminates against a shielded squad", () => {
  it("clears the Verdant G2 keep (bramble-shield + spore-caster) instead of hanging", () => {
    const world = getWorldById("verdant")!;
    const shield = world.enemies.find((e) => e.id === "enemy.verdant.g2.bramble-shield")!;
    const caster = world.enemies.find((e) => e.id === "enemy.verdant.g2.spore-caster")!;
    const result = runAuto(world, squadFight(world, shield, caster));
    expect(result.phase, `auto-battle did not end (still in combat after ${result.rounds} rounds)`).not.toBe("combat");
    expect(result.rounds).toBeLessThan(20);
  });

  it("clears the ash-warden / ash-caller squad in the default world", () => {
    const warden = defaultWorld.enemies.find((e) => e.id === "enemy.b2f.ash-warden")!;
    const caller = defaultWorld.enemies.find((e) => e.id === "enemy.b2f.ash-caller")!;
    const result = runAuto(defaultWorld, squadFight(defaultWorld, warden, caller));
    expect(result.phase, `auto-battle did not end (still in combat after ${result.rounds} rounds)`).not.toBe("combat");
    expect(result.rounds).toBeLessThan(20);
  });
});

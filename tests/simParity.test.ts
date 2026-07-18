import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { equipPartyForEnemy, resolveFight, type PlannedEncounter } from "../src/headless/descentSim";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { createDebugStateFromProgress } from "../src/debug/debugStart";
import type { GameState } from "../src/domain/types";

// IMP-023V — simulator ↔ production parity. The deterministic descent simulator must resolve fights
// ONLY through the production engine (createCombatState + declare_round + applyLevelUps), never a
// re-implemented damage/hit/leveling formula. That is what lets a seeded simulator outcome match
// what a browser session actually rolls, and it is the drift the "duplicated formulas" past-trouble
// warns about. This gate resolves the SAME kitted encounter two ways — through resolveFight, and
// through an INDEPENDENT production combat loop written here — and requires byte-identical party
// state. If anyone ever reimplements combat math inside the simulator, these diverge and this fails.
describe("simulator ↔ production parity (IMP-023V)", () => {
  const world = worldRegistry.default;

  // An independent production resolution of a planned encounter — the oracle. Deliberately NOT a call
  // into descentSim: it drives createCombatState + declare_round itself, so it can only agree with
  // resolveFight if resolveFight is also delegating to the real engine.
  function oracleResolve(state: GameState, encounter: PlannedEncounter, policy: "naive" | "prepared"): GameState {
    const kitted = { ...state, party: equipPartyForEnemy(state.party, world, encounter.enemy, policy) };
    let current: GameState = {
      ...kitted,
      phase: "combat",
      combat: createCombatState(kitted.position?.roomId ?? "sim", encounter.enemy, encounter.count)
    };
    for (let round = 0; round < 80 && current.phase === "combat"; round += 1) {
      const target = current.combat?.enemyGroups.find((group) => group.count > 0);
      const front = current.party.filter((member) => member.row === "front" && member.hp > 0 && !member.injury);
      const actors = front.length > 0 ? front : current.party.filter((member) => member.hp > 0 && !member.injury);
      if (!target || actors.length === 0) {
        break;
      }
      current = executeCommand(current, world, {
        type: "declare_round",
        actions: actors.map((actor) => ({ actorId: actor.id, action: "attack" as const, targetGroupId: target.id }))
      });
    }
    return current;
  }

  const base = createDebugStateFromProgress(world, "ready");

  for (const policy of ["naive", "prepared"] as const) {
    for (const enemyId of ["enemy.b1f.ash-slime", "enemy.b3f.cistern-warden"]) {
      it(`resolveFight equals an independent production loop — ${enemyId} / ${policy}`, () => {
        const enemy = world.enemies.find((candidate) => candidate.id === enemyId);
        expect(enemy, `${enemyId} exists in the default world`).toBeTruthy();
        const encounter: PlannedEncounter = { enemy: enemy!, count: 2 };
        const state: GameState = { ...base, party: base.party.map((member) => ({ ...member })) };

        const sim = resolveFight(state, world, encounter, policy).state;
        const oracle = oracleResolve(state, encounter, policy);

        // Same rolls → same survivors, HP, wounds, phase. (Seeds are turn/round/id strings, identical
        // because both start from the same state and drive the same createCombatState + rounds.)
        expect(sim.phase).toBe(oracle.phase);
        expect(sim.party.map((member) => member.hp)).toEqual(oracle.party.map((member) => member.hp));
        expect(sim.party.map((member) => member.injury ?? null)).toEqual(oracle.party.map((member) => member.injury ?? null));
        expect(sim.combat?.enemyGroups.map((group) => group.count) ?? []).toEqual(
          oracle.combat?.enemyGroups.map((group) => group.count) ?? []
        );
      });
    }
  }
});

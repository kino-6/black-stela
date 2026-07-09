import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import {
  createSquadCombatState,
  executeCommand,
  hasStandingFrontEnemy,
  meleeTargetableGroup,
  resolveCommand
} from "../src/domain/rulesEngine";
import { runTempoStep } from "../src/domain/tempo";
import { defaultWorld } from "../src/data/defaultWorld";
import { createTranslator } from "../src/i18n";
import type { GameState } from "../src/domain/types";

// #4: a front blocker shields a back-line caster, so Attack-spam can't win. The
// player must break the front (slow — the warden resists physical) or reach past it
// with a spell, and Repeat hands control back. These lock that behaviour.
const warden = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b2f.ash-warden")!;
const caller = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b2f.ash-caller")!;

function squadFight(): GameState {
  let state = createInitialGameState();
  state = addCharacter(state, createGuildCharacter({ name: "Bran", classId: "vanguard", seed: "sq-front" }));
  state = addCharacter(state, createGuildCharacter({ name: "Cael", classId: "occultist", seed: "sq-cast" }));
  const party = state.party.map((member, index) => ({ ...member, row: index === 0 ? "front" as const : "back" as const }));
  return { ...state, party, phase: "combat", combat: createSquadCombatState("room.b2f.005", [warden, caller]) } as GameState;
}

describe("front-blocker / back-caster squad", () => {
  it("spawns a shielded back line", () => {
    const combat = createSquadCombatState("room.b2f.005", [warden, caller]);
    expect(combat.enemyGroups).toHaveLength(2);
    const [front, back] = combat.enemyGroups;
    expect(hasStandingFrontEnemy(combat.enemyGroups)).toBe(true);
    expect(meleeTargetableGroup(front, combat.enemyGroups)).toBe(true); // the warden
    expect(meleeTargetableGroup(back, combat.enemyGroups)).toBe(false); // the caller, shielded
  });

  it("exposes the caller only once the warden falls", () => {
    const combat = createSquadCombatState("room.b2f.005", [warden, caller]);
    const felledFront = { ...combat, enemyGroups: [{ ...combat.enemyGroups[0], count: 0 }, combat.enemyGroups[1]] };
    expect(hasStandingFrontEnemy(felledFront.enemyGroups)).toBe(false);
    expect(meleeTargetableGroup(felledFront.enemyGroups[1], felledFront.enemyGroups)).toBe(true);
  });

  it("blocks a melee swing at the shielded caller", () => {
    const state = squadFight();
    const callerGroup = state.combat!.enemyGroups[1];
    const { events } = resolveCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: state.party[0].id, action: "attack", targetGroupId: callerGroup.id }]
    });
    expect(events).toContainEqual(expect.objectContaining({ type: "combat_action_blocked", reason: "enemy_guarded" }));
  });

  it("the one-button Attack lands on the front warden, never the caller", () => {
    const state = squadFight();
    const [wardenGroup, callerGroup] = state.combat!.enemyGroups;
    const after = executeCommand(state, defaultWorld, { type: "attack" });
    // The caller is untouched; only the warden could have taken the hit.
    const afterCaller = after.combat?.enemyGroups.find((group) => group.id === callerGroup.id);
    expect(afterCaller?.count).toBe(callerGroup.count);
    expect(afterCaller?.hpEach).toBe(callerGroup.hpEach);
    void wardenGroup;
  });

  it("a spell reaches past the warden to hurt the caller", () => {
    const state = squadFight();
    const callerGroup = state.combat!.enemyGroups[1];
    const after = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: state.party[1].id, action: "cast", spellId: "firebolt", targetGroupId: callerGroup.id }]
    });
    const afterCaller = after.combat?.enemyGroups.find((group) => group.id === callerGroup.id);
    // Either the caller is dead, or its hp dropped — the spell bypassed the shield.
    expect(afterCaller === undefined || afterCaller.count === 0 || afterCaller.hpEach < callerGroup.hpEach).toBe(true);
  });

  it("the warden shrugs off physical blows (resists melee, weak to fire)", () => {
    expect(warden.weaknesses?.physical).toBe(0.5);
    expect(warden.weaknesses?.fire).toBeGreaterThan(1);
    expect(warden.hp).toBeGreaterThanOrEqual(12);
  });

  it("Repeat/tempo refuses to auto-grind the squad", () => {
    const t = createTranslator("en");
    const result = runTempoStep(squadFight(), "combat", defaultWorld, t);
    expect(result.keepRunning).toBe(false);
    expect(result.status).toBe(t("tempo.autoStoppedTactical"));
  });
});

import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { CombatStatus, GameState } from "../src/domain/types";

function slimeFight(): GameState {
  const start = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Cael", classId: "occultist", seed: "s" }));
  return executeCommand(executeCommand(start, defaultWorld, { type: "enter_dungeon" }), defaultWorld, { type: "move_forward" });
}

function withStatus(state: GameState, status: CombatStatus[]): GameState {
  return { ...state, party: state.party.map((member) => ({ ...member, status })) };
}

describe("status ailments", () => {
  it("a slept actor skips its turn and spends no MP", () => {
    const combat = slimeFight();
    const actor = combat.party[0];
    const group = combat.combat!.enemyGroups[0];

    const after = executeCommand(withStatus(combat, ["sleep"]), defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "firebolt", targetGroupId: group.id }]
    });

    expect(after.phase).toBe("combat"); // the bolt never went off
    expect(after.party[0].mp).toBe(actor.mp);
  });

  it("poison bites the party at round end", () => {
    const combat = slimeFight();
    const actor = combat.party[0];

    const after = executeCommand(withStatus(combat, ["poison"]), defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "defend" }]
    });

    expect(after.log.some((entry) => entry.text.includes("Poison gnaws"))).toBe(true);
  });
});

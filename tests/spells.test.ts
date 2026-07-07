import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { baseMaxMpForClass, isCasterClass, knownSpells } from "../src/domain/spells";
import { defaultWorld } from "../src/data/defaultWorld";
import type { CombatStatus, GameState } from "../src/domain/types";

function caster(classId: "occultist" | "mender"): GameState {
  return addCharacter(createInitialGameState(), createGuildCharacter({ name: "Cael", classId, seed: "spell-test" }));
}

function slimeFight(classId: "occultist" | "mender"): GameState {
  const entered = executeCommand(caster(classId), defaultWorld, { type: "enter_dungeon" });
  return executeCommand(entered, defaultWorld, { type: "move_forward" });
}

describe("spells", () => {
  it("teaches spells on a per-class level schedule", () => {
    expect(knownSpells("mender", 1)).toContain("heal");
    expect(knownSpells("occultist", 1)).toContain("firebolt");
    expect(knownSpells("occultist", 1)).not.toContain("sleep");
    expect(knownSpells("occultist", 3)).toContain("sleep");
    expect(knownSpells("vanguard", 99)).toHaveLength(0);
  });

  it("gives casters an MP pool and martials none", () => {
    const arcane = { might: 0, agility: 0, spirit: 2, wit: 1, luck: 0 };
    expect(isCasterClass("occultist")).toBe(true);
    expect(baseMaxMpForClass("occultist", arcane)).toBeGreaterThan(0);
    expect(baseMaxMpForClass("vanguard", arcane)).toBe(0);
  });

  it("casts an attack spell, spending MP and damaging the enemy", () => {
    const combat = slimeFight("occultist");
    expect(combat.phase).toBe("combat");
    const actor = combat.party[0];
    const group = combat.combat!.enemyGroups[0];

    const after = executeCommand(combat, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "firebolt", targetGroupId: group.id }]
    });

    expect(after.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(after.party[0].mp).toBe(actor.mp - 4);
  });

  it("silence blocks casting and spends no MP", () => {
    const combat = slimeFight("occultist");
    const actor = combat.party[0];
    const group = combat.combat!.enemyGroups[0];
    const silenced: GameState = {
      ...combat,
      party: combat.party.map((member) => ({ ...member, status: ["silence"] as CombatStatus[] }))
    };

    const after = executeCommand(silenced, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "firebolt", targetGroupId: group.id }]
    });

    expect(after.phase).toBe("combat"); // the bolt never landed
    expect(after.party[0].mp).toBe(actor.mp);
  });
});

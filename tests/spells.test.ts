import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { baseMaxMpForClass, isCasterClass, knownSpells } from "../src/domain/spells";
import { defaultWorld } from "../src/data/defaultWorld";
import type { CombatStatus, GameState } from "../src/domain/types";

function caster(classId: "occultist" | "priest" | "mage"): GameState {
  return addCharacter(createInitialGameState(), createGuildCharacter({ name: "Cael", classId, seed: "spell-test" }));
}

function slimeFight(classId: "occultist" | "priest" | "mage"): GameState {
  const entered = executeCommand(caster(classId), defaultWorld, { type: "enter_dungeon" });
  return executeCommand(entered, defaultWorld, { type: "move_forward" });
}

describe("spells", () => {
  it("teaches abilities on a per-class level schedule", () => {
    expect(knownSpells("priest", 1)).toContain("heal");
    // §9.4b: the Occultist no longer opens with the MAGE's firebolt — §5 forbids duplicating mage
    // damage with occult control — so it opens on control plus its own drain.
    expect(knownSpells("occultist", 1)).toContain("dread");
    expect(knownSpells("occultist", 1)).not.toContain("firebolt");
    expect(knownSpells("occultist", 1)).not.toContain("sleep");
    expect(knownSpells("occultist", 3)).toContain("sleep");
    // Front-row martial classes learn a 特技, not a spell.
    expect(knownSpells("warrior", 1)).toContain("power-strike");
    // §9.4b: the Knight has a line now. It used to know nothing at any level — a selectable class whose
    // only move was Attack.
    expect(knownSpells("knight", 1)).toContain("shield-wall");
    expect(knownSpells("knight", 3)).toContain("cover");
  });

  it("gives casters an MP pool, 特技 classes a smaller 気力 pool, and others none", () => {
    const stats = { might: 2, agility: 0, spirit: 2, wit: 1, luck: 0 };
    expect(isCasterClass("occultist")).toBe(true);
    expect(isCasterClass("warrior")).toBe(false); // 特技 user, not a caster
    expect(baseMaxMpForClass("occultist", stats)).toBeGreaterThan(0);
    // A front-row 特技 class has a pool, but a smaller one than a caster.
    expect(baseMaxMpForClass("warrior", stats)).toBeGreaterThan(0);
    expect(baseMaxMpForClass("warrior", stats)).toBeLessThan(baseMaxMpForClass("occultist", stats));
    // §9.4b: the Knight became a 特技 class, so it now has the martial pool its techniques spend. A
    // class with NO technique at all would still have none — that is what the zero branch is for.
    expect(baseMaxMpForClass("knight", stats)).toBe(baseMaxMpForClass("warrior", stats));
  });

  it("casts an attack spell, spending MP and damaging the enemy", () => {
    const combat = slimeFight("mage");
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
    const combat = slimeFight("mage");
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

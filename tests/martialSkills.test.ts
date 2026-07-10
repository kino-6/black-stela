import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import { isCasterClass, isMartialSkillClass, knownSpells } from "../src/domain/spells";
import { defaultWorld } from "../src/domain/../data/defaultWorld";

// 戦闘#8: front-row classes wield 特技 (martial skills), resolved through the same
// cast path as spells but flavored as strikes and spending the 気力 pool.
describe("front-row 特技", () => {
  it("classifies a 特技 class as martial, not a caster", () => {
    expect(isMartialSkillClass("vanguard")).toBe(true);
    expect(isCasterClass("vanguard")).toBe(false);
    expect(isMartialSkillClass("occultist")).toBe(false);
    expect(isMartialSkillClass("scout")).toBe(false);
    expect(knownSpells("seeker", 1)).toContain("power-strike");
  });

  it("power-strike lands as a physical strike, spending 気力, and can fell the slime", () => {
    const vanguard = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "ms" }));
    const entered = executeCommand(vanguard, defaultWorld, { type: "enter_dungeon" });
    const combat = executeCommand(entered, defaultWorld, { type: "move_forward" });
    expect(combat.phase).toBe("combat");
    const actor = combat.party[0];
    expect(actor.maxMp).toBeGreaterThan(0); // 気力 pool
    const group = combat.combat!.enemyGroups[0];

    const after = executeCommand(combat, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "power-strike", targetGroupId: group.id }]
    });

    // 気力 was spent and the strike landed (slime felled) — logged as a strike, not a scorch.
    expect(after.party[0].mp).toBe(actor.mp - 3);
    expect(after.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    const struck = after.log.some((entry) => entry.event?.type === "combat_round_resolved"
      && entry.event.summaries.some((line) => /strikes/.test(line)));
    expect(struck).toBe(true);
  });

  it("refuses power-strike when 気力 is exhausted, spending none", () => {
    const vanguard = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "ms" }));
    const entered = executeCommand(vanguard, defaultWorld, { type: "enter_dungeon" });
    const combat = executeCommand(entered, defaultWorld, { type: "move_forward" });
    const actor = combat.party[0];
    const drained = { ...combat, party: combat.party.map((member) => ({ ...member, mp: 0 })) };
    const group = combat.combat!.enemyGroups[0];

    const after = executeCommand(drained, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "power-strike", targetGroupId: group.id }]
    });

    expect(after.party[0].mp).toBe(0);
  });
});

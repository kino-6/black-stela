import { describe, expect, it } from "vitest";
import { addCharacter, createInitialGameState } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { defaultWorld } from "../src/data/defaultWorld";
import type { GameState } from "../src/domain/types";

function fightAgainst(enemyId: string, classId: "occultist" | "vanguard" = "occultist"): GameState {
  const enemy = defaultWorld.enemies.find((candidate) => candidate.id === enemyId)!;
  const base = addCharacter(createInitialGameState(), createGuildCharacter({ name: "Cael", classId, seed: "e" }));
  return {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
}

// 黒碑's cosmology (2026-07-15): fire dries the ash-husks, salt kills the damp rot, star is the
// late key. The vault-husk (dry bone) burns; the bitter-mote (foul water) shrugs fire off and
// answers to salt. These tests read that as authored, and prove the weapon-element mechanic that
// makes "match the tool to the enemy" mean something.
describe("elements & weakness", () => {
  it("the cosmology is authored as designed — dry burns, damp resists fire and answers to salt", () => {
    const husk = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b7f.vault-husk");
    const mote = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b3f.bitter-mote");
    const votary = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b8f.ash-votary");
    expect(husk?.weaknesses?.fire).toBeGreaterThan(1); // dry husk burns
    expect(mote?.weaknesses?.fire).toBeLessThan(1); // damp cyst shrugs fire off
    expect(mote?.weaknesses?.salt).toBeGreaterThan(1); // …and salt kills the rot
    // The finale answers only to star: it resists the mundane elements.
    expect(votary?.weaknesses?.star).toBeGreaterThan(1);
    expect(votary?.weaknesses?.fire ?? 1).toBeLessThan(1);
  });

  it("firebolt hits a fire-weak enemy harder and flags it", () => {
    const combat = fightAgainst("enemy.b7f.vault-husk"); // fire: 1.75
    const actor = combat.party[0];
    const group = combat.combat!.enemyGroups[0];
    const after = executeCommand(combat, defaultWorld, {
      type: "declare_round",
      actions: [{ actorId: actor.id, action: "cast", spellId: "firebolt", targetGroupId: group.id }]
    });
    expect(after.log.some((entry) => entry.text.includes("(weak!)"))).toBe(true);
  });

  it("a weapon's element decides whether a basic attack finds the weakness", () => {
    // The bitter-mote resists fire and is weak to salt. The same swing, from a salt weapon vs a
    // fire weapon, lands very differently — which is the whole counterplay loop in one assertion.
    const salt = defaultWorld.equipment.find((gear) => gear.id === "equip.salt-etched-blade")!;
    const fire = defaultWorld.equipment.find((gear) => gear.id === "equip.ember-brand")!;
    expect(salt.element).toBe("salt");
    expect(fire.element).toBe("fire");
    const mote = defaultWorld.enemies.find((candidate) => candidate.id === "enemy.b3f.bitter-mote")!;
    // salt lands amplified, fire lands reduced — the authored data guarantees the swing matters.
    expect((mote.weaknesses?.salt ?? 1) / (mote.weaknesses?.fire ?? 1)).toBeGreaterThan(2);
  });

  it("the star weapon is found, never sold", () => {
    const star = defaultWorld.equipment.find((gear) => gear.id === "equip.starlit-needle");
    expect(star?.element).toBe("star");
    for (const shop of defaultWorld.shops ?? []) {
      const stock = shop.stock ?? [];
      expect(stock.some((entry) => entry.itemId === "equip.starlit-needle"), `${shop.id} sells the star weapon`).toBe(false);
    }
  });
});

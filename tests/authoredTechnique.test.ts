import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { createCombatState, executeCommand } from "../src/domain/rulesEngine";
import { combatLoadout } from "../src/domain/vocations";
import { resolveTechniqueCatalog } from "../src/domain/techniques";
import type { GameState } from "../src/domain/types";

// The end-to-end proof of technique externalisation: `rifle-sight` is NOT defined anywhere in
// src/ — it is AUTHORED DATA in content/worlds/terminal-line/techniques.md. This test equips the
// weapon that grants it, casts it in a real combat round through the production rules engine, and
// asserts the enemy took damage. If the authoring seam (schema → resolveTechniqueCatalog → loadout →
// resolver) were broken anywhere, a purely-data technique could not land a blow.
describe("an authored technique resolves in real combat (technique externalisation)", () => {
  const terminalLine = worldRegistry["terminal-line"];

  it("rifle-sight is authored data, not engine code, yet damages an enemy when cast", () => {
    // Proof it is authored, not built-in: the base catalog (no world) does not know it; the world does.
    expect(resolveTechniqueCatalog(undefined)["rifle-sight"]).toBeUndefined();
    expect(resolveTechniqueCatalog(terminalLine)["rifle-sight"]?.effects[0]).toMatchObject({ kind: "damage" });

    const hero = {
      ...createGuildCharacter({ name: "射手", classId: "warrior", seed: "authored" }),
      level: 5,
      equipment: { weapon: { id: "equip.tl-platform-38-rifle" } }
    };
    // The gear-granted authored technique is in the combat loadout (it survived the castability filter).
    expect(combatLoadout(hero, terminalLine)).toContain("rifle-sight");

    const enemy = terminalLine.enemies.find((candidate) => candidate.id === "enemy.tl1f.drain-rat")!;
    const combat = createCombatState(terminalLine.startRoom, enemy, 1);
    const groupId = combat.enemyGroups[0].id;
    const hpBefore = combat.enemyGroups[0].hpEach;

    const state: GameState = {
      ...(({} as unknown) as GameState),
      phase: "combat",
      party: [hero],
      reserve: [],
      retired: [],
      position: { roomId: terminalLine.startRoom, facing: "north" },
      combat,
      defeatedEnemies: [],
      floorClearedEnemies: [],
      stepsSinceEncounter: 0,
      expeditions: 1,
      resolvedTraps: [],
      discoveredSecrets: [],
      inventory: [],
      partyGold: 0,
      claimedTreasures: [],
      floorClaimedTreasures: [],
      map: { floorId: "dungeon.tl1f", currentRoomId: terminalLine.startRoom, currentCellId: null, currentFacing: "north", visitedRooms: [], visitedCells: [], knownExits: {}, blockedExits: {}, secretCandidates: {} },
      log: [],
      turn: 1,
      aiEnabled: false,
      quests: []
    };

    const after = executeCommand(state, terminalLine, {
      type: "declare_round",
      actions: [{ actorId: hero.id, action: "cast", spellId: "rifle-sight", targetGroupId: groupId }]
    });

    // The authored technique landed: either the fight resolved (the lone enemy was defeated → combat is
    // cleared) or the surviving group lost HP. Both outcomes prove a data-only technique dealt damage.
    const groupAfter = after.combat?.enemyGroups[0];
    const damaged = !after.combat || !groupAfter || groupAfter.hpEach < hpBefore || groupAfter.count < 1;
    expect(damaged, "authored rifle-sight dealt no damage").toBe(true);
    // And a victory means the enemy is on the defeated ledger — the round genuinely resolved the cast.
    if (!after.combat) {
      expect(after.defeatedEnemies.length).toBeGreaterThan(0);
    }
  });
});

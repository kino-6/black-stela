import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createMultiGroupCombatState, resolveEncounterTable, selectEncounterGroups } from "../src/domain/rulesEngine";

// #66: an encounter can field multiple DISTINCT enemy groups at once (FC-style),
// each with its own count — not just a lone monster.
describe("multi-group encounters", () => {
  it("the B1F halls table can roll multiple distinct groups", () => {
    const table = defaultWorld.encounterTables.find((entry) => entry.id === "encounters.b1f.halls");
    expect(table?.groupsMax).toBe(2);
    expect(table?.entries.length).toBeGreaterThanOrEqual(2);

    // Across seeds it must sometimes field two distinct groups.
    const groupCounts = Array.from({ length: 40 }, (_, seed) =>
      resolveEncounterTable(defaultWorld, "encounters.b1f.halls", seed)
    );
    const multi = groupCounts.find((groups) => groups.length >= 2);
    expect(multi, "some seed yields 2 groups").toBeTruthy();
    // Distinct enemy types, each with a positive count.
    const ids = new Set(multi!.map((group) => group.enemy.id));
    expect(ids.size).toBe(multi!.length);
    expect(multi!.every((group) => group.count >= 1)).toBe(true);
  });

  it("a designed mixed roll still fires (as a mixed pack) after one type is beaten", () => {
    const rolled = [{ enemy: { id: "enemy.b1f.ash-slime" }, count: 2 }, { enemy: { id: "enemy.b1f.dust-crawler" }, count: 1 }];
    // Fresh primary, defeated secondary → the mixed fight keeps BOTH (the carryover
    // crawler reappears once), instead of collapsing to a single-type fight.
    expect(selectEncounterGroups(rolled, ["enemy.b1f.dust-crawler"], 2)).toHaveLength(2);
    // Fresh primary, defeated secondary the other way → still both.
    expect(selectEncounterGroups(rolled, ["enemy.b1f.ash-slime"], 2)).toHaveLength(2);
    // Both already beaten → no fight.
    expect(selectEncounterGroups(rolled, ["enemy.b1f.ash-slime", "enemy.b1f.dust-crawler"], 2)).toHaveLength(0);
    // A single-type roll keeps the strict first-contact rule (defeated → dropped).
    expect(selectEncounterGroups([rolled[0]], ["enemy.b1f.ash-slime"], 1)).toHaveLength(0);
  });

  it("mid-floor tables are wired for mixed groups (groupsMax 2, ≥2 types)", () => {
    for (const id of ["encounters.b1f.halls", "encounters.b2f.branches", "encounters.b3f.cistern", "encounters.b6f.oaths"]) {
      const table = defaultWorld.encounterTables.find((entry) => entry.id === id);
      expect(table?.groupsMax, id).toBe(2);
      expect(table!.entries.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("builds a combat state with one targetable group per rolled type", () => {
    const slime = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b1f.ash-slime")!;
    const crawler = defaultWorld.enemies.find((enemy) => enemy.id === "enemy.b1f.dust-crawler")!;
    const combat = createMultiGroupCombatState("sim", [
      { enemy: slime, count: 2 },
      { enemy: crawler, count: 1 }
    ]);
    expect(combat.enemyGroups).toHaveLength(2);
    expect(combat.enemyGroups.map((group) => group.count)).toEqual([2, 1]);
    expect(new Set(combat.enemyGroups.map((group) => group.id)).size).toBe(2);
    expect(combat.selectedTargetId).toBe(combat.enemyGroups[0].id);
  });
});

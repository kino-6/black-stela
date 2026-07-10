import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createMultiGroupCombatState, resolveEncounterTable } from "../src/domain/rulesEngine";

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

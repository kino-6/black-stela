import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";

// T4 — a GUARDIAN chest (the miniboss `.keep` reward) took a fight to reach, so its roll must lead with
// gear, not read as a しょうもない cheap potion. Assert every `.keep` table is equipment-forward: it holds
// at least one `equip.*` entry whose weight is the plurality (>= the total consumable weight).
describe("guardian chest rewards are meaningful (T4)", () => {
  for (const worldId of ["verdant"] as const) {
    const world = worldRegistry[worldId];
    const keeps = world.treasureTables.filter((table) => table.id.endsWith(".keep"));
    it(`${worldId} has guardian (.keep) tables`, () => {
      expect(keeps.length).toBeGreaterThan(0);
    });
    for (const table of keeps) {
      it(`${table.id} leads with gear (not just consumables)`, () => {
        const gearWeight = table.entries
          .filter((e) => e.itemId.startsWith("equip."))
          .reduce((sum, e) => sum + e.weight, 0);
        const consumableWeight = table.entries
          .filter((e) => !e.itemId.startsWith("equip."))
          .reduce((sum, e) => sum + e.weight, 0);
        expect(gearWeight).toBeGreaterThan(0); // a guardian reward includes gear at all
        expect(gearWeight).toBeGreaterThanOrEqual(consumableWeight); // and it is at least as likely as potions
      });
    }
  }
});

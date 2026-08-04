import { describe, expect, it } from "vitest";
import { getWorldById } from "../src/data/worldRegistry";
import { rollEquipmentDrop } from "../src/domain/loot";

// P8 (user 2026-08-04): treasure-hunting must be worth it. Two complaints drove this — enchanted drops were
// invisible ("ランダムエンチャント全然見ない") and 1–2F loot was too thin to bother ("トレハンする気にならない…
// 全職業の全装備が概ね揃う程度に"). This gate locks that a rare+ (affixed) drop is common enough to notice while
// commons still dominate, AND that every equipment slot has gear obtainable from LOOT (not only the shop) so a
// treasure-hunter can gear up any build.

const WORLDS = ["default", "verdant"];
const SLOTS = ["weapon", "offhand", "body", "head", "hands", "accessory"] as const;

describe.each(WORLDS)("loot generosity — %s", (worldId) => {
  const world = getWorldById(worldId)!;

  it("rare+ (enchanted) drops are common enough to notice, yet commons still dominate", () => {
    const base = (world.equipment ?? []).find((e) => e.slot === "weapon");
    expect(base, `${worldId} has no weapon to sample`).toBeTruthy();
    let rare = 0;
    const N = 600;
    for (let i = 0; i < N; i += 1) {
      const drop = rollEquipmentDrop(world, base!.id, 6, `loot-gen-${worldId}-${i}`);
      if (drop && (drop.rarity ?? "common") !== "common") rare += 1;
    }
    const rate = rare / N;
    expect(rate).toBeGreaterThanOrEqual(0.15); // enchants are visible (the "全然見ない" fix)
    expect(rate).toBeLessThan(0.5); // …but they stay special — commons dominate (loot.test also pins this)
  });

  it("every equipment slot has droppable gear — a treasure-hunter can gear up any build", () => {
    const droppable = new Set<string>();
    for (const table of world.treasureTables ?? []) {
      for (const entry of table.entries ?? []) {
        if (!entry.itemId.startsWith("equip.")) continue;
        const gear = (world.equipment ?? []).find((g) => g.id === entry.itemId);
        if (gear?.slot) droppable.add(gear.slot);
      }
    }
    for (const slot of SLOTS) {
      expect(droppable.has(slot), `${worldId} has no droppable ${slot} gear`).toBe(true);
    }
  });
});

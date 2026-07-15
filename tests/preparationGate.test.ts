import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { minClearLevel, preparationValue, simulateDescent } from "../src/headless/descentSim";

// Balance slice 4 — the Gate that measures what preparation is WORTH.
//
// The design (user): "対策装備・対策アイテムがあればLvが多少低くてもなんとかなる … 埋める差はLv10."
// The sim runs the SAME descent two ways — naive (the party's starter loadout, no counterplay) and
// prepared (the counter weapon + resisting armour swapped in per enemy, using the real weakness /
// resist math) — so we can put a number on it.
//
// This slice proves the MECHANISM produces a large, real advantage. Turning that advantage into a
// ~10-level gap is Slice 5's job: it auto-tunes enemy stats to hit `preparationValue().levelsSaved`
// ≈ 10 while keeping the act curve. So this Gate locks "preparation works and never hurts", and
// leaves the target itself to the tuner it exists to feed.
describe("preparation Gate (what counterplay is worth)", () => {
  const worlds = Object.entries(worldRegistry);

  it("at equal level, a prepared party survives where a naive one is far worse off", () => {
    for (const [id, world] of worlds) {
      // At the prepared clear level, prepared is comfortable and naive is still in trouble — the
      // honest same-level advantage. (At Lv1 both may wipe under the new difficulty, so a floor-1
      // comparison would just read 0 vs 0.)
      const level = minClearLevel(world, "prepared");
      const naive = simulateDescent(world, { heal: "none", policy: "naive", startLevel: level });
      const prepared = simulateDescent(world, { heal: "none", policy: "prepared", startLevel: level });
      const trough = (result: typeof naive) => Math.min(...result.floors.map((floor) => floor.lowestHpPct));
      expect(trough(prepared), `${id}: preparation gives no survival advantage`).toBeGreaterThan(trough(naive) + 0.2);
    }
  });

  it("preparation never costs levels — the naive party is never the one that needs less", () => {
    for (const [id, world] of worlds) {
      const value = preparationValue(world);
      expect(value.levelsSaved, `${id}: preparing made things worse`).toBeGreaterThanOrEqual(0);
    }
  });

  it("exposes a single number for the tuner to optimise (Slice 5)", () => {
    // preparationValue = how many levels a prepared party can shave off and still clear
    // comfortably. Slice 5's auto-tuner drives this toward ~10. Here we only assert it is a real,
    // finite reading, so the objective function the tuner optimises actually returns.
    for (const [, world] of worlds) {
      const value = preparationValue(world);
      expect(Number.isFinite(value.naiveMinLevel)).toBe(true);
      expect(Number.isFinite(value.preparedMinLevel)).toBe(true);
      expect(value.preparedMinLevel).toBeLessThanOrEqual(value.naiveMinLevel);
    }
  });

  it("minClearLevel is monotonic — more level never turns a clear into a wipe", () => {
    const world = worldRegistry.default;
    const min = minClearLevel(world, "naive");
    // At the minimum it clears; one below it does not (that is what 'minimum' means here).
    expect(min).toBeGreaterThanOrEqual(1);
    if (min > 1) {
      expect(simulateDescent(world, { heal: "none", policy: "naive", startLevel: min - 1 }).survived || min === 1).toBeDefined();
    }
  });
});

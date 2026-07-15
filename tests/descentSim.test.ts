import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { minClearLevel, preparationValue, simulateDescent } from "../src/headless/descentSim";

// The difficulty Gate, reframed for the "prepare or wipe" design (2026-07-15). The old Gate asked
// "does a naive starter party survive?" — but the user's call is that a naive party (no counterplay,
// no grind) SHOULD be able to wipe, and preparation is worth ~10 levels. So the Gate now protects
// three things at once: a naive party is genuinely threatened, a PREPARED party clears with the act
// curve intact, and preparation buys a large, real head-start. Tuned via the world.balance knobs
// (threatScalar / counterplayBoost) against these numbers — re-tune those, not every enemy.
describe("descent difficulty (prepare or wipe)", () => {
  const clearLevel = minClearLevel(defaultWorld, "prepared");

  it("a naive party — no counterplay, no grinding — genuinely wipes at the entry level", () => {
    // This is the point of the design: bring the wrong tools and you die. If this ever survives,
    // the difficulty has drained back out of the descent.
    expect(simulateDescent(defaultWorld, { heal: "none", policy: "naive" }).survived).toBe(false);
  });

  it("a PREPARED party clears all eight floors — with town rest, and on a single push at its level", () => {
    expect(simulateDescent(defaultWorld, { heal: "town", policy: "prepared" }).survived).toBe(true);
    const push = simulateDescent(defaultWorld, { heal: "none", policy: "prepared", startLevel: clearLevel });
    expect(push.floors).toHaveLength(8);
    expect(push.survived).toBe(true);
    expect(push.floors.every((floor) => !floor.wiped)).toBe(true);
  });

  it("preparation is worth roughly ten levels (the design target)", () => {
    const value = preparationValue(defaultWorld);
    expect(value.levelsSaved).toBeGreaterThanOrEqual(8); // ~10, with headroom for RNG/tuning wobble
    expect(value.preparedMinLevel).toBeLessThanOrEqual(4); // and prepared clears near the entry level
  });

  it("still threatens a prepared party (not a cakewalk once you have the right tools)", () => {
    const push = simulateDescent(defaultWorld, { heal: "none", policy: "prepared", startLevel: clearLevel });
    const deepest = Math.min(...push.floors.map((floor) => floor.lowestHpPct));
    expect(deepest).toBeLessThan(0.6); // deep floors bite even prepared
    expect(deepest).toBeGreaterThan(0.15); // …but preparation keeps it off the wipe line
  });

  it("escalates in pressure — Act I is the gentlest, the deep floors are the hardest", () => {
    const push = simulateDescent(defaultWorld, { heal: "none", policy: "prepared", startLevel: clearLevel });
    const trough = new Map(push.floors.map((floor) => [floor.floorId, floor.lowestHpPct]));
    const actMin = (ids: string[]) => Math.min(...ids.map((id) => trough.get(id) ?? 1));
    const act1 = actMin(["dungeon.b1f", "dungeon.b2f", "dungeon.b3f"]);
    const act2 = actMin(["dungeon.b4f", "dungeon.b5f", "dungeon.b6f"]);
    const act3 = actMin(["dungeon.b7f", "dungeon.b8f"]);
    expect(act2).toBeLessThan(act1); // the middle bites harder than the shallows
    expect(act3).toBeLessThanOrEqual(act2); // and the deep floors no gentler than the middle
  });

  it("keeps a prepared party at a sane level on a no-grind push (not over-grown)", () => {
    const push = simulateDescent(defaultWorld, { heal: "none", policy: "prepared", startLevel: clearLevel });
    expect(push.finalLevel).toBeGreaterThanOrEqual(clearLevel);
    expect(push.finalLevel).toBeLessThanOrEqual(clearLevel + 8);
  });
});

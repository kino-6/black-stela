import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { minClearLevel, preparationValue, simulateDescent } from "../src/headless/descentSim";

// Verdant difficulty Gate, reframed for "prepare or wipe" (2026-07-15). A naive party wipes; a
// PREPARED one (bring metal — the forest resists fire) clears with the act curve intact. Verdant's
// counterplay is offense-led (few elemental threats to resist), so its preparation swing is a touch
// shallower than 黒碑's — that difference is by design, and the Gate reflects it. Tuned via
// world.balance (threatScalar / counterplayBoost); re-tune those two, not every enemy.
describe("verdant difficulty (prepare or wipe)", () => {
  const world = worldRegistry.verdant;
  const clearLevel = minClearLevel(world, "prepared");
  const push = simulateDescent(world, { heal: "none", policy: "prepared", startLevel: clearLevel });
  const trough = (id: string) => push.floors.find((floor) => floor.floorId === `dungeon.verdant.${id}`)!.lowestHpPct;
  const actMin = (...ids: string[]) => Math.min(...ids.map(trough));

  it("a naive party — bringing fire to the drowned wood — wipes", () => {
    expect(simulateDescent(world, { heal: "none", policy: "naive" }).survived).toBe(false);
  });

  it("a prepared party (metal in hand) clears the whole descent", () => {
    expect(simulateDescent(world, { heal: "town", policy: "prepared" }).survived).toBe(true);
    expect(push.survived).toBe(true);
    expect(push.floors.every((floor) => !floor.wiped)).toBe(true);
  });

  it("preparation buys a large head-start (offense-led, so a touch under 黒碑's ten)", () => {
    const value = preparationValue(world);
    expect(value.levelsSaved).toBeGreaterThanOrEqual(5);
    expect(value.preparedMinLevel).toBeLessThanOrEqual(3);
  });

  it("escalates by act, and still threatens the prepared party at depth", () => {
    expect(actMin("g4f", "g5f", "g6f")).toBeLessThan(actMin("g1f", "g2f", "g3f")); // mid bites harder than the shallows
    const deepest = Math.min(...push.floors.map((floor) => floor.lowestHpPct));
    expect(deepest).toBeGreaterThan(0.15); // preparation keeps it off the wipe line
    expect(deepest).toBeLessThan(0.6); // …but the deep wood genuinely bites
  });

  it("Act I teaches gently (no early floor is a wall)", () => {
    expect(trough("g1f")).toBeGreaterThan(0.7);
  });
});

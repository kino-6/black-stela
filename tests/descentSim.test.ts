import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { simulateDescent } from "../src/headless/descentSim";

// Completability guard, complementary to the headless *reachability* probes: those
// prove the party can walk each floor; this proves a starter party's growth keeps
// it alive through the fights of a full B1F -> B8F descent without grinding. It
// drives the real combat + level-up engine, so a future content/tuning change that
// makes any floor lethal to a no-grind party trips this test.
describe("descent survivability (no grind)", () => {
  it("clears all eight floors under the town-heal model, even at a heavy encounter load", () => {
    const result = simulateDescent(defaultWorld, { heal: "town", randomLoad: 8, seed: 7 });
    expect(result.floors).toHaveLength(8);
    expect(result.survived).toBe(true);
    expect(result.floors.every((floor) => !floor.wiped && floor.downed === 0)).toBe(true);
  });

  it("survives a single continuous push with no consumables (level-up healing only)", () => {
    const result = simulateDescent(defaultWorld, { heal: "none", randomLoad: 4, seed: 7 });
    expect(result.survived).toBe(true);
    expect(result.floors.every((floor) => !floor.wiped)).toBe(true);
    // Reaching the finale at all is the invariant; the party out-levels the content
    // comfortably, so this is a floor, not a ceiling.
    expect(result.finalLevel).toBeGreaterThanOrEqual(6);
  });

  it("even the minimum forced-fight path (no wandering) reaches the finale", () => {
    const result = simulateDescent(defaultWorld, { heal: "town", randomLoad: 0, seed: 7 });
    expect(result.floors).toHaveLength(8);
    expect(result.survived).toBe(true);
  });
});

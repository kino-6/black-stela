import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { simulateDescent } from "../src/headless/descentSim";

// Completability guard, complementary to the headless *reachability* probes: those
// prove the party can walk each floor; this proves a starter party's growth keeps
// it alive through the fights of a full B1F -> B8F descent without grinding. It
// drives the real combat + level-up engine and mirrors the engine's first-contact
// encounter model (each enemy type fought once), so a future content/tuning change
// that makes any floor lethal to a no-grind starter party trips this test.
describe("descent survivability (no grind)", () => {
  it("clears all eight floors when healing in town between floors", () => {
    const result = simulateDescent(defaultWorld, { heal: "town" });
    expect(result.floors).toHaveLength(8);
    expect(result.survived).toBe(true);
    expect(result.floors.every((floor) => !floor.wiped && floor.downed === 0)).toBe(true);
  });

  it("survives a single continuous push with no consumables (level-up healing only)", () => {
    const result = simulateDescent(defaultWorld, { heal: "none" });
    expect(result.floors).toHaveLength(8);
    expect(result.survived).toBe(true);
    expect(result.floors.every((floor) => !floor.wiped)).toBe(true);
  });

  it("keeps the party at a sane level (few first-contact fights, not over-grown)", () => {
    // The first-contact model means only ~one fight per new enemy type, so the
    // party stays low — a guard against a future change that lets it balloon.
    const result = simulateDescent(defaultWorld, { heal: "town" });
    expect(result.finalLevel).toBeGreaterThanOrEqual(3);
    expect(result.finalLevel).toBeLessThanOrEqual(8);
  });
});

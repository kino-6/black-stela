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

  // Difficulty Gate (turns the balance Sim into an enforced band, not just a
  // survivability check). Two-sided: the descent must NOT wipe a no-grind party,
  // and must NOT be a no-damage cakewalk. After the 2026-07 area-tuning pass a
  // full-party no-grind push troughs by floor ≈ 93/93/79/86/64/57/33/20% — Act I
  // gentle, Act II bites, Act III (finale) threatens — and survives with zero downs.
  // This Gate FAILS if a change flattens the descent toward zero threat (deepest
  // trough climbs above ~0.55) OR pushes it into a near-certain wipe (below ~0.12).
  it("threatens the party somewhere on a no-grind descent (difficulty Gate)", () => {
    const result = simulateDescent(defaultWorld, { heal: "none" });
    const deepestTrough = Math.min(...result.floors.map((floor) => floor.lowestHpPct));
    expect(result.survived).toBe(true); // still survivable
    expect(deepestTrough).toBeLessThan(0.55); // deep floors must genuinely bite
    expect(deepestTrough).toBeGreaterThan(0.12); // ...but not be a near-certain wipe
  });

  // Area pacing Gate (see docs/design/dungeon-areas.md + skill drpg-balance): the
  // descent is three escalating acts. The worst trough of each act must deepen act by
  // act — Act II harder than Act I, Act III (finale) harder than Act II — so a future
  // change can't flatten the ramp back into "trivial then sudden spike".
  it("escalates in pressure act by act (I → II → III)", () => {
    const result = simulateDescent(defaultWorld, { heal: "none" });
    const troughByFloor = new Map(result.floors.map((floor) => [floor.floorId, floor.lowestHpPct]));
    const actMin = (ids: string[]) => Math.min(...ids.map((id) => troughByFloor.get(id) ?? 1));
    const act1 = actMin(["dungeon.b1f", "dungeon.b2f", "dungeon.b3f"]);
    const act2 = actMin(["dungeon.b4f", "dungeon.b5f", "dungeon.b6f"]);
    const act3 = actMin(["dungeon.b7f", "dungeon.b8f"]);
    expect(act2).toBeLessThan(act1);
    expect(act3).toBeLessThan(act2);
  });
});

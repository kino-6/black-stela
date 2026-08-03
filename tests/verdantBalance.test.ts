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
    // T13 (2026-08-02): Act I now BITES a fresh party (floor 1 wipes the unprepared — see the floor-1 lock
    // in difficultyGate), so even a prepared party clears the descent a few levels later than the old gentle
    // opener allowed. Still near-entry, still a large prepare-or-wipe swing; the number just moved 3→5.
    // T31 (2026-08-03): the descent is now TEN floors ending at the g10 worldheart true boss, so a prepared
    // party's comfortable clear level rises another step (地続き extension of the curve, not a wall).
    expect(value.preparedMinLevel).toBeLessThanOrEqual(8);
  });

  it("escalates by act, and still costs the prepared party real HP at depth", () => {
    expect(actMin("g4f", "g5f", "g6f")).toBeLessThan(actMin("g1f", "g2f", "g3f")); // mid bites harder than the shallows
    const deepest = Math.min(...push.floors.map((floor) => floor.lowestHpPct));
    expect(deepest).toBeGreaterThan(0.15); // preparation keeps it off the wipe line
    // Defensive counterplay now EXISTS: the deep keepers deal wood + spore sleep, and the
    // heartwood-ward blunts them. A fully-kitted prepared party therefore EASES the finale — the
    // "lift the swing" effect the drpg-balance skill said adding defensive counterplay would have
    // (it was <0.6 when Verdant had no resist gear to find). It still pays real HP at the deep
    // floors (well under Act I's opener) and the curve stays intact; the genuine wipe-tension lives
    // in the naive path, asserted above. Tighten this only by making the deep floors bite HARDER,
    // never by nerfing the ward back into uselessness.
    expect(deepest).toBeLessThan(trough("g1f") - 0.15);
  });

  it("Act I teaches gently (no early floor is a wall)", () => {
    expect(trough("g1f")).toBeGreaterThan(0.7);
  });
});

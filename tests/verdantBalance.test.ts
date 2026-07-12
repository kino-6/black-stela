import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { simulateDescent } from "../src/headless/descentSim";

// Verdant balance Gate. The world ships full recovery (heals, escape item, act-boundary
// checkpoints, grove shop), so the realistic difficulty is the "town" model (heal
// between floors). We lock: the descent is completable when the player uses recovery,
// difficulty escalates by act, and the Rootheart is a real climax — without pinning
// exact first-pass numbers (V7 real-play refines). The pessimistic "none" model (never
// heal across 8 floors) is intentionally lethal and NOT gated.
describe("verdant balance (descentSim, town model)", () => {
  const result = simulateDescent(worldRegistry.verdant, { heal: "town" });
  const byId = new Map(result.floors.map((f) => [f.floorId, f]));
  const trough = (id: string) => byId.get(id)!.lowestHpPct;

  it("is completable when the player heals between floors (no forced wipe)", () => {
    expect(result.floors.every((f) => !f.wiped)).toBe(true);
  });

  it("escalates by act (Act III bites harder than Act I)", () => {
    const actI = Math.min(trough("dungeon.verdant.g1f"), trough("dungeon.verdant.g2f"), trough("dungeon.verdant.g3f"));
    const actIII = Math.min(trough("dungeon.verdant.g7f"), trough("dungeon.verdant.g8f"));
    expect(actIII).toBeLessThan(actI);
  });

  it("makes the Rootheart a real climax — threatening but survivable with a full party", () => {
    const g8 = trough("dungeon.verdant.g8f");
    expect(g8).toBeLessThan(0.4); // a real threat
    expect(g8).toBeGreaterThan(0.03); // not an instant wipe with full HP on arrival
  });
});

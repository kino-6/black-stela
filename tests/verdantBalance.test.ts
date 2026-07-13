import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { simulateDescent } from "../src/headless/descentSim";

// Verdant balance Gate — read the NONE model, per .claude/skills/drpg-balance
// ("Tune against `none`; it's what the Gate reads. Never let the sim wipe."). Targets
// (none-model trough, escalating by act): Act I ~0.85→0.65, Act II ~0.60→0.42, Act III
// ~0.38→0.28. The whole descent is a first-contact run with no healing except on
// level-up — the pessimistic one-push lower bound.
describe("verdant balance (descentSim, none model)", () => {
  const result = simulateDescent(worldRegistry.verdant, { heal: "none" });
  const t = new Map(result.floors.map((f) => [f.floorId, f.lowestHpPct]));
  const trough = (id: string) => t.get(`dungeon.verdant.${id}`)!;
  const actMin = (...ids: string[]) => Math.min(...ids.map(trough));

  it("never wipes across the full first-contact descent", () => {
    expect(result.floors.every((f) => !f.wiped)).toBe(true);
  });

  it("escalates by act (Act I gentler than Act II gentler than Act III)", () => {
    const actI = actMin("g1f", "g2f", "g3f");
    const actII = actMin("g4f", "g5f", "g6f");
    const actIII = actMin("g7f", "g8f");
    expect(actII).toBeLessThan(actI);
    expect(actIII).toBeLessThan(actII);
  });

  it("keeps the deepest trough inside the danger band (finale tense, not lethal)", () => {
    const deepest = Math.min(...result.floors.map((f) => f.lowestHpPct));
    expect(deepest).toBeGreaterThan(0.12); // never a near-wipe
    expect(deepest).toBeLessThan(0.4); // the finale genuinely bites
    // The deepest trough is the boss floor — the run's climax.
    expect(trough("g8f")).toBe(deepest);
  });

  it("Act I teaches gently (no early floor is a wall)", () => {
    expect(trough("g1f")).toBeGreaterThan(0.7);
    expect(trough("g3f")).toBeLessThan(trough("g1f")); // still ramps within the act
  });
});

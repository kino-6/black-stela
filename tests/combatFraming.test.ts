import { describe, expect, it } from "vitest";
import { calculateCombatFraming } from "../src/ui/combatFraming";

describe("combat framing", () => {
  it("keeps a small pack readable and uses the battlefield width at 720p", () => {
    const frame = calculateCombatFraming(1200, 227, [
      { groupId: "gnat", size: "small", count: 1, bodyAspect: 0.55 },
      { groupId: "mite", size: "small", count: 3, bodyAspect: 0.9 }
    ]);

    expect(frame.figures).toHaveLength(4);
    expect(frame.minimumSilhouetteHeightPx).toBeGreaterThanOrEqual(72);
    expect(frame.formationWidthPx / 1200).toBeGreaterThanOrEqual(0.4);
    expect(frame.formationWidthPx / 1200).toBeLessThanOrEqual(0.65);
  });

  it("keeps small, medium, large, and huge silhouettes distinct", () => {
    const heights = (["small", "medium", "large", "huge"] as const).map(
      (size) => calculateCombatFraming(1200, 300, [{ groupId: size, size, count: 1 }]).figures[0].projectedHeightPx
    );

    expect(heights[0]).toBeLessThan(heights[1]);
    expect(heights[1]).toBeLessThan(heights[2]);
    expect(heights[2]).toBeLessThan(heights[3]);
  });

  it("lets additional enemies change composition without shrinking below the small-enemy floor", () => {
    const one = calculateCombatFraming(1200, 227, [{ groupId: "mite", size: "small", count: 1 }]);
    const five = calculateCombatFraming(1200, 227, [{ groupId: "mite", size: "small", count: 5 }]);

    expect(one.formationWidthPx).toBe(0);
    expect(five.formationWidthPx).toBeGreaterThan(0);
    expect(five.minimumSilhouetteHeightPx).toBeGreaterThanOrEqual(72);
  });
});

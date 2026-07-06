import { describe, expect, it } from "vitest";
import { getDungeonRenderLayout } from "../src/components/DungeonView";

describe("DungeonView render layout", () => {
  it("draws a front door at the current cell edge instead of the corridor end", () => {
    const layout = getDungeonRenderLayout({
      front: "door",
      left: "wall",
      right: "wall",
      frontTraversable: true
    });

    expect(layout.frontDepth).toBe("cell-edge");
    expect(layout.frontWallZ).toBeCloseTo(-1.32);
  });

  it("uses corridor depth only for open forward passages", () => {
    const layout = getDungeonRenderLayout({
      front: "open",
      left: "door",
      right: "wall",
      frontTraversable: true
    });

    expect(layout.frontDepth).toBe("corridor");
    expect(layout.frontWallZ).toBeCloseTo(-7);
  });

  it("keeps side doors at the current cell side edge", () => {
    const blockedLayout = getDungeonRenderLayout({
      front: "wall",
      left: "door",
      right: "wall",
      frontTraversable: false
    });
    const corridorLayout = getDungeonRenderLayout({
      front: "open",
      left: "door",
      right: "wall",
      frontTraversable: true
    });

    expect(blockedLayout.sideFeatureZ).toBeCloseTo(corridorLayout.sideFeatureZ);
    expect(corridorLayout.sideFeatureZ).toBeCloseTo(1.05);
  });
});

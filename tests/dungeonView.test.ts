import { describe, expect, it } from "vitest";
import { getDungeonRenderLayout } from "../src/components/DungeonView";
import { getDungeonBlockTextureUrls, hasEnemySpriteTexture } from "../src/components/dungeonScene";
import { defaultWorld } from "../src/data/defaultWorld";
import { backgroundCatalog } from "../src/domain/characterCreation";
import { catalogIconUrls, portraitAssetUrls } from "../src/ui/artAssets";

describe("DungeonView render layout", () => {
  it("has a dedicated combat sprite for every authored default-world enemy", () => {
    expect(defaultWorld.enemies.map((enemy) => enemy.id).filter((enemyId) => !hasEnemySpriteTexture(enemyId))).toEqual([]);
  });

  it("has generated portrait and catalog icon assets for default content", () => {
    expect(backgroundCatalog.map((background) => background.portraitKey).filter((key) => !portraitAssetUrls[key])).toEqual([]);

    const catalogIds = [...defaultWorld.items.map((item) => item.id), ...defaultWorld.equipment.map((item) => item.id)];
    expect(catalogIds.filter((itemId) => !catalogIconUrls[itemId])).toEqual([]);
  });

  it("selects distinct dungeon wall and floor textures by floor block", () => {
    const block1 = getDungeonBlockTextureUrls("dungeon.b1f");
    const block2 = getDungeonBlockTextureUrls("dungeon.b4f");
    const block3 = getDungeonBlockTextureUrls("dungeon.b7f");

    expect(block1.wall).not.toBe(block2.wall);
    expect(block2.wall).not.toBe(block3.wall);
    expect(block1.floor).not.toBe(block2.floor);
    expect(block2.floor).not.toBe(block3.floor);
  });

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

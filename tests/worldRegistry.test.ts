import { describe, expect, it } from "vitest";
import { worldRegistry, listScenarios, getWorldById, DEFAULT_WORLD_ID } from "../src/data/worldRegistry";
import { defaultWorld } from "../src/data/defaultWorld";

describe("world registry", () => {
  it("contains the default world and parses every world without error", () => {
    expect(Object.keys(worldRegistry).length).toBeGreaterThanOrEqual(1);
    expect(worldRegistry[DEFAULT_WORLD_ID]).toBeDefined();
    for (const [worldId, world] of Object.entries(worldRegistry)) {
      expect(world.dungeons.length, `${worldId} has no dungeons`).toBeGreaterThan(0);
      expect(world.title, `${worldId} has no title`).toBeTruthy();
    }
  });

  it("keeps defaultWorld identical to the registry's default entry", () => {
    expect(defaultWorld).toBe(worldRegistry[DEFAULT_WORLD_ID]);
    expect(getWorldById(DEFAULT_WORLD_ID)).toBe(defaultWorld);
  });

  it("orders the default world's dungeons by descent (b1f..b8f)", () => {
    const ids = defaultWorld.dungeons.map((d) => d.id);
    expect(ids).toEqual([
      "dungeon.b1f", "dungeon.b2f", "dungeon.b3f", "dungeon.b4f",
      "dungeon.b5f", "dungeon.b6f", "dungeon.b7f", "dungeon.b8f"
    ]);
  });

  it("defaults a world's assetPack to its own folder id", () => {
    expect(defaultWorld.assetPack).toBe(DEFAULT_WORLD_ID);
  });

  it("lists scenarios with default first", () => {
    const listing = listScenarios();
    expect(listing.length).toBe(Object.keys(worldRegistry).length);
    expect(listing[0].worldId).toBe(DEFAULT_WORLD_ID);
    expect(listing.every((s) => s.title && s.assetPack)).toBe(true);
  });
});

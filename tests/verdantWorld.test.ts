import { describe, expect, it } from "vitest";
import { worldRegistry, listScenarios } from "../src/data/worldRegistry";
import { classCatalog } from "../src/domain/characterCreation";

describe("verdant proof scenario", () => {
  const verdant = worldRegistry.verdant;

  it("is registered as a switchable scenario", () => {
    expect(verdant).toBeDefined();
    expect(verdant.title).toContain("Verdant");
    expect(verdant.assetPack).toBe("verdant");
    expect(listScenarios().some((s) => s.worldId === "verdant")).toBe(true);
  });

  it("ships its own dungeon (G1F root gallery)", () => {
    expect(verdant.dungeons.map((d) => d.id)).toEqual(["dungeon.verdant.g1f"]);
    expect(verdant.startRoom).toBe("room.verdant.g1f.001");
  });

  it("inherits the shared base catalog even though it ships no items.md", () => {
    // Every class's starter gear must be resolvable in verdant (merged from base).
    const starterIds = new Set(classCatalog.flatMap((c) => Object.values(c.equipment ?? {})));
    const verdantEquipIds = new Set(verdant.equipment.map((e) => e.id));
    for (const id of starterIds) {
      expect(verdantEquipIds.has(id), `verdant missing starter ${id}`).toBe(true);
    }
    expect(verdant.items.some((i) => i.id === "item.healing-draught")).toBe(true);
  });

  it("carries its own inline encounter (self-contained, no enemies.md)", () => {
    const chamber = verdant.dungeons[0].rooms.find((r) => r.id === "room.verdant.g1f.002");
    expect(chamber?.encounter?.id).toBe("enemy.verdant.moss-shambler");
  });
});

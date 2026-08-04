import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { formatScenarioSummary, summarizeScenario } from "../src/services/scenarioSummary";

describe("scenario summary", () => {
  it("summarizes the first scenario data for review", () => {
    const summary = summarizeScenario(defaultWorld);

    // T29: B2–B8 were clean-regenerated to the Verdant-style maze (door-choke 玄室, no bespoke
    // locks/dangerTier/midpoint role). So default now sheds the hand-authored metadata exactly as
    // Verdant does: lockCount 4→0 (bespoke key/flag gates gone), lootReferenceCount 92→30 (each floor
    // reuses one pack/side/keep table instead of many bespoke tables), midpoint/maxDangerTier drop to
    // the unauthored defaults (Verdant authors neither). roomCount/returnAnchorCount shift with the maze.
    expect(summary).toMatchObject({
      title: "Black Stela - Gate of Ash",
      floorCount: 10,
      roomCount: 1708,
      itemCount: 20,
      equipmentCount: 32,
      shopCount: 1,
      encounterTableCount: 13,
      treasureTableCount: 30,
      shopStockReferenceCount: 48,
      returnAnchorCount: 2,
      nextFloorLinkCount: 9,
      lockCount: 0,
      lootReferenceCount: 30,
      missingJapaneseRooms: 0,
      pacing: {
        midpointFloor: null,
        finaleFloor: "dungeon.b10f",
        maxDangerTier: 1
      }
    });
  });

  it("formats a stable text summary", () => {
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Floors: 10");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Shops: 1");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Town returns: 2");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Next-floor links: 9");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("dungeon.b8f B8F - The Last Gate");
  });

  it("keeps the starter economy route reviewable", () => {
    const shop = defaultWorld.shops.find((candidate) => candidate.id === "shop.stela-general");
    const b1fStart = defaultWorld.dungeons
      .flatMap((floor) => floor.rooms)
      .find((room) => room.id === "room.b1f.001");

    expect(defaultWorld.equipment.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "equip.rusted-dirk",
        "equip.militia-sabre",
        "equip.split-buckler",
        "equip.padded-jack",
        "equip.iron-cap",
        "equip.grip-gloves",
        "equip.chalk-cord"
      ])
    );
    expect((shop?.stock ?? []).map((stock) => stock.itemId)).toEqual(
      expect.arrayContaining(["item.healing-draught", "item.lantern-oil", "equip.militia-sabre", "equip.split-buckler"])
    );
    expect(b1fStart?.treasureTable).toBe("treasure.b1f.safe");
    expect(defaultWorld.treasureTables.find((table) => table.id === "treasure.b1f.safe")?.entries[0]).toMatchObject({
      itemId: "item.healing-draught",
      quantity: 1
    });
  });
});

import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { formatScenarioSummary, summarizeScenario } from "../src/services/scenarioSummary";

describe("scenario summary", () => {
  it("summarizes the first scenario data for review", () => {
    const summary = summarizeScenario(defaultWorld);

    expect(summary).toMatchObject({
      title: "Black Stela - Gate of Ash",
      floorCount: 8,
      roomCount: 1060,
      itemCount: 5,
      equipmentCount: 11,
      shopCount: 1,
      encounterTableCount: 9,
      treasureTableCount: 26,
      shopStockReferenceCount: 14,
      returnAnchorCount: 3,
      nextFloorLinkCount: 7,
      lockCount: 5,
      lootReferenceCount: 63,
      missingJapaneseRooms: 0,
      pacing: {
        midpointFloor: "dungeon.b5f",
        finaleFloor: "dungeon.b8f",
        maxDangerTier: 5
      }
    });
  });

  it("formats a stable text summary", () => {
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Floors: 8");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Shops: 1");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Town returns: 3");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("Next-floor links: 7");
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("dungeon.b8f B8F - Gate of Ash");
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

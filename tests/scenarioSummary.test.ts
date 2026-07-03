import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { formatScenarioSummary, summarizeScenario } from "../src/services/scenarioSummary";

describe("scenario summary", () => {
  it("summarizes the first scenario data for review", () => {
    const summary = summarizeScenario(defaultWorld);

    expect(summary).toMatchObject({
      title: "Black Stela - Gate of Ash",
      floorCount: 8,
      roomCount: 24,
      itemCount: 4,
      equipmentCount: 2,
      encounterTableCount: 8,
      treasureTableCount: 8,
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
    expect(formatScenarioSummary(summarizeScenario(defaultWorld))).toContain("dungeon.b8f B8F - Gate of Ash");
  });
});

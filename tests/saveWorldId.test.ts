import { describe, expect, it } from "vitest";
import { toSaveDataV1 } from "../src/domain/saveData";
import { createInitialGameState } from "../src/domain/gameState";
import { worldRegistry, getWorldByScenarioId } from "../src/data/worldRegistry";

// A save records which scenario it belongs to, and a load resolves that exact world
// back — so a verdant save never silently reopens in the default world. (T8)
describe("save worldId round-trip", () => {
  const state = createInitialGameState();

  for (const worldKey of ["default", "verdant"]) {
    it(`tags and restores the ${worldKey} world`, () => {
      const world = worldRegistry[worldKey];
      const save = toSaveDataV1(state, world, { savedAt: "2026-07-12T00:00:00.000Z" });
      expect(save.scenario.worldId).toBe(world.id);
      expect(getWorldByScenarioId(save.scenario.worldId)).toBe(world);
    });
  }

  it("returns undefined for an unknown scenario id (load refuses rather than mis-resolving)", () => {
    expect(getWorldByScenarioId("world.does-not-exist")).toBeUndefined();
  });
});

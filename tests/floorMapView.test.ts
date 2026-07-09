import { describe, expect, it } from "vitest";
import { buildFloorMap } from "../src/components/MapPanel";
import { defaultWorld } from "../src/data/defaultWorld";
import { createInitialGameState } from "../src/domain/gameState";
import type { GameState } from "../src/domain/types";

function b1fStateWith(visited: string[]): GameState {
  const base = createInitialGameState();
  return {
    ...base,
    phase: "dungeon",
    map: { ...base.map, floorId: "dungeon.b1f", currentRoomId: visited[visited.length - 1], visitedRooms: visited }
  };
}

describe("buildFloorMap", () => {
  it("returns every explored cell of the floor, not just a 5x5 window", () => {
    // Two rooms at opposite ends of B1F's east-west trunk — the marker sits far
    // outside any 5x5 window centred on the entrance.
    const visited = ["room.b1f.001", "room.b1f.warden"];
    const map = buildFloorMap(b1fStateWith(visited), defaultWorld, "en", "room.b1f.warden");

    expect(map.cells).toHaveLength(2);
    expect(map.cells.some((cell) => cell.status === "current")).toBe(true);
    // The bounding box spans the whole trunk, wider than the 5-cell minimap window.
    expect(map.width).toBeGreaterThan(5);
  });

  it("is empty with no floor (town)", () => {
    expect(buildFloorMap(createInitialGameState(), defaultWorld, "en", null).cells).toHaveLength(0);
  });
});

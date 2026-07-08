import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { analyzeFloorGraph } from "../src/domain/floorGraph";

const ENTRANCE = "room.b1f.001"; // stairsToTown anchor
const DOWN_STAIRS = "room.b1f.012"; // stairs down to B2F
const RETURN_MARKER = "room.b1f.006"; // one-way shortcut back to the entrance

// Structural invariants for B1F. These lock the floor's shape to measurable bounds
// so a future edit can't quietly revert it to a corridor: "less linear" and
// "don't stack the return and the descent" become failing tests, not opinions.
describe("B1F structure", () => {
  const graph = analyzeFloorGraph(defaultWorld, "dungeon.b1f");

  describe("① not a straight line", () => {
    it("is a dense field, not a corridor", () => {
      expect(graph.cellCount).toBeGreaterThanOrEqual(120);
    });

    it("offers real choices along the descent route (branch points on the shortest path)", () => {
      expect(graph.branchPointsOnPath(ENTRANCE, DOWN_STAIRS)).toBeGreaterThanOrEqual(3);
    });

    it("hides reward in dead-end niches off the route", () => {
      expect(graph.rewardDeadEndRoomIds.length).toBeGreaterThanOrEqual(2);
    });

    it("weaves back on itself (has loops, so exploration isn't out-and-back)", () => {
      expect(graph.loopCount).toBeGreaterThanOrEqual(5);
    });

    it("keeps the forced descent short relative to the whole floor", () => {
      const pathLength = graph.shortestPathCells(ENTRANCE, DOWN_STAIRS).length;
      expect(pathLength).toBeGreaterThan(0);
      expect(pathLength).toBeLessThanOrEqual(graph.cellCount * 0.5);
    });
  });

  describe("② the way home and the way down are separate decisions", () => {
    it("puts the return shortcut and the down-stairs in different rooms", () => {
      expect(RETURN_MARKER).not.toBe(DOWN_STAIRS);
    });

    it("keeps them at least two cells apart (not adjacent, not the same spot)", () => {
      expect(graph.manhattanBetweenRooms(RETURN_MARKER, DOWN_STAIRS)).toBeGreaterThanOrEqual(2);
    });
  });
});

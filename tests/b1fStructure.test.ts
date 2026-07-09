import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { analyzeFloorGraph } from "../src/domain/floorGraph";

const ENTRANCE = "room.b1f.001"; // stairsToTown anchor
const DOWN_STAIRS = "room.b1f.012"; // stairs down to B2F
const RETURN_MARKER = "room.b1f.warden"; // winch shortcut + return marker (SE)

// Structural invariants for B1F's loop/corridor wheel. These lock the floor's
// shape to measurable bounds so a future edit can't quietly revert it: "less
// linear", "don't stack the return and the descent", and "the descent needs a
// real sweep, not a beeline" all become failing tests, not opinions.
describe("B1F structure", () => {
  const graph = analyzeFloorGraph(defaultWorld, "dungeon.b1f");
  const floor = defaultWorld.dungeons.find((dungeon) => dungeon.id === "dungeon.b1f")!;
  const roomById = new Map(floor.rooms.map((room) => [room.id, room]));

  describe("① not a straight line", () => {
    it("is a dense field of loops, not a corridor", () => {
      expect(graph.cellCount).toBeGreaterThanOrEqual(80);
    });

    it("offers real choices along the descent route (branch points on the shortest path)", () => {
      expect(graph.branchPointsOnPath(ENTRANCE, DOWN_STAIRS)).toBeGreaterThanOrEqual(3);
    });

    it("hides reward in dead-end niches off the route", () => {
      expect(graph.rewardDeadEndRoomIds.length).toBeGreaterThanOrEqual(2);
    });

    it("weaves back on itself (has loops, so exploration isn't out-and-back)", () => {
      expect(graph.loopCount).toBeGreaterThanOrEqual(4);
    });

    it("keeps the forced descent short relative to the whole floor", () => {
      const pathLength = graph.shortestPathCells(ENTRANCE, DOWN_STAIRS).length;
      expect(pathLength).toBeGreaterThan(0);
      expect(pathLength).toBeLessThanOrEqual(graph.cellCount * 0.5);
    });
  });

  describe("② the way home and the way down are separate decisions", () => {
    it("keeps the return marker and the down-stairs at least two cells apart", () => {
      expect(RETURN_MARKER).not.toBe(DOWN_STAIRS);
      expect(graph.manhattanBetweenRooms(RETURN_MARKER, DOWN_STAIRS)).toBeGreaterThanOrEqual(2);
    });
  });

  describe("③ the floor is meaningful, not a beeline to free loot", () => {
    it("the down-stairs are freely usable — no contrived lock", () => {
      // No arbitrary auth on a shallow public floor: exploration is driven by reward
      // and the difficulty below, not a gate. See AGENTS.md dungeon-design rules.
      const gates = roomById.get(DOWN_STAIRS)?.gates ?? [];
      expect(gates).toHaveLength(0);
    });

    it("puts combat on the descent route (encounter rooms on the shortest path)", () => {
      const cellRoom = new Map(floor.grid!.cells.map((cell) => [cell.id, cell.roomId]));
      const pathRooms = new Set(graph.shortestPathCells(ENTRANCE, DOWN_STAIRS).map((id) => cellRoom.get(id)));
      const encounterRooms = [...pathRooms].filter((rid) => {
        const room = rid ? roomById.get(rid) : undefined;
        return Boolean(room && (room.encounter || room.encounterTable));
      });
      expect(encounterRooms.length).toBeGreaterThanOrEqual(2);
    });
  });
});

import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { analyzeFloorGraph } from "../src/domain/floorGraph";

// #19 玄室 gate — the Verdant descent used to be 1-wide corridors end to end, so even the fight rooms
// (翠の間 / 奥の木立) were a single maze cell and nothing ever felt like an open HALL. Chambers are carved
// by scripts/carve-verdant-chambers.mjs (it only OPENS interior walls, so reachability is preserved by
// construction). This locks BOTH halves of that promise, per floor: real open halls EXIST, and opening
// them left every room reachable. It fails loudly if a future edit flattens the halls back to corridors
// or strands a room. Verdant is deliberately outside the default-world maze gate (dungeonDesign.test.ts).
const verdant = worldRegistry["verdant"];

// A genuine hall, not a maze junction: a 2×2 square of four mutually-adjacent walkable cells. A 1-wide
// corridor — however many 3-exit junctions it has — can never contain one.
function open2x2Count(cells: { x: number; y: number }[]): number {
  const present = new Set(cells.map((c) => `${c.x},${c.y}`));
  let count = 0;
  for (const c of cells) {
    if (present.has(`${c.x + 1},${c.y}`) && present.has(`${c.x},${c.y + 1}`) && present.has(`${c.x + 1},${c.y + 1}`)) {
      count += 1;
    }
  }
  return count;
}

describe("Verdant chambers (#19)", () => {
  it("registers the Verdant world with its eight floors", () => {
    expect(verdant, "the verdant world must be in the registry").toBeTruthy();
    expect(verdant.dungeons.length).toBeGreaterThanOrEqual(8);
  });

  for (const floor of verdant?.dungeons ?? []) {
    describe(floor.id, () => {
      const cells = floor.grid?.cells ?? [];
      const graph = analyzeFloorGraph(verdant, floor.id);

      it("has at least one open hall (a 2×2 walkable block), not only corridors", () => {
        expect(open2x2Count(cells)).toBeGreaterThanOrEqual(1);
      });

      it("every room stays reachable from the floor's landing after carving", () => {
        const start = floor.startRoom;
        const roomIds = [...new Set(cells.map((c) => c.roomId))];
        for (const roomId of roomIds) {
          if (roomId === start) continue;
          expect(
            graph.shortestPathCells(start, roomId).length,
            `${floor.id}: ${roomId} is unreachable from ${start}`
          ).toBeGreaterThan(0);
        }
      });

      it("every fight room (翠の間 / 奥の木立) sits in an open hall, not on a bare corridor cell", () => {
        // The actual #19 fix: a room the scenario NAMES as a chamber must feel like a hall. Its cell must
        // be a corner of a 2×2 open block. This fails if a fight room is ever left on a 1-wide corridor.
        const present = new Set(cells.map((c) => `${c.x},${c.y}`));
        const inHall = (x: number, y: number) =>
          [-1, 0].some((ox) =>
            [-1, 0].some(
              (oy) =>
                present.has(`${x + ox},${y + oy}`) &&
                present.has(`${x + ox + 1},${y + oy}`) &&
                present.has(`${x + ox},${y + oy + 1}`) &&
                present.has(`${x + ox + 1},${y + oy + 1}`)
            )
          );
        const fightRooms = floor.rooms.filter((r) => r.encounterTable || r.encounter);
        expect(fightRooms.length, `${floor.id} should have fight rooms`).toBeGreaterThan(0);
        for (const room of fightRooms) {
          const cell = cells.find((c) => c.roomId === room.id);
          expect(cell, `${floor.id}: fight room ${room.id} has no grid cell`).toBeTruthy();
          expect(
            cell && inHall(cell.x, cell.y),
            `${floor.id}: fight room ${room.id} sits on a bare corridor cell, not a hall`
          ).toBe(true);
        }
      });
    });
  }
});

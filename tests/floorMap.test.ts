import { describe, expect, it } from "vitest";
import { expandFloorMap, isMapFloor, type RawMapFloor } from "../src/domain/floorMap";

const base: RawMapFloor = {
  id: "dungeon.test",
  name: "Test Floor",
  startRoom: "room.test.entry",
  map: ["E..", ".#.", "..S"].join("\n"),
  symbols: { E: "room.test.entry", S: "room.test.stairs" },
  corridor: { name: "Corridor", description: "A plain corridor." },
  edges: [{ from: "room.test.stairs", direction: "south", kind: "stairs", to: "room.next.entry", targetFloorId: "dungeon.next" }],
  rooms: [
    { id: "room.test.entry", name: "Entry", description: "Start." },
    { id: "room.test.stairs", name: "Stairs", description: "Down.", restPoint: true }
  ]
};

function expand(overrides: Partial<RawMapFloor> = {}) {
  return expandFloorMap({ ...base, ...overrides }) as {
    grid: { cells: Array<{ id: string; roomId: string; x: number; y: number; edges: Record<string, { kind: string; targetRoomId?: string; targetFloorId?: string }> }> };
    rooms: Array<{ id: string; name: string; exits: Record<string, string>; restPoint?: boolean }>;
  };
}

describe("floor map expander", () => {
  it("detects map floors", () => {
    expect(isMapFloor(base)).toBe(true);
    expect(isMapFloor({ id: "x", grid: { cells: [] } })).toBe(false);
  });

  it("expands corridors and walls into cells, skipping '#' and spaces", () => {
    const floor = expand();
    // 3x3 grid minus the single center wall = 8 cells.
    expect(floor.grid.cells).toHaveLength(8);
    expect(floor.grid.cells.some((cell) => cell.x === 1 && cell.y === 1)).toBe(false);
    // Corridor cells get synthesized ids; specials keep authored ids.
    expect(floor.rooms.find((room) => room.id === "room.test.c1_0")).toBeTruthy();
    expect(floor.rooms.find((room) => room.id === "room.test.entry")).toBeTruthy();
  });

  it("auto-connects adjacent cells with open edges and derives exits", () => {
    const floor = expand();
    const entry = floor.grid.cells.find((cell) => cell.roomId === "room.test.entry")!;
    // Entry at (0,0): east neighbor (1,0) exists, south neighbor (0,1) exists.
    expect(entry.edges.east?.kind).toBe("open");
    expect(entry.edges.east?.targetRoomId).toBe("room.test.c1_0");
    expect(entry.edges.south?.targetRoomId).toBe("room.test.c0_1");
    expect(entry.edges.north).toBeUndefined();
    const entryRoom = floor.rooms.find((room) => room.id === "room.test.entry")!;
    expect(entryRoom.exits.east).toBe("room.test.c1_0");
    expect(entryRoom.exits.south).toBe("room.test.c0_1");
  });

  it("preserves authored special-room fields", () => {
    const floor = expand();
    const stairsRoom = floor.rooms.find((room) => room.id === "room.test.stairs")!;
    expect(stairsRoom.restPoint).toBe(true);
  });

  it("emits a cross-floor stairs edge without a target cell", () => {
    const floor = expand();
    const stairs = floor.grid.cells.find((cell) => cell.roomId === "room.test.stairs")!;
    expect(stairs.edges.south?.kind).toBe("stairs");
    expect(stairs.edges.south?.targetRoomId).toBe("room.next.entry");
    expect(stairs.edges.south?.targetFloorId).toBe("dungeon.next");
    // The stairs room's exit graph carries the cross-floor link.
    const stairsRoom = floor.rooms.find((room) => room.id === "room.test.stairs")!;
    expect(stairsRoom.exits.south).toBe("room.next.entry");
  });

  it("mirrors a door onto the neighbour's reverse edge", () => {
    const floor = expand({
      edges: [{ from: "room.test.entry", direction: "east", kind: "door" }]
    });
    const entry = floor.grid.cells.find((cell) => cell.roomId === "room.test.entry")!;
    const neighbor = floor.grid.cells.find((cell) => cell.roomId === "room.test.c1_0")!;
    expect(entry.edges.east?.kind).toBe("door");
    expect(neighbor.edges.west?.kind).toBe("door");
  });

  it("keeps a magic shortcut one-directional without breaking the target's edges", () => {
    // Shortcut from the far stairs cell back to the entry (non-adjacent).
    const floor = expand({
      edges: [{ from: "room.test.stairs", direction: "east", kind: "shortcut", to: "room.test.entry", targetFloorId: "dungeon.test" }]
    });
    const stairs = floor.grid.cells.find((cell) => cell.roomId === "room.test.stairs")!;
    expect(stairs.edges.east?.kind).toBe("shortcut");
    expect(stairs.edges.east?.targetRoomId).toBe("room.test.entry");
    // Entry keeps its normal corridor edges (reverse untouched for non-adjacent).
    const entry = floor.grid.cells.find((cell) => cell.roomId === "room.test.entry")!;
    expect(entry.edges.east?.kind).toBe("open");
  });
});

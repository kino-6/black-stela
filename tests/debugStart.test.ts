import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress, parseDebugProgress } from "../src/debug/debugStart";

describe("debug start state", () => {
  it("parses supported progress inputs with a safe default", () => {
    expect(parseDebugProgress("ready")).toBe("ready");
    expect(parseDebugProgress("after_encounter")).toBe("after_encounter");
    expect(parseDebugProgress("return_ready")).toBe("return_ready");
    expect(parseDebugProgress("clear_ready")).toBe("return_ready");
    expect(parseDebugProgress("floor_8")).toBe("floor_8");
    expect(parseDebugProgress("unknown")).toBe("ready");
    expect(parseDebugProgress(null)).toBe("ready");
  });

  it("starts with the expected debug party and map information", () => {
    const state = createDebugStateFromProgress(defaultWorld, "after_encounter");

    expect(state.party.map((member) => member.name)).toEqual(["Mira", "Sei", "Rook", "Vale", "Bran", "Lio"]);
    expect(state.phase).toBe("dungeon");
    expect(state.position).toEqual({ roomId: "room.b1f.002", cellId: "cell.b1f.002", facing: "east" });
    expect(state.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(state.resolvedTraps).toContain("trap.b1f.needle");
    expect(state.map.floorId).toBe("dungeon.b1f");
    expect(state.map.currentRoomId).toBe("room.b1f.002");
    expect(state.map.currentCellId).toBe("cell.b1f.002");
    expect(state.map.currentFacing).toBe("east");
    expect(state.map.visitedRooms).toEqual(["room.b1f.001", "room.b1f.002"]);
    expect(state.map.visitedCells).toEqual(["cell.b1f.001", "cell.b1f.002"]);
    expect(state.map.knownExits["room.b1f.002"]).toEqual(["west", "east"]);
    expect(state.map.blockedExits).toEqual({});
    expect(state.map.secretCandidates).toEqual({});
  });

  it("starts at authored scenario floors with expected map context", () => {
    const state = createDebugStateFromProgress(defaultWorld, "floor_8");

    expect(state.phase).toBe("dungeon");
    expect(state.position).toEqual({ roomId: "room.b8f.001", cellId: "cell.b8f.001", facing: "east" });
    expect(state.map.floorId).toBe("dungeon.b8f");
    expect(state.map.visitedRooms).toContain("room.b1f.006");
    expect(state.map.visitedRooms).toContain("room.b8f.001");
    expect(state.inventory.map((item) => item.id)).toContain("item.lantern-oil");
  });
});

import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress, parseDebugProgress } from "../src/debug/debugStart";

describe("debug start state", () => {
  it("parses supported progress inputs with a safe default", () => {
    expect(parseDebugProgress("ready")).toBe("ready");
    expect(parseDebugProgress("after_encounter")).toBe("after_encounter");
    expect(parseDebugProgress("clear_ready")).toBe("clear_ready");
    expect(parseDebugProgress("unknown")).toBe("ready");
    expect(parseDebugProgress(null)).toBe("ready");
  });

  it("starts with the expected debug party and map information", () => {
    const state = createDebugStateFromProgress(defaultWorld, "after_encounter");

    expect(state.party.map((member) => member.name)).toEqual(["Mira", "Sei", "Rook", "Vale"]);
    expect(state.phase).toBe("dungeon");
    expect(state.position).toEqual({ roomId: "room.b1f.002", facing: "east" });
    expect(state.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(state.resolvedTraps).toContain("trap.b1f.needle");
    expect(state.map.floorId).toBe("dungeon.b1f");
    expect(state.map.currentRoomId).toBe("room.b1f.002");
    expect(state.map.currentFacing).toBe("east");
    expect(state.map.visitedRooms).toEqual(["room.b1f.001", "room.b1f.002"]);
    expect(state.map.knownExits["room.b1f.002"]).toEqual(["west", "east"]);
    expect(state.map.blockedExits).toEqual({});
    expect(state.map.secretCandidates).toEqual({});
  });
});

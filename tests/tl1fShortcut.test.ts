import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { createInitialGameState, addCharacter } from "../src/domain/gameState";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { executeCommand } from "../src/domain/rulesEngine";
import type { GameEvent, GameState } from "../src/domain/types";

/**
 * #15 — tl1f's evacuation-shutter shortcut is a REAL passage cell (17,16) on the map, NOT a shortcut warp:
 * routing the midnight signal (信号室 grants flag.tl1f.signal-routed) unlocks the vertical passage between the
 * emergency-call point (帰還, 17,15) and the platform stairs (降り口, 17,17), collapsing a ~34-step return trek
 * to a couple of steps. It must stay LOCKED until earned (no early mystery warp — the #8 defect), open both
 * ways once routed, and — unlike a `shortcut` edge, which floor_map draws as a wall — be built from ordinary
 * OPEN edges through a drawn cell, so the map SHOWS it and the D9 no-warp guard stays satisfied.
 */
const world = worldRegistry["terminal-line"];

function eventTypes(state: GameState): string[] {
  return (state.log ?? []).map((entry) => (entry.event as GameEvent | undefined)?.type).filter(Boolean) as string[];
}

function walk(fromRoom: string, facing: "south" | "north", routed: boolean): GameState {
  let state = createInitialGameState();
  state = addCharacter(state, createGuildCharacter({ name: "Probe", classId: "warrior", seed: "tl1f-shortcut" }));
  const start: GameState = {
    ...state,
    phase: "dungeon",
    position: { roomId: fromRoom, facing },
    map: { ...state.map, floorId: "dungeon.tl1f" },
    discoveredSecrets: routed ? ["flag.tl1f.signal-routed"] : []
  };
  return executeCommand(start, world, { type: "move_forward" });
}

describe("#15 tl1f evacuation-shutter shortcut", () => {
  it("stays LOCKED until the signal is routed — no early mystery warp (#8)", () => {
    const before = walk("room.tl1f.return-marker", "south", false);
    expect(before.position?.roomId, "the shutter must not open on its own").toBe("room.tl1f.return-marker");
    expect(eventTypes(before)).toContain("movement_blocked");
  });

  it("routing the signal opens 帰還 → 降り口 (reaching the shutter passage cell)", () => {
    const after = walk("room.tl1f.return-marker", "south", true);
    // One step lands in the shutter passage cell; the point is that the wall is now WALKABLE, not blocked.
    expect(after.position?.roomId, "the routed shutter is walkable").not.toBe("room.tl1f.return-marker");
    expect(eventTypes(after)).toContain("room_entered");
  });

  it("opens symmetrically from 降り口 too", () => {
    const back = walk("room.tl1f.down-stair", "north", true);
    expect(back.position?.roomId).not.toBe("room.tl1f.down-stair");
    expect(eventTypes(back)).toContain("room_entered");
  });

  it("is a DRAWN passage cell with OPEN edges (not a shortcut warp), gated by the routed flag", () => {
    const tl1f = world.dungeons.find((d) => d.id === "dungeon.tl1f")!;
    const rm = tl1f.grid!.cells.find((c) => c.roomId === "room.tl1f.return-marker")!;
    const ds = tl1f.grid!.cells.find((c) => c.roomId === "room.tl1f.down-stair")!;
    // The shutter must be ORDINARY open edges through a real cell — a `shortcut` here would be a map-invisible
    // warp and the D9 guard would (rightly) reject it.
    expect(rm.edges?.south?.kind).toBe("open");
    expect(ds.edges?.north?.kind).toBe("open");
    expect(tl1f.grid!.cells.some((c) => c.x === 17 && c.y === 16), "the shutter passage cell 17,16 exists").toBe(true);
    const gate = tl1f.rooms.find((r) => r.id === "room.tl1f.return-marker")?.gates?.find((g) => g.direction === "south");
    expect(gate?.requiredFlag).toBe("flag.tl1f.signal-routed");
  });
});

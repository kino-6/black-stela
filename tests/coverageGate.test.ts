import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress } from "../src/debug/debugStart";
import { executeCommand, floorExploredRatio } from "../src/domain/rulesEngine";
import type { GameState, ScenarioWorld } from "../src/domain/types";

// Mechanism test for the exploration-gated descent (#2). A gate carrying
// `requiredExploredRatio` must stay locked until the party has visited that
// fraction of the floor's reachable cells — so the stairs can't be reached by a
// straight shot. B1F content adoption + the 0.8 layout come next (behind
// real-play approval); this locks the engine mechanism.

const B1F = "dungeon.b1f";
const STAIR = "room.b1f.012";

function b1fCellRooms(world: ScenarioWorld): string[] {
  const cells = world.dungeons.find((d) => d.id === B1F)?.grid?.cells ?? [];
  return cells.map((c) => c.roomId);
}

// Clone the world and require an 80% sweep on B1F's down-stair (alongside the
// existing crank flag).
function withCoverageGate(world: ScenarioWorld, ratio: number): ScenarioWorld {
  const w: ScenarioWorld = structuredClone(world);
  const stair = w.dungeons.find((d) => d.id === B1F)!.rooms.find((r) => r.id === STAIR)!;
  (stair.gates![0] as any).requiredExploredRatio = ratio;
  return w;
}

function stairState(world: ScenarioWorld, visitedRooms: string[]): GameState {
  const base = createDebugStateFromProgress(world, "ready");
  return {
    ...base,
    phase: "dungeon",
    position: { roomId: STAIR, facing: "east" },
    discoveredSecrets: ["flag.b1f.descent"], // crank already turned
    map: { ...base.map, floorId: B1F, currentRoomId: STAIR, visitedRooms }
  };
}

describe("exploration-gated descent (requiredExploredRatio)", () => {
  it("floorExploredRatio = visited floor cells / total floor cells", () => {
    const all = b1fCellRooms(defaultWorld);
    expect(floorExploredRatio(defaultWorld, stairState(defaultWorld, [STAIR]))).toBeCloseTo(1 / all.length, 5);
    expect(floorExploredRatio(defaultWorld, stairState(defaultWorld, all))).toBe(1);
  });

  it("bars the descent below the threshold even with the crank flag set", () => {
    const world = withCoverageGate(defaultWorld, 0.8);
    const barely = stairState(world, [STAIR]); // ~0.6% explored
    const next = executeCommand(barely, world, { type: "use_stairs" });
    expect(next.position?.roomId).toBe(STAIR);
    expect(next.map.floorId).toBe(B1F);
  });

  it("allows the descent once the floor is mapped past the threshold", () => {
    const world = withCoverageGate(defaultWorld, 0.8);
    const swept = stairState(world, b1fCellRooms(world)); // 100% explored
    const next = executeCommand(swept, world, { type: "use_stairs" });
    expect(next.map.floorId).toBe("dungeon.b2f");
  });
});

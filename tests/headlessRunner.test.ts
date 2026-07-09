import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress } from "../src/debug/debugStart";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import type { ScenarioWorld } from "../src/domain/types";
import { runHeadlessClear, runHeadlessProbes } from "../src/headless/headlessRunner";

describe("headless reachability runner", () => {
  it("navigates from a fresh debug party and reaches town", () => {
    const initialState = createDebugStateFromProgress(defaultWorld, "ready");
    const result = runHeadlessClear(initialState, defaultWorld, 600);

    expect(result.cleared).toBe(true);
    expect(result.reason).toBe("clear");
    expect(result.state.phase).toBe("town");
    expect(result.state.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(result.trace.find((step) => step.command === "return_to_town")?.toPhase).toBe("town");
  });

  it("can resume from an in-progress map state and still reach town", () => {
    const initialState = createDebugStateFromProgress(defaultWorld, "after_encounter");
    const result = runHeadlessClear(initialState, defaultWorld, 600);

    expect(result.cleared).toBe(true);
    expect(result.state.defeatedEnemies).toContain("enemy.b1f.ash-slime");
  });

  it("reports a stuck room when no scenario route is available", () => {
    const result = runHeadlessClear(stateWithParty(), blockedWorld, 5);

    expect(result.cleared).toBe(false);
    expect(result.reason).toBe("stuck");
    expect(result.diagnostic).toMatchObject({
      roomId: "room.blocked.start",
      floorId: "dungeon.blocked",
      reason: "no_route"
    });
  });

  it("reports max steps for looping scenarios", () => {
    const result = runHeadlessClear(stateWithParty(), loopWorld, 4);

    expect(result.cleared).toBe(false);
    expect(result.reason).toBe("max_steps");
    expect(result.diagnostic?.roomId).toMatch(/^room\.loop\./);
  });

  it("runs probes from authored debug progress states", () => {
    const results = runHeadlessProbes(defaultWorld);

    expect(results.map((result) => result.progress)).toContain("floor_8");
    // With level growth the party can now clear every authored start state.
    expect(results.every((result) => result.cleared)).toBe(true);
    expect(results.find((result) => result.progress === "floor_8")?.state.phase).toBe("town");
  });
});

function stateWithParty() {
  return addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" }));
}

const blockedWorld: ScenarioWorld = {
  id: "world.blocked",
  title: "Blocked Test",
  startDungeon: "dungeon.blocked",
  startRoom: "room.blocked.start",
  aiPolicy: { allowed: [], forbidden: [] },
  items: [],
  equipment: [],
  shops: [],
  enemies: [],
  encounterTables: [],
  treasureTables: [],
  progressionFlags: [],
  dungeons: [
    {
      id: "dungeon.blocked",
      name: "Blocked",
      startRoom: "room.blocked.start",
      rooms: [
        {
          id: "room.blocked.start",
          name: "Blocked Start",
          description: "There is nowhere to go.",
          exits: {}
        }
      ]
    }
  ]
};

const loopWorld: ScenarioWorld = {
  id: "world.loop",
  title: "Loop Test",
  startDungeon: "dungeon.loop",
  startRoom: "room.loop.a",
  aiPolicy: { allowed: [], forbidden: [] },
  items: [],
  equipment: [],
  shops: [],
  enemies: [],
  encounterTables: [],
  treasureTables: [],
  progressionFlags: [],
  dungeons: [
    {
      id: "dungeon.loop",
      name: "Loop",
      startRoom: "room.loop.a",
      rooms: [
        {
          id: "room.loop.a",
          name: "Loop A",
          description: "A corridor bends east.",
          exits: { east: "room.loop.b" }
        },
        {
          id: "room.loop.b",
          name: "Loop B",
          description: "A corridor bends west.",
          exits: { west: "room.loop.a" }
        }
      ]
    }
  ]
};

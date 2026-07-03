import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress } from "../src/debug/debugStart";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import type { ScenarioWorld } from "../src/domain/types";
import { runHeadlessClear, runHeadlessProbes } from "../src/headless/headlessRunner";

describe("headless clear runner", () => {
  it("clears the MVP dungeon deterministically from a fresh debug party", () => {
    const initialState = createDebugStateFromProgress(defaultWorld, "ready");
    const result = runHeadlessClear(initialState, defaultWorld);

    expect(result.cleared).toBe(true);
    expect(result.reason).toBe("clear");
    expect(result.state.phase).toBe("town");
    expect(result.state.defeatedEnemies).toContain("enemy.b1f.ash-slime");
    expect(result.state.resolvedTraps).toContain("trap.b1f.needle");
    expect(result.state.map.visitedRooms).toEqual(["room.b1f.001", "room.b1f.002", "room.b1f.003"]);
    expect(result.commands.map((command) => command.type)).toEqual([
      "enter_dungeon",
      "move_forward",
      "declare_round",
      "move_forward",
      "return_to_town"
    ]);
    expect(result.trace.map((step) => step.command)).toEqual(result.commands.map((command) => command.type));
    expect(result.trace.filter((step) => step.knowledge === "known_map_exits")).toHaveLength(2);
    expect(result.trace.find((step) => step.command === "return_to_town")).toMatchObject({
      fromRoomId: "room.b1f.003",
      toPhase: "town",
      knowledge: "known_room_state"
    });
  });

  it("can resume from an in-progress map state and still clear", () => {
    const initialState = createDebugStateFromProgress(defaultWorld, "after_encounter");
    const result = runHeadlessClear(initialState, defaultWorld);

    expect(result.cleared).toBe(true);
    expect(result.commands.map((command) => command.type)).toEqual(["move_forward", "return_to_town"]);
    expect(result.trace[0]).toMatchObject({
      command: "move_forward",
      fromRoomId: "room.b1f.002",
      toRoomId: "room.b1f.003",
      knowledge: "known_map_exits"
    });
    expect(result.state.map.visitedRooms).toContain("room.b1f.003");
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
    expect(results.some((result) => !result.cleared)).toBe(true);
    expect(results.find((result) => result.progress === "floor_8")?.state.phase).toBe("town");
    expect(results.find((result) => result.progress === "floor_2")?.diagnostic?.phase).toBe("combat");
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

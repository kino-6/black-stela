import { describe, expect, it } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { createDebugStateFromProgress } from "../src/debug/debugStart";
import { runHeadlessClear } from "../src/headless/headlessRunner";

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
      "attack",
      "move_forward",
      "return_to_town"
    ]);
  });

  it("can resume from an in-progress map state and still clear", () => {
    const initialState = createDebugStateFromProgress(defaultWorld, "after_encounter");
    const result = runHeadlessClear(initialState, defaultWorld);

    expect(result.cleared).toBe(true);
    expect(result.commands.map((command) => command.type)).toEqual(["move_forward", "return_to_town"]);
    expect(result.state.map.visitedRooms).toContain("room.b1f.003");
  });
});

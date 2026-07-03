import { executeCommand } from "../domain/rulesEngine";
import type { Command, GameState, ScenarioWorld } from "../domain/types";

export interface HeadlessClearResult {
  cleared: boolean;
  reason: "clear" | "stuck" | "max_steps";
  state: GameState;
  commands: Command[];
}

export function runHeadlessClear(initialState: GameState, world: ScenarioWorld, maxSteps = 20): HeadlessClearResult {
  let state = initialState;
  const commands: Command[] = [];

  for (let step = 0; step < maxSteps; step += 1) {
    if (isMvpCleared(state)) {
      return { cleared: true, reason: "clear", state, commands };
    }

    const command = chooseNextCommand(state);
    if (!command) {
      return { cleared: false, reason: "stuck", state, commands };
    }

    commands.push(command);
    state = executeCommand(state, world, command);
  }

  return {
    cleared: isMvpCleared(state),
    reason: isMvpCleared(state) ? "clear" : "max_steps",
    state,
    commands
  };
}

export function isMvpCleared(state: GameState): boolean {
  return (
    state.phase === "town" &&
    state.defeatedEnemies.includes("enemy.b1f.ash-slime") &&
    state.resolvedTraps.includes("trap.b1f.needle") &&
    state.map.visitedRooms.includes("room.b1f.003")
  );
}

function chooseNextCommand(state: GameState): Command | null {
  if (state.phase === "town") {
    return state.party.length > 0 ? { type: "enter_dungeon" } : null;
  }

  if (state.phase === "combat") {
    return { type: "attack" };
  }

  if (!state.position) {
    return null;
  }

  if (state.position.roomId === "room.b1f.001") {
    return state.position.facing === "east" ? { type: "move_forward" } : { type: "turn_right" };
  }

  if (state.position.roomId === "room.b1f.002") {
    return state.position.facing === "east" ? { type: "move_forward" } : { type: "turn_right" };
  }

  if (state.position.roomId === "room.b1f.003") {
    return { type: "return_to_town" };
  }

  return null;
}

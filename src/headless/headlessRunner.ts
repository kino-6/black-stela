import { executeCommand } from "../domain/rulesEngine";
import { getRoom } from "../domain/scenario";
import type { Command, Direction, GameState, ScenarioWorld } from "../domain/types";

export interface HeadlessDiagnostic {
  reason: "no_party" | "no_position" | "no_route" | "max_steps";
  roomId?: string;
  phase: GameState["phase"];
}

export interface HeadlessClearResult {
  cleared: boolean;
  reason: "clear" | "stuck" | "max_steps";
  state: GameState;
  commands: Command[];
  diagnostic?: HeadlessDiagnostic;
}

export function runHeadlessClear(initialState: GameState, world: ScenarioWorld, maxSteps = 20): HeadlessClearResult {
  let state = initialState;
  const commands: Command[] = [];

  for (let step = 0; step < maxSteps; step += 1) {
    if (isMvpCleared(state)) {
      return { cleared: true, reason: "clear", state, commands };
    }

    const decision = chooseNextCommand(state, world);
    if (!decision.command) {
      return { cleared: false, reason: "stuck", state, commands, diagnostic: decision.diagnostic };
    }

    commands.push(decision.command);
    state = executeCommand(state, world, decision.command);
  }

  const cleared = isMvpCleared(state);
  return {
    cleared,
    reason: cleared ? "clear" : "max_steps",
    state,
    commands,
    diagnostic: cleared ? undefined : describeState(state, "max_steps")
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

interface HeadlessDecision {
  command: Command | null;
  diagnostic?: HeadlessDiagnostic;
}

const directionOrder: Direction[] = ["north", "east", "south", "west"];
const rightOf: Record<Direction, Direction> = {
  north: "east",
  east: "south",
  south: "west",
  west: "north"
};
const leftOf: Record<Direction, Direction> = {
  north: "west",
  west: "south",
  south: "east",
  east: "north"
};

function chooseNextCommand(state: GameState, world: ScenarioWorld): HeadlessDecision {
  if (state.phase === "town") {
    return state.party.length > 0
      ? { command: { type: "enter_dungeon" } }
      : { command: null, diagnostic: describeState(state, "no_party") };
  }

  if (state.phase === "combat") {
    return { command: { type: "attack" } };
  }

  if (!state.position) {
    return { command: null, diagnostic: describeState(state, "no_position") };
  }

  const room = getRoom(world, state.position.roomId);
  if (room.stairsToTown && state.defeatedEnemies.length > 0) {
    return { command: { type: "return_to_town" } };
  }

  const direction = chooseExplorationDirection(state, room.exits);
  if (!direction) {
    return { command: null, diagnostic: describeState(state, "no_route") };
  }

  if (state.position.facing === direction) {
    return { command: { type: "move_forward" } };
  }

  return { command: turnToward(state.position.facing, direction) };
}

function chooseExplorationDirection(
  state: GameState,
  exits: Partial<Record<Direction, string>>
): Direction | null {
  const directions = directionOrder.filter((direction) => exits[direction]);
  const unexplored = directions.find((direction) => {
    const roomId = exits[direction];
    return roomId ? !state.map.visitedRooms.includes(roomId) : false;
  });

  return unexplored ?? directions[0] ?? null;
}

function turnToward(facing: Direction, target: Direction): Command {
  if (rightOf[facing] === target) {
    return { type: "turn_right" };
  }

  if (leftOf[facing] === target) {
    return { type: "turn_left" };
  }

  return { type: "turn_right" };
}

function describeState(state: GameState, reason: HeadlessDiagnostic["reason"]): HeadlessDiagnostic {
  return {
    reason,
    phase: state.phase,
    roomId: state.position?.roomId
  };
}

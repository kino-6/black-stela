import { executeCommand } from "../domain/rulesEngine";
import { getGridEdge, getRoom } from "../domain/scenario";
import { createDebugStateFromProgress, debugProgressValues, type DebugProgress } from "../debug/debugStart";
import type { Command, Direction, GameState, ScenarioWorld } from "../domain/types";

export interface HeadlessDiagnostic {
  reason: "no_party" | "no_position" | "no_route" | "max_steps";
  roomId?: string;
  floorId?: string | null;
  phase: GameState["phase"];
  command?: Command["type"];
}

export interface HeadlessClearResult {
  cleared: boolean;
  reason: "clear" | "stuck" | "max_steps";
  state: GameState;
  commands: Command[];
  trace: HeadlessStepTrace[];
  diagnostic?: HeadlessDiagnostic;
}

export interface HeadlessProbeResult extends HeadlessClearResult {
  progress: DebugProgress;
}

export type HeadlessKnowledge =
  | "town_state"
  | "combat_state"
  | "known_room_state"
  | "known_map_exits";

export interface HeadlessStepTrace {
  command: Command["type"];
  fromPhase: GameState["phase"];
  toPhase: GameState["phase"];
  fromRoomId?: string;
  toRoomId?: string;
  floorId?: string | null;
  knowledge: HeadlessKnowledge;
}

export function runHeadlessClear(initialState: GameState, world: ScenarioWorld, maxSteps = 20): HeadlessClearResult {
  let state = initialState;
  const commands: Command[] = [];
  const trace: HeadlessStepTrace[] = [];

  for (let step = 0; step < maxSteps; step += 1) {
    if (isMvpCleared(state)) {
      return { cleared: true, reason: "clear", state, commands, trace };
    }

    const decision = chooseNextCommand(state, world);
    if (!decision.command) {
      return { cleared: false, reason: "stuck", state, commands, trace, diagnostic: decision.diagnostic };
    }

    commands.push(decision.command);
    const nextState = executeCommand(state, world, decision.command);
    trace.push({
      command: decision.command.type,
      fromPhase: state.phase,
      toPhase: nextState.phase,
      fromRoomId: state.position?.roomId,
      toRoomId: nextState.position?.roomId,
      floorId: state.map.floorId ?? nextState.map.floorId,
      knowledge: decision.knowledge
    });
    if (nextState === state) {
      return {
        cleared: false,
        reason: "stuck",
        state,
        commands,
        trace,
        diagnostic: { ...describeState(state, "no_route"), command: decision.command.type }
      };
    }
    state = nextState;
  }

  const cleared = isMvpCleared(state);
  return {
    cleared,
    reason: cleared ? "clear" : "max_steps",
    state,
    commands,
    trace,
    diagnostic: cleared ? undefined : describeState(state, "max_steps")
  };
}

export function runHeadlessProbes(world: ScenarioWorld, maxSteps = 80): HeadlessProbeResult[] {
  return debugProgressValues
    .filter((progress) => progress !== "ready")
    .map((progress) => ({
      progress,
      ...runHeadlessClear(createDebugStateFromProgress(world, progress), world, maxSteps)
    }));
}

export function isMvpCleared(state: GameState): boolean {
  return (
    state.phase === "town" &&
    state.defeatedEnemies.includes("enemy.b1f.ash-slime") &&
    state.resolvedTraps.includes("trap.b1f.needle") &&
    state.map.visitedRooms.includes("room.b1f.006")
  );
}

interface HeadlessDecision {
  command: Command | null;
  knowledge: HeadlessKnowledge;
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
      ? { command: { type: "enter_dungeon" }, knowledge: "town_state" }
      : { command: null, knowledge: "town_state", diagnostic: describeState(state, "no_party") };
  }

  if (state.phase === "combat") {
    const target = state.combat?.enemyGroups.find((group) => group.count > 0);
    const frontActors = state.party.filter((member) => member.row === "front" && !member.injury && member.hp > 0);
    const actors = frontActors.length > 0 ? frontActors : state.party.filter((member) => !member.injury && member.hp > 0);
    return target && actors.length > 0
      ? {
          command: {
            type: "declare_round",
            actions: actors.map((actor) => ({ actorId: actor.id, action: "attack", targetGroupId: target.id }))
          },
          knowledge: "combat_state"
        }
      : { command: null, knowledge: "combat_state", diagnostic: describeState(state, "no_route") };
  }

  if (!state.position) {
    return { command: null, knowledge: "known_room_state", diagnostic: describeState(state, "no_position") };
  }

  const room = getRoom(world, state.position.roomId);
  if (room.stairsToTown && state.defeatedEnemies.length > 0) {
    return { command: { type: "return_to_town" }, knowledge: "known_room_state" };
  }

  const direction = chooseExplorationDirection(state, room.exits, state.map.knownExits[state.position.roomId] ?? []);
  if (!direction) {
    return { command: null, knowledge: "known_map_exits", diagnostic: describeState(state, "no_route") };
  }

  if (state.position.facing === direction) {
    const edge = getGridEdge(world, state.position.roomId, direction);
    return {
      command: edge?.kind === "stairs" ? { type: "use_stairs" } : { type: "move_forward" },
      knowledge: "known_map_exits"
    };
  }

  return { command: turnToward(state.position.facing, direction), knowledge: "known_map_exits" };
}

function chooseExplorationDirection(
  state: GameState,
  exits: Partial<Record<Direction, string>>,
  knownDirections: Direction[]
): Direction | null {
  const directions = directionOrder.filter((direction) => knownDirections.includes(direction) && exits[direction]);
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
    roomId: state.position?.roomId,
    floorId: state.map.floorId
  };
}

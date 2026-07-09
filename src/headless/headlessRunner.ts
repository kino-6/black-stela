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
  // Run-scoped visit counts let the explorer prefer least-trodden ground when a
  // room offers no unexplored exit, so it walks out of dense loops instead of
  // ping-ponging between two already-seen cells.
  const visitCounts = new Map<string, number>();
  // Exits the engine refused to traverse this pass — a locked gate on a stair or
  // corridor, or an unrevealed secret wall. Deferring them lets the explorer go
  // find the crank (or simply route around an optional secret) instead of
  // looping on the blocked exit. Cleared whenever a flag/secret is discovered, so
  // a freshly-freed passage is retried on the next pass.
  const blockedMoves = new Set<string>();

  for (let step = 0; step < maxSteps; step += 1) {
    if (isMvpCleared(state)) {
      return { cleared: true, reason: "clear", state, commands, trace };
    }

    if (state.position) {
      visitCounts.set(state.position.roomId, (visitCounts.get(state.position.roomId) ?? 0) + 1);
    }

    const decision = chooseNextCommand(state, world, visitCounts, blockedMoves);
    if (!decision.command) {
      return { cleared: false, reason: "stuck", state, commands, trace, diagnostic: decision.diagnostic };
    }

    commands.push(decision.command);
    const nextState = executeCommand(state, world, decision.command);

    // A move or stair that left the party in place hit a locked gate or an
    // unrevealed secret wall — defer that exit and explore elsewhere.
    if (
      (decision.command.type === "use_stairs" || decision.command.type === "move_forward") &&
      state.position &&
      nextState.position?.roomId === state.position.roomId
    ) {
      blockedMoves.add(`${state.position.roomId}:${state.position.facing}`);
    }
    // A newly discovered flag/secret may have freed a deferred passage.
    if (nextState.discoveredSecrets.length !== state.discoveredSecrets.length) {
      blockedMoves.clear();
    }
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

// Dense 20x20 floors cost the greedy explorer far more steps than the old linear
// layout, and a deep-floor probe may cross several of them to reach a town-return
// anchor — so the walk budget is generous.
export function runHeadlessProbes(world: ScenarioWorld, maxSteps = 1800): HeadlessProbeResult[] {
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
    state.map.visitedRooms.includes("room.b1f.warden")
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

function chooseNextCommand(
  state: GameState,
  world: ScenarioWorld,
  visitCounts: Map<string, number> = new Map(),
  blockedMoves: Set<string> = new Set()
): HeadlessDecision {
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
  // Return from any town-return anchor the engine honours — rest points as well
  // as stairs-to-town — so a deep-floor probe heads home from the nearest anchor
  // instead of climbing every dense floor back to the surface.
  if ((room.stairsToTown || room.restPoint) && state.defeatedEnemies.length > 0) {
    return { command: { type: "return_to_town" }, knowledge: "known_room_state" };
  }

  const direction = chooseExplorationDirection(
    state,
    room.exits,
    state.map.knownExits[state.position.roomId] ?? [],
    visitCounts,
    state.position.roomId,
    blockedMoves
  );
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
  knownDirections: Direction[],
  visitCounts: Map<string, number>,
  roomId: string,
  blockedMoves: Set<string>
): Direction | null {
  const all = directionOrder.filter((direction) => knownDirections.includes(direction) && exits[direction]);
  // Defer a stair the engine just refused to descend (a locked gate bars it):
  // explore the rest of the floor to find the crank that frees it, then the
  // stair is cleared from this set once a flag is granted and we come back.
  const directions = all.filter((direction) => !blockedMoves.has(`${roomId}:${direction}`));
  const pool = directions.length > 0 ? directions : all;

  const unexplored = pool.find((direction) => {
    const target = exits[direction];
    return target ? !state.map.visitedRooms.includes(target) : false;
  });
  if (unexplored) {
    return unexplored;
  }

  if (pool.length === 0) {
    return null;
  }

  // No unexplored exit: head toward the least-visited neighbour (ties broken by
  // the fixed direction order) so dense loops unwind instead of oscillating.
  return pool.reduce((best, direction) => {
    const cost = visitCounts.get(exits[direction] ?? "") ?? 0;
    const bestCost = visitCounts.get(exits[best] ?? "") ?? 0;
    return cost < bestCost ? direction : best;
  }, pool[0]);
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

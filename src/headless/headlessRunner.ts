import { executeCommand } from "../domain/rulesEngine";
import { getFloorIdForRoom, getGridEdge, getRoom } from "../domain/scenario";
import { analyzeFloorGraph } from "../domain/floorGraph";
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

const floorDepthOf = (id: string | undefined | null) => Number(id?.match(/b(\d+)f/)?.[1] ?? 0);

function downStairRoomOnFloor(world: ScenarioWorld, floorId: string): string | null {
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  const depth = floorDepthOf(floorId);
  for (const cell of floor?.grid?.cells ?? []) {
    for (const edge of Object.values(cell.edges)) {
      if (edge?.kind === "stairs" && edge.targetFloorId && floorDepthOf(edge.targetFloorId) > depth) {
        return cell.roomId;
      }
    }
  }
  return null;
}

// One command that walks one cell along the shortest route toward a target room.
function stepTowardRoom(state: GameState, world: ScenarioWorld, floorId: string, targetRoomId: string): Command | null {
  if (!state.position) {
    return null;
  }
  const path = analyzeFloorGraph(world, floorId).shortestPathCells(state.position.roomId, targetRoomId);
  if (path.length < 2) {
    return null;
  }
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  const byId = new Map((floor?.grid?.cells ?? []).map((cell) => [cell.id, cell]));
  const here = byId.get(path[0]);
  const next = byId.get(path[1]);
  if (!here || !next) {
    return null;
  }
  const dir: Direction =
    next.x - here.x === 1 ? "east" : next.x - here.x === -1 ? "west" : next.y - here.y === 1 ? "south" : "north";
  return state.position.facing === dir ? { type: "move_forward" } : turnToward(state.position.facing, dir);
}

// Debug convenience: auto-walk the dungeon so a tester need not tap WASD dozens of
// times. It BLITZES floor by floor — greedily visiting unexplored cells (real
// movement, so encounters fire and the map reveals), then walking to the down-stair
// and descending — and STOPS on any combat so the player fights, or when a descent
// is barred (a gate/crank it hasn't opened). Never returns to town on its own.
export function debugAutoExplore(initialState: GameState, world: ScenarioWorld, maxSteps = 800): GameState {
  let current = initialState;

  for (let floorPass = 0; floorPass < 10; floorPass += 1) {
    const visitCounts = new Map<string, number>();
    const blockedMoves = new Set<string>();

    // Phase 1: explore this floor until nothing new is reachable (or a fight).
    for (let step = 0; step < maxSteps; step += 1) {
      if (current.phase !== "dungeon" || !current.position) {
        return current; // combat or town
      }
      visitCounts.set(current.position.roomId, (visitCounts.get(current.position.roomId) ?? 0) + 1);
      const decision = chooseNextCommand(current, world, visitCounts, blockedMoves, true);
      // Leaving the floor is handled below — stop the explore loop here.
      if (!decision.command || decision.command.type === "return_to_town" || decision.command.type === "use_stairs") {
        break;
      }
      const next = executeCommand(current, world, decision.command);
      if (decision.command.type === "move_forward" && current.position && next.position?.roomId === current.position.roomId) {
        blockedMoves.add(`${current.position.roomId}:${current.position.facing}`);
      }
      if (next.discoveredSecrets.length !== current.discoveredSecrets.length) {
        blockedMoves.clear();
      }
      if (next === current) {
        break;
      }
      current = next;
      if (current.phase === "combat") {
        return current; // hand the fight to the player
      }
    }

    // Phase 2: thread to the down-stair.
    const downStair = downStairRoomOnFloor(world, current.map.floorId ?? "");
    if (!downStair) {
      return current; // finale floor, no descent
    }
    for (let step = 0; step < maxSteps && current.position?.roomId !== downStair; step += 1) {
      const command = stepTowardRoom(current, world, current.map.floorId ?? "", downStair);
      if (!command) {
        break;
      }
      const next = executeCommand(current, world, command);
      if (next === current) {
        break;
      }
      current = next;
      if (current.phase === "combat") {
        return current;
      }
    }

    // Phase 3: descend and repeat on the next floor. If the stair is barred (a
    // gate/crank not yet opened) the floor won't change — stop for the player.
    if (current.position?.roomId !== downStair) {
      return current;
    }
    const beforeFloor = current.map.floorId;
    const descended = executeCommand(current, world, { type: "use_stairs" });
    if (descended.map.floorId === beforeFloor) {
      return current; // descent barred
    }
    current = descended;
    if (current.phase === "combat") {
      return current; // the landing fight
    }
  }
  return current;
}

// Reachability sentinel: the explorer fought B1F's intro slime and found its way
// home to town. (B1F's stair is unlocked now, so a fresh run may descend to B2F and
// return from there; deeper probes have gated descents and return in place. Either
// way, reaching town after the intro fight proves the route is navigable.)
export function isMvpCleared(state: GameState): boolean {
  return state.phase === "town" && state.defeatedEnemies.includes("enemy.b1f.ash-slime");
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
  blockedMoves: Set<string> = new Set(),
  // descendOnly: the player-facing auto-explore only ever works its way DOWN. It
  // must never wander off the current floor mid-pass — neither down a stair (Phase
  // 2/3 threads to the intended down-stair) nor, crucially, BACKWARD through an
  // always-open return shortcut (e.g. B5F's bar → B2F), which would silently warp
  // the party up several floors and then re-descend, reading as a "B5F → B3F loop".
  descendOnly = false
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

  // B1F's stair is unlocked now, so a reachability probe would just fall down it and
  // wander a deeper floor. Drop only *descending* exits (to a deeper floor); the
  // probe still explores here and may ascend to head home to town.
  const floorDepth = (roomId: string | undefined) =>
    Number((roomId ? getFloorIdForRoom(world, roomId) : "")?.match(/b(\d+)f/)?.[1] ?? 0);
  const currentDepth = floorDepth(state.position.roomId);
  const exploreExits = Object.fromEntries(
    Object.entries(room.exits).filter(([, targetRoomId]) => {
      if (descendOnly ? floorDepth(targetRoomId) !== currentDepth : floorDepth(targetRoomId) > currentDepth) {
        return false; // never leave this floor mid-pass (down-stair OR backward shortcut)
      }
      // Skip an unwinnable tactical squad room — a greedy single-target walker can't
      // clear a shielded front + back-line caster. These sit in dead-end reward rooms,
      // so avoiding them never removes the path home.
      const target = targetRoomId ? getRoom(world, targetRoomId) : null;
      const squad = target?.encounterSquad;
      return !(squad && squad.length >= 2 && !state.defeatedEnemies.includes(squad[0]));
    })
  ) as Partial<Record<Direction, string>>;
  const direction = chooseExplorationDirection(
    state,
    exploreExits,
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

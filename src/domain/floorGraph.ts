// Structural analysis of a dungeon floor's grid, used to hold floor layouts to
// measurable invariants (branch count, dead-ends, loops, anchor separation)
// instead of a subjective "make it less linear". See tests/b1fStructure.test.ts.
//
// The graph is the player-walkable one: nodes are grid cells, and two cells are
// connected when an edge between them is traversable on foot (open/door/locked).
// Magic edges (shortcut/one_way) and off-floor stair targets are deliberately
// excluded so path/branch metrics reflect how the floor actually reads while
// exploring, not teleports.
import type { ScenarioWorld } from "./types";

const WALKABLE = new Set(["open", "door", "locked"]);

interface Cell {
  id: string;
  roomId: string;
  x: number;
  y: number;
}

export interface FloorGraphAnalysis {
  floorId: string;
  cellCount: number;
  edgeCount: number;
  /** Independent loops in the walkable graph (E - N + connected components). */
  loopCount: number;
  /** Room ids whose cell has exactly one walkable neighbour. */
  deadEndRoomIds: string[];
  /** Dead-end rooms that hold a reward (treasure table, encounter, or a secret exit). */
  rewardDeadEndRoomIds: string[];
  degreeForRoom(roomId: string): number;
  cellForRoom(roomId: string): { x: number; y: number } | null;
  manhattanBetweenRooms(a: string, b: string): number | null;
  /** Cell ids on a shortest walkable path between two rooms, empty if unreachable. */
  shortestPathCells(fromRoomId: string, toRoomId: string): string[];
  /** Count of cells on that shortest path that are branch points (degree >= 3). */
  branchPointsOnPath(fromRoomId: string, toRoomId: string): number;
  /**
   * Moves a blind party makes to visit every reachable cell from a start room,
   * backtracking each dead-end — the "honest sweep" cost of clearing the floor.
   * A perfect maze runs ~2x its edges; a wide-open field is near-linear.
   */
  fullSweepSteps(fromRoomId: string): number;
}

export function analyzeFloorGraph(world: ScenarioWorld, floorId: string): FloorGraphAnalysis {
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  const rawCells = floor?.grid?.cells ?? [];
  const cells: Cell[] = rawCells.map((cell) => ({ id: cell.id, roomId: cell.roomId, x: cell.x, y: cell.y }));
  const byId = new Map(cells.map((cell) => [cell.id, cell]));
  const firstCellForRoom = new Map<string, Cell>();
  for (const cell of cells) {
    if (!firstCellForRoom.has(cell.roomId)) {
      firstCellForRoom.set(cell.roomId, cell);
    }
  }

  const adj = new Map<string, Set<string>>();
  for (const cell of cells) {
    adj.set(cell.id, new Set());
  }
  for (const cell of rawCells) {
    for (const edge of Object.values(cell.edges)) {
      if (edge && WALKABLE.has(edge.kind) && edge.targetCellId && byId.has(edge.targetCellId)) {
        adj.get(cell.id)!.add(edge.targetCellId);
        adj.get(edge.targetCellId)!.add(cell.id);
      }
    }
  }

  const degree = (cellId: string) => adj.get(cellId)?.size ?? 0;
  const edgeCount = cells.reduce((total, cell) => total + degree(cell.id), 0) / 2;

  // Connected components, so loopCount is well-defined even if a floor has islands.
  const seen = new Set<string>();
  let components = 0;
  for (const cell of cells) {
    if (seen.has(cell.id)) {
      continue;
    }
    components += 1;
    const stack = [cell.id];
    seen.add(cell.id);
    while (stack.length) {
      const current = stack.pop()!;
      for (const next of adj.get(current)!) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
  }
  const loopCount = edgeCount - cells.length + components;

  const roomById = new Map((floor?.rooms ?? []).map((room) => [room.id, room]));
  const deadEndCells = cells.filter((cell) => degree(cell.id) === 1);
  const deadEndRoomIds = Array.from(new Set(deadEndCells.map((cell) => cell.roomId)));
  const hasSecretExit = new Set<string>();
  for (const cell of rawCells) {
    for (const edge of Object.values(cell.edges)) {
      if (edge && (edge.kind === "secret" || edge.kind === "one_way")) {
        hasSecretExit.add(cell.roomId);
      }
    }
  }
  const rewardDeadEndRoomIds = deadEndRoomIds.filter((roomId) => {
    const room = roomById.get(roomId);
    return Boolean(room && (room.treasureTable || room.encounter)) || hasSecretExit.has(roomId);
  });

  const cellForRoom = (roomId: string) => {
    const cell = firstCellForRoom.get(roomId);
    return cell ? { x: cell.x, y: cell.y } : null;
  };

  const shortestPathCells = (fromRoomId: string, toRoomId: string): string[] => {
    const start = firstCellForRoom.get(fromRoomId);
    const goal = firstCellForRoom.get(toRoomId);
    if (!start || !goal) {
      return [];
    }
    const prev = new Map<string, string | null>([[start.id, null]]);
    const queue = [start.id];
    while (queue.length) {
      const current = queue.shift()!;
      if (current === goal.id) {
        break;
      }
      for (const next of adj.get(current)!) {
        if (!prev.has(next)) {
          prev.set(next, current);
          queue.push(next);
        }
      }
    }
    if (!prev.has(goal.id)) {
      return [];
    }
    const path: string[] = [];
    let cursor: string | null | undefined = goal.id;
    while (cursor) {
      path.unshift(cursor);
      cursor = prev.get(cursor) ?? null;
    }
    return path;
  };

  return {
    floorId,
    cellCount: cells.length,
    edgeCount,
    loopCount,
    deadEndRoomIds,
    rewardDeadEndRoomIds,
    degreeForRoom: (roomId) => {
      const cell = firstCellForRoom.get(roomId);
      return cell ? degree(cell.id) : 0;
    },
    cellForRoom,
    manhattanBetweenRooms: (a, b) => {
      const ca = cellForRoom(a);
      const cb = cellForRoom(b);
      return ca && cb ? Math.abs(ca.x - cb.x) + Math.abs(ca.y - cb.y) : null;
    },
    shortestPathCells,
    branchPointsOnPath: (fromRoomId, toRoomId) =>
      shortestPathCells(fromRoomId, toRoomId).filter((cellId) => degree(cellId) >= 3).length,
    fullSweepSteps: (fromRoomId) => {
      const start = firstCellForRoom.get(fromRoomId);
      if (!start) {
        return 0;
      }
      const reachable = new Set([start.id]);
      const queue = [start.id];
      while (queue.length) {
        const current = queue.shift()!;
        for (const next of adj.get(current)!) {
          if (!reachable.has(next)) {
            reachable.add(next);
            queue.push(next);
          }
        }
      }
      const visited = new Set([start.id]);
      const stack = [start.id];
      let steps = 0;
      while (visited.size < reachable.size && stack.length) {
        const current = stack[stack.length - 1];
        let advanced = false;
        for (const next of adj.get(current)!) {
          if (!visited.has(next)) {
            visited.add(next);
            stack.push(next);
            steps += 1;
            advanced = true;
            break;
          }
        }
        if (!advanced) {
          stack.pop();
          steps += 1;
        }
      }
      return steps;
    }
  };
}

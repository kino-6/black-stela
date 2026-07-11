import { useEffect, useMemo, useRef } from "react";
import { getFloorIdForRoom, getGridCellForRoom, getGridEdge, getRoom, isTraversableEdge, secretKey } from "../domain/scenario";
import type { Direction, GameState, ScenarioWorld } from "../domain/types";
import { buildDungeonScene, type CorridorSegment, type EdgeKindVisual } from "./dungeonScene";

interface DungeonViewProps {
  state: GameState;
  world: ScenarioWorld;
  label: string;
}

type EdgeVisual = "wall" | "open" | "door";

interface EdgeViewState {
  visual: EdgeVisual;
  traversable: boolean;
}

interface DungeonViewModel {
  front: EdgeVisual;
  left: EdgeVisual;
  right: EdgeVisual;
  frontTraversable: boolean;
}

export interface DungeonRenderLayout {
  roomDepth: number;
  roomCenterZ: number;
  frontWallZ: number;
  sideFeatureZ: number;
  frontDepth: "cell-edge" | "corridor";
}

// The camera stands in the current cell looking down the corridor; the view
// projects up to MAX_DEPTH cells ahead before the fog. Scene geometry lives in
// dungeonScene.ts.
const MAX_DEPTH = 4;

export function DungeonView({ state, world, label }: DungeonViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewModel = useMemo(() => getDungeonViewModel(state, world), [state.position, state.discoveredSecrets, world]);
  const corridor = useMemo(
    () => projectCorridorAhead(state, world),
    [state.position, state.discoveredSecrets, world]
  );

  useEffect(() => {
    if (!mountRef.current || !state.position || !viewModel) {
      return;
    }

    const room = getRoom(world, state.position.roomId);
    // A faced stair reads as up or down by comparing the target floor's depth.
    const facedEdge = getGridEdge(world, state.position.roomId, state.position.facing);
    const floorDepth = (id: string | null) => Number(id?.match(/b(\d+)f/)?.[1] ?? 0);
    const stairDescends =
      facedEdge?.kind === "stairs" && facedEdge.targetFloorId
        ? floorDepth(facedEdge.targetFloorId) > floorDepth(getFloorIdForRoom(world, state.position.roomId))
        : null;
    return buildDungeonScene(mountRef.current, {
      corridor,
      floorId: getFloorIdForRoom(world, state.position.roomId),
      enemies:
        state.phase === "combat"
          ? (state.combat?.enemyGroups ?? [])
              .filter((group) => group.count > 0)
              .map((group) => ({ id: group.enemyId, elevation: group.elevation }))
          : [],
      showTrap: Boolean(room.trap) && !state.resolvedTraps.includes(room.trap!.id),
      returnMarker: room.stairsToTown ? (room.returnStyle === "stairs" ? "stairs" : "marker") : null,
      stairDescends,
      frontWallIndex: corridor.findIndex((segment) => segment.frontCap)
    });
  }, [
    state.position,
    state.phase,
    // Re-render when the living enemy line-up changes (types + which are still up).
    state.combat?.enemyGroups.map((group) => `${group.enemyId}:${group.count > 0 ? 1 : 0}`).join(","),
    state.resolvedTraps,
    corridor,
    viewModel,
    world
  ]);

  return (
    <div className="dungeon-view" aria-label={label}>
      <div
        ref={mountRef}
        className="dungeon-canvas"
        data-front-edge={viewModel?.front ?? "unknown"}
        data-front-traversable={viewModel?.frontTraversable ? "true" : "false"}
        data-front-visual={viewModel?.front === "wall" ? "blocked-wall" : viewModel?.front ?? "unknown"}
        data-front-depth={viewModel ? getDungeonRenderLayout(viewModel).frontDepth : "unknown"}
        data-left-edge={viewModel?.left ?? "unknown"}
        data-right-edge={viewModel?.right ?? "unknown"}
        data-testid="dungeon-canvas"
      />
    </div>
  );
}

export function getDungeonRenderLayout(viewModel: DungeonViewModel): DungeonRenderLayout {
  const frontIsCurrentCellBoundary = viewModel.front === "wall" || viewModel.front === "door";

  return {
    roomDepth: frontIsCurrentCellBoundary ? 5.8 : 12,
    roomCenterZ: frontIsCurrentCellBoundary ? 1.55 : -1,
    frontWallZ: frontIsCurrentCellBoundary ? -1.32 : -7,
    sideFeatureZ: 1.05,
    frontDepth: frontIsCurrentCellBoundary ? "cell-edge" : "corridor"
  };
}

export function getDungeonViewModel(state: GameState, world: ScenarioWorld): DungeonViewModel | null {
  if (!state.position) {
    return null;
  }

  const room = getRoom(world, state.position.roomId);
  const hasGridCell = Boolean(getGridCellForRoom(world, state.position.roomId));
  const secrets = state.discoveredSecrets;
  const front = getEdgeViewState(world, room.id, state.position.facing, hasGridCell, room, secrets);
  const left = getEdgeViewState(world, room.id, turn(state.position.facing, "left"), hasGridCell, room, secrets);
  const right = getEdgeViewState(world, room.id, turn(state.position.facing, "right"), hasGridCell, room, secrets);

  return {
    front: front.visual,
    left: left.visual,
    right: right.visual,
    frontTraversable: front.traversable
  };
}

function getEdgeViewState(
  world: ScenarioWorld,
  roomId: string,
  direction: Direction,
  hasGridCell: boolean,
  room: ReturnType<typeof getRoom>,
  discoveredSecrets: string[]
): EdgeViewState {
  const edge = getGridEdge(world, roomId, direction);
  if (edge) {
    if (edge.kind === "door" || edge.kind === "locked") {
      return { visual: "door", traversable: isTraversableEdge(edge) };
    }

    // A hidden passage stays wall-blank until searched out; once found it reads
    // as a doorway, matching the minimap and never leaking the secret early.
    if (edge.kind === "secret") {
      return discoveredSecrets.includes(secretKey(roomId, direction))
        ? { visual: "door", traversable: true }
        : { visual: "wall", traversable: false };
    }

    return isTraversableEdge(edge)
      ? { visual: "open", traversable: true }
      : { visual: "wall", traversable: false };
  }

  if (hasGridCell) {
    return { visual: "wall", traversable: false };
  }

  if (room.doors?.includes(direction)) {
    return { visual: "door", traversable: Boolean(room.exits[direction]) };
  }

  return room.exits[direction]
    ? { visual: "open", traversable: true }
    : { visual: "wall", traversable: false };
}

// Walk forward through open edges, collecting the cells the party can see down
// the corridor along with each cell's side walls, until a wall/door/stairs (or
// the depth limit) closes the view.
export function projectCorridorAhead(state: GameState, world: ScenarioWorld): CorridorSegment[] {
  if (!state.position) {
    return [];
  }

  const facing = state.position.facing;
  const leftDir = turn(facing, "left");
  const rightDir = turn(facing, "right");
  const segments: CorridorSegment[] = [];
  let roomId: string | undefined = state.position.roomId;

  for (let index = 0; index < MAX_DEPTH && roomId; index += 1) {
    const left = geometryEdgeKind(world, roomId, leftDir, state.discoveredSecrets);
    const right = geometryEdgeKind(world, roomId, rightDir, state.discoveredSecrets);
    const front = geometryEdgeKind(world, roomId, facing, state.discoveredSecrets);
    const forwardEdge = getGridEdge(world, roomId, facing);
    const canContinue = front === "open" && Boolean(forwardEdge?.targetRoomId) && index < MAX_DEPTH - 1;

    if (canContinue) {
      segments.push({ index, left, right });
      roomId = forwardEdge?.targetRoomId;
    } else {
      segments.push({ index, left, right, frontCap: front });
      break;
    }
  }

  return segments;
}

function geometryEdgeKind(
  world: ScenarioWorld,
  roomId: string,
  direction: Direction,
  discoveredSecrets: string[]
): EdgeKindVisual {
  const edge = getGridEdge(world, roomId, direction);
  if (!edge) {
    if (!getGridCellForRoom(world, roomId)) {
      const room = getRoom(world, roomId);
      if (room.doors?.includes(direction)) {
        return "door";
      }
      return room.exits[direction] ? "open" : "wall";
    }
    return "wall";
  }

  switch (edge.kind) {
    case "door":
    case "locked":
      return "door";
    case "secret":
      return discoveredSecrets.includes(secretKey(roomId, direction)) ? "door" : "wall";
    case "stairs":
      return "stairs";
    case "open":
    case "one_way":
    case "shortcut":
      return isTraversableEdge(edge) ? "open" : "wall";
    default:
      return "wall";
  }
}

function turn(facing: Direction, side: "left" | "right"): Direction {
  const directions: Direction[] = ["north", "east", "south", "west"];
  const index = directions.indexOf(facing);
  return directions[(index + (side === "left" ? 3 : 1)) % directions.length];
}

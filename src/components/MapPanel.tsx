import { getGridCellForRoom, getLocalizedRoomText, getRoom } from "../domain/scenario";
import type { Direction, DungeonGridEdge, GameState, ScenarioWorld } from "../domain/types";
import type { Locale, Translator } from "../i18n";

interface MapPanelProps {
  state: GameState;
  world: ScenarioWorld;
  locale: Locale;
  t: Translator;
}

const MINI_MAP_SIZE = 5;
const MINI_MAP_RADIUS = Math.floor(MINI_MAP_SIZE / 2);
const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];
const directionOffsets: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

type EdgeKind = "open" | "wall" | "door" | "locked" | "stairs";
type CellMarker = "return" | "stairs" | "spinner" | "teleporter" | "hazard" | "event" | "trap" | "treasure" | null;

interface MiniMapCell {
  id: string;
  x: number;
  y: number;
  status: "current" | "visited" | "unseen";
  edges: Record<Direction, EdgeKind>;
  marker: CellMarker;
  label: string;
}

const CLOSED_EDGES: Record<Direction, EdgeKind> = { north: "wall", east: "wall", south: "wall", west: "wall" };

export function MapPanel({ state, world, locale, t }: MapPanelProps) {
  const currentRoomId = state.map.currentRoomId ?? state.position?.roomId ?? null;
  const miniMap = buildMiniMap(state, world, locale, currentRoomId);
  const facing = state.position?.facing ?? state.map.currentFacing ?? null;
  const cellsByPosition = new Map(miniMap.cells.map((cell) => [`${cell.x},${cell.y}`, cell]));

  return (
    <section className="map-panel" aria-labelledby="map-heading">
      <div className="section-title">
        <h3 id="map-heading">{t("map.heading")}</h3>
        <span>{state.map.floorId ?? t("map.noFloor")}</span>
      </div>
      <div className="map-current" data-testid="map-current">
        <small>{t("map.current")}</small>
        <strong>{currentRoomId ? getLocalizedRoomText(world, currentRoomId, locale).name : t("map.town")}</strong>
      </div>
      {miniMap.cells.length > 0 && (
        <div className="mini-map" aria-label={t("map.miniMap")} data-testid="minimap">
          <div
            data-testid="minimap-grid"
            className="mini-map-grid"
            style={{
              gridTemplateColumns: `repeat(${MINI_MAP_SIZE}, 1.62rem)`,
              gridTemplateRows: `repeat(${MINI_MAP_SIZE}, 1.62rem)`
            }}
          >
            {Array.from({ length: MINI_MAP_SIZE * MINI_MAP_SIZE }).map((_, index) => {
              const x = index % MINI_MAP_SIZE;
              const y = Math.floor(index / MINI_MAP_SIZE);
              const cell = cellsByPosition.get(`${x},${y}`);
              if (!cell) {
                return <span key={`empty-${index}`} className="mini-map-cell empty" aria-hidden="true" />;
              }

              const edgeClasses = DIRECTIONS.map((direction) => `edge-${direction}-${cell.edges[direction]}`).join(" ");
              const markerLabel = cell.marker ? `, ${t(`map.marker.${cell.marker}`)}` : "";
              return (
                <span
                  aria-label={`${cell.label}: ${t(`map.${cell.status}`)}${markerLabel}`}
                  className={`mini-map-cell ${cell.status} ${edgeClasses}`}
                  data-testid={`minimap-${cell.status}`}
                  key={cell.id}
                  title={cell.label}
                >
                  {cell.marker && (
                    <i className={`mini-map-marker marker-${cell.marker}`} data-testid={`minimap-marker-${cell.marker}`} aria-hidden="true" />
                  )}
                  {cell.status === "current" && facing && (
                    <b
                      aria-label={t(`direction.${facing}`)}
                      className={`mini-map-facing facing-${facing}`}
                      data-testid="minimap-facing"
                    />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function edgeRenderKind(edge: DungeonGridEdge | undefined): EdgeKind {
  if (!edge) {
    return "wall";
  }
  switch (edge.kind) {
    case "open":
    case "one_way":
    case "shortcut":
      return "open";
    case "door":
      return "door";
    case "locked":
      return "locked";
    case "stairs":
      return "stairs";
    case "wall":
    case "secret":
    default:
      return "wall";
  }
}

function cellMarker(world: ScenarioWorld, state: GameState, roomId: string, edges: Record<Direction, EdgeKind>): CellMarker {
  const room = getRoom(world, roomId);
  if (room.stairsToTown) {
    return "return";
  }
  if (room.spinner) {
    return "spinner";
  }
  if (room.teleportTo) {
    return "teleporter";
  }
  if (room.damageTile) {
    return "hazard";
  }
  if (DIRECTIONS.some((direction) => edges[direction] === "stairs")) {
    return "stairs";
  }
  if (room.event) {
    return "event";
  }
  if (room.trap && state.resolvedTraps.includes(room.trap.id)) {
    return "trap";
  }
  if (room.treasureTable && !state.claimedTreasures.includes(roomId)) {
    return "treasure";
  }
  return null;
}

function buildMiniMap(state: GameState, world: ScenarioWorld, locale: Locale, currentRoomId: string | null) {
  const currentGridCell = currentRoomId ? getGridCellForRoom(world, currentRoomId) : null;
  if (currentGridCell && currentRoomId) {
    return buildGridMiniMap(state, world, locale, currentRoomId, currentGridCell);
  }

  return buildGraphMiniMap(state, world, locale, currentRoomId);
}

function buildGridMiniMap(
  state: GameState,
  world: ScenarioWorld,
  locale: Locale,
  currentRoomId: string,
  currentGridCell: NonNullable<ReturnType<typeof getGridCellForRoom>>
) {
  const visitedRooms = new Set(state.map.visitedRooms);
  visitedRooms.add(currentRoomId);
  const originX = currentGridCell.x - MINI_MAP_RADIUS;
  const originY = currentGridCell.y - MINI_MAP_RADIUS;
  const floor = world.dungeons.find((dungeon) => dungeon.id === state.map.floorId);
  const visibleCells = (floor?.grid?.cells ?? [])
    .filter((cell) => visitedRooms.has(cell.roomId))
    .filter(
      (cell) =>
        cell.x >= originX && cell.x < originX + MINI_MAP_SIZE && cell.y >= originY && cell.y < originY + MINI_MAP_SIZE
    );

  const cells: MiniMapCell[] = visibleCells.map((cell) => {
    const edges: Record<Direction, EdgeKind> = {
      north: edgeRenderKind(cell.edges.north),
      east: edgeRenderKind(cell.edges.east),
      south: edgeRenderKind(cell.edges.south),
      west: edgeRenderKind(cell.edges.west)
    };

    return {
      id: cell.id,
      x: cell.x - originX,
      y: cell.y - originY,
      status: cell.roomId === currentRoomId ? "current" : "visited",
      edges,
      marker: cellMarker(world, state, cell.roomId, edges),
      label: getLocalizedRoomText(world, cell.roomId, locale).name
    };
  });

  return { cells };
}

function buildGraphMiniMap(state: GameState, world: ScenarioWorld, locale: Locale, currentRoomId: string | null) {
  const startRoomId = state.map.visitedRooms[0] ?? currentRoomId;
  if (!startRoomId) {
    return { cells: [] as MiniMapCell[] };
  }

  const roomIds = new Set<string>(state.map.visitedRooms);
  if (currentRoomId) {
    roomIds.add(currentRoomId);
  }

  const coordinates = new Map<string, { x: number; y: number }>([[startRoomId, { x: 0, y: 0 }]]);
  const queue = [startRoomId];
  for (let index = 0; index < queue.length; index += 1) {
    const roomId = queue[index];
    const origin = coordinates.get(roomId);
    if (!origin) {
      continue;
    }

    const room = getRoom(world, roomId);
    for (const direction of state.map.knownExits[roomId] ?? []) {
      const targetRoomId = room.exits[direction];
      if (!targetRoomId || !roomIds.has(targetRoomId) || coordinates.has(targetRoomId)) {
        continue;
      }

      const offset = directionOffsets[direction];
      coordinates.set(targetRoomId, { x: origin.x + offset.x, y: origin.y + offset.y });
      queue.push(targetRoomId);
    }
  }

  let looseOffset = 0;
  for (const roomId of roomIds) {
    if (!coordinates.has(roomId)) {
      looseOffset += 1;
      coordinates.set(roomId, { x: looseOffset, y: 1 });
    }
  }

  const currentCoordinate = currentRoomId ? coordinates.get(currentRoomId) : null;
  if (!currentCoordinate) {
    return { cells: [] as MiniMapCell[] };
  }

  const originX = currentCoordinate.x - MINI_MAP_RADIUS;
  const originY = currentCoordinate.y - MINI_MAP_RADIUS;

  const cells: MiniMapCell[] = Array.from(coordinates.entries())
    .filter(
      ([, coordinate]) =>
        coordinate.x >= originX &&
        coordinate.x < originX + MINI_MAP_SIZE &&
        coordinate.y >= originY &&
        coordinate.y < originY + MINI_MAP_SIZE
    )
    .map(([roomId, coordinate]) => {
      const room = getRoom(world, roomId);
      const status: MiniMapCell["status"] =
        roomId === currentRoomId ? "current" : state.map.visitedRooms.includes(roomId) ? "visited" : "unseen";
      const known = status === "unseen" ? [] : state.map.knownExits[roomId] ?? [];
      const edges: Record<Direction, EdgeKind> = { ...CLOSED_EDGES };
      for (const direction of known) {
        const targetRoomId = room.exits[direction];
        if (targetRoomId && roomIds.has(targetRoomId)) {
          edges[direction] = "open";
        }
      }

      return {
        id: roomId,
        x: coordinate.x - originX,
        y: coordinate.y - originY,
        status,
        edges,
        marker: status === "unseen" ? null : cellMarker(world, state, roomId, edges),
        label: getLocalizedRoomText(world, roomId, locale).name
      };
    });

  return { cells };
}

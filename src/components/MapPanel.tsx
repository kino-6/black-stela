import { floorName, getGridCellForRoom, getLocalizedRoomText, getRoom, secretKey } from "../domain/scenario";
import { floorExploredRatio } from "../domain/rulesEngine";
import { useMemo } from "react";
import type { Direction, DungeonGridEdge, DungeonRoom, GameState, ScenarioWorld } from "../domain/types";
import type { Locale, Translator } from "../i18n";

interface MapPanelProps {
  state: GameState;
  world: ScenarioWorld;
  locale: Locale;
  t: Translator;
  debugMode?: boolean;
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
type CellMarker = "return" | "stairs" | "descend" | "spinner" | "teleporter" | "hazard" | "gather" | "event" | "trap" | "treasure" | null;

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

export function MapPanel({ state, world, locale, t, debugMode = false }: MapPanelProps) {
  const currentRoomId = state.map.currentRoomId ?? state.position?.roomId ?? null;
  const miniMap = useMemo(() => buildMiniMap(state, world, locale, currentRoomId), [state, world, locale, currentRoomId]);
  const facing = state.position?.facing ?? state.map.currentFacing ?? null;
  const cellsByPosition = new Map(miniMap.cells.map((cell) => [`${cell.x},${cell.y}`, cell]));
  const inDarkZone = Boolean(
    currentRoomId && getRoom(world, currentRoomId).gates?.some((gate) => gate.kind === "dark_zone")
  );

  return (
    <section className="map-panel" aria-labelledby="map-heading">
      <div className="section-title">
        <h3 id="map-heading">{t("map.heading")}</h3>
        <span>{state.map.floorId ? floorName(world, state.map.floorId, locale) : t("map.noFloor")}</span>
      </div>
      <div className="map-current" data-testid="map-current">
        <small>{t("map.current")}</small>
        <strong>{currentRoomId ? getLocalizedRoomText(world, currentRoomId, locale).name : t("map.town")}</strong>
      </div>
      {state.map.floorId && debugMode && (
        <div className="floor-coverage" data-testid="floor-coverage">
          {t("map.coverage", { percent: Math.round(floorExploredRatio(world, state) * 100) })}
        </div>
      )}
      {miniMap.cells.length > 0 && (
        <div className={`mini-map${inDarkZone ? " dark" : ""}`} aria-label={t("map.miniMap")} data-testid="minimap">
          {inDarkZone && (
            <div className="mini-map-dark-overlay" data-testid="minimap-dark">
              {t("map.darkness")}
            </div>
          )}
          <div
            data-testid="minimap-grid"
            className="mini-map-grid"
            style={{
              gridTemplateColumns: `repeat(${MINI_MAP_SIZE}, 2.3rem)`,
              gridTemplateRows: `repeat(${MINI_MAP_SIZE}, 2.3rem)`
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

// Whole-floor map overlay: renders every explored cell of the current floor at
// a compact scale, reusing the minimap cell styling (edges, markers, current).
export function FloorMapView({ state, world, locale, t }: MapPanelProps) {
  const currentRoomId = state.map.currentRoomId ?? state.position?.roomId ?? null;
  const floorMap = useMemo(() => buildFloorMap(state, world, locale, currentRoomId), [state, world, locale, currentRoomId]);
  const facing = state.position?.facing ?? state.map.currentFacing ?? null;
  const cellsByPosition = new Map(floorMap.cells.map((cell) => [`${cell.x},${cell.y}`, cell]));

  if (floorMap.cells.length === 0) {
    return <p className="floor-map-empty">{t("map.noFloor")}</p>;
  }

  // A1-style rulers (letters across the top, numbers down the left) on the floor's ABSOLUTE origin, and a
  // faint grid via a 1px gap over a dark backing — the マス目 the player counts. Mirrors floor_map.gd.
  const header: JSX.Element[] = [<span key="corner" className="floor-map-ruler corner" aria-hidden="true" />];
  for (let cx = 0; cx < floorMap.width; cx += 1) {
    header.push(
      <span key={`col-${cx}`} className="floor-map-ruler" aria-hidden="true">
        {columnLetter(floorMap.minX + cx - floorMap.floorMinX)}
      </span>
    );
  }
  const rows: JSX.Element[] = [];
  for (let ry = 0; ry < floorMap.height; ry += 1) {
    rows.push(
      <span key={`row-${ry}`} className="floor-map-ruler" aria-hidden="true">
        {floorMap.minY + ry - floorMap.floorMinY + 1}
      </span>
    );
    for (let cx = 0; cx < floorMap.width; cx += 1) {
      const cell = cellsByPosition.get(`${cx},${ry}`);
      if (!cell) {
        rows.push(<span key={`empty-${ry}-${cx}`} className="mini-map-cell empty" aria-hidden="true" />);
        continue;
      }
      const edgeClasses = DIRECTIONS.map((direction) => `edge-${direction}-${cell.edges[direction]}`).join(" ");
      const markerLabel = cell.marker ? `, ${t(`map.marker.${cell.marker}`)}` : "";
      rows.push(
        <span
          aria-label={`${cell.label}: ${t(`map.${cell.status}`)}${markerLabel}`}
          className={`mini-map-cell ${cell.status} ${edgeClasses}`}
          data-testid={`floor-map-${cell.status}`}
          key={cell.id}
          title={cell.label}
        >
          {cell.marker && <i className={`mini-map-marker marker-${cell.marker}`} aria-hidden="true" />}
          {cell.status === "current" && facing && (
            <b aria-label={t(`direction.${facing}`)} className={`mini-map-facing facing-${facing}`} />
          )}
        </span>
      );
    }
  }

  return (
    <div
      className="floor-map-grid"
      data-testid="floor-map-grid"
      style={{
        gridTemplateColumns: `1.15rem repeat(${floorMap.width}, 1.15rem)`,
        gridTemplateRows: `1.15rem repeat(${floorMap.height}, 1.15rem)`
      }}
    >
      {header}
      {rows}
    </div>
  );
}

function edgeRenderKind(edge: DungeonGridEdge | undefined, secretRevealed = false): EdgeKind {
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
    case "secret":
      // A hidden passage stays indistinguishable from a wall until searched out.
      return secretRevealed ? "door" : "wall";
    case "wall":
    default:
      return "wall";
  }
}

// Down = the cell's stairs edge targets a floor LATER in the world's dungeon order than the mapped floor. Lets
// the map pick the descent apart from the way back — both used to read as a single "stairs" (playtest「階段が探せない」).
function stairsDescends(cell: GridCell, state: GameState, world: ScenarioWorld): boolean {
  const current = state.map.floorId;
  const stairsEdge = DIRECTIONS.map((d) => cell.edges[d]).find((e) => e?.kind === "stairs" && e.targetFloorId);
  const target = stairsEdge?.targetFloorId;
  if (!target || !current) return true;
  const ci = world.dungeons.findIndex((d) => d.id === current);
  const ti = world.dungeons.findIndex((d) => d.id === target);
  if (ci < 0 || ti < 0) return true;
  return ti > ci;
}

function cellMarker(room: DungeonRoom, state: GameState, edges: Record<Direction, EdgeKind>, descends = false): CellMarker {
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
  if (room.gatherItem && !state.discoveredSecrets.includes(`gather:${room.id}`)) {
    return "gather";
  }
  if (DIRECTIONS.some((direction) => edges[direction] === "stairs")) {
    return descends ? "descend" : "stairs";
  }
  if (room.event) {
    return "event";
  }
  if (room.trap && state.resolvedTraps.includes(room.trap.id)) {
    return "trap";
  }
  if (room.treasureTable && !state.claimedTreasures.includes(room.id)) {
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

  const cells = visibleCells.map((cell) => buildMiniMapCell(cell, originX, originY, state, world, locale, currentRoomId));

  return { cells };
}

type GridCell = NonNullable<NonNullable<ScenarioWorld["dungeons"][number]["grid"]>["cells"]>[number];

function buildMiniMapCell(
  cell: GridCell,
  originX: number,
  originY: number,
  state: GameState,
  world: ScenarioWorld,
  locale: Locale,
  currentRoomId: string
): MiniMapCell {
  const room = getRoom(world, cell.roomId);
  const isRevealed = (direction: Direction) => state.discoveredSecrets.includes(secretKey(cell.roomId, direction));
  const edges: Record<Direction, EdgeKind> = {
    north: edgeRenderKind(cell.edges.north, isRevealed("north")),
    east: edgeRenderKind(cell.edges.east, isRevealed("east")),
    south: edgeRenderKind(cell.edges.south, isRevealed("south")),
    west: edgeRenderKind(cell.edges.west, isRevealed("west"))
  };

  return {
    id: cell.id,
    x: cell.x - originX,
    y: cell.y - originY,
    status: cell.roomId === currentRoomId ? "current" : "visited",
    edges,
    marker: cellMarker(room, state, edges, stairsDescends(cell, state, world)),
    label: getLocalizedRoomText(world, cell.roomId, locale).name
  };
}

// The whole explored floor (no 5x5 window): every visited cell, offset to a
// bounding box, for the full-floor map view.
export function buildFloorMap(state: GameState, world: ScenarioWorld, locale: Locale, currentRoomId: string | null) {
  const floor = world.dungeons.find((dungeon) => dungeon.id === state.map.floorId);
  const gridCells = floor?.grid?.cells ?? [];
  const visited = new Set(state.map.visitedRooms);
  if (currentRoomId) {
    visited.add(currentRoomId);
  }
  const shown = gridCells.filter((cell) => visited.has(cell.roomId));
  if (!currentRoomId || shown.length === 0) {
    return { cells: [] as MiniMapCell[], width: 0, height: 0, minX: 0, minY: 0, floorMinX: 0, floorMinY: 0 };
  }

  const minX = Math.min(...shown.map((cell) => cell.x));
  const minY = Math.min(...shown.map((cell) => cell.y));
  const width = Math.max(...shown.map((cell) => cell.x)) - minX + 1;
  const height = Math.max(...shown.map((cell) => cell.y)) - minY + 1;
  const cells = shown.map((cell) => buildMiniMapCell(cell, minX, minY, state, world, locale, currentRoomId));
  // Coordinates are ABSOLUTE to the floor's own origin (min over ALL cells) so a cell's A1 label is stable no
  // matter how much is explored — the Wizardry read. Mirrors floor_map.gd.
  const floorMinX = Math.min(...gridCells.map((cell) => cell.x));
  const floorMinY = Math.min(...gridCells.map((cell) => cell.y));

  return { cells, width, height, minX, minY, floorMinX, floorMinY };
}

/** Column index → spreadsheet letters (0→A … 25→Z, 26→AA). Mirrors floor_map._col_letter. */
export function columnLetter(index: number): string {
  let out = "";
  let n = index;
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}

/** The party's current cell as an A1 coordinate on the floor's absolute grid, or "" when off the floor. */
export function floorCoordinate(state: GameState, world: ScenarioWorld): string {
  const floor = world.dungeons.find((dungeon) => dungeon.id === state.map.floorId);
  const cells = floor?.grid?.cells ?? [];
  const currentId = state.map.currentCellId;
  const here = currentId ? cells.find((cell) => cell.id === currentId) : undefined;
  if (!here || cells.length === 0) return "";
  const floorMinX = Math.min(...cells.map((cell) => cell.x));
  const floorMinY = Math.min(...cells.map((cell) => cell.y));
  return `${columnLetter(here.x - floorMinX)}${here.y - floorMinY + 1}`;
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
        marker: status === "unseen" ? null : cellMarker(room, state, edges),
        label: getLocalizedRoomText(world, roomId, locale).name
      };
    });

  return { cells };
}

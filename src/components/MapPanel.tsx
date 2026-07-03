import { getLocalizedRoomText, getRoom } from "../domain/scenario";
import type { Direction, GameState, ScenarioWorld } from "../domain/types";
import type { Locale, Translator } from "../i18n";

interface MapPanelProps {
  state: GameState;
  world: ScenarioWorld;
  locale: Locale;
  t: Translator;
}

const directions: Direction[] = ["north", "east", "south", "west"];
const directionOffsets: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 }
};

interface MiniMapCell {
  id: string;
  x: number;
  y: number;
  status: "current" | "visited" | "unseen";
  exits: Direction[];
  label: string;
}

export function MapPanel({ state, world, locale, t }: MapPanelProps) {
  const currentRoomId = state.map.currentRoomId ?? state.position?.roomId ?? null;
  const currentRoom = currentRoomId ? getRoom(world, currentRoomId) : null;
  const currentExits = currentRoomId ? state.map.knownExits[currentRoomId] ?? [] : [];
  const blockedExits = currentRoomId ? state.map.blockedExits[currentRoomId] ?? [] : [];
  const miniMap = buildMiniMap(state, world, locale, currentRoomId);

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
            className="mini-map-grid"
            style={{
              gridTemplateColumns: `repeat(${miniMap.width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${miniMap.height}, minmax(0, 1fr))`
            }}
          >
            {miniMap.cells.map((cell) => (
              <span
                aria-label={`${cell.label}: ${t(`map.${cell.status}`)}`}
                className={`mini-map-cell ${cell.status} ${cell.exits.map((direction) => `exit-${direction}`).join(" ")}`}
                data-testid={`minimap-${cell.status}`}
                key={cell.id}
                style={{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }}
                title={cell.label}
              >
                {cell.exits.map((direction) => (
                  <i aria-hidden="true" className={`mini-map-link link-${direction}`} key={direction} />
                ))}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="map-compass" aria-label={t("map.paths")} data-testid="map-directions">
        {directions.map((direction) => {
          const status = getDirectionStatus(direction, currentRoom, currentExits, blockedExits, state.map.visitedRooms);
          return (
            <div
              className={`map-direction ${status}`}
              data-testid={`map-direction-${direction}`}
              key={direction}
            >
              <strong>{t(`direction.${direction}`)}</strong>
              <span>{t(`map.${status}`)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getDirectionStatus(
  direction: Direction,
  currentRoom: ReturnType<typeof getRoom> | null,
  currentExits: Direction[],
  blockedExits: Direction[],
  visitedRooms: string[]
) {
  if (blockedExits.includes(direction)) {
    return "wall" as const;
  }

  if (!currentRoom || !currentExits.includes(direction)) {
    return "unknown" as const;
  }

  const targetRoomId = currentRoom.exits[direction];
  return targetRoomId && visitedRooms.includes(targetRoomId) ? ("open" as const) : ("unseen" as const);
}

function buildMiniMap(state: GameState, world: ScenarioWorld, locale: Locale, currentRoomId: string | null) {
  const startRoomId = state.map.visitedRooms[0] ?? currentRoomId;
  if (!startRoomId) {
    return { width: 0, height: 0, cells: [] as MiniMapCell[] };
  }

  const roomIds = new Set<string>(state.map.visitedRooms);
  if (currentRoomId) {
    roomIds.add(currentRoomId);
  }

  for (const [roomId, exits] of Object.entries(state.map.knownExits)) {
    roomIds.add(roomId);
    const room = getRoom(world, roomId);
    for (const direction of exits ?? []) {
      const targetRoomId = room.exits[direction];
      if (targetRoomId) {
        roomIds.add(targetRoomId);
      }
    }
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

  const rawCells = Array.from(coordinates.entries()).map(([roomId, coordinate]) => {
    const room = getRoom(world, roomId);
    const knownExits = (state.map.knownExits[roomId] ?? []).filter((direction) => {
      const targetRoomId = room.exits[direction];
      return targetRoomId ? roomIds.has(targetRoomId) : false;
    });
    return {
      id: roomId,
      ...coordinate,
      status: roomId === currentRoomId ? ("current" as const) : state.map.visitedRooms.includes(roomId) ? ("visited" as const) : ("unseen" as const),
      exits: knownExits,
      label: getLocalizedRoomText(world, roomId, locale).name
    };
  });

  const minX = Math.min(...rawCells.map((cell) => cell.x));
  const minY = Math.min(...rawCells.map((cell) => cell.y));
  const cells = rawCells.map((cell) => ({ ...cell, x: cell.x - minX, y: cell.y - minY }));
  const width = Math.max(...cells.map((cell) => cell.x)) + 1;
  const height = Math.max(...cells.map((cell) => cell.y)) + 1;
  return { width, height, cells };
}

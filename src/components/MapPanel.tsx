import { getRoom } from "../domain/scenario";
import type { Direction, GameState, ScenarioWorld } from "../domain/types";

interface MapPanelProps {
  state: GameState;
  world: ScenarioWorld;
}

const directions: Direction[] = ["north", "east", "south", "west"];

export function MapPanel({ state, world }: MapPanelProps) {
  const currentRoomId = state.map.currentRoomId ?? state.position?.roomId ?? null;
  const currentRoom = currentRoomId ? getRoom(world, currentRoomId) : null;
  const currentExits = currentRoomId ? state.map.knownExits[currentRoomId] ?? [] : [];
  const blockedExits = currentRoomId ? state.map.blockedExits[currentRoomId] ?? [] : [];
  const unexploredExits = currentRoom
    ? currentExits.filter((direction) => {
        const targetRoomId = currentRoom.exits[direction];
        return targetRoomId ? !state.map.visitedRooms.includes(targetRoomId) : false;
      })
    : [];

  return (
    <section className="map-panel" aria-labelledby="map-heading">
      <div className="section-title">
        <h3 id="map-heading">Map</h3>
        <span>{state.map.floorId ?? "No floor"}</span>
      </div>
      <div className="map-current" data-testid="map-current">
        <small>Current</small>
        <strong>{currentRoom?.name ?? "Town"}</strong>
      </div>
      <div className="map-grid">
        <div>
          <small>Visited</small>
          <ul data-testid="map-visited">
            {state.map.visitedRooms.length === 0 ? (
              <li>None</li>
            ) : (
              state.map.visitedRooms.map((roomId) => <li key={roomId}>{getRoom(world, roomId).name}</li>)
            )}
          </ul>
        </div>
        <div>
          <small>Exits</small>
          <div className="map-tags" aria-label="Known exits">
            {directions.map((direction) => (
              <span
                className={
                  currentExits.includes(direction)
                    ? unexploredExits.includes(direction)
                      ? "map-tag unexplored"
                      : "map-tag known"
                    : blockedExits.includes(direction)
                      ? "map-tag blocked"
                      : "map-tag muted"
                }
                key={direction}
              >
                {direction}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

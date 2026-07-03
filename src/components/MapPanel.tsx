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

export function MapPanel({ state, world, locale, t }: MapPanelProps) {
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
        <h3 id="map-heading">{t("map.heading")}</h3>
        <span>{state.map.floorId ?? t("map.noFloor")}</span>
      </div>
      <div className="map-current" data-testid="map-current">
        <small>{t("map.current")}</small>
        <strong>{currentRoomId ? getLocalizedRoomText(world, currentRoomId, locale).name : t("map.town")}</strong>
      </div>
      <div className="map-grid">
        <div>
          <small>{t("map.visited")}</small>
          <ul data-testid="map-visited">
            {state.map.visitedRooms.length === 0 ? (
              <li>{t("map.none")}</li>
            ) : (
              state.map.visitedRooms.map((roomId) => (
                <li key={roomId}>{getLocalizedRoomText(world, roomId, locale).name}</li>
              ))
            )}
          </ul>
        </div>
        <div>
          <small>{t("map.exits")}</small>
          <div className="map-tags" aria-label={t("map.knownExits")}>
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
                {t(`direction.${direction}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

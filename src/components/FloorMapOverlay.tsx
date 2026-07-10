import type { GameState, ScenarioWorld } from "../domain/types";
import { floorName } from "../domain/scenario";
import type { Locale, Translator } from "../i18n";
import { FloorMapView } from "./MapPanel";

interface FloorMapOverlayProps {
  state: GameState;
  world: ScenarioWorld;
  locale: Locale;
  t: Translator;
  onClose: () => void;
}

// The whole-floor map overlay (extracted verbatim from App's render).
export function FloorMapOverlay({ state, world, locale, t, onClose }: FloorMapOverlayProps) {
  return (
    <div className="floor-map-overlay" data-testid="floor-map" onClick={onClose}>
      <section
        className="floor-map-panel"
        role="dialog"
        aria-label={t("play.fullMapTitle")}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="floor-map-head">
          <h3>{t("play.fullMapTitle")}</h3>
          <span>{floorName(world, state.map.floorId)}</span>
        </header>
        <div className="floor-map-scroll">
          <FloorMapView state={state} world={world} locale={locale} t={t} />
        </div>
        <button type="button" className="primary-action" onClick={onClose}>
          {t("play.closeMap")}
        </button>
      </section>
    </div>
  );
}

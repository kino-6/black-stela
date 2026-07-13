import type { Locale, Translator } from "../i18n";
import type { ScenarioListing } from "../data/worldRegistry";

interface ScenarioPickerProps {
  t: Translator;
  locale: Locale;
  scenarios: ScenarioListing[];
  onSelect: (worldId: string) => void;
  onBack: () => void;
}

// Pre-game scenario picker: choose which content/worlds/<id> to play. Shown from New Game
// when more than one scenario is registered. Selecting a card points every world consumer
// (engine, catalog, art pack) at that world and starts a fresh run.
//
// This was the only top-level screen that registered no controller surface. With zero active
// surfaces `getAllControllerFocusableElements()` returns nothing, so App's focus effect had
// nowhere to land, arrows did nothing, and a player on a gamepad was simply stuck — while the
// click-driven Gate sailed past it. The `data-controller-*` attributes below are the whole
// registration; the existing focus machinery does the rest.
//
// It also printed `scenario.worldId` under each title, i.e. the literal strings "default" and
// "verdant" — a raw route id in normal play, which AGENTS.md forbids. The card now says what
// the world IS, in the player's language.
export function ScenarioPicker({ t, locale, scenarios, onSelect, onBack }: ScenarioPickerProps) {
  return (
    <section
      className="title-screen scenario-picker"
      aria-labelledby="scenario-heading"
      data-controller-surface="scenario"
      data-controller-active="true"
    >
      <div className="title-mark">
        <span className="title-rule" />
        <h1 id="scenario-heading">{t("scenario.pick.title")}</h1>
        <p className="title-tagline">{t("scenario.pick.subtitle")}</p>
      </div>
      <ul className="scenario-list" role="list">
        {scenarios.map((scenario) => {
          const title = scenario.locales?.[locale]?.title ?? scenario.title;
          const tagline = scenario.locales?.[locale]?.tagline ?? scenario.tagline;
          return (
            <li key={scenario.worldId}>
              <button
                type="button"
                className="scenario-card"
                data-testid={`scenario-card-${scenario.worldId}`}
                onClick={() => onSelect(scenario.worldId)}
              >
                <strong>{title}</strong>
                {tagline && <small>{tagline}</small>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="title-actions">
        <button type="button" className="ghost" onClick={onBack} data-testid="scenario-back" data-controller-cancel>
          {t("scenario.pick.back")}
        </button>
      </div>
    </section>
  );
}

import type { Translator } from "../i18n";
import type { ScenarioListing } from "../data/worldRegistry";

interface ScenarioPickerProps {
  t: Translator;
  scenarios: ScenarioListing[];
  onSelect: (worldId: string) => void;
  onBack: () => void;
}

// Pre-game scenario picker: choose which content/worlds/<id> to play. Shown from
// New Game when more than one scenario is registered. Selecting a card points every
// world consumer (engine, catalog, art pack) at that world and starts a fresh run.
export function ScenarioPicker({ t, scenarios, onSelect, onBack }: ScenarioPickerProps) {
  return (
    <section className="title-screen scenario-picker" aria-labelledby="scenario-heading">
      <div className="title-mark">
        <span className="title-rule" />
        <h1 id="scenario-heading">{t("scenario.pick.title")}</h1>
        <p className="title-tagline">{t("scenario.pick.subtitle")}</p>
      </div>
      <ul className="scenario-list" role="list">
        {scenarios.map((scenario) => (
          <li key={scenario.worldId}>
            <button
              type="button"
              className="scenario-card"
              data-testid={`scenario-card-${scenario.worldId}`}
              onClick={() => onSelect(scenario.worldId)}
            >
              <strong>{scenario.title}</strong>
              <small>{scenario.worldId}</small>
            </button>
          </li>
        ))}
      </ul>
      <div className="title-actions">
        <button type="button" className="ghost" onClick={onBack} data-testid="scenario-back">
          {t("scenario.pick.back")}
        </button>
      </div>
    </section>
  );
}

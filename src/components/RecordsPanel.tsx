import type { GameState, ScenarioWorld } from "../domain/types";
import { projectEventToLog } from "../domain/replayLog";
import type { Locale, Translator } from "../i18n";

interface RecordsPanelProps {
  t: Translator;
  log: GameState["log"];
  locale: Locale;
  world: ScenarioWorld;
}

// The town records service — recent log entries (extracted verbatim from App).
export function RecordsPanel({ t, log, locale, world }: RecordsPanelProps) {
  return (
    <section className="town-service" aria-labelledby="records-heading">
      <h3 id="records-heading">{t("town.recordsHeading")}</h3>
      <p>{t("town.logCount", { count: log.length })}</p>
      {log.length > 0 && (
        <ol className="records-list">
          {log.slice().reverse().slice(0, 8).map((entry) => (
            <li key={entry.id}>
              <small>{t("log.turn", { turn: entry.turn })}</small>
              <p>{entry.event ? projectEventToLog(entry.event, locale, world)?.text ?? entry.text : entry.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

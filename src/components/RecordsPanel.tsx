import type { GameState, ScenarioWorld } from "../domain/types";
import { projectEventToLog } from "../domain/replayLog";
import { bestiaryEntries } from "../domain/bestiary";
import type { Locale, Translator } from "../i18n";

interface RecordsPanelProps {
  t: Translator;
  log: GameState["log"];
  enemyRecord: GameState["enemyRecord"];
  locale: Locale;
  world: ScenarioWorld;
}

// The town records service — recent log entries, plus the IMP-022D bestiary: the enemies the party
// has met, and (once defeated) their weaknesses and rare-drop sources. Coarse only — no exact HP.
export function RecordsPanel({ t, log, enemyRecord, locale, world }: RecordsPanelProps) {
  const bestiary = bestiaryEntries(world, enemyRecord, locale);
  return (
    <section className="town-service" aria-labelledby="records-heading" data-testid="records-panel">
      <h3 id="records-heading">{t("town.recordsHeading")}</h3>

      <div className="bestiary" data-testid="bestiary">
        <h4>{t("bestiary.heading")}</h4>
        {bestiary.length === 0 ? (
          <p className="service-empty">{t("bestiary.empty")}</p>
        ) : (
          <ul className="bestiary-list">
            {bestiary.map((entry) => (
              <li className={`bestiary-row${entry.known ? " known" : ""}`} key={entry.enemyId} data-testid={`bestiary-${entry.enemyId}`}>
                <div className="bestiary-head">
                  <strong>{entry.name}</strong>
                  <span className="bestiary-threat" aria-label={t("bestiary.threat", { threat: entry.threat })}>
                    {"★".repeat(Math.min(5, entry.threat))}
                  </span>
                  <span className="bestiary-count">{t("bestiary.defeated", { count: entry.defeated })}</span>
                </div>
                {entry.known ? (
                  <div className="bestiary-meta">
                    <span>
                      {t("bestiary.weaknesses")}:{" "}
                      {entry.weaknesses.length > 0 ? entry.weaknesses.map((w) => w.label).join(" / ") : t("bestiary.none")}
                    </span>
                    <span>
                      {t("bestiary.drops")}:{" "}
                      {entry.drops.length > 0 ? entry.drops.map((d) => d.name).join(" / ") : t("bestiary.none")}
                    </span>
                  </div>
                ) : (
                  <p className="bestiary-unknown">{t("bestiary.unknown")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h4>{t("bestiary.logHeading")}</h4>
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

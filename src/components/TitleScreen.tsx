import type { Locale, Translator } from "../i18n";

interface TitleScreenProps {
  screen: "title" | "config";
  t: Translator;
  locale: Locale;
  hasAutosave: boolean;
  saveStatus: string;
  hasCorruptAutosave: boolean;
  autoBattleSafety: boolean;
  instantCombatLog: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onToggleConfig: () => void;
  onChangeLocale: (locale: Locale) => void;
  onToggleAutoBattleSafety: (enabled: boolean) => void;
  onToggleInstantCombatLog: (enabled: boolean) => void;
}

// The pre-game title + config screen (extracted verbatim from App's render).
export function TitleScreen({
  screen,
  t,
  locale,
  hasAutosave,
  saveStatus,
  hasCorruptAutosave,
  autoBattleSafety,
  instantCombatLog,
  onNewGame,
  onContinue,
  onToggleConfig,
  onChangeLocale,
  onToggleAutoBattleSafety,
  onToggleInstantCombatLog
}: TitleScreenProps) {
  return (
    <section className="title-screen" aria-labelledby="title-heading">
      <div className="title-mark">
        <span className="title-rule" />
        <h1 id="title-heading">{t("app.title")}</h1>
      </div>
      <nav className="title-menu" aria-label={t("title.menu")} data-controller-active={screen === "title" ? "true" : undefined} data-controller-surface="title">
        <button type="button" className="primary-action" onClick={onNewGame}>
          {t("title.newGame")}
        </button>
        <button type="button" disabled={!hasAutosave} onClick={onContinue}>
          {t("title.continue")}
        </button>
        <button type="button" onClick={onToggleConfig}>
          {t("title.config")}
        </button>
      </nav>
      {screen === "config" && (
        <section
          className="title-config"
          aria-labelledby="title-config-heading"
          data-controller-active="true"
          data-controller-surface="title-config"
        >
          <h2 id="title-config-heading">{t("title.config")}</h2>
          <label>
            {t("locale.label")}
            <select value={locale} onChange={(event) => onChangeLocale(event.target.value as Locale)}>
              <option value="en">{t("locale.en")}</option>
              <option value="ja">{t("locale.ja")}</option>
            </select>
          </label>
          <label className="config-toggle">
            <input
              type="checkbox"
              data-testid="config-auto-safety"
              checked={autoBattleSafety}
              onChange={(event) => onToggleAutoBattleSafety(event.target.checked)}
            />
            {t("config.autoBattleSafety")}
          </label>
          <label className="config-toggle">
            <input
              type="checkbox"
              data-testid="config-instant-combat-log"
              checked={instantCombatLog}
              onChange={(event) => onToggleInstantCombatLog(event.target.checked)}
            />
            {t("config.instantCombatLog")}
          </label>
        </section>
      )}
      {(saveStatus || hasCorruptAutosave) && (
        <p className="title-status" aria-live="polite">{saveStatus || t("save.corrupt")}</p>
      )}
    </section>
  );
}

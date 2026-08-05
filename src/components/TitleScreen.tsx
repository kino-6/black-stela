import { useEffect, useState } from "react";
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
  confirmRound: boolean;
  /** The instant-combat-log skip is a DEBUG convenience (it hides what happened); only expose it in debug. */
  debugMode?: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenLoad: () => void;
  onDeleteSave: () => void;
  onToggleConfig: () => void;
  onChangeLocale: (locale: Locale) => void;
  onToggleAutoBattleSafety: (enabled: boolean) => void;
  onToggleInstantCombatLog: (enabled: boolean) => void;
  onToggleConfirmRound: (enabled: boolean) => void;
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
  confirmRound,
  debugMode,
  onNewGame,
  onContinue,
  onOpenLoad,
  onDeleteSave,
  onToggleConfig,
  onChangeLocale,
  onToggleAutoBattleSafety,
  onToggleInstantCombatLog,
  onToggleConfirmRound
}: TitleScreenProps) {
  // The 削除 confirm is a two-step gate: 削除 → はい、削除する / やめる. Reset it whenever the save vanishes
  // (deleted, or we leave the title) so a stale confirm can never act on a slot that is already gone.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  useEffect(() => {
    if (!hasAutosave || screen !== "title") {
      setConfirmingDelete(false);
    }
  }, [hasAutosave, screen]);
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
        <button type="button" disabled={!hasAutosave} data-testid="title-load" onClick={onOpenLoad}>
          {t("title.loadGame")}
        </button>
        {hasAutosave && !confirmingDelete && (
          <button type="button" data-testid="title-delete-save" onClick={() => setConfirmingDelete(true)}>
            {t("title.deleteSlot")}
          </button>
        )}
        {hasAutosave && confirmingDelete && (
          <div className="title-delete-confirm" role="group" aria-label={t("title.deleteSlot")}>
            <button
              type="button"
              className="danger-action"
              data-testid="title-delete-confirm"
              onClick={() => {
                onDeleteSave();
                setConfirmingDelete(false);
              }}
            >
              {t("title.deleteConfirm")}
            </button>
            <button type="button" data-testid="title-delete-cancel" onClick={() => setConfirmingDelete(false)}>
              {t("title.deleteCancel")}
            </button>
          </div>
        )}
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
          {debugMode && (
            <label className="config-toggle">
              <input
                type="checkbox"
                data-testid="config-instant-combat-log"
                checked={instantCombatLog}
                onChange={(event) => onToggleInstantCombatLog(event.target.checked)}
              />
              {t("config.instantCombatLog")}
            </label>
          )}
          <label className="config-toggle">
            <input
              type="checkbox"
              data-testid="config-confirm-round"
              checked={confirmRound}
              onChange={(event) => onToggleConfirmRound(event.target.checked)}
            />
            {t("config.confirmRound")}
          </label>
        </section>
      )}
      {(saveStatus || hasCorruptAutosave) && (
        <p className="title-status" aria-live="polite">{saveStatus || t("save.corrupt")}</p>
      )}
    </section>
  );
}

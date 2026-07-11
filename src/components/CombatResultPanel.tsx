import { useEffect, useRef } from "react";
import type { Translator } from "../i18n";

export interface CombatResult {
  enemyNames: string[];
  xp: number;
  gold: number;
  levelUps: { name: string; level: number }[];
}

interface CombatResultPanelProps {
  result: CombatResult;
  t: Translator;
  onDismiss: () => void;
}

// Post-victory result screen. Combat used to end in one collapsed log line; this
// holds the outcome on screen — who was felled, XP/gold earned, and any level-ups —
// until the player confirms, so a win reads as a win.
export function CombatResultPanel({ result, t, onDismiss }: CombatResultPanelProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div className="combat-result-overlay" role="dialog" aria-modal="true" aria-label={t("result.title")} data-testid="combat-result">
      <div className="combat-result-card">
        <h2 className="combat-result-title">{t("result.title")}</h2>
        {result.enemyNames.length > 0 && (
          <p className="combat-result-defeated">{t("result.defeated", { names: result.enemyNames.join("・") })}</p>
        )}
        <dl className="combat-result-rewards">
          <div>
            <dt>{t("result.xp")}</dt>
            <dd data-testid="result-xp">+{result.xp}</dd>
          </div>
          <div>
            <dt>{t("result.gold")}</dt>
            <dd data-testid="result-gold">+{result.gold}</dd>
          </div>
        </dl>
        {result.levelUps.length > 0 && (
          <ul className="combat-result-levelups" data-testid="result-levelups">
            {result.levelUps.map((entry) => (
              <li key={`${entry.name}-${entry.level}`}>{t("result.levelUp", { name: entry.name, level: entry.level })}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="combat-result-continue"
          data-testid="combat-result-continue"
          ref={buttonRef}
          onClick={onDismiss}
        >
          {t("result.continue")}
          <kbd className="key-hint">Enter</kbd>
        </button>
      </div>
    </div>
  );
}

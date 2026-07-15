import { useEffect, useRef } from "react";
import type { Character, CombatConclusion } from "../domain/types";
import type { Translator } from "../i18n";
import { renderPortraitContent } from "../ui/portrait";

interface CombatResultPanelProps {
  result: CombatConclusion;
  party: Character[];
  t: Translator;
  onDismiss: () => void;
}

// Hold victory on the battlefield as a game-state transition, not a floating
// application notification. Rewards and growth share one stable controller surface.
export function CombatResultPanel({ result, party, t, onDismiss }: CombatResultPanelProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div
      className="combat-result-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("result.title")}
      data-testid="combat-result"
      data-controller-active="true"
      data-controller-surface="combat-result"
    >
      <section className="combat-result-aftermath" data-testid="combat-aftermath">
        <header className="combat-result-heading">
          <h2 className="combat-result-title">{t("result.title")}</h2>
          {result.enemyNames.length > 0 && (
            <p className="combat-result-defeated">{t("result.defeated", { names: result.enemyNames.join("・") })}</p>
          )}
        </header>

        <div className={`combat-result-body${result.levelUps.length === 0 ? " no-growth" : ""}`}>
          <section className="combat-result-spoils" aria-labelledby="combat-result-spoils-heading">
            <h3 id="combat-result-spoils-heading">{t("result.spoils")}</h3>
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
          </section>

          {result.levelUps.length > 0 && (
            <section className="combat-result-growth" aria-labelledby="combat-result-growth-heading">
              <h3 id="combat-result-growth-heading">{t("result.growth")}</h3>
              <ul className="combat-result-levelups" data-testid="result-levelups">
                {result.levelUps.map((entry) => {
                  const member = party.find((candidate) =>
                    entry.characterId ? candidate.id === entry.characterId : candidate.name === entry.name
                  );
                  return (
                    <li key={`${entry.characterId ?? entry.name}-${entry.level}`} data-testid="result-levelup-member">
                      {member && (
                        <span className="combat-result-portrait" style={{ borderColor: member.accentColor }}>
                          {renderPortraitContent({
                            portraitRef: member.portraitRef,
                            backgroundId: member.backgroundId,
                            fallback: member.name,
                            alt: member.name
                          })}
                        </span>
                      )}
                      <span className="combat-result-growth-copy">
                        <strong>{entry.name}</strong>
                        <span>{t("result.levelUp")}</span>
                      </span>
                      <b>{t("result.level", { level: entry.level })}</b>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <footer className="combat-result-footer">
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
        </footer>
      </section>
    </div>
  );
}

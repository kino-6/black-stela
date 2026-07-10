import type { Translator } from "../i18n";

interface CombatLogProps {
  t: Translator;
  beats: string[];
  revealed: number;
  onAdvance: () => void;
}

// #69: the round no longer collapses to one line. Each blow ("Rook hits the slime
// for 7. 2 remain.") is a beat, revealed one at a time so the fight has weight and
// 数字感. Tapping the panel reveals the rest at once (accelerate / skip).
export function CombatLog({ t, beats, revealed, onAdvance }: CombatLogProps) {
  // Show a trailing window of the beats revealed so far (newest last).
  const shown = beats.slice(0, revealed).slice(-6);
  const more = revealed < beats.length;
  return (
    <button
      type="button"
      className="combat-log"
      data-testid="combat-log"
      aria-label={t("play.combatLog")}
      aria-live="polite"
      onClick={onAdvance}
      title={t("play.combatLogAdvance")}
    >
      <span className="combat-log-title">{t("play.combatLog")}</span>
      <ol className="combat-log-beats">
        {shown.length === 0 ? (
          <li className="combat-log-beat combat-log-empty">{t("play.combatLogWaiting")}</li>
        ) : (
          shown.map((beat, index) => (
            <li key={`${revealed}-${index}`} className="combat-log-beat" data-testid="combat-log-beat">
              {beat}
            </li>
          ))
        )}
      </ol>
      {more && <span className="combat-log-more" data-testid="combat-log-more">{t("play.combatLogAdvance")}</span>}
    </button>
  );
}

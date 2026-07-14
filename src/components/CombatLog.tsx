import type { Translator } from "../i18n";

interface CombatLogProps {
  t: Translator;
  beats: string[];
  revealed: number;
  onAdvance: () => void;
}

// The live band is not the battle history. It shows one obvious current beat and
// one line of immediate context; the replay log remains the durable record.
export function CombatLog({ t, beats, revealed, onAdvance }: CombatLogProps) {
  const shown = beats.slice(0, revealed);
  const current = shown.at(-1);
  const previous = shown.at(-2);
  const more = revealed < beats.length;
  return (
    <div
      className="combat-log"
      data-testid="combat-log"
      aria-live="polite"
    >
      <span className="combat-log-title">{t("play.combatLog")}</span>
      <div className="combat-log-beats">
        {previous && <p className="combat-log-context">{previous}</p>}
        <p className={`combat-log-beat${current ? "" : " combat-log-empty"}`} data-testid="combat-log-beat">
          {current ?? t("play.combatLogWaiting")}
        </p>
      </div>
      {more && (
        <button type="button" className="combat-log-more" data-testid="combat-log-more" onClick={onAdvance}>
          {t("play.combatLogAdvance")}
        </button>
      )}
    </div>
  );
}

import { Repeat2, ShieldCheck, Square, Sword } from "lucide-react";
import type { Translator } from "../i18n";

interface CombatCommandDockProps {
  t: Translator;
  isTempoRunning: boolean;
  onToggleTempo: () => void;
  onRetreat: () => void;
  debugMode: boolean;
  onForceVictory: () => void;
  onReviveParty: () => void;
}

// Combat META bar — the round-level affordances that sit beside the per-actor
// command menu (the menu, not this bar, handles attack/magic/item/defend). Fixed
// position so it never reflows.
export function CombatCommandDock({
  t,
  isTempoRunning,
  onToggleTempo,
  onRetreat,
  debugMode,
  onForceVictory,
  onReviveParty
}: CombatCommandDockProps) {
  return (
    <div
      className="command-bar command-dock combat-command-window combat-meta-bar"
      aria-label={t("play.combatCommands")}
      data-controller-active="true"
      data-controller-surface="combat-meta"
      data-testid="combat-command-window"
    >
      <button type="button" aria-pressed={isTempoRunning} onClick={onToggleTempo}>
        {isTempoRunning ? <Square size={18} /> : <Repeat2 size={18} />}
        {isTempoRunning ? t("tempo.stop") : t("tempo.repeat")}
        <kbd className="key-hint">R</kbd>
      </button>
      <button type="button" onClick={onRetreat}>
        <ShieldCheck size={18} />
        {t("play.retreat")}
      </button>
      {debugMode && (
        <>
          <button
            type="button"
            className="context-command"
            data-testid="debug-force-victory"
            onClick={onForceVictory}
          >
            <Sword size={18} />
            {t("debug.forceVictory")}
          </button>
          <button
            type="button"
            className="context-command"
            data-testid="debug-revive-party"
            onClick={onReviveParty}
          >
            <ShieldCheck size={18} />
            {t("debug.reviveParty")}
          </button>
        </>
      )}
    </div>
  );
}

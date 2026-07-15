import { PlayCircle, RotateCcw, ShieldCheck, Square, Sword, Swords } from "lucide-react";
import type { Translator } from "../i18n";

interface CombatCommandDockProps {
  t: Translator;
  isTempoRunning: boolean;
  onToggleTempo: () => void;
  onAllOut: () => void;
  canAllOut: boolean;
  onRepeatRound: () => void;
  canRepeat: boolean;
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
  onAllOut,
  canAllOut,
  onRepeatRound,
  canRepeat,
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
      {/* The friction cure: commit the whole round with the smart attack default in one press,
          instead of six × (command → target) + confirm. The fast path for a plain fight. */}
      <button
        type="button"
        className="combat-all-out"
        onClick={onAllOut}
        disabled={!canAllOut}
        data-testid="combat-all-out"
        title={t("tempo.allOutHint")}
      >
        <Swords size={18} />
        {t("tempo.allOut")}
        <kbd className="key-hint">F</kbd>
      </button>
      <button type="button" aria-pressed={isTempoRunning} onClick={onToggleTempo} data-testid="combat-auto">
        {isTempoRunning ? <Square size={18} /> : <PlayCircle size={18} />}
        {isTempoRunning ? t("tempo.stop") : t("tempo.auto")}
        <kbd className="key-hint">R</kbd>
      </button>
      <button
        type="button"
        onClick={onRepeatRound}
        disabled={!canRepeat}
        data-testid="combat-repeat-round"
        title={t("tempo.repeatRoundHint")}
      >
        <RotateCcw size={18} />
        {t("tempo.repeatRound")}
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

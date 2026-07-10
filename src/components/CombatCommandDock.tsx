import { ArrowRight, Repeat2, ShieldCheck, Square, Sword, Wand2 } from "lucide-react";
import { SPELLS, knownSpells, type SpellId } from "../domain/spells";
import type { Character } from "../domain/types";
import type { Translator } from "../i18n";

const SPELL_LABEL_KEY: Record<SpellId, "play.spellHeal" | "play.spellFirebolt" | "play.spellSleep"> = {
  heal: "play.spellHeal",
  firebolt: "play.spellFirebolt",
  sleep: "play.spellSleep"
};

interface CombatCommandDockProps {
  t: Translator;
  isTempoRunning: boolean;
  onToggleTempo: () => void;
  canSelectedActorAttack: boolean;
  onAttack: () => void;
  canCycleTarget: boolean;
  onCycleTarget: () => void;
  selectedActor: Character | null;
  hasSelectedTarget: boolean;
  onDefend: () => void;
  onCastSpell: (spellId: SpellId) => void;
  showUseItem: boolean;
  onUseItem: () => void;
  combatOrdersReady: boolean;
  onExecute: () => void;
  combatOrdersCount: number;
  onTakeBack: () => void;
  onClear: () => void;
  onRetreat: () => void;
  debugMode: boolean;
  onForceVictory: () => void;
  onReviveParty: () => void;
}

// The combat command dock (extracted verbatim from App's render). SPELL_LABEL_KEY
// moves here with the spell buttons — it is used nowhere else.
export function CombatCommandDock({
  t,
  isTempoRunning,
  onToggleTempo,
  canSelectedActorAttack,
  onAttack,
  canCycleTarget,
  onCycleTarget,
  selectedActor,
  hasSelectedTarget,
  onDefend,
  onCastSpell,
  showUseItem,
  onUseItem,
  combatOrdersReady,
  onExecute,
  combatOrdersCount,
  onTakeBack,
  onClear,
  onRetreat,
  debugMode,
  onForceVictory,
  onReviveParty
}: CombatCommandDockProps) {
  return (
    <div
      className="command-bar command-dock combat-command-window"
      aria-label={t("play.combatCommands")}
      data-controller-active="true"
      data-controller-surface="combat-commands"
      data-testid="combat-command-window"
    >
      <button type="button" aria-pressed={isTempoRunning} onClick={onToggleTempo}>
        {isTempoRunning ? <Square size={18} /> : <Repeat2 size={18} />}
        {isTempoRunning ? t("tempo.stop") : t("tempo.repeat")}
        <kbd className="key-hint">R</kbd>
      </button>
      <button type="button" disabled={!canSelectedActorAttack} onClick={onAttack}>
        <Sword size={18} />
        {t("play.attack")}
        <kbd className="key-hint">F</kbd>
      </button>
      <button type="button" disabled={!canCycleTarget} onClick={onCycleTarget}>
        <ArrowRight size={18} />
        {t("play.targetNext")}
      </button>
      <button type="button" disabled={!selectedActor} onClick={onDefend}>
        <ShieldCheck size={18} />
        {t("play.defend")}
        <kbd className="key-hint">G</kbd>
      </button>
      {selectedActor &&
        knownSpells(selectedActor.classId, selectedActor.level).map((spellId) => {
          const spell = SPELLS[spellId];
          const needsTarget = spell.target === "enemyGroup" && !hasSelectedTarget;
          return (
            <button
              key={spellId}
              type="button"
              disabled={selectedActor.mp < spell.mpCost || needsTarget}
              onClick={() => onCastSpell(spellId)}
            >
              <Wand2 size={18} />
              {t(SPELL_LABEL_KEY[spellId])} · {t("play.mpShort")} {spell.mpCost}
            </button>
          );
        })}
      {showUseItem && selectedActor && (
        <button type="button" onClick={onUseItem}>
          <ShieldCheck size={18} />
          {t("play.useItem")}
        </button>
      )}
      <button type="button" disabled={!combatOrdersReady} onClick={onExecute}>
        <Sword size={18} />
        {t("play.fight")}
        <kbd className="key-hint">X</kbd>
      </button>
      <button type="button" data-controller-cancel="true" disabled={combatOrdersCount === 0} onClick={onTakeBack}>
        <ShieldCheck size={18} />
        {t("play.takeBack")}
        <kbd className="key-hint">⌫</kbd>
      </button>
      <button type="button" disabled={combatOrdersCount === 0} onClick={onClear}>
        <Square size={18} />
        {t("play.clearOrders")}
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

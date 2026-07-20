import { useState } from "react";
import type { ReactNode } from "react";
import type { Character, CombatBeat, CombatEnemyGroup, GameState, ScenarioWorld } from "../domain/types";
import type { Locale, Translator } from "../i18n";
import type { SpellId } from "../domain/spells";
import { isCasterClass, type SpellTargeting } from "../domain/spells";
import { combatLoadout } from "../domain/vocations";
import { getEffectiveCharacterStats, weaponReaches } from "../domain/economy";
import { localizedEnemyGroupName } from "../ui/catalog";
import { DungeonView } from "./DungeonView";
import type { EnemyAnchor } from "./dungeonScene";
import { CombatEnemyStage } from "./CombatEnemyStage";
import { CombatPartyStrip } from "./CombatPartyStrip";
import { CombatLog } from "./CombatLog";
import { CombatCommandMenu } from "./CombatCommandMenu";
import { CombatCommandDock } from "./CombatCommandDock";
import { CharacterPresence } from "./CharacterPresence";

interface CombatCockpitProps {
  state: GameState;
  world: ScenarioWorld;
  locale: Locale;
  t: Translator;
  debugMode: boolean;

  // Enemy stage
  enemyGroups: CombatEnemyGroup[];
  livingEnemyGroups: CombatEnemyGroup[];
  selectedTarget?: CombatEnemyGroup;
  onSelectTarget?: (groupId: string | null) => void;
  activeBeat: CombatBeat | null;
  /** Playback index; also the "playback is running" signal (undefined = interactive). */
  beatKey?: number;
  playingBack: boolean;
  /** Current per-beat interval (ms) so stage FX complete within one beat and stay in sync with the log. */
  beatMs?: number;

  // Party
  displayedParty: Character[];
  activeParty: Character[];
  selectedActor?: Character | null;
  orderedActorIds: Set<string>;
  frontRowStanding: boolean;

  // Log
  tempoStatus: string;
  logLines: string[];
  revealedBeats: number;
  onAdvanceLog: () => void;
  orderedCount: number;
  tempo: ReactNode;

  // Command menu
  consumables: { id: string; label: string; targeting: SpellTargeting }[];
  onQueueAttack: (groupId: string) => void;
  onQueueSpell: (spellId: SpellId, groupId: string | null) => void;
  onQueueDefend: () => void;
  onQueueItem: (itemId: string, target: { characterId?: string; groupId?: string }) => void;
  onUndo: () => void;

  // Round confirm
  ordersReady: boolean;
  confirmRound: boolean;
  onExecuteRound: () => void;

  // Dock
  isTempoRunning: boolean;
  onToggleTempo: () => void;
  onAllOut: () => void;
  canAllOut: boolean;
  onRepeatRound: () => void;
  canRepeat: boolean;
  onRetreat: () => void;
  onForceVictory: () => void;
  onReviveParty: () => void;
}

// The combat half of the adventure cockpit — the three-zone layout from
// .claude/skills/combat-ui-drpg (enemy stage / party strip / log + command dock).
// Split out of App.tsx, where it was interleaved with the dungeon half through four
// separate `phase === "combat" ? … : …` ternaries.
export function CombatCockpit({
  state,
  world,
  locale,
  t,
  debugMode,
  enemyGroups,
  livingEnemyGroups,
  selectedTarget,
  onSelectTarget,
  activeBeat,
  beatKey,
  playingBack,
  beatMs,
  displayedParty,
  activeParty,
  selectedActor,
  orderedActorIds,
  frontRowStanding,
  tempoStatus,
  logLines,
  revealedBeats,
  onAdvanceLog,
  orderedCount,
  tempo,
  consumables,
  onQueueAttack,
  onQueueSpell,
  onQueueDefend,
  onQueueItem,
  onUndo,
  ordersReady,
  confirmRound,
  onExecuteRound,
  isTempoRunning,
  onToggleTempo,
  onAllOut,
  canAllOut,
  onRepeatRound,
  canRepeat,
  onRetreat,
  onForceVictory,
  onReviveParty
}: CombatCockpitProps) {
  // Where the renderer actually planted each group's figures. The stage overlays the
  // name/HP on the creatures themselves, so it needs their screen position, not a card.
  const [enemyAnchors, setEnemyAnchors] = useState<EnemyAnchor[]>([]);
  const beatActor = activeBeat?.actorId
    ? displayedParty.find((member) => member.id === activeBeat.actorId)
    : undefined;
  const beatTarget = activeBeat?.targetCharacterId
    ? displayedParty.find((member) => member.id === activeBeat.targetCharacterId)
    : undefined;
  const presenceActor = playingBack ? beatActor ?? beatTarget : selectedActor;

  const caption = `${t("play.round", { round: state.combat?.round ?? 1 })} · ${
    selectedActor && selectedTarget
      ? t("play.selectedOrder", {
          actor: selectedActor.name,
          target: localizedEnemyGroupName(selectedTarget, locale)
        })
      : ordersReady
        ? t("play.orderReady")
        : t("play.selectOrder")
  }`;

  return (
    <>
      <CombatEnemyStage
        backdrop={
          <DungeonView state={state} world={world} label={t("play.dungeonView")} onEnemyAnchors={setEnemyAnchors} />
        }
        groups={enemyGroups}
        anchors={enemyAnchors}
        selectedTargetId={selectedTarget?.id}
        targetingActive={!playingBack}
        onSelectTarget={onSelectTarget}
        activeBeat={activeBeat}
        beatKey={beatKey}
        beatMs={beatMs}
        locale={locale}
        t={t}
        caption={caption}
      />
      <CombatPartyStrip
        members={displayedParty.map((member) => ({
          ...member,
          maxHp: getEffectiveCharacterStats(member, world).maxHp,
          maxMp: getEffectiveCharacterStats(member, world).maxMp
        }))}
        selectedActorId={playingBack ? undefined : selectedActor?.id}
        orderedActorIds={orderedActorIds}
        activeBeat={activeBeat}
        beatKey={beatKey}
        t={t}
      />

      <div className="cockpit-message combat-message">
        {tempoStatus && (
          <p className="event-window" aria-live="polite">
            {tempoStatus}
          </p>
        )}
        <CombatLog t={t} beats={logLines} revealed={revealedBeats} onAdvance={onAdvanceLog} />
        {!playingBack && !isTempoRunning && (
          <span className="combat-order-progress" data-testid="combat-order-list">
            {t("play.orderProgress", { ready: orderedCount, total: activeParty.length })}
          </span>
        )}
      </div>

      {/* The command zone keeps its height whether it holds the menu, the confirm step, or
          nothing at all (during beat playback). It used to simply unmount, and the enemy
          stage — being flex:1 — swelled to fill the gap and shrank back a moment later. */}
      <div className="combat-command-zone">
        <div className="combat-character-presence-slot" aria-hidden={!presenceActor}>
          {presenceActor && (
            <CharacterPresence
              character={presenceActor}
              locale={locale}
              mode={playingBack ? "action" : "command"}
            />
          )}
        </div>
        {isTempoRunning ? tempo : selectedActor && !playingBack ? (
          <CombatCommandMenu
            actor={selectedActor}
            livingGroups={livingEnemyGroups}
            spells={combatLoadout(selectedActor)}
            abilityKind={isCasterClass(selectedActor.classId) ? "spell" : "skill"}
            localizeGroup={(group) => localizedEnemyGroupName(group, locale)}
            canAttack={
              livingEnemyGroups.length > 0 &&
              !(selectedActor.row === "back" && frontRowStanding && !weaponReaches(selectedActor, world))
            }
            consumables={consumables}
            partyTargets={activeParty.map((member) => ({ id: member.id, name: member.name }))}
            t={t}
            onQueueAttack={onQueueAttack}
            onQueueSpell={onQueueSpell}
            onQueueDefend={onQueueDefend}
            onQueueItem={onQueueItem}
            onUndo={onUndo}
            onTargetPreview={onSelectTarget}
          />
        ) : null}
        {!isTempoRunning && ordersReady && confirmRound && !playingBack && (
          <div
            className="combat-command-menu combat-confirm"
            data-testid="combat-confirm-round"
            data-controller-active="true"
            data-controller-surface="combat-menu"
            onKeyDown={(event) => {
              const key = event.key.toLowerCase();
              if (key === "escape" || key === "backspace" || key === "a") {
                event.preventDefault();
                onUndo();
              }
            }}
          >
            <p className="combat-command-menu-head">{t("play.confirmRoundPrompt")}</p>
            <button
              type="button"
              className="combat-confirm-button"
              data-testid="combat-confirm-execute"
              ref={(node) => node?.focus()}
              onClick={onExecuteRound}
            >
              {t("play.executeRound")}
              <kbd className="key-hint">Enter</kbd>
            </button>
            <p className="combat-command-menu-hint">{t("play.confirmRoundHint")}</p>
          </div>
        )}
      </div>
      <CombatCommandDock
        t={t}
        isTempoRunning={isTempoRunning}
        onToggleTempo={onToggleTempo}
        onAllOut={onAllOut}
        canAllOut={canAllOut}
        onRepeatRound={onRepeatRound}
        canRepeat={canRepeat}
        onRetreat={onRetreat}
        debugMode={debugMode}
        onForceVictory={onForceVictory}
        onReviveParty={onReviveParty}
      />
    </>
  );
}

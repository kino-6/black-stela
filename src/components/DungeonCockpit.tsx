import type { ReactNode } from "react";
import type { Command, GameState, ScenarioWorld } from "../domain/types";
import type { Locale, Translator } from "../i18n";
import { getEffectiveCharacterStats } from "../domain/economy";
import { formatCharacterSummary } from "../ui/catalog";
import { renderPortraitContent } from "../ui/portrait";
import { DungeonView } from "./DungeonView";
import { MapPanel } from "./MapPanel";
import { DungeonCommandDock } from "./DungeonCommandDock";

interface DungeonCockpitProps {
  state: GameState;
  world: ScenarioWorld;
  locale: Locale;
  t: Translator;
  debugMode: boolean;
  roomDescription?: string;
  message: string;
  tempo: ReactNode;
  run: (command: Command) => void;
  isTempoRunning: boolean;
  onToggleTempo: () => void;
  onOpenPartyMenu: () => void;
  onOpenFullMap: () => void;
  onAutoExplore: () => void;
  canUseStairs: boolean;
  blockingStairGate: boolean;
  stairGateClue: string | null;
  onUseStairs: () => void;
  canReturnToTown: boolean;
  returnViaStairs: boolean;
  onReturnToTown: () => void;
  showEscapeItem: boolean;
  onUseEscapeItem: () => void;
}

// The dungeon half of the adventure cockpit: first-person view + map/party rail, the
// room copy, and the movement dock. Split out of App.tsx, where it was interleaved with
// the combat half through four separate `phase === "combat" ? … : …` ternaries.
export function DungeonCockpit({
  state,
  world,
  locale,
  t,
  debugMode,
  roomDescription,
  message,
  tempo,
  run,
  isTempoRunning,
  onToggleTempo,
  onOpenPartyMenu,
  onOpenFullMap,
  onAutoExplore,
  canUseStairs,
  blockingStairGate,
  stairGateClue,
  onUseStairs,
  canReturnToTown,
  returnViaStairs,
  onReturnToTown,
  showEscapeItem,
  onUseEscapeItem
}: DungeonCockpitProps) {
  return (
    <>
      <div className="cockpit-scene">
        <DungeonView state={state} world={world} label={t("play.dungeonView")} />
      </div>
      <aside className="cockpit-rail" aria-label={t("play.partyStatus")}>
        <div className="navigation-board" aria-label={t("map.heading")}>
          <MapPanel state={state} world={world} locale={locale} t={t} debugMode={debugMode} />
        </div>
        <div className="party-hud" data-testid="party-hud" aria-label={t("play.partyStatus")}>
          {(["front", "back"] as const).map((row) => (
            <div className="party-row-strip" data-testid={`party-${row}-row`} key={row}>
              <span>{row === "front" ? t("play.frontRow") : t("play.backRow")}</span>
              <div className="party-row-slots">
                {state.party
                  .filter((member) => member.row === row)
                  .map((member) => {
                    const stats = getEffectiveCharacterStats(member, world);
                    const down = member.injury || member.hp <= 0;
                    const danger = member.hp <= Math.ceil(member.maxHp * 0.35);
                    return (
                      <div
                        className={`party-token ${member.row} ${down ? "down" : danger ? "danger" : ""}`}
                        data-testid="party-token"
                        key={member.id}
                        style={{ borderColor: member.accentColor }}
                      >
                        <div className="party-token-portrait" style={{ borderColor: member.accentColor }}>
                          {renderPortraitContent({
                            portraitRef: member.portraitRef,
                            backgroundId: member.backgroundId,
                            fallback: member.name,
                            alt: member.name,
                            testId: "party-hud-portrait"
                          })}
                        </div>
                        <div className="party-token-body">
                          <div className="party-token-heading">
                            <strong>{member.name}</strong>
                            <small>{formatCharacterSummary(member, locale, t, { includeRow: false })}</small>
                            {member.status && member.status.filter((status) => status !== "ward").length > 0 && (
                              <small className="party-token-status">
                                {member.status.filter((status) => status !== "ward").join(" · ")}
                              </small>
                            )}
                          </div>
                          <div className="party-token-stats" aria-label={t("play.memberStatus")}>
                            <span>Lv {member.level}</span>
                            <span>
                              HP {member.hp}/{stats.maxHp}
                            </span>
                            {stats.maxMp > 0 && (
                              <span>
                                {t("play.mpShort")} {member.mp}/{stats.maxMp}
                              </span>
                            )}
                            <span className="party-token-detail">
                              {t("party.damage")} {stats.damageMin}-{stats.damageMax}
                            </span>
                            <span className="party-token-detail">
                              {t("party.armor")} {stats.armor}
                            </span>
                            <span className="party-token-detail">
                              {t("party.speed")} {stats.speed}
                            </span>
                          </div>
                          <div className="party-token-gauges">
                            <div
                              className={`stat-gauge hp-gauge${danger ? " danger" : ""}`}
                              role="meter"
                              aria-valuenow={member.hp}
                              aria-valuemax={member.maxHp}
                              aria-label={`${member.name} HP`}
                            >
                              <span
                                className="stat-gauge-fill"
                                style={{ width: `${Math.max(0, (member.hp / member.maxHp) * 100)}%` }}
                              />
                            </div>
                            {member.maxMp > 0 && (
                              <div
                                className="stat-gauge mp-gauge"
                                data-testid="party-mp-gauge"
                                role="meter"
                                aria-valuenow={member.mp}
                                aria-valuemax={member.maxMp}
                                aria-label={`${member.name} MP`}
                              >
                                <span
                                  className="stat-gauge-fill"
                                  style={{ width: `${Math.max(0, (member.mp / member.maxMp) * 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="cockpit-message">
        <p className="room-copy">{roomDescription}</p>
        <p className="event-window" aria-live="polite">
          {message}
        </p>
      </div>
      {tempo}
      <DungeonCommandDock
        t={t}
        onCommand={run}
        isTempoRunning={isTempoRunning}
        onToggleTempo={onToggleTempo}
        onOpenPartyMenu={onOpenPartyMenu}
        onOpenFullMap={onOpenFullMap}
        debugMode={debugMode}
        onAutoExplore={onAutoExplore}
        canUseStairs={canUseStairs}
        blockingStairGate={blockingStairGate}
        stairGateClue={stairGateClue}
        onUseStairs={onUseStairs}
        canReturnToTown={canReturnToTown}
        returnViaStairs={returnViaStairs}
        onReturnToTown={onReturnToTown}
        showEscapeItem={showEscapeItem}
        onUseEscapeItem={onUseEscapeItem}
      />
    </>
  );
}

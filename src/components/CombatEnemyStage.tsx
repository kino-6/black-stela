import type { ReactNode } from "react";
import type { CombatBeat, CombatEnemyGroup } from "../domain/types";
import type { Locale, Translator } from "../i18n";
import { localizedEnemyGroupName } from "../ui/catalog";
import type { EnemyAnchor } from "./dungeonScene";

interface CombatEnemyStageProps {
  backdrop: ReactNode;
  groups: CombatEnemyGroup[];
  /** Where each group's figures stand in the backdrop, in % of the stage box. */
  anchors: EnemyAnchor[];
  selectedTargetId?: string;
  targetingActive: boolean;
  activeBeat: CombatBeat | null;
  beatKey?: number;
  locale: Locale;
  t: Translator;
  caption: string;
}

// Zone 1 of the three-zone combat layout (see .claude/skills/combat-ui-drpg): the enemies
// ARE the screen.
//
// The enemies used to be drawn twice — as sprites inside the 3D view, and AGAIN as a row
// of DOM cards below it carrying the name, an HP bar and "2 left · unhurt". Two
// representations of one thing, and the cards resized with their contents, so the whole
// screen jittered every round. A group of three was also one sprite with a "×3" on a card.
//
// Now the creatures are the only representation: the renderer draws one figure per enemy
// and reports where each group's feet land, and this plants a slim name + HP bar AT those
// feet. Nothing here is in the layout flow — the overlay is absolutely positioned inside a
// fixed-size stage — so the screen cannot reflow no matter what the fight does.
export function CombatEnemyStage({
  backdrop,
  groups,
  anchors,
  selectedTargetId,
  targetingActive,
  activeBeat,
  beatKey,
  locale,
  t,
  caption
}: CombatEnemyStageProps) {
  const anchorFor = (groupId: string) => anchors.find((anchor) => anchor.groupId === groupId);

  return (
    <div className="enemy-stage">
      <div className="enemy-stage-backdrop">{backdrop}</div>
      <div className="enemy-stage-figures" role="list" aria-label={t("play.enemyGroups")}>
        {groups.map((group) => {
          const anchor = anchorFor(group.id);
          const selected = targetingActive && group.id === selectedTargetId;
          const hit = activeBeat?.targetGroupId === group.id;
          const dead = group.count === 0;
          const hpPct = group.maxHpEach > 0 ? Math.max(0, (group.hpEach / group.maxHpEach) * 100) : 0;
          const name = localizedEnemyGroupName(group, locale);
          return (
            <div
              key={group.id}
              role="listitem"
              data-testid="combat-enemy-group"
              aria-current={selected ? "true" : undefined}
              aria-label={`${name} · ${group.count}`}
              className={`enemy-mark${selected ? " selected" : ""}${hit ? " beat-hit" : ""}${dead ? " defeated" : ""}`}
              // Anchored to the creatures' feet. Until the scene reports (first frame, or a
              // headless test with no WebGL) they fall back to a sane spread so the labels
              // are never stranded off-screen.
              style={{
                left: `${anchor?.xPct ?? 50}%`,
                top: `${anchor?.yPct ?? 72}%`
              }}
            >
              {hit && (
                <>
                  <span className="fx-flash" key={`f${beatKey}`} aria-hidden="true" />
                  <span className={`fx-slash${activeBeat?.crit ? " crit" : ""}`} key={`s${beatKey}`} aria-hidden="true" />
                </>
              )}
              {hit && activeBeat?.damage != null && (
                <span className={`hit-number${activeBeat?.crit ? " crit" : ""}`} key={beatKey} data-testid="hit-number">
                  -{activeBeat.damage}
                </span>
              )}
              <div
                className="enemy-hp"
                role="meter"
                aria-valuenow={group.hpEach}
                aria-valuemax={group.maxHpEach}
                aria-label={`${name} HP`}
              >
                <span className="enemy-hp-fill" style={{ width: `${hpPct}%` }} />
              </div>
              <span className="enemy-mark-name">{name}</span>
            </div>
          );
        })}
      </div>
      <p className="stage-caption">{caption}</p>
    </div>
  );
}

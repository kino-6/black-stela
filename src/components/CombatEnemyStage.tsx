import type { ReactNode } from "react";
import type { CombatBeat, CombatEnemyGroup } from "../domain/types";
import type { Locale, Translator } from "../i18n";
import { localizedEnemyGroupName } from "../ui/catalog";
import { enemyGroupHealthPercent } from "../ui/enemyGroupPresentation";
import type { EnemyAnchor } from "./dungeonScene";

interface CombatEnemyStageProps {
  backdrop: ReactNode;
  groups: CombatEnemyGroup[];
  /** Where each group's figures stand in the backdrop, in % of the stage box. */
  anchors: EnemyAnchor[];
  selectedTargetId?: string;
  targetingActive: boolean;
  /** Pick this group as the attack target by pointing at it on the stage (not a text list). */
  onSelectTarget?: (groupId: string) => void;
  activeBeat: CombatBeat | null;
  beatKey?: number;
  /** Current per-beat interval (ms). Stage FX scale to it so each blow's animation finishes inside
   *  its beat and stays in step with the log, instead of a fixed ~0.7s that lags at 2x. */
  beatMs?: number;
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
  onSelectTarget,
  activeBeat,
  beatKey,
  beatMs,
  locale,
  t,
  caption
}: CombatEnemyStageProps) {
  const anchorFor = (groupId: string) => anchors.find((anchor) => anchor.groupId === groupId);
  // Cap the hit-FX at ~85% of a beat so it plays fully and clears before the next blow lands — in
  // step with the log, which advances once per beat. Fixed to a readable floor for the interactive view.
  const fxMs = Math.max(140, Math.round((beatMs ?? 430) * 0.85));

  return (
    <div className="enemy-stage" style={{ ["--fx-ms" as string]: `${fxMs}ms` }}>
      <div className="enemy-stage-backdrop">{backdrop}</div>
      <div className="enemy-stage-figures" role="list" aria-label={t("play.enemyGroups")}>
        {groups.map((group) => {
          const anchor = anchorFor(group.id);
          const selected = targetingActive && group.id === selectedTargetId;
          const hit = activeBeat?.targetGroupId === group.id;
          const dead = group.count === 0;
          const targetable = targetingActive && !dead && Boolean(onSelectTarget);
          const hpPct = enemyGroupHealthPercent(group);
          const name = localizedEnemyGroupName(group, locale);
          return (
            <div
              key={group.id}
              role="listitem"
              data-testid="combat-enemy-group"
              aria-current={selected ? "true" : undefined}
              aria-label={`${name} · ${group.count}`}
              data-enemy-group-id={group.id}
              data-health-percent={hpPct.toFixed(3)}
              data-enemy-count={group.count}
              className={`enemy-mark${selected ? " selected" : ""}${targetable ? " targetable" : ""}${hit ? " beat-hit" : ""}${dead ? " defeated" : ""}`}
              // Anchored to the creatures' feet. Until the scene reports (first frame, or a
              // headless test with no WebGL) they fall back to a sane spread so the labels
              // are never stranded off-screen.
              style={{
                left: `${anchor?.xPct ?? 50}%`,
                top: `${anchor?.yPct ?? 72}%`
              }}
              // Point at the enemy ON THE STAGE to target it — not a business-app list row.
              onPointerDown={targetable ? () => onSelectTarget!(group.id) : undefined}
            >
              {/* Target reticle: a pulsing frame + arrow over the chosen creature, so "this is the
                  one you will strike" reads on the stage itself. */}
              {selected && (
                <span className="enemy-reticle" aria-hidden="true">
                  <span className="enemy-reticle-arrow" />
                </span>
              )}
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
                aria-valuenow={Math.round(hpPct)}
                aria-valuemax={100}
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

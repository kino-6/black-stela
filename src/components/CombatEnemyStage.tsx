import type { ReactNode } from "react";
import type { CombatBeat, CombatEnemyGroup } from "../domain/types";
import type { Locale, Translator } from "../i18n";
import { localizedEnemyGroupName } from "../ui/catalog";
import { formatEnemyGroupStatus } from "../ui/format";

interface CombatEnemyStageProps {
  backdrop: ReactNode;
  groups: CombatEnemyGroup[];
  selectedTargetId?: string;
  targetingActive: boolean;
  activeBeat: CombatBeat | null;
  beatKey?: number;
  locale: Locale;
  t: Translator;
  caption: string;
}

// Zone 1 of the three-zone combat layout (see .claude/skills/combat-ui-drpg): the
// enemies ARE the screen. The 3D view is the backdrop; large enemy figures sit
// centered over it with their own HP bar, the target reticle, and floating damage
// numbers — replacing the old cramped enemy-list rail. Responsive: the figure row
// wraps and scales with the stage.
export function CombatEnemyStage({
  backdrop,
  groups,
  selectedTargetId,
  targetingActive,
  activeBeat,
  beatKey,
  locale,
  t,
  caption
}: CombatEnemyStageProps) {
  return (
    <div className="enemy-stage">
      <div className="enemy-stage-backdrop">{backdrop}</div>
      <div className="enemy-stage-figures" role="list" aria-label={t("play.enemyGroups")}>
        {groups.map((group) => {
          const selected = targetingActive && group.id === selectedTargetId;
          const hit = activeBeat?.targetGroupId === group.id;
          const dead = group.count === 0;
          const hpPct = group.maxHpEach > 0 ? Math.max(0, (group.hpEach / group.maxHpEach) * 100) : 0;
          return (
            <div
              key={group.id}
              role="listitem"
              data-testid="combat-enemy-group"
              aria-current={selected ? "true" : undefined}
              className={`enemy-figure${selected ? " selected" : ""}${hit ? " beat-hit" : ""}${dead ? " defeated" : ""}`}
            >
              <span className="enemy-figure-name">
                {localizedEnemyGroupName(group, locale)}
                {group.count > 1 && <span className="enemy-figure-count"> ×{group.count}</span>}
              </span>
              <div
                className="enemy-hp"
                role="meter"
                aria-valuenow={group.hpEach}
                aria-valuemax={group.maxHpEach}
                aria-label={`${localizedEnemyGroupName(group, locale)} HP`}
              >
                <span className="enemy-hp-fill" style={{ width: `${hpPct}%` }} />
              </div>
              <span className="enemy-figure-status">{formatEnemyGroupStatus(group, t)}</span>
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
            </div>
          );
        })}
      </div>
      <p className="stage-caption">{caption}</p>
    </div>
  );
}

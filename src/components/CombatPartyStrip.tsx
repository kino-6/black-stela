import type { CombatBeat, Character } from "../domain/types";
import type { Translator } from "../i18n";

interface CombatPartyStripProps {
  members: Character[];
  selectedActorId?: string;
  orderedActorIds: Set<string>;
  activeBeat: CombatBeat | null;
  beatKey?: number;
  t: Translator;
}

// Zone 2 of the three-zone combat layout (see .claude/skills/combat-ui-drpg): the
// six-member party collapses from big cards into ONE thin, responsive strip —
// front group, a divider, then back group. Each token stays compact (name, HP/気力
// bars, an order pip, hit flash), and the strip wraps gracefully at narrow widths.
export function CombatPartyStrip({ members, selectedActorId, orderedActorIds, activeBeat, beatKey, t }: CombatPartyStripProps) {
  const rows = ["front", "back"] as const;
  return (
    <div className="party-strip" data-testid="party-strip" role="list" aria-label={t("play.partyFormation")}>
      {rows.map((row, index) => (
        <div className="party-strip-group" data-row={row} data-testid={`combat-${row}-row`} key={row}>
          {index === 1 && <span className="party-strip-divider" aria-hidden="true" />}
          {members
            .filter((member) => member.row === row)
            .map((member) => {
              const active = member.id === selectedActorId;
              const ordered = orderedActorIds.has(member.id);
              const hit = activeBeat?.targetCharacterId === member.id;
              const down = member.injury || member.hp <= 0;
              const danger = member.hp <= Math.ceil(member.maxHp * 0.35);
              return (
                <div
                  key={member.id}
                  role="listitem"
                  data-testid="combat-actor"
                  aria-current={active ? "step" : undefined}
                  className={`party-token-combat${active ? " active" : ""}${ordered ? " ordered" : ""}${hit ? " beat-hit" : ""}${down ? " down" : ""}`}
                >
                  <span className="pt-head">
                    <span className="pt-name">{member.name}</span>
                    <span className="pt-pip" aria-hidden="true">{ordered ? "⚔" : active ? "▶" : ""}</span>
                  </span>
                  <div
                    className={`stat-gauge hp-gauge${danger ? " danger" : ""}`}
                    data-testid="combat-hp-gauge"
                    role="meter"
                    aria-valuenow={member.hp}
                    aria-valuemax={member.maxHp}
                    aria-label={`${member.name} HP`}
                  >
                    <span className="stat-gauge-fill" style={{ width: `${Math.max(0, (member.hp / member.maxHp) * 100)}%` }} />
                  </div>
                  {member.maxMp > 0 && (
                    <div
                      className="stat-gauge mp-gauge"
                      data-testid="combat-mp-gauge"
                      role="meter"
                      aria-valuenow={member.mp}
                      aria-valuemax={member.maxMp}
                      aria-label={`${member.name} MP`}
                    >
                      <span className="stat-gauge-fill" style={{ width: `${Math.max(0, (member.mp / member.maxMp) * 100)}%` }} />
                    </div>
                  )}
                  <span className="pt-hp-text">
                    {member.hp}/{member.maxHp}
                    {member.maxMp > 0 && <> · {t("play.mpShort")} {member.mp}</>}
                  </span>
                  {hit && activeBeat?.damage != null && (
                    <span className="hit-number" key={beatKey}>-{activeBeat.damage}</span>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}

import { useEffect, useRef } from "react";
import { GraduationCap } from "lucide-react";
import type { Character, Command, GameEvent, ScenarioWorld } from "../domain/types";
import { SPELLS, type SpellId } from "../domain/spells";
import {
  LOADOUT_LIMIT,
  MASTERED_RANK,
  canAdoptVocation,
  isMastered,
  localizedVocationName,
  masteryRank,
  resolveVocationCatalog,
  resolveVocationState
} from "../domain/vocations";
import type { Locale, Translator } from "../i18n";

const SPELL_LABEL_KEY: Record<SpellId, "play.spellHeal" | "play.spellFirebolt" | "play.spellSleep" | "play.skillPowerStrike"> = {
  heal: "play.spellHeal",
  firebolt: "play.spellFirebolt",
  sleep: "play.spellSleep",
  "power-strike": "play.skillPowerStrike"
};

function techniqueName(id: string, t: Translator): string {
  return id in SPELLS ? t(SPELL_LABEL_KEY[id as SpellId]) : id;
}

interface CareerPanelProps {
  t: Translator;
  locale: Locale;
  world: ScenarioWorld;
  party: Character[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
  latestLogText: string;
  latestEventType: GameEvent["type"] | null;
  onCommand: (command: Command) => void;
  onClose: () => void;
}

// IMP-021C — the town CAREER service. An adventurer's build is the vocations they have mastered:
// this shows the current vocation and its mastery, the vocations they can move into (with the
// prerequisites visible BEFORE committing), the techniques they have learned, and the bounded combat
// loadout. Controller-first; changing vocation never resets level (see docs/design/vocation-mastery.md).
export function CareerPanel({
  t,
  locale,
  world,
  party,
  selectedMemberId,
  onSelectMember,
  latestLogText,
  latestEventType,
  onCommand,
  onClose
}: CareerPanelProps) {
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstActionRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const member = party.find((candidate) => candidate.id === selectedMemberId) ?? party[0];
  if (!member) {
    return null;
  }
  const state = resolveVocationState(member);
  const catalog = resolveVocationCatalog(world);
  const currentName = localizedVocationName(world, state.current, locale);

  const requirementText = (requires: { mastered?: string[]; minLevel?: number } | undefined): string => {
    const parts: string[] = [];
    for (const req of requires?.mastered ?? []) {
      parts.push(t("career.reqMastered", { vocation: localizedVocationName(world, req, locale) }));
    }
    if (requires?.minLevel) parts.push(t("career.reqLevel", { level: requires.minLevel }));
    return parts.join(" · ");
  };

  let firstAssigned = false;
  const claimFirst = () => {
    if (firstAssigned) return undefined;
    firstAssigned = true;
    return firstActionRef;
  };

  return (
    <section
      className="town-service career-service"
      aria-labelledby="career-heading"
      data-testid="career-panel"
      data-controller-active="true"
      data-controller-surface="town-career"
    >
      <div className="service-counter">
        <div className="service-counter-head">
          <h3 id="career-heading">
            <GraduationCap size={18} aria-hidden="true" /> {t("career.title")}
          </h3>
        </div>
        <p className="service-intro">{t("career.intro")}</p>

        {latestLogText && latestEventType === "vocation_changed" && (
          <p className="event-window" aria-live="polite">
            {latestLogText}
          </p>
        )}

        {/* Which adventurer's career we are looking at. */}
        <div className="career-member-select" role="tablist" aria-label={t("career.member")}>
          {party.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              role="tab"
              aria-selected={candidate.id === member.id}
              className={candidate.id === member.id ? "selected" : undefined}
              data-testid={`career-member-${candidate.id}`}
              onClick={() => onSelectMember(candidate.id)}
            >
              {candidate.name}
            </button>
          ))}
        </div>

        <dl className="career-current">
          <div>
            <dt>{t("career.current")}</dt>
            <dd data-testid="career-current-vocation">{currentName}</dd>
          </div>
          <div>
            <dt>{t("career.mastery")}</dt>
            <dd>
              {isMastered(state, state.current)
                ? t("career.mastered")
                : t("career.masteryRank", { rank: masteryRank(state, state.current), max: MASTERED_RANK })}
            </dd>
          </div>
        </dl>

        {/* Vocations to move into: current, available (with a Become button), or locked (needs …). */}
        <ul className="career-vocations" data-testid="career-vocations">
          {catalog.map((vocation) => {
            const isCurrent = vocation.id === state.current;
            const available = !isCurrent && canAdoptVocation(member, vocation.id, world);
            const rank = masteryRank(state, vocation.id);
            return (
              <li className={`career-vocation career-${vocation.tier}${isCurrent ? " current" : ""}`} key={vocation.id} data-testid={`career-vocation-${vocation.id}`}>
                <div className="career-vocation-head">
                  <span className={`quest-kind quest-kind-${vocation.tier === "advanced" ? "bounty" : "delivery"}`}>
                    {vocation.tier === "advanced" ? t("career.advanced") : t("career.basic")}
                  </span>
                  <strong>{localizedVocationName(world, vocation.id, locale)}</strong>
                  {rank > 0 && (
                    <span className="career-rank">
                      {isMastered(state, vocation.id) ? t("career.mastered") : t("career.masteryRank", { rank, max: MASTERED_RANK })}
                    </span>
                  )}
                </div>
                {vocation.requires && !isCurrent && (
                  <p className="career-requires">{t("career.requires", { requirements: requirementText(vocation.requires) })}</p>
                )}
                <div className="career-vocation-actions">
                  {isCurrent ? (
                    <span className="career-current-tag">{t("career.current")}</span>
                  ) : available ? (
                    <button
                      type="button"
                      className="primary-action"
                      ref={claimFirst()}
                      data-testid={`career-adopt-${vocation.id}`}
                      onClick={() => onCommand({ type: "change_vocation", characterId: member.id, vocationId: vocation.id })}
                    >
                      {t("career.changeTo", { vocation: localizedVocationName(world, vocation.id, locale) })}
                    </button>
                  ) : (
                    <span className="career-locked">{t("career.locked")}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Learned techniques and the bounded combat loadout. */}
        <div className="career-techniques" data-testid="career-techniques">
          <h4>{t("career.loadout", { count: state.loadout.length, max: LOADOUT_LIMIT })}</h4>
          {state.learned.length === 0 ? (
            <p className="service-empty">{t("career.noTechniques")}</p>
          ) : (
            <ul className="career-technique-list">
              {state.learned.map((technique) => {
                const inLoadout = state.loadout.includes(technique);
                const full = state.loadout.length >= LOADOUT_LIMIT;
                return (
                  <li className={`career-technique${inLoadout ? " in-loadout" : ""}`} key={technique} data-testid={`career-technique-${technique}`}>
                    <span>{techniqueName(technique, t)}</span>
                    <button
                      type="button"
                      ref={claimFirst()}
                      disabled={!inLoadout && full}
                      data-testid={`career-loadout-${technique}`}
                      onClick={() =>
                        onCommand({
                          type: "set_loadout",
                          characterId: member.id,
                          loadout: inLoadout
                            ? state.loadout.filter((id) => id !== technique)
                            : [...state.loadout, technique]
                        })
                      }
                    >
                      {inLoadout ? t("career.removeFromLoadout") : full ? t("career.loadoutFull") : t("career.addToLoadout")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="service-actions">
          <button type="button" data-controller-cancel="true" data-testid="career-back" ref={claimFirst()} onClick={onClose}>
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}

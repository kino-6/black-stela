import { useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import type { Character, Command, EquipmentSlot, GameEvent, ScenarioWorld } from "../domain/types";
import { SPELLS, type SpellId } from "../domain/spells";
import {
  MASTERED_RANK,
  canAdoptVocation,
  isMastered,
  localizedVocationName,
  localizedVocationSignature,
  masteryRank,
  resolveVocationCatalog,
  resolveVocationState
} from "../domain/vocations";
import type { Locale, Translator } from "../i18n";
import { SPELL_LABEL as SPELL_LABEL_KEY } from "../domain/combatBeatText";


function techniqueName(id: string, t: Translator): string {
  return id in SPELLS ? t(SPELL_LABEL_KEY[id as SpellId]) : id;
}

// The stat modifiers a vocation can shift, in the order a player reads them.
const STAT_ORDER = ["maxHp", "maxMp", "attack", "damageMin", "damageMax", "accuracy", "armor", "speed"] as const;

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

// IMP-021C / SFC reclass flow — the town CAREER service (転職). An adventurer's build is the vocations
// they have mastered. The left pane is who they are now (current vocation, mastery, learned techniques +
// the bounded combat loadout). The right pane is the DQ3-Dharma idiom: a lean NAME list of 就ける道, and
// when one is chosen it becomes that calling's 変化プレビュー + 確定 — one path's full sheet at a time, so
// the player reads a decision, not a wall of cards. Controller-first; a reclass never resets level
// (docs/design/vocation-mastery.md).
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
  // Which destination is being previewed (null = the list). Reset whenever the adventurer changes.
  const [previewId, setPreviewId] = useState<string | null>(null);
  useEffect(() => {
    setPreviewId(null);
  }, [selectedMemberId]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstActionRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [selectedMemberId, previewId]);

  const member = party.find((candidate) => candidate.id === selectedMemberId) ?? party[0];
  if (!member) {
    return null;
  }
  const state = resolveVocationState(member, world);
  const catalog = resolveVocationCatalog(world);
  const currentName = localizedVocationName(world, state.current, locale);

  const requirementText = (requires: { mastered?: string[]; minLevel?: number } | undefined): string => {
    const parts: string[] = [];
    for (const req of requires?.mastered ?? []) {
      parts.push(t("career.reqMastered", { vocation: localizedVocationName(world, req, locale) }));
    }
    if (requires?.minLevel) parts.push(t("career.reqLevel", { level: requires.minLevel }));
    if (parts.length === 0) return "";
    // Wrap the requirement list in the "Needs: {requirements}" copy — the SFC rewrite rendered the bare
    // list and dropped the label, so a locked path read "Warrior mastered · …" with no cue it was a
    // requirement (e2e career.spec expects "Needs"; caught only when the full gate ran, 2026-07-31).
    return t("career.requires", { requirements: parts.join(" · ") });
  };

  const statShifts = (mods: (typeof catalog)[number]["statModifiers"]) =>
    STAT_ORDER.filter((key) => mods?.[key]).map((key) => ({ key, value: mods![key]! }));

  const advanced = catalog.filter((vocation) => vocation.tier === "advanced");
  const basic = catalog.filter((vocation) => vocation.tier === "basic");

  // Controller focus should land on the first real CHOICE — the first path they can take now.
  const firstAdoptId = catalog.find((vocation) => vocation.id !== state.current && canAdoptVocation(member, vocation.id, world))?.id;
  const previewVocation = previewId ? catalog.find((vocation) => vocation.id === previewId) ?? null : null;

  // --- list mode: one lean NAME row per calling -----------------------------------------------------
  const renderVocationRow = (vocation: (typeof catalog)[number]) => {
    const isCurrent = vocation.id === state.current;
    const available = !isCurrent && canAdoptVocation(member, vocation.id, world);
    const rank = masteryRank(state, vocation.id);
    const name = localizedVocationName(world, vocation.id, locale);
    const badge =
      rank > 0 ? (isMastered(state, vocation.id) ? t("career.mastered") : t("career.masteryRank", { rank, max: MASTERED_RANK })) : null;
    return (
      <li className={`career-vocation career-${vocation.tier}${isCurrent ? " current" : ""}${available ? " available" : ""}`} key={vocation.id} data-testid={`career-vocation-${vocation.id}`}>
        {isCurrent ? (
          <span className="career-row-current">
            {name} <span className="career-current-tag">（{t("career.current")}）</span>
          </span>
        ) : available ? (
          // The row IS the choice: it opens this calling's preview+confirm, it never reclasses in one press.
          <button
            type="button"
            className="career-row-button"
            ref={vocation.id === firstAdoptId ? firstActionRef : undefined}
            data-testid={`career-adopt-${vocation.id}`}
            onClick={() => setPreviewId(vocation.id)}
          >
            <strong>{name}</strong>
            {badge && <span className="career-rank">{badge}</span>}
          </button>
        ) : (
          <span className="career-row-locked">
            <strong>{name}</strong>
            <span className="career-locked">{t("career.locked")}</span>
            <span className="career-requires">{requirementText(vocation.requires)}</span>
          </span>
        )}
      </li>
    );
  };

  // --- preview mode: one calling's full sheet + the confirm -----------------------------------------
  const renderPreview = (vocation: (typeof catalog)[number]) => {
    const name = localizedVocationName(world, vocation.id, locale);
    const signature = localizedVocationSignature(world, vocation.id, locale);
    const shifts = statShifts(vocation.statModifiers);
    const rank = masteryRank(state, vocation.id);
    return (
      <div className="career-preview" data-testid="career-preview">
        <div className="career-vocation-head">
          <span className={`quest-kind quest-kind-${vocation.tier === "advanced" ? "bounty" : "delivery"}`}>
            {vocation.tier === "advanced" ? t("career.advanced") : t("career.basic")}
          </span>
          <strong>{name}</strong>
          {rank > 0 && (
            <span className="career-rank">
              {isMastered(state, vocation.id) ? t("career.mastered") : t("career.masteryRank", { rank, max: MASTERED_RANK })}
            </span>
          )}
        </div>

        <p className="career-transition">
          {t("career.current")}: {currentName} → {name}
        </p>
        {signature && <p className="career-signature">{signature}</p>}

        <dl className="career-vocation-facts">
          <div className="career-fact career-fact-shifts">
            <dt>{t("career.shifts")}</dt>
            <dd>
              {shifts.length === 0 ? (
                <span className="career-fact-none">{t("career.noShifts")}</span>
              ) : (
                shifts.map(({ key, value }) => (
                  <span key={key} className={`career-shift ${value > 0 ? "up" : "down"}`}>
                    {t(`career.stat.${key}` as Parameters<typeof t>[0])} {value > 0 ? `+${value}` : value}
                  </span>
                ))
              )}
            </dd>
          </div>
          {vocation.allowedSlots && vocation.allowedSlots.length > 0 && (
            <div className="career-fact">
              <dt>{t("career.equips")}</dt>
              <dd>
                {vocation.allowedSlots.map((slot: EquipmentSlot) => (
                  <span key={slot} className="career-slot">{t(`career.slot.${slot}` as Parameters<typeof t>[0])}</span>
                ))}
              </dd>
            </div>
          )}
          {vocation.grantsTechniques && vocation.grantsTechniques.length > 0 && (
            <div className="career-fact">
              <dt>{t("career.grants")}</dt>
              <dd>
                {vocation.grantsTechniques.map((technique) => (
                  <span key={technique} className="career-grant">{techniqueName(technique, t)}</span>
                ))}
              </dd>
            </div>
          )}
        </dl>

        {/* What the reclass KEEPS — the DQ3 "will I lose everything?" fear, answered before the confirm. */}
        <p className="career-keeps">{t("career.intro")}</p>

        <p className="career-confirm-prompt">{t("career.reclassPrompt", { vocation: name })}</p>
        <div className="career-preview-actions">
          <button
            type="button"
            className="primary-action"
            ref={firstActionRef}
            data-testid={`career-adopt-${vocation.id}`}
            onClick={() => {
              onCommand({ type: "change_vocation", characterId: member.id, vocationId: vocation.id });
              setPreviewId(null);
            }}
          >
            {t("career.doReclass")}
          </button>
          <button type="button" data-testid="career-preview-back" onClick={() => setPreviewId(null)}>
            {t("career.back")}
          </button>
        </div>
      </div>
    );
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

        <div className="career-body">
          {/* Left: who this adventurer is now + the combat-set editor for the CURRENT calling. */}
          <div className="career-overview">
            <h4 className="career-pane-title">{t("career.overview")}</h4>
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

            {/* Learned techniques and the bounded combat loadout. */}
            <div className="career-techniques" data-testid="career-techniques">
              <h5>{t("career.loadout", { count: state.loadout.length })}</h5>
              {state.learned.length === 0 ? (
                <p className="service-empty">{t("career.noTechniques")}</p>
              ) : (
                <ul className="career-technique-list">
                  {state.learned.map((technique) => {
                    const inLoadout = state.loadout.includes(technique);
                    return (
                      <li className={`career-technique${inLoadout ? " in-loadout" : ""}`} key={technique} data-testid={`career-technique-${technique}`}>
                        <span>{techniqueName(technique, t)}</span>
                        <button
                          type="button"
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
                          {inLoadout ? t("career.removeFromLoadout") : t("career.addToLoadout")}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right: 就ける道 — a lean NAME list; choosing one swaps this pane for its preview + confirm. */}
          <div className="career-destinations">
            {previewVocation ? (
              renderPreview(previewVocation)
            ) : (
              <>
                <h4 className="career-pane-title">{t("career.destinations")}</h4>
                <p className="career-pick-hint">{t("career.pickPath")}</p>
                {advanced.length > 0 && (
                  <>
                    <h5 className="career-group-title">{t("career.advancedGroup")}</h5>
                    <ul className="career-vocations" data-testid="career-vocations-advanced">
                      {advanced.map(renderVocationRow)}
                    </ul>
                  </>
                )}
                <h5 className="career-group-title">{t("career.basicGroup")}</h5>
                <ul className="career-vocations" data-testid="career-vocations-basic">
                  {basic.map(renderVocationRow)}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="service-actions">
          <button
            type="button"
            data-controller-cancel="true"
            data-testid="career-back"
            ref={firstAdoptId && !previewVocation ? undefined : firstActionRef}
            onClick={onClose}
          >
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}

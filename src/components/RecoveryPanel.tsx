import { useEffect, useRef } from "react";
import type { Character, GameEvent } from "../domain/types";
import { getMemberRecoveryCost, isRecoveryEventType } from "../ui/format";
import type { Translator } from "../i18n";

interface RecoveryPanelProps {
  t: Translator;
  party: Character[];
  partyGold: number;
  recoveryCost: number;
  latestLogText: string;
  latestEventType: GameEvent["type"] | null;
  injuredCount: number;
  onRecover: () => void;
  onClose: () => void;
}

// The town recovery service, as a SERVICE — a counter you stand at, not a web form.
//
// IMP-014: it used to be a large empty field, then six plain cards spread edge to edge (five of
// them saying "No treatment."), then an oversized full-width submit. The healthy members were
// taking up most of the screen to tell you nothing, and the one number that matters — what this
// will cost — was a footnote.
//
// What a player needs here is small: who is hurt, what they will be brought back to, what each
// one costs, what the lot costs, whether they can afford it, and yes or no. That is this window.
export function RecoveryPanel({
  t,
  party,
  partyGold,
  recoveryCost,
  latestLogText,
  latestEventType,
  injuredCount,
  onRecover,
  onClose
}: RecoveryPanelProps) {
  const wounded = party
    .map((member) => ({ member, cost: getMemberRecoveryCost(member) }))
    .filter((entry) => entry.cost > 0);
  const affordable = partyGold >= recoveryCost;
  const canTreat = recoveryCost > 0 && affordable;

  // The cursor starts on the command the player came here to give.
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => confirmRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [canTreat]);

  return (
    <section
      className="town-service recovery-service"
      aria-labelledby="recovery-heading"
      data-controller-active="true"
      data-controller-surface="town-recovery"
    >
      <div className="service-counter" data-testid="recovery-counter">
        <div className="service-counter-head">
          <h3 id="recovery-heading">{t("town.recoveryHeading")}</h3>
          <strong>{t("town.gold", { gold: partyGold })}</strong>
        </div>

        {latestLogText && latestEventType && isRecoveryEventType(latestEventType) && (
          <p className="event-window" aria-live="polite">
            {latestLogText}
          </p>
        )}

        {wounded.length === 0 ? (
          // Five cards saying "No treatment." is not information. One line is.
          <p className="service-empty" data-testid="recovery-plan">
            {t("town.noRecoveryNeeded")}
          </p>
        ) : (
          <ul className="recovery-plan" data-testid="recovery-plan">
            {wounded.map(({ member, cost }) => (
              <li className="recovery-row injured" key={member.id}>
                <strong>{member.name}</strong>
                <span className="recovery-hp">
                  {member.hp}/{member.maxHp}
                  <span className="recovery-arrow" aria-hidden="true">
                    →
                  </span>
                  {member.maxHp}
                </span>
                <span className="recovery-cost">{t("town.gold", { gold: cost })}</span>
              </li>
            ))}
          </ul>
        )}

        {recoveryCost > 0 && (
          <p className={`service-total${affordable ? "" : " unaffordable"}`} data-testid="recovery-total">
            <span>{t("town.afterRecovery", { count: injuredCount })}</span>
            <strong>{t("town.recoveryCost", { gold: recoveryCost })}</strong>
          </p>
        )}
        {recoveryCost > 0 && !affordable && (
          <p className="service-warning">{t("town.cannotAffordRecovery")}</p>
        )}

        <div className="service-actions">
          <button
            type="button"
            className="primary-action"
            ref={confirmRef}
            data-testid="recovery-confirm"
            disabled={!canTreat}
            onClick={onRecover}
          >
            {t("town.recoverParty")}
          </button>
          <button type="button" data-controller-cancel="true" data-testid="recovery-cancel" onClick={onClose}>
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}

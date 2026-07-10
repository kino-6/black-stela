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
}

// The town recovery service (extracted verbatim from App's render).
export function RecoveryPanel({
  t,
  party,
  partyGold,
  recoveryCost,
  latestLogText,
  latestEventType,
  injuredCount,
  onRecover
}: RecoveryPanelProps) {
  return (
    <section
      className="town-service"
      aria-labelledby="recovery-heading"
      data-controller-active="true"
      data-controller-surface="town-recovery"
    >
      <h3 id="recovery-heading">{t("town.recoveryHeading")}</h3>
      {latestLogText && latestEventType && isRecoveryEventType(latestEventType) && (
        <p className="event-window" aria-live="polite">{latestLogText}</p>
      )}
      <p className="town-ledger">
        <strong>{t("town.gold", { gold: partyGold })}</strong>
        <span>{t("town.recoveryCost", { gold: recoveryCost })}</span>
      </p>
      <div className="recovery-plan" data-testid="recovery-plan">
        {party.map((member) => {
          const memberCost = getMemberRecoveryCost(member);
          return (
            <article className={memberCost > 0 ? "recovery-row injured" : "recovery-row"} key={member.id}>
              <strong>{member.name}</strong>
              <span>{member.hp}/{member.maxHp}</span>
              <small>
                {memberCost > 0
                  ? t("town.recoveryMemberPlan", { cost: memberCost, after: member.maxHp })
                  : t("town.noTreatmentNeeded")}
              </small>
            </article>
          );
        })}
      </div>
      <p className="town-ledger">
        <span>{recoveryCost > 0 ? t("town.afterRecovery", { count: injuredCount }) : t("town.noRecoveryNeeded")}</span>
        {partyGold < recoveryCost && <strong>{t("town.cannotAffordRecovery")}</strong>}
      </p>
      <button type="button" disabled={recoveryCost <= 0 || partyGold < recoveryCost} onClick={onRecover}>
        {t("town.recoverParty")}
      </button>
    </section>
  );
}

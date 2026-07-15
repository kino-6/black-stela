import { useEffect, useRef } from "react";
import { ClipboardList } from "lucide-react";
import type { Command, GameEvent, ScenarioQuest, ScenarioWorld } from "../domain/types";
import type { QuestBoardEntry, QuestBoardStatus } from "../domain/quests";
import type { Locale, Translator } from "../i18n";

interface QuestBoardPanelProps {
  t: Translator;
  locale: Locale;
  world: ScenarioWorld;
  entries: QuestBoardEntry[];
  latestLogText: string;
  latestEventType: GameEvent["type"] | null;
  onCommand: (command: Command) => void;
  onClose: () => void;
}

const STATUS_KEY: Record<QuestBoardStatus, string> = {
  available: "questBoard.statusAvailable",
  active: "questBoard.statusActive",
  ready: "questBoard.statusReady",
  done: "questBoard.statusDone"
};

// The town quest board — standing bounties and delivery tithes, all authored in
// content/worlds/<id>/quests.md. A player accepts a contract here, then returns to claim its
// reward once the objective is met. Gold means focus (see styles.css), so the cursor lands on the
// first actionable contract, never a decorative highlight.
export function QuestBoardPanel({
  t,
  locale,
  world,
  entries,
  latestLogText,
  latestEventType,
  onCommand,
  onClose
}: QuestBoardPanelProps) {
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstActionRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const questName = (quest: ScenarioQuest) => quest.locales?.[locale]?.name ?? quest.name;
  const questDescription = (quest: ScenarioQuest) => quest.locales?.[locale]?.description ?? quest.description;
  const targetName = (quest: ScenarioQuest) => {
    if (quest.kind === "bounty") {
      const enemy = world.enemies.find((candidate) => candidate.id === quest.targetEnemyId);
      return enemy?.locales?.[locale]?.name ?? enemy?.name ?? quest.targetEnemyId ?? "";
    }
    const item = world.items.find((candidate) => candidate.id === quest.targetItemId);
    return item?.locales?.[locale]?.name ?? item?.name ?? quest.targetItemId ?? "";
  };

  const rewardText = (quest: ScenarioQuest) => {
    const parts: string[] = [];
    if (quest.reward.gold) parts.push(t("questBoard.rewardGold", { gold: quest.reward.gold }));
    if (quest.reward.xp) parts.push(t("questBoard.rewardXp", { xp: quest.reward.xp }));
    if (quest.reward.itemId) {
      const item = world.items.find((candidate) => candidate.id === quest.reward.itemId);
      const name = item?.locales?.[locale]?.name ?? item?.name ?? quest.reward.itemId;
      parts.push(quest.reward.itemQuantity && quest.reward.itemQuantity > 1 ? `${name} ×${quest.reward.itemQuantity}` : name);
    }
    return parts.join(t("questBoard.rewardSeparator"));
  };

  let firstActionAssigned = false;
  const actionRef = () => {
    if (firstActionAssigned) {
      return undefined;
    }
    firstActionAssigned = true;
    return firstActionRef;
  };

  return (
    <section
      className="town-service quest-board-service"
      aria-labelledby="quest-board-heading"
      data-testid="quest-board"
      data-controller-active="true"
      data-controller-surface="town-quests"
    >
      <div className="service-counter">
        <div className="service-counter-head">
          <h3 id="quest-board-heading">
            <ClipboardList size={18} aria-hidden="true" /> {t("questBoard.title")}
          </h3>
        </div>
        <p className="service-intro">{t("questBoard.intro")}</p>

        {latestLogText && latestEventType?.startsWith("quest_") && (
          <p className="event-window" aria-live="polite">
            {latestLogText}
          </p>
        )}

        {entries.length === 0 ? (
          <p className="service-empty" data-testid="quest-board-empty">
            {t("questBoard.empty")}
          </p>
        ) : (
          <ul className="quest-list" data-testid="quest-list">
            {entries.map(({ quest, status, count, required, claims }) => {
              const objectiveKey = quest.kind === "bounty" ? "questBoard.objectiveBounty" : "questBoard.objectiveDelivery";
              const kindLabel = quest.kind === "bounty" ? t("questBoard.kindBounty") : t("questBoard.kindDelivery");
              return (
                <li className={`quest-row quest-${status}`} key={quest.id} data-testid={`quest-${quest.id}`}>
                  <div className="quest-head">
                    <span className={`quest-kind quest-kind-${quest.kind}`}>{kindLabel}</span>
                    <strong className="quest-name">{questName(quest)}</strong>
                    <span className={`quest-status quest-status-${status}`} data-testid={`quest-status-${quest.id}`}>
                      {t(STATUS_KEY[status] as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  <p className="quest-desc">{questDescription(quest)}</p>
                  <div className="quest-meta">
                    <span className="quest-objective">
                      {t(objectiveKey as Parameters<typeof t>[0], { target: targetName(quest), count: required })}
                    </span>
                    <span className="quest-progress" data-testid={`quest-progress-${quest.id}`}>
                      {t("questBoard.progress", { count, required })}
                    </span>
                    <span className="quest-reward">
                      {t("questBoard.reward")}: {rewardText(quest)}
                    </span>
                    {quest.repeatable && <span className="quest-tag">{t("questBoard.repeatable")}</span>}
                    {claims > 0 && <span className="quest-tag">{t("questBoard.claimedTimes", { count: claims })}</span>}
                  </div>
                  <div className="quest-actions">
                    {status === "available" && (
                      <button
                        type="button"
                        className="primary-action"
                        ref={actionRef()}
                        data-testid={`quest-accept-${quest.id}`}
                        onClick={() => onCommand({ type: "accept_quest", questId: quest.id })}
                      >
                        {t("questBoard.accept")}
                      </button>
                    )}
                    {status === "ready" && (
                      <button
                        type="button"
                        className="primary-action"
                        ref={actionRef()}
                        data-testid={`quest-claim-${quest.id}`}
                        onClick={() => onCommand({ type: "claim_quest", questId: quest.id })}
                      >
                        {quest.kind === "delivery" ? t("questBoard.turnIn") : t("questBoard.claim")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="service-actions">
          <button
            type="button"
            data-controller-cancel="true"
            data-testid="quest-board-back"
            ref={actionRef()}
            onClick={onClose}
          >
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}

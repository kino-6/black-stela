import { useEffect, useRef } from "react";
import { DoorOpen, HeartPulse, ScrollText, ShoppingBag, Users } from "lucide-react";
import type { Character, Command, ScenarioWorld } from "../domain/types";
import { getLocalizedRoomText } from "../domain/scenario";
import type { Locale, Translator } from "../i18n";

interface Checkpoint {
  roomId: string;
}

interface TownEntryPanelProps {
  t: Translator;
  world: ScenarioWorld;
  locale: Locale;
  partyGold: number;
  partyEmpty: boolean;
  /** How many times the party has gone below. 0 = it has never left town. */
  expeditions: number;
  partySize: number;
  latestLogText: string;
  injuredMembers: Character[];
  carriedLootCount: number;
  carriedLootSummary: string;
  recoveryCost: number;
  hasEquipmentLoot: boolean;
  unlockedCheckpoints: Checkpoint[];
  onCommand: (command: Command) => void;
  onEnterMode: (mode: "guild" | "shop" | "recovery" | "records") => void;
}

// The town entry cockpit — status ledger, checkpoint resume, and the service menu.
//
// The controller cursor used to land on the FIRST focusable command (Guild), while
// "Enter dungeon" was painted permanently gold. Pressing Enter on the command that looked
// chosen opened the guild. The cursor now starts on the command the player actually came
// here to give, and gold means focus and nothing else (see styles.css, "GOLD MEANS FOCUS").
export function TownEntryPanel({
  t,
  world,
  locale,
  partyGold,
  partyEmpty,
  expeditions,
  partySize,
  latestLogText,
  injuredMembers,
  carriedLootCount,
  carriedLootSummary,
  recoveryCost,
  hasEquipmentLoot,
  unlockedCheckpoints,
  onCommand,
  onEnterMode
}: TownEntryPanelProps) {
  // Start the cursor on the command a party standing in town is here to give. App's
  // focusFirstControllerChoice() is a no-op once focus already sits on an interactive element
  // inside an active surface, so claiming it here wins without fighting that effect.
  const firstDeparture = expeditions === 0;
  const enterDungeonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (partyEmpty) {
      return;
    }
    const frame = window.requestAnimationFrame(() => enterDungeonRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [partyEmpty]);

  return (
    <section
      className="town-service town-cockpit"
      aria-labelledby="town-status-heading"
      data-testid="town-cockpit"
      data-controller-active="true"
      data-controller-surface="town-entry"
    >
      {/* A party that has never gone below is not "back". The town used to greet a fresh
          six with "Town return", a "Return record" reading `Rook joined the roster.` (the last
          log line, which for a new party is the last recruit), no wounds, nothing carried, and
          the news that they could descend AGAIN. Nothing had happened yet. */}
      <div className="service-heading">
        <div>
          <h3 id="town-status-heading">{firstDeparture ? t("town.departureHeading") : t("town.statusHeading")}</h3>
          <p>{firstDeparture ? t("town.departureCopy") : t("town.statusCopy")}</p>
        </div>
        <strong>{t("town.gold", { gold: partyGold })}</strong>
      </div>
      <div className="town-cockpit-grid">
        {/* The town-hub still (P7) IS the scene now — the old CSS stand-in props
            (skyline/gate/lanterns/stela/steps) would sit on top of a real town. */}
        <div className="town-scene" aria-hidden="true" />
        {firstDeparture ? (
          <dl className="town-status-ledger" data-testid="town-first-departure">
            <div>
              <dt>{t("town.party")}</dt>
              <dd>{partyEmpty ? t("town.noParty") : t("town.partyReady", { count: partySize })}</dd>
            </div>
            <div>
              <dt>{t("town.supplies")}</dt>
              <dd>{carriedLootCount > 0 ? carriedLootSummary : t("town.noSupplies")}</dd>
            </div>
            <div>
              <dt>{t("town.nextPreparation")}</dt>
              <dd>{partyEmpty ? t("town.firstNeedParty") : t("town.firstDescend")}</dd>
            </div>
          </dl>
        ) : (
          <dl className="town-status-ledger">
            <div>
              <dt>{t("town.expeditionResult")}</dt>
              <dd>{latestLogText || t("town.readyToDescend")}</dd>
            </div>
            <div>
              <dt>{t("town.wounds")}</dt>
              <dd>{injuredMembers.length > 0 ? injuredMembers.map((member) => `${member.name} ${member.hp}/${member.maxHp}`).join(" / ") : t("town.noWounds")}</dd>
            </div>
            <div>
              <dt>{t("town.loot")}</dt>
              <dd>{carriedLootCount > 0 ? carriedLootSummary : t("town.noLoot")}</dd>
            </div>
            <div>
              <dt>{t("town.nextPreparation")}</dt>
              <dd>{recoveryCost > 0 ? t("town.nextRecovery") : hasEquipmentLoot ? t("town.nextShop") : t("town.readyToDescend")}</dd>
            </div>
          </dl>
        )}
      </div>
      {unlockedCheckpoints.length > 0 && (
        <div className="checkpoint-resume" data-testid="checkpoint-resume">
          <h4>{t("play.checkpointsHeading")}</h4>
          <div className="checkpoint-list">
            {unlockedCheckpoints.map((checkpoint) => (
              <button
                type="button"
                key={checkpoint.roomId}
                data-testid={`resume-${checkpoint.roomId}`}
                disabled={partyEmpty}
                onClick={() => onCommand({ type: "resume_at_checkpoint", roomId: checkpoint.roomId })}
              >
                {t("play.resumeAt", { place: getLocalizedRoomText(world, checkpoint.roomId, locale).name })}
              </button>
            ))}
          </div>
        </div>
      )}
      <nav
        className="town-service-menu"
        aria-label={t("town.servicesHeading")}
        data-controller-active="true"
        data-controller-surface="town-services"
      >
        <button type="button" data-testid="town-service-guild" onClick={() => onEnterMode("guild")}>
          <Users size={18} />
          {t("town.guild")}
        </button>
        <button
          type="button"
          onClick={() => onEnterMode("shop")}
          disabled={(world.shops?.length ?? 0) === 0}
          title={(world.shops?.length ?? 0) === 0 ? t("town.noShop") : undefined}
        >
          <ShoppingBag size={18} />
          {t("town.shop")}
        </button>
        <button type="button" onClick={() => onEnterMode("recovery")}>
          <HeartPulse size={18} />
          {t("town.recovery")}
        </button>
        <button type="button" onClick={() => onEnterMode("records")}>
          <ScrollText size={18} />
          {t("town.records")}
        </button>
        <button
          type="button"
          className="primary-action"
          data-testid="town-enter-dungeon"
          ref={enterDungeonRef}
          disabled={partyEmpty}
          onClick={() => onCommand({ type: "enter_dungeon" })}
        >
          <DoorOpen size={18} />
          {t("play.enterDungeon")}
        </button>
      </nav>
    </section>
  );
}

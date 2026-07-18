import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ClipboardList, DoorOpen, Gem, GraduationCap, Hammer, HeartPulse, Landmark, ScrollText, ShoppingBag, Store, Users, UsersRound } from "lucide-react";
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
  onEnterMode: (mode: "guild" | "shop" | "recovery" | "records" | "quests" | "career" | "loot" | "workshop") => void;
  onOpenPartyMenu: () => void;
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
  onEnterMode,
  onOpenPartyMenu
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

  // IMP-025: the town's first level is a handful of DESTINATIONS, not ten equal systems. Roster work,
  // the market, and the archive each hold their services one step in; recovery and departure stay on
  // the square. Controller-first: one press to a place, Cancel back to the square.
  type TownLocation = "hall" | "market" | "archive";
  const [location, setLocation] = useState<TownLocation | null>(null);
  const services: Record<TownLocation, { key: string; testid: string; icon: JSX.Element; label: string; onClick: () => void; disabled?: boolean }[]> = {
    hall: [
      { key: "guild", testid: "town-service-guild", icon: <Users size={18} />, label: t("town.guild"), onClick: () => onEnterMode("guild") },
      { key: "party", testid: "town-party-menu", icon: <UsersRound size={18} />, label: t("partyMenu.title"), onClick: onOpenPartyMenu, disabled: partyEmpty },
      { key: "career", testid: "town-service-career", icon: <GraduationCap size={18} />, label: t("town.career"), onClick: () => onEnterMode("career"), disabled: partyEmpty }
    ],
    market: [
      { key: "shop", testid: "town-service-shop", icon: <ShoppingBag size={18} />, label: t("town.shop"), onClick: () => onEnterMode("shop"), disabled: (world.shops?.length ?? 0) === 0 },
      { key: "loot", testid: "town-service-loot", icon: <Gem size={18} />, label: t("town.reliquary"), onClick: () => onEnterMode("loot") },
      { key: "workshop", testid: "town-service-workshop", icon: <Hammer size={18} />, label: t("town.workshop"), onClick: () => onEnterMode("workshop"), disabled: partyEmpty }
    ],
    archive: [
      { key: "records", testid: "town-service-records", icon: <ScrollText size={18} />, label: t("town.records"), onClick: () => onEnterMode("records") },
      { key: "quests", testid: "town-service-quests", icon: <ClipboardList size={18} />, label: t("town.quests"), onClick: () => onEnterMode("quests"), disabled: (world.quests?.length ?? 0) === 0 }
    ]
  };

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
        data-town-location={location ?? "square"}
      >
        {location === null ? (
          <>
            {/* The town square — a few destinations, then the way down. */}
            <button type="button" data-testid="town-location-hall" onClick={() => setLocation("hall")}>
              <Landmark size={18} />
              {t("town.locGuildHall")}
            </button>
            <button type="button" data-testid="town-location-market" onClick={() => setLocation("market")}>
              <Store size={18} />
              {t("town.locMarket")}
            </button>
            <button type="button" data-testid="town-location-archive" onClick={() => setLocation("archive")}>
              <ScrollText size={18} />
              {t("town.locArchive")}
            </button>
            <button type="button" data-testid="town-service-recovery" onClick={() => onEnterMode("recovery")}>
              <HeartPulse size={18} />
              {t("town.recovery")}
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
          </>
        ) : (
          <>
            {/* Inside a destination — its services, and one step back to the square. */}
            <button type="button" data-controller-cancel="true" data-testid="town-location-back" onClick={() => setLocation(null)}>
              <ArrowLeft size={18} />
              {t("town.backToHub")}
            </button>
            {services[location].map((service) => (
              <button
                key={service.key}
                type="button"
                data-testid={service.testid}
                onClick={service.onClick}
                disabled={service.disabled}
                title={service.key === "shop" && (world.shops?.length ?? 0) === 0 ? t("town.noShop") : undefined}
              >
                {service.icon}
                {service.label}
              </button>
            ))}
          </>
        )}
      </nav>
    </section>
  );
}

import type { AdventureLogEntry, GameEvent } from "./types";
import { getLocalizedRoomText } from "./scenario";
import type { ScenarioWorld } from "./types";
import { createTranslator, type Locale, type Translator } from "../i18n";

interface LogProjection {
  text: string;
  tags: string[];
}

export function appendEventLogs(state: { log: AdventureLogEntry[]; turn: number }, events: GameEvent[]): AdventureLogEntry[] {
  return [...state.log, ...projectEventsToLogEntries(events, state.turn)];
}

export function projectEventsToLogEntries(events: GameEvent[], turn: number): AdventureLogEntry[] {
  return events.flatMap((event) => {
    const projection = projectEventToLog(event);
    if (!projection) {
      return [];
    }

    return [{
      id: crypto.randomUUID(),
      turn,
      text: projection.text,
      tags: projection.tags,
      event
    }];
  });
}

export function projectEventToLog(event: GameEvent, locale: Locale = "en", world?: ScenarioWorld): LogProjection | null {
  const t = createTranslator(locale);

  switch (event.type) {
    case "party_member_joined":
      return { text: t("events.partyJoined", { name: event.characterName }), tags: ["party"] };
    case "command_blocked":
      return projectBlockedCommand(event.reason, t);
    case "dungeon_entered":
      return { text: t("events.dungeonEntered"), tags: ["dungeon"] };
    case "party_turned":
      return {
        text: t("events.partyTurned", {
          side: t(event.side === "left" ? "events.sideLeft" : "events.sideRight"),
          facing: t(`direction.${event.facing}`)
        }),
        tags: ["move"]
      };
    case "movement_blocked":
      if (event.reason === "stairs") {
        return { text: t("events.movementBlockedStairs"), tags: ["blocked", "stairs"] };
      }
      if (event.reason === "locked") {
        return { text: t("events.movementBlockedLocked"), tags: ["blocked", "locked"] };
      }
      return { text: t("events.movementBlockedWall"), tags: ["blocked"] };
    case "shortcut_opened":
      return { text: t("events.shortcutOpened"), tags: ["shortcut"] };
    case "spinner_triggered":
      return { text: t("events.spinnerTriggered"), tags: ["spinner"] };
    case "teleported":
      return { text: t("events.teleported"), tags: ["teleport"] };
    case "hazard_damage":
      return { text: t("events.hazardDamage", { damage: event.damage }), tags: ["hazard"] };
    case "secret_found":
      return { text: t("events.secretFound"), tags: ["secret"] };
    case "stairs_used":
      return { text: t("events.stairsUsed"), tags: ["move", "stairs"] };
    case "map_room_visited":
    case "map_exits_known":
    case "map_exit_blocked":
    case "map_secret_candidate_added":
      return null;
    case "room_entered":
      return { text: t("events.roomEntered", { room: resolveRoomName(event.roomId, event.roomName, world, locale) }), tags: ["move"] };
    case "trap_triggered":
      return { text: t("events.trapTriggered", { trap: event.trapName }), tags: ["trap"] };
    case "room_event_triggered":
      return { text: resolveRoomEventText(event.roomId, event.text, world, locale), tags: ["event"] };
    case "enemy_encountered":
      return { text: t("events.enemyEncountered", { enemy: resolveEnemyName(event.enemyId, event.enemyName, world, locale) }), tags: ["combat"] };
    case "inspection_made":
      return projectInspection(event.mode, t);
    case "search_completed":
      return { text: t("events.searchCompleted"), tags: ["search"] };
    case "trap_detected":
      return { text: t("events.trapDetected", { trap: event.trapName }), tags: ["search"] };
    case "trap_disarm_failed":
      return { text: t("events.trapDisarmFailed"), tags: ["trap"] };
    case "trap_disarmed":
      return { text: t("events.trapDisarmed", { trap: event.trapName }), tags: ["trap"] };
    case "enemy_damaged":
      return { text: t("events.enemyDamaged", { enemy: resolveEnemyName(event.enemyId, event.enemyName, world, locale) }), tags: ["combat"] };
    case "enemy_defeated":
      return { text: t("events.enemyDefeated", { enemy: resolveEnemyName(event.enemyId, event.enemyName, world, locale) }), tags: ["combat"] };
    case "combat_action_blocked":
      return {
        text:
          event.reason === "back_row_blocked"
            ? t("events.combatActionBackRow", { actor: event.actorName ?? t("events.backRowFallback") })
            : t("events.combatActionBlocked"),
        tags: ["combat", "blocked"]
      };
    case "combat_round_resolved":
      return { text: t("events.combatRoundResolved", { round: event.round, summaries: event.summaries.join(" ") }), tags: ["combat", "round"] };
    case "combat_rewards":
      return { text: t("events.combatRewards", { xp: event.xp, gold: event.gold }), tags: ["combat", "reward"] };
    case "party_wounded":
      return { text: t("events.partyWounded", { enemy: resolveEnemyName(event.enemyId, event.enemyName, world, locale) }), tags: ["combat"] };
    case "character_injured":
      return { text: t("events.characterInjured", { name: event.characterName }), tags: ["injury"] };
    case "party_defended":
      return { text: t("events.partyDefended", { enemy: resolveEnemyName(event.enemyId, event.enemyName, world, locale) }), tags: ["combat", "defend"] };
    case "item_used":
      return {
        text: t("events.itemUsed", {
          target: event.targetName,
          item: resolveCatalogName(event.itemId, event.itemName, world, locale),
          hp: event.healAmount
        }),
        tags: ["item"]
      };
    case "inventory_item_gained":
      return {
        text: t("events.inventoryItemGained", { item: resolveCatalogName(event.itemId, event.itemName, world, locale), quantity: event.quantity }),
        tags: ["item", event.source]
      };
    case "item_bought":
      return {
        text: t("events.itemBought", { item: resolveCatalogName(event.itemId, event.itemName, world, locale), gold: event.gold }),
        tags: ["town", "shop"]
      };
    case "item_sold":
      return {
        text: t("events.itemSold", { item: resolveCatalogName(event.itemId, event.itemName, world, locale), gold: event.gold }),
        tags: ["town", "shop"]
      };
    case "equipment_changed":
      return {
        text: t("events.equipmentChanged", { name: event.characterName, item: resolveCatalogName(event.itemId, event.itemName, world, locale) }),
        tags: ["town", "equipment"]
      };
    case "party_recovered":
      return { text: t("events.partyRecovered", { gold: event.gold }), tags: ["town", "recovery"] };
    case "recovery_blocked":
      return { text: t("events.recoveryBlocked", { gold: event.goldRequired }), tags: ["town", "blocked"] };
    case "party_retreated":
      return { text: t("events.partyRetreated"), tags: ["combat", "retreat"] };
    case "returned_to_town":
      return { text: t("events.returnedToTown"), tags: ["town"] };
    case "debug_started":
      return { text: event.text, tags: ["debug"] };
  }
}

function resolveRoomName(roomId: string, fallback: string, world: ScenarioWorld | undefined, locale: Locale) {
  return locale === "ja" && world ? getLocalizedRoomText(world, roomId, "ja").name : fallback;
}

function resolveRoomEventText(roomId: string, fallback: string, world: ScenarioWorld | undefined, locale: Locale) {
  return locale === "ja" && world ? getLocalizedRoomText(world, roomId, "ja").event ?? fallback : fallback;
}

function resolveCatalogName(itemId: string, fallback: string, world: ScenarioWorld | undefined, locale: Locale) {
  if (locale !== "ja") {
    return fallback;
  }
  const item = world?.items.find((candidate) => candidate.id === itemId);
  const equipment = world?.equipment.find((candidate) => candidate.id === itemId);
  return item?.locales?.ja?.name ?? equipment?.locales?.ja?.name ?? fallback;
}

function resolveEnemyName(enemyId: string, fallback: string, world: ScenarioWorld | undefined, locale: Locale) {
  if (locale !== "ja") {
    return fallback;
  }
  const enemy = world?.enemies.find((candidate) => candidate.id === enemyId);
  return enemy?.locales?.ja?.name ?? enemy?.name ?? fallback;
}

function projectBlockedCommand(
  reason: "party_required" | "town_return_unavailable" | "stairs_unavailable",
  t: Translator
): LogProjection {
  if (reason === "party_required") {
    return { text: t("events.blockedPartyRequired"), tags: ["blocked"] };
  }
  if (reason === "stairs_unavailable") {
    return { text: t("events.blockedStairsUnavailable"), tags: ["blocked", "stairs"] };
  }

  return { text: t("events.blockedNoReturn"), tags: ["blocked"] };
}

function projectInspection(mode: "inspect_wall" | "listen" | "open_door", t: Translator): LogProjection {
  if (mode === "inspect_wall") {
    return { text: t("events.inspectWall"), tags: ["inspect"] };
  }

  if (mode === "listen") {
    return { text: t("events.listen"), tags: ["listen"] };
  }

  return { text: t("events.openDoor"), tags: ["door"] };
}

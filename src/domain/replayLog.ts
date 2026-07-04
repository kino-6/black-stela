import type { AdventureLogEntry, GameEvent } from "./types";
import { getLocalizedRoomText } from "./scenario";
import type { ScenarioWorld } from "./types";

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

export function projectEventToLog(event: GameEvent, locale = "en", world?: ScenarioWorld): LogProjection | null {
  if (locale === "ja") {
    return projectEventToJapaneseLog(event, world);
  }

  switch (event.type) {
    case "party_member_joined":
      return { text: `${event.characterName} joined the roster.`, tags: ["party"] };
    case "command_blocked":
      return projectBlockedCommand(event.reason);
    case "dungeon_entered":
      return { text: "The party descends beneath the black stela.", tags: ["dungeon"] };
    case "party_turned":
      return { text: `The party turns ${event.side}, now facing ${event.facing}.`, tags: ["move"] };
    case "movement_blocked":
      return event.reason === "stairs"
        ? { text: "A stair waits ahead. Choose Use stairs to descend.", tags: ["blocked", "stairs"] }
        : { text: "A cold wall blocks the way.", tags: ["blocked"] };
    case "stairs_used":
      return { text: "The party takes the stair to the next floor.", tags: ["move", "stairs"] };
    case "map_room_visited":
    case "map_exits_known":
    case "map_exit_blocked":
    case "map_secret_candidate_added":
      return null;
    case "room_entered":
      return { text: `The party advances into ${event.roomName}.`, tags: ["move"] };
    case "trap_triggered":
      return { text: `${event.trapName} snaps shut. The party is injured, but nobody is erased.`, tags: ["trap"] };
    case "room_event_triggered":
      return { text: event.text, tags: ["event"] };
    case "enemy_encountered":
      return { text: `${event.enemyName} blocks the passage.`, tags: ["combat"] };
    case "inspection_made":
      return projectInspection(event.mode);
    case "search_completed":
      return { text: "The search finds no active danger.", tags: ["search"] };
    case "trap_detected":
      return { text: `The party notices ${event.trapName}.`, tags: ["search"] };
    case "trap_disarm_failed":
      return { text: "There is no active trap to disarm.", tags: ["trap"] };
    case "trap_disarmed":
      return { text: `${event.trapName} is made safe.`, tags: ["trap"] };
    case "enemy_damaged":
      return { text: `${event.enemyName} reels, then wounds the front line.`, tags: ["combat"] };
    case "enemy_defeated":
      return { text: `${event.enemyName} falls. The route is clear.`, tags: ["combat"] };
    case "combat_action_blocked":
      return {
        text:
          event.reason === "back_row_blocked"
            ? `${event.actorName ?? "The back row"} cannot reach past the front row.`
            : "The battle order cannot be completed.",
        tags: ["combat", "blocked"]
      };
    case "combat_round_resolved":
      return { text: `Round ${event.round}: ${event.summaries.join(" ")}`, tags: ["combat", "round"] };
    case "combat_rewards":
      return { text: `Victory. The party earns ${event.xp} XP and ${event.gold} gold.`, tags: ["combat", "reward"] };
    case "party_wounded":
      return { text: `${event.enemyName} reels, then wounds the front line.`, tags: ["combat"] };
    case "character_injured":
      return { text: `${event.characterName} is wounded but remains in the party.`, tags: ["injury"] };
    case "party_defended":
      return { text: `${event.enemyName} presses in, but the party holds formation.`, tags: ["combat", "defend"] };
    case "item_used":
      return { text: `${event.targetName} uses ${event.itemName} and recovers ${event.healAmount} HP.`, tags: ["item"] };
    case "inventory_item_gained":
      return { text: `Found ${event.itemName} x${event.quantity}.`, tags: ["item", event.source] };
    case "item_bought":
      return { text: `Bought ${event.itemName} for ${event.gold} gold.`, tags: ["town", "shop"] };
    case "item_sold":
      return { text: `Sold ${event.itemName} for ${event.gold} gold.`, tags: ["town", "shop"] };
    case "equipment_changed":
      return { text: `${event.characterName} equips ${event.itemName}.`, tags: ["town", "equipment"] };
    case "party_recovered":
      return { text: `The party rests in town for ${event.gold} gold.`, tags: ["town", "recovery"] };
    case "recovery_blocked":
      return { text: `The party cannot afford recovery. ${event.goldRequired} gold required.`, tags: ["town", "blocked"] };
    case "party_retreated":
      return { text: "The party retreats and regroups without losing anyone.", tags: ["combat", "retreat"] };
    case "returned_to_town":
      return { text: "The party returns to town. The record is preserved.", tags: ["town"] };
    case "debug_started":
      return { text: event.text, tags: ["debug"] };
  }
}

function projectEventToJapaneseLog(event: GameEvent, world?: ScenarioWorld): LogProjection | null {
  switch (event.type) {
    case "party_member_joined":
      return { text: `${event.characterName} が隊列に加わった。`, tags: ["party"] };
    case "command_blocked":
      return projectJapaneseBlockedCommand(event.reason);
    case "dungeon_entered":
      return { text: "隊列は黒い石碑の下へ降りた。", tags: ["dungeon"] };
    case "party_turned":
      return { text: `隊列は${event.side === "left" ? "左" : "右"}を向き、${translateDirection(event.facing)}を正面にした。`, tags: ["move"] };
    case "movement_blocked":
      return event.reason === "stairs"
        ? { text: "正面に階段がある。降りるなら階段を使う。", tags: ["blocked", "stairs"] }
        : { text: "冷たい壁が行く手を塞いでいる。", tags: ["blocked"] };
    case "stairs_used":
      return { text: "隊列は階段を降りた。", tags: ["move", "stairs"] };
    case "map_room_visited":
    case "map_exits_known":
    case "map_exit_blocked":
    case "map_secret_candidate_added":
      return null;
    case "room_entered":
      return { text: `隊列は${roomName(world, event.roomId, event.roomName)}へ進んだ。`, tags: ["move"] };
    case "trap_triggered":
      return { text: `${event.trapName} が作動した。隊列は傷を負ったが、誰も失われていない。`, tags: ["trap"] };
    case "room_event_triggered":
      return { text: world ? getLocalizedRoomText(world, event.roomId, "ja").event ?? event.text : event.text, tags: ["event"] };
    case "enemy_encountered":
      return { text: `${localizedEnemyName(event.enemyId, event.enemyName, world)} が通路を塞いでいる。`, tags: ["combat"] };
    case "inspection_made":
      return projectJapaneseInspection(event.mode);
    case "search_completed":
      return { text: "探索したが、動いている危険は見つからない。", tags: ["search"] };
    case "trap_detected":
      return { text: `隊列は ${event.trapName} に気づいた。`, tags: ["search"] };
    case "trap_disarm_failed":
      return { text: "解除すべき罠はない。", tags: ["trap"] };
    case "trap_disarmed":
      return { text: `${event.trapName} は安全になった。`, tags: ["trap"] };
    case "enemy_damaged":
      return { text: `${localizedEnemyName(event.enemyId, event.enemyName, world)} はよろめき、前衛に傷を負わせた。`, tags: ["combat"] };
    case "enemy_defeated":
      return { text: `${localizedEnemyName(event.enemyId, event.enemyName, world)} は倒れた。道は開けた。`, tags: ["combat"] };
    case "combat_action_blocked":
      return {
        text:
          event.reason === "back_row_blocked"
            ? `${event.actorName ?? "後衛"} は前衛を越えて攻撃できない。`
            : "戦闘指示を完了できない。",
        tags: ["combat", "blocked"]
      };
    case "combat_round_resolved":
      return { text: `ラウンド ${event.round} の戦闘指示を実行した。`, tags: ["combat", "round"] };
    case "combat_rewards":
      return { text: `勝利。隊列は経験値 ${event.xp} と ${event.gold}G を得た。`, tags: ["combat", "reward"] };
    case "party_wounded":
      return { text: `${localizedEnemyName(event.enemyId, event.enemyName, world)} は前衛に傷を負わせた。`, tags: ["combat"] };
    case "character_injured":
      return { text: `${event.characterName} は負傷したが、隊列には残っている。`, tags: ["injury"] };
    case "party_defended":
      return { text: `${localizedEnemyName(event.enemyId, event.enemyName, world)} が迫るが、隊列は防御の構えを保った。`, tags: ["combat", "defend"] };
    case "item_used":
      return {
        text: `${event.targetName} は ${localizedCatalogName(event.itemId, event.itemName, world)} を使い、HPを ${event.healAmount} 回復した。`,
        tags: ["item"]
      };
    case "inventory_item_gained":
      return {
        text: `${localizedCatalogName(event.itemId, event.itemName, world)} を ${event.quantity} 個見つけた。`,
        tags: ["item", event.source]
      };
    case "item_bought":
      return {
        text: `${localizedCatalogName(event.itemId, event.itemName, world)} を ${event.gold}G で買った。`,
        tags: ["town", "shop"]
      };
    case "item_sold":
      return {
        text: `${localizedCatalogName(event.itemId, event.itemName, world)} を売り、${event.gold}G を得た。`,
        tags: ["town", "shop"]
      };
    case "equipment_changed":
      return {
        text: `${event.characterName} は ${localizedCatalogName(event.itemId, event.itemName, world)} を装備した。`,
        tags: ["town", "equipment"]
      };
    case "party_recovered":
      return { text: `隊列は街で休み、${event.gold}G を支払った。`, tags: ["town", "recovery"] };
    case "recovery_blocked":
      return { text: `回復には ${event.goldRequired}G 必要だ。`, tags: ["town", "blocked"] };
    case "party_retreated":
      return { text: "隊列は退却し、誰も失わずに立て直した。", tags: ["combat", "retreat"] };
    case "returned_to_town":
      return { text: "隊列は街へ戻った。記録は残された。", tags: ["town"] };
    case "debug_started":
      return { text: event.text, tags: ["debug"] };
  }
}

function roomName(world: ScenarioWorld | undefined, roomId: string, fallback: string) {
  return world ? getLocalizedRoomText(world, roomId, "ja").name : fallback;
}

function localizedCatalogName(itemId: string, fallback: string, world?: ScenarioWorld) {
  const item = world?.items.find((candidate) => candidate.id === itemId);
  const equipment = world?.equipment.find((candidate) => candidate.id === itemId);
  return item?.locales?.ja?.name ?? equipment?.locales?.ja?.name ?? fallback;
}

function localizedEnemyName(enemyId: string, fallback: string, world?: ScenarioWorld) {
  const enemy = world?.enemies.find((candidate) => candidate.id === enemyId);
  return enemy?.locales?.ja?.name ?? enemy?.name ?? fallback;
}

function translateDirection(direction: "north" | "east" | "south" | "west") {
  return { north: "北", east: "東", south: "南", west: "西" }[direction];
}

function projectBlockedCommand(reason: "party_required" | "town_return_unavailable" | "stairs_unavailable"): LogProjection {
  if (reason === "party_required") {
    return { text: "A party is required before entering the labyrinth.", tags: ["blocked"] };
  }
  if (reason === "stairs_unavailable") {
    return { text: "There is no stair in front of the party.", tags: ["blocked", "stairs"] };
  }

  return { text: "There is no stair or return seal here.", tags: ["blocked"] };
}

function projectJapaneseBlockedCommand(reason: "party_required" | "town_return_unavailable" | "stairs_unavailable"): LogProjection {
  if (reason === "party_required") {
    return { text: "迷宮に入るには隊列が必要だ。", tags: ["blocked"] };
  }
  if (reason === "stairs_unavailable") {
    return { text: "正面に使える階段はない。", tags: ["blocked", "stairs"] };
  }

  return { text: "ここには街へ戻る階段も帰還印もない。", tags: ["blocked"] };
}

function projectJapaneseInspection(mode: "inspect_wall" | "listen" | "open_door"): LogProjection {
  if (mode === "inspect_wall") {
    return { text: "隊列は石組みを調べたが、進路は変わらない。", tags: ["inspect"] };
  }

  if (mode === "listen") {
    return { text: "組まれた石の向こうで、低い隙間風が動いている。", tags: ["listen"] };
  }

  return { text: "扉は慎重な一押しで開いた。", tags: ["door"] };
}

function projectInspection(mode: "inspect_wall" | "listen" | "open_door"): LogProjection {
  if (mode === "inspect_wall") {
    return { text: "The party studies the stonework without changing the route.", tags: ["inspect"] };
  }

  if (mode === "listen") {
    return { text: "A low draft moves somewhere beyond the fitted blocks.", tags: ["listen"] };
  }

  return { text: "The door yields to a careful push.", tags: ["door"] };
}

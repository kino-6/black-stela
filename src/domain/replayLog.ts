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
      return { text: "A party is required before entering the labyrinth.", tags: ["blocked"] };
    case "dungeon_entered":
      return { text: "The party descends beneath the black stela.", tags: ["dungeon"] };
    case "party_turned":
      return { text: `The party turns ${event.side}, now facing ${event.facing}.`, tags: ["move"] };
    case "movement_blocked":
      return { text: "A cold wall blocks the way.", tags: ["blocked"] };
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
    case "party_wounded":
      return { text: `${event.enemyName} reels, then wounds the front line.`, tags: ["combat"] };
    case "character_injured":
      return { text: `${event.characterName} is wounded but remains in the party.`, tags: ["injury"] };
    case "party_defended":
      return { text: `${event.enemyName} presses in, but the party holds formation.`, tags: ["combat", "defend"] };
    case "item_used":
      return { text: `${event.targetName} uses ${event.itemName} and recovers ${event.healAmount} HP.`, tags: ["item"] };
    case "party_recovered":
      return { text: "The party rests in town. Wounds are cleaned and strength returns.", tags: ["town", "recovery"] };
    case "party_retreated":
      return { text: "The party retreats and regroups without losing anyone.", tags: ["combat", "retreat"] };
    case "returned_to_town":
      return { text: "The party returns to town. Wounds are treated and the record is preserved.", tags: ["town"] };
    case "debug_started":
      return { text: event.text, tags: ["debug"] };
  }
}

function projectEventToJapaneseLog(event: GameEvent, world?: ScenarioWorld): LogProjection | null {
  switch (event.type) {
    case "party_member_joined":
      return { text: `${event.characterName} が隊列に加わった。`, tags: ["party"] };
    case "command_blocked":
      return { text: "迷宮に入るには隊列が必要だ。", tags: ["blocked"] };
    case "dungeon_entered":
      return { text: "隊列は黒い石碑の下へ降りた。", tags: ["dungeon"] };
    case "party_turned":
      return { text: `隊列は${event.side === "left" ? "左" : "右"}を向き、${translateDirection(event.facing)}を正面にした。`, tags: ["move"] };
    case "movement_blocked":
      return { text: "冷たい壁が行く手を塞いでいる。", tags: ["blocked"] };
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
      return { text: `${event.enemyName} が通路を塞いでいる。`, tags: ["combat"] };
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
      return { text: `${event.enemyName} はよろめき、前衛に傷を負わせた。`, tags: ["combat"] };
    case "enemy_defeated":
      return { text: `${event.enemyName} は倒れた。道は開けた。`, tags: ["combat"] };
    case "party_wounded":
      return { text: `${event.enemyName} は前衛に傷を負わせた。`, tags: ["combat"] };
    case "character_injured":
      return { text: `${event.characterName} は負傷したが、隊列には残っている。`, tags: ["injury"] };
    case "party_defended":
      return { text: `${event.enemyName} が迫るが、隊列は防御の構えを保った。`, tags: ["combat", "defend"] };
    case "item_used":
      return { text: `${event.targetName} は ${event.itemName} を使い、HPを ${event.healAmount} 回復した。`, tags: ["item"] };
    case "party_recovered":
      return { text: "隊列は街で休んだ。傷は清められ、力が戻った。", tags: ["town", "recovery"] };
    case "party_retreated":
      return { text: "隊列は退却し、誰も失わずに立て直した。", tags: ["combat", "retreat"] };
    case "returned_to_town":
      return { text: "隊列は街へ戻った。傷は手当てされ、記録は残された。", tags: ["town"] };
    case "debug_started":
      return { text: event.text, tags: ["debug"] };
  }
}

function roomName(world: ScenarioWorld | undefined, roomId: string, fallback: string) {
  return world ? getLocalizedRoomText(world, roomId, "ja").name : fallback;
}

function translateDirection(direction: "north" | "east" | "south" | "west") {
  return { north: "北", east: "東", south: "南", west: "西" }[direction];
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

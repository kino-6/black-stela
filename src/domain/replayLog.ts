import type { AdventureLogEntry, GameEvent } from "./types";

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
      tags: projection.tags
    }];
  });
}

export function projectEventToLog(event: GameEvent): LogProjection | null {
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
    case "party_retreated":
      return { text: "The party retreats and regroups without losing anyone.", tags: ["combat", "retreat"] };
    case "returned_to_town":
      return { text: "The party returns to town. Wounds are treated and the record is preserved.", tags: ["town"] };
    case "debug_started":
      return { text: event.text, tags: ["debug"] };
  }
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

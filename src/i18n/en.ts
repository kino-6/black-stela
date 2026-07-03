export const en = {
  app: {
    title: "Black Stela",
    subtitle: "Town, party, dungeon, combat, return. AI is off by default."
  },
  locale: {
    label: "Language",
    en: "English",
    ja: "Japanese"
  },
  save: {
    controls: "Save controls",
    slot: "Slot",
    slotInput: "Save slot",
    save: "Save game",
    load: "Load game",
    unavailable: "Save storage is unavailable.",
    saved: "Saved {slot}.",
    loaded: "Loaded {slot}.",
    slots: "{count} slots",
    corrupt: "Corrupt save"
  },
  ai: {
    local: "Local AI"
  },
  debug: {
    heading: "Debug Start",
    visited: "Visited {visited}/{total} · Phase {phase}",
    progress: "Progress",
    ready: "Ready in town",
    afterEncounter: "After encounter",
    clearReady: "Clear ready",
    loadProgress: "Load progress",
    headlessClear: "Headless clear",
    headlessStatus: "Headless clear: {reason} ({count} commands)"
  },
  party: {
    heading: "Party Roster",
    empty: "Create at least one adventurer before entering the labyrinth.",
    name: "Name",
    notes: "Notes",
    portrait: "Portrait",
    portraitPreview: "Selected portrait preview",
    namePlaceholder: "A player-authored adventurer",
    notesPlaceholder: "Background, vows, scars, table notes",
    noNotes: "No notes yet.",
    add: "Add adventurer",
    hpAtk: "HP {hp}/{maxHp} · ATK {attack}"
  },
  play: {
    town: "Town",
    combat: "Combat",
    safe: "Safe",
    facing: "Facing {direction}",
    townCopy:
      "Lanterns burn low around the guild hall. The stair beneath the ancient black stela waits for a party that can return with a story.",
    enterDungeon: "Enter dungeon",
    combatDescription: "{enemy} stands in the party's path.",
    combatCommands: "Combat commands",
    dungeonCommands: "Dungeon commands",
    dungeonView: "First-person dungeon view",
    turnLeft: "Turn left",
    turnRight: "Turn right",
    move: "Move",
    search: "Search",
    listen: "Listen",
    return: "Return",
    attack: "Attack",
    retreat: "Retreat",
    enemyHp: "Enemy HP {hp}"
  },
  map: {
    heading: "Map",
    noFloor: "No floor",
    current: "Current",
    town: "Town",
    visited: "Visited",
    none: "None",
    exits: "Exits",
    knownExits: "Known exits"
  },
  log: {
    heading: "Adventure Log",
    replay: "Replay prose",
    empty: "Canonical events will appear here.",
    turn: "Turn {turn}",
    narratorIdle: "Narrator idle",
    requesting: "Requesting local narrator...",
    rejected: "Narration rejected.",
    localProposal: "Local narration proposal",
    fallbackProposal: "Fallback narration"
  },
  direction: {
    north: "north",
    east: "east",
    south: "south",
    west: "west"
  }
} as const;

export type Dictionary = WidenStrings<typeof en>;

type WidenStrings<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : WidenStrings<T[Key]>;
};

export const en = {
  app: {
    title: "Black Stela"
  },
  locale: {
    label: "Language",
    en: "English",
    ja: "Japanese"
  },
  title: {
    menu: "Title menu",
    newGame: "New expedition",
    continue: "Continue",
    config: "Config"
  },
  save: {
    controls: "Save controls",
    devControls: "Developer save controls",
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
  debug: {
    heading: "Debug Start",
    visited: "Mapped {visited}/{total} · Phase {phase}",
    progress: "Progress",
    ready: "Ready in town",
    afterEncounter: "After encounter",
    clearReady: "Clear ready",
    floorStart: "{floor} start",
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
    dungeon: "Dungeon",
    combat: "Combat",
    safe: "Safe",
    facing: "Facing {direction}",
    townCopy:
      "Lanterns burn low around the guild hall. The stair beneath the ancient black stela waits for a party that can return with a story.",
    enterDungeon: "Enter dungeon",
    combatDescription: "{enemy} stands in the party's path.",
    combatCommands: "Combat commands",
    battleScreen: "Battle screen",
    round: "Round {round}",
    enemyGroups: "Enemy groups",
    partyFormation: "Party formation",
    frontRow: "Front row",
    backRow: "Back row",
    selectOrder: "Select an actor and target.",
    selectedOrder: "{actor} targets {target}.",
    enemyGroupStatus: "{count} left · HP {hp}",
    actorStatus: "HP {hp}/{maxHp} · {row}",
    resolveRound: "Resolve round",
    sleep: "Sleep",
    dungeonCommands: "Dungeon commands",
    dungeonView: "First-person dungeon view",
    turnLeft: "Turn left",
    turnRight: "Turn right",
    move: "Move",
    search: "Search",
    listen: "Listen",
    return: "Return",
    attack: "Attack",
    defend: "Defend",
    useItem: "Use item",
    retreat: "Retreat",
    enemyHp: "Enemy HP {hp}"
  },
  town: {
    guild: "Guild",
    recovery: "Recovery",
    records: "Records",
    entry: "Dungeon Entry",
    recoveryHeading: "Recovery",
    recordsHeading: "Records",
    recoverParty: "Recover party",
    recoverAll: "Recover all",
    logCount: "{count} records",
    inventory: "Inventory"
  },
  tempo: {
    repeat: "Repeat",
    autoCombat: "Auto combat",
    autoMove: "Auto explore",
    noRepeat: "No command to repeat.",
    repeatBlocked: "The last command cannot be repeated here.",
    repeated: "Repeated last command.",
    autoStoppedClear: "Auto combat stopped: combat ended.",
    autoStoppedBoss: "Auto stopped: boss or miniboss requires manual control.",
    autoStoppedDanger: "Auto stopped: party danger detected.",
    autoStoppedLimit: "Auto stopped: step limit reached.",
    autoMoveStoppedEvent: "Auto move stopped: interesting event or unsafe state.",
    autoMoveStoppedBranch: "Auto move stopped: branch or unknown route."
  },
  map: {
    heading: "Area",
    noFloor: "No floor",
    current: "Current room",
    town: "Town",
    miniMap: "Mini-map",
    paths: "Ways",
    visited: "Mapped",
    open: "Open",
    unseen: "Unseen",
    wall: "Wall",
    unknown: "Unknown"
  },
  visual: {
    visible: "Visible dungeon features",
    door: "Door",
    trap: "Trap",
    stairs: "Stairs"
  },
  log: {
    empty: "Canonical events will appear here.",
    turn: "Turn {turn}"
  },
  direction: {
    north: "north",
    east: "east",
    south: "south",
    west: "west"
  },
  scenario: {
    validation: "Scenario Validation",
    blocked: "Scenario cannot start.",
    warnings: "Scenario warnings",
    error: "Error",
    warning: "Warning",
    file: "File",
    field: "Field",
    reason: "Reason"
  }
} as const;

export type Dictionary = WidenStrings<typeof en>;

type WidenStrings<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : WidenStrings<T[Key]>;
};

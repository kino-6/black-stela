export type Direction = "north" | "east" | "south" | "west";

// How the party entered a room, for narration. Forward is the default (omitted).
export type RoomEntryMotion = "backward" | "left" | "right";

export type Command =
  | { type: "enter_dungeon" }
  | { type: "bench_member"; characterId: string }
  | { type: "recall_member"; characterId: string }
  | { type: "reclass_member"; characterId: string; classId: CharacterClassId }
  | { type: "retire_member"; characterId: string }
  | { type: "unretire_member"; characterId: string }
  | { type: "erase_member"; characterId: string }
  | { type: "edit_member_identity"; characterId: string; name: string; title: string; notes: string; accentColor: string }
  | { type: "import_member"; adventurer: PortableAdventurer }
  | { type: "resume_at_checkpoint"; roomId: string }
  | { type: "move_forward" }
  | { type: "move_backward" }
  | { type: "strafe_left" }
  | { type: "strafe_right" }
  | { type: "use_stairs" }
  | { type: "turn_left" }
  | { type: "turn_right" }
  | { type: "inspect_wall" }
  | { type: "listen" }
  | { type: "search" }
  | { type: "open_door" }
  | { type: "disarm_trap" }
  | { type: "attack" }
  | { type: "defend" }
  | { type: "use_item"; itemId: string; targetCharacterId: string }
  | { type: "discard_item"; itemId: string; plus?: number; affix?: string }
  | { type: "set_member_row"; characterId: string; row: CombatRow }
  | { type: "swap_member_rows"; characterId: string; targetCharacterId: string }
  | { type: "buy_item"; shopId: string; itemId: string }
  | { type: "sell_item"; itemId: string; plus?: number; affix?: string }
  | { type: "equip_item"; characterId: string; equipmentId: string; plus?: number; affix?: string }
  | { type: "declare_round"; actions: CombatActionDeclaration[] }
  | { type: "continue_after_combat" }
  | { type: "retreat" }
  | { type: "recover_party" }
  | { type: "return_to_town" }
  | { type: "debug_force_victory" }
  | { type: "debug_revive_party" };

export type CombatRow = "front" | "back";
export type CombatActionKind = "attack" | "defend" | "use_item" | "cast";
export type EquipmentSlot = "weapon" | "offhand" | "body" | "head" | "hands" | "accessory";
export type CharacterClassId =
  | "vanguard"
  | "sellsword"
  | "bulwark"
  | "duelist"
  | "seeker"
  | "scout"
  | "cutpurse"
  | "mender"
  | "chanter"
  | "occultist"
  | "arcanist"
  | "wayfinder";
export type CharacterBackgroundId =
  | "watch"
  | "ruinborn"
  | "apothecary"
  | "debtor"
  | "cartographer"
  | "shrine_ward"
  | "caravan_guard"
  | "pit_fighter"
  | "scriptorium"
  | "grave_tender"
  | "dock_rat"
  | "deserter";
export type CharacterTraitId =
  | "steady"
  | "scarred"
  | "lucky"
  | "grim"
  | "curious"
  | "cautious"
  | "bold"
  | "devout"
  | "nimble"
  | "stubborn"
  | "sharp_eyed"
  | "soft_spoken";
export type CharacterCreationMethod = "legacy" | "quick" | "detailed" | "template" | "debug" | "import";

export interface CharacterAptitudes {
  might: number;
  agility: number;
  spirit: number;
  wit: number;
  luck: number;
}

export interface CharacterCreationHistory {
  method: CharacterCreationMethod;
  seed?: string;
  registeredAtTurn: number;
}

export interface RosterMemory {
  firstExpeditionTurn?: number;
  deepestFloorId?: string;
  injuries: number;
  retreats: number;
  notableVictories: string[];
  deeds: string[];
}

// A scenario-independent snapshot of a registered adventurer: identity, the
// build (class/background/aptitude/traits), and earned progress (level/xp/
// reputation). Deliberately excludes scenario-bound equipment ids, dungeon
// position, and derived combat stats — those are rebuilt on import into a
// target world. Versioned so the vault format can evolve.
export interface PortableAdventurer {
  formatVersion: 1;
  exportedAt: string;
  origin: { worldId: string; worldTitle: string };
  identity: {
    name: string;
    title: string;
    notes: string;
    accentColor: string;
    portraitRef?: string;
  };
  build: {
    classId: CharacterClassId;
    backgroundId: CharacterBackgroundId;
    roleTags: string[];
    rowPreference: CombatRow;
    aptitude: CharacterAptitudes;
    traitIds: CharacterTraitId[];
  };
  progress: {
    level: number;
    xp: number;
    gold: number;
    memory: RosterMemory;
  };
}

// How a target scenario constrains adventurers imported from the vault.
export interface ScenarioImportPolicy {
  levelCap?: number;
  goldCap?: number;
  allowedClasses?: CharacterClassId[];
  startingFloorId?: string;
}

export type ImportAdjustmentKind = "level_capped" | "gold_capped" | "class_remapped" | "progress_reset";

export interface Character {
  id: string;
  name: string;
  notes: string;
  title: string;
  classId: CharacterClassId;
  roleTags: string[];
  rowPreference: CombatRow;
  backgroundId: CharacterBackgroundId;
  aptitude: CharacterAptitudes;
  traitIds: CharacterTraitId[];
  accentColor: string;
  startingEquipment: string[];
  equipment: Partial<Record<EquipmentSlot, EquippedItem>>;
  creation: CharacterCreationHistory;
  memory: RosterMemory;
  portraitRef?: string;
  row: CombatRow;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  damageMin: number;
  damageMax: number;
  accuracy: number;
  armor: number;
  speed: number;
  resistance?: Partial<Record<CombatStatus, number>>;
  xp: number;
  gold: number;
  status?: CombatStatus[];
  injury?: "wounded";
}

// A single equipped item: the base catalog id plus its rolled instance data (a
// numeric "+N" upgrade and/or a named enchant). Plain gear is just { id }.
export interface EquippedItem {
  id: string;
  plus?: number;
  affix?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  kind: "healing" | "utility" | "key" | "treasure" | "equipment" | "escape" | "cure" | "focus";
  quantity: number;
  healAmount?: number;
  restoreMp?: number;
  curesStatuses?: CombatStatus[];
  slot?: EquipmentSlot;
  attackBonus?: number;
  defenseBonus?: number;
  accuracyBonus?: number;
  speedBonus?: number;
  sellValue?: number;
  // Instance data for affixed / upgraded equipment. Rows only stack when the
  // base id, plus, and affix all match (see equipmentInstanceKey).
  plus?: number;
  affix?: string;
}

// One resolved action within a combat round, carrying both the text line and a
// snapshot of the battlefield AFTER it resolved, so the UI can play the fight
// forward blow-by-blow (enemies fall as the hit lands) instead of snapping to the
// final state. `kind`/`targetGroupId`/`targetCharacterId`/`damage` drive the hit
// animation and floating number.
export interface CombatBeat {
  text: string; // English fallback (tests, log history); UI localizes from the fields below
  kind: "hit" | "miss" | "cast" | "heal" | "defend" | "enemyHit" | "status" | "poison" | "asleep";
  actorId?: string;
  actorName?: string; // party actor display name
  actorEnemyId?: string; // enemy-group actor → localize via world enemy locale
  targetGroupId?: string;
  targetEnemyId?: string; // enemy-group target → localize
  targetCharacterId?: string;
  targetName?: string; // party target display name (heal/enemy-hit)
  damage?: number;
  remaining?: number; // enemies left in the target group after this blow
  crit?: boolean;
  weak?: boolean;
  spellId?: "heal" | "firebolt" | "sleep" | "power-strike"; // localize ability name
  abilityName?: string; // enemy ability raw name (fallback)
  statusName?: string; // status/ailment name
  groups: { id: string; count: number; hpEach: number }[];
  party: { id: string; hp: number }[];
}

export interface AdventureLogEntry {
  id: string;
  turn: number;
  text: string;
  tags: string[];
  event?: GameEvent;
}

export type GameEvent =
  | { type: "party_member_joined"; characterId: string; characterName: string }
  | { type: "party_member_benched"; characterName: string }
  | { type: "party_member_recalled"; characterName: string }
  | { type: "party_member_reformed"; characterName: string; row: CombatRow }
  | { type: "party_member_reclassed"; characterName: string; className: string }
  | { type: "party_member_retired"; characterName: string }
  | { type: "party_member_unretired"; characterName: string }
  | { type: "party_member_erased"; characterName: string }
  | { type: "party_member_edited"; characterName: string }
  | { type: "party_member_imported"; characterName: string; adjustments: ImportAdjustmentKind[] }
  | { type: "command_blocked"; reason: "party_required" | "town_return_unavailable" | "stairs_unavailable"; command: Command["type"] }
  | { type: "dungeon_entered"; roomId: string; facing: Direction }
  | { type: "party_turned"; side: "left" | "right"; facing: Direction }
  | { type: "movement_blocked"; reason: "wall" | "stairs" | "locked"; roomId: string; facing: Direction }
  | { type: "shortcut_opened" }
  | { type: "spinner_triggered"; facing: Direction }
  | { type: "teleported"; toRoomId: string; toRoomName: string }
  | { type: "hazard_damage"; damage: number }
  | { type: "secret_found" }
  | { type: "stairs_used"; fromRoomId: string; toRoomId: string; toFloorId: string | null }
  | { type: "map_room_visited"; floorId: string; roomId: string }
  | { type: "map_exits_known"; floorId: string; roomId: string; exits: Direction[] }
  | { type: "map_exit_blocked"; floorId: string | null; roomId: string; direction: Direction }
  | { type: "map_secret_candidate_added"; floorId: string | null; roomId: string; direction: Direction }
  | { type: "room_entered"; roomId: string; roomName: string; motion?: RoomEntryMotion }
  | { type: "trap_triggered"; trapId: string; trapName: string; damage: number }
  | { type: "room_event_triggered"; roomId: string; text: string }
  | { type: "enemy_encountered"; enemyId: string; enemyName: string; roomId: string }
  | { type: "inspection_made"; mode: "inspect_wall" | "listen" | "open_door" }
  | { type: "search_completed"; result: "none" }
  | { type: "trap_detected"; trapId: string; trapName: string }
  | { type: "trap_disarm_failed"; reason: "none_active" }
  | { type: "trap_disarmed"; trapId: string; trapName: string }
  | { type: "enemy_damaged"; enemyId: string; enemyName: string; remainingHp: number }
  | { type: "enemy_defeated"; enemyId: string; enemyName: string }
  | { type: "combat_action_blocked"; reason: "back_row_blocked" | "invalid_actor" | "invalid_target" | "enemy_guarded"; actorName?: string }
  | { type: "combat_round_resolved"; round: number; summaries: string[]; beats?: CombatBeat[] }
  | { type: "combat_rewards"; xp: number; gold: number; enemyNames: string[]; enemyIds: string[] }
  | { type: "party_wounded"; enemyId: string; enemyName: string; damage: number }
  | { type: "character_injured"; characterId: string; characterName: string; injury: "wounded" }
  | { type: "character_leveled_up"; characterId: string; characterName: string; level: number }
  | { type: "party_defended"; enemyId: string; enemyName: string; damage: number }
  | { type: "item_used"; itemId: string; itemName: string; targetCharacterId: string; targetName: string; healAmount: number }
  | { type: "item_discarded"; itemId: string; itemName: string }
  | { type: "inventory_item_gained"; itemId: string; itemName: string; quantity: number; source: "treasure" | "reward"; plus?: number; affix?: string }
  | { type: "item_bought"; itemId: string; itemName: string; gold: number }
  | { type: "item_sold"; itemId: string; itemName: string; gold: number }
  | { type: "equipment_changed"; itemId: string; characterName: string; itemName: string; slot: EquipmentSlot }
  | { type: "party_recovered"; gold: number }
  | { type: "recovery_blocked"; goldRequired: number; goldAvailable: number }
  | { type: "party_retreated" }
  | { type: "returned_to_town" }
  /** The whole party is down — the expedition fails and they are dragged back to town
   *  for a rescue fee. Without this, a fight with no able actors had no exit at all. */
  | { type: "party_wiped"; rescueFee: number }
  | { type: "debug_started"; text: string };

// Vertical placement of the combat sprite: planted on the floor, hovering at
// mid height, or drifting well above it. Omitted defaults to "ground".
export type EnemyElevation = "ground" | "mid" | "air";

// How big the creature stands in the corridor. The renderer measures the sprite's real
// silhouette and scales it to this world height, so a mite and a boss read as different
// creatures no matter how each was framed in its image file. Omitted defaults to "medium".
export type EnemySize = "small" | "medium" | "large" | "huge";

export interface Enemy {
  id: string;
  name: string;
  locales?: LocalizedNameDescription;
  hp: number;
  attack: number;
  armor?: number;
  accuracy?: number;
  damageMin?: number;
  damageMax?: number;
  speed?: number;
  morale?: number;
  xp?: number;
  gold?: number;
  resistances?: Partial<Record<CombatStatus, number>>;
  inflicts?: { status: CombatStatus; chance: number };
  weaknesses?: Partial<Record<Element, number>>;
  abilities?: EnemyAbility[];
  drops?: string[];
  role?: EnemyRole;
  dangerTier?: number;
  tags?: string[];
  isBoss?: boolean;
  elevation?: EnemyElevation;
  size?: EnemySize;
  /** Draw the creature off the floor. PRESENTATION ONLY — it does not change what melee can
   *  reach. `elevation` looks like it would do this job, but it is a COMBAT field: air/mid
   *  groups are shielded from melee while a ground group still stands (enemyGroupIsBack), which
   *  is how the front-blocker / back-caster squads work. A swarm of gnats that melee cannot
   *  touch is just tedious, so hovering and being out of reach are two different things. */
  hover?: boolean;
}

export interface Trap {
  id: string;
  name: string;
  damage: number;
  detectDc: number;
  warning?: string;
}

export interface CombatState {
  enemy: Enemy;
  roomId: string;
  round: number;
  enemyGroups: CombatEnemyGroup[];
  pendingActions: CombatActionDeclaration[];
  selectedActorId?: string;
  selectedTargetId?: string;
  surprise?: "party" | "enemy";
}

export type CombatStatus = "poison" | "fear" | "silence" | "sleep" | "ward";

// An element is now a WORLD's own cosmology, not a fixed engine union — the ash pit fights
// with fire / salt / star, the drowned wood with fire / wood / metal, and a future scenario
// can invent its own. So an element id is any string; the world declares the set it uses
// (ScenarioWorld.elements), and the loader rejects any weakness or threat that names one the
// world never declared. `physical` is universal — every world has bodies — and is the baseline
// a basic attack always deals; it need not be declared.
export type Element = string;
export const PHYSICAL: Element = "physical";

// One element in a world's cosmology: its id, a localized label for the UI, and an optional
// accent colour. The relations between elements (what is weak to what) live on each enemy as
// `weaknesses`; the 相剋 cycle is how those are AUTHORED, not a table the engine reads.
export interface ElementDef {
  id: string;
  label: string;
  locales?: Partial<Record<string, { label?: string }>>;
  color?: string;
}

export interface EnemyAbility {
  name: string;
  chance: number;
  effect:
    | { kind: "damage"; min: number; max: number; element: Element }
    | { kind: "status"; status: CombatStatus };
}

export interface EnemyAbility {
  name: string;
  chance: number;
  effect:
    | { kind: "damage"; min: number; max: number; element: Element }
    | { kind: "status"; status: CombatStatus };
}

export interface CombatEnemyGroup {
  id: string;
  enemyId: string;
  name: string;
  count: number;
  /** Number of bodies when this group entered combat. Presentation uses it to
   *  show one monotonically depleting group-condition bar across member deaths. */
  initialCount?: number;
  hpEach: number;
  maxHpEach: number;
  attack: number;
  armor: number;
  accuracy: number;
  damageMin: number;
  damageMax: number;
  speed: number;
  morale: number;
  xp: number;
  gold: number;
  role?: EnemyRole;
  /** Front line (ground) shields the back line (mid/air) from melee until it falls. */
  elevation?: EnemyElevation;
  status?: CombatStatus[];
  resistances?: Partial<Record<CombatStatus, number>>;
  inflicts?: { status: CombatStatus; chance: number };
  weaknesses?: Partial<Record<Element, number>>;
  abilities?: EnemyAbility[];
}

export interface CombatActionDeclaration {
  actorId: string;
  action: CombatActionKind;
  targetGroupId?: string;
  targetCharacterId?: string;
  itemId?: string;
  spellId?: "heal" | "firebolt" | "sleep" | "power-strike";
}

export interface DungeonPosition {
  roomId: string;
  cellId?: string;
  facing: Direction;
}

export interface DungeonMapState {
  floorId: string | null;
  currentRoomId: string | null;
  currentCellId?: string | null;
  currentFacing: Direction | null;
  visitedRooms: string[];
  visitedCells?: string[];
  knownExits: Partial<Record<string, Direction[]>>;
  blockedExits: Partial<Record<string, Direction[]>>;
  secretCandidates: Partial<Record<string, Direction[]>>;
}

export interface CombatConclusion {
  enemyIds: string[];
  enemyNames: string[];
  xp: number;
  gold: number;
  levelUps: { characterId?: string; name: string; level: number }[];
  resumePosition: DungeonPosition | null;
}

export interface GameState {
  phase: "town" | "dungeon" | "combat";
  party: Character[];
  reserve: Character[];
  retired: Character[];
  position: DungeonPosition | null;
  combat: CombatState | null;
  /** Domain-owned result subphase. While present, only the explicit Continue
   *  command may return control to dungeon exploration. */
  combatConclusion?: CombatConclusion | null;
  defeatedEnemies: string[];
  /** Enemy types cleared on the CURRENT floor visit. Encounter suppression is scoped
   *  here, NOT to defeatedEnemies — so leaving and re-entering a floor repopulates its
   *  chambers (玄室). defeatedEnemies stays the run-long record (mvp/records/squad). */
  floorClearedEnemies: string[];
  /** Steps walked since the last fight. A wandering encounter needs a safety window, so
   *  the party is never chain-ambushed step after step. */
  stepsSinceEncounter: number;
  /** How many times the party has gone below. 0 = it has never left town, so the town must not
   *  greet it as if it had come back. */
  expeditions: number;
  resolvedTraps: string[];
  discoveredSecrets: string[];
  inventory: InventoryItem[];
  partyGold: number;
  claimedTreasures: string[];
  /** Treasure rooms looted on the CURRENT floor visit — resets with the floor, so a
   *  re-entered floor's chambers hold loot again. */
  floorClaimedTreasures: string[];
  map: DungeonMapState;
  log: AdventureLogEntry[];
  turn: number;
  aiEnabled: boolean;
}

/** Per-scenario colour of the first-person scene. Wall/floor tint multiplies the
 *  block texture, so a scenario reads as its own world (ash vs. drowned green) even
 *  before it ships its own textures. Omitted → the default ash palette. */
export interface ScenePalette {
  fog?: string;
  ambient?: string;
  torch?: string;
  front?: string;
  wall?: string;
  floor?: string;
}

export interface ScenarioWorld {
  id: string;
  title: string;
  /** One line the player reads on the scenario card (localized via `locales`). */
  tagline?: string;
  locales?: Partial<Record<string, { title?: string; tagline?: string }>>;
  /** Player-facing copy this world says in its own voice, by locale then translation key.
   *  Overrides the i18n dictionary for this world; anything omitted falls through to it. */
  copy?: Partial<Record<string, Record<string, string>>>;
  /** This world's elemental cosmology. Weaknesses and threats may only name elements declared
   *  here (plus the universal `physical`). Empty/absent = the world uses physical only. */
  elements?: ElementDef[];
  /** Art pack folder under content/worlds/<assetPack>/assets (defaults to "default").
   *  Lets a scenario ship its own atmosphere pack. */
  assetPack?: string;
  /** Scene colour for this world's dungeon (see ScenePalette). */
  palette?: ScenePalette;
  startDungeon: string;
  startRoom: string;
  aiPolicy: AiPolicy;
  dungeons: DungeonFloor[];
  items: ScenarioItem[];
  equipment: ScenarioEquipment[];
  shops: ScenarioShop[];
  enemies: Enemy[];
  encounterTables: EncounterTable[];
  treasureTables: TreasureTable[];
  progressionFlags: ProgressionFlag[];
  importPolicy?: ScenarioImportPolicy;
}

export interface AiPolicy {
  allowed: string[];
  forbidden: string[];
}

export interface DungeonFloor {
  id: string;
  name: string;
  startRoom: string;
  grid?: DungeonGrid;
  rooms: DungeonRoom[];
  level?: number;
  role?: FloorRole;
  dangerTier?: number;
  recommendedPartyLevel?: number;
  /** Party head-count this floor is balanced around; under it, packs swell. */
  recommendedPartySize?: number;
  /** Level a party should reach before descending past this floor. Surfaced as a
   *  soft warning at the down-stair — the descent itself is never locked. */
  recommendedClearLevel?: number;
  tags?: string[];
  authorNotes?: string;
}

export interface DungeonGrid {
  cells: DungeonGridCell[];
}

export interface DungeonGridCell {
  id: string;
  roomId: string;
  x: number;
  y: number;
  edges: Partial<Record<Direction, DungeonGridEdge>>;
}

export interface DungeonGridEdge {
  kind: "open" | "wall" | "door" | "locked" | "secret" | "one_way" | "shortcut" | "stairs";
  targetRoomId?: string;
  targetCellId?: string;
  targetFloorId?: string;
}

export interface DungeonRoom {
  id: string;
  name: string;
  description: string;
  locales?: Partial<Record<string, Partial<Pick<DungeonRoom, "name" | "description" | "event">>>>;
  exits: Partial<Record<Direction, string>>;
  doors?: Direction[];
  stairsToTown?: boolean;
  returnStyle?: "stairs" | "marker";
  restPoint?: boolean;
  spinner?: boolean;
  teleportTo?: string;
  damageTile?: number;
  gatherItem?: string;
  trap?: Trap;
  encounter?: Enemy;
  /** A fixed multi-group fight, by enemy id: the first is the front line, the rest
   *  hang back (mid/air) and are shielded from melee until the front falls. */
  encounterSquad?: string[];
  encounterTable?: string;
  treasureTable?: string;
  gates?: ExplorationGate[];
  zone?: string;
  event?: string;
}

export type FloorRole =
  | "onboarding"
  | "attrition"
  | "navigation_twist"
  | "midpoint_gate"
  | "deep_route"
  | "finale"
  | "optional";

export type EnemyRole = "attrition" | "blocker" | "status" | "ambusher" | "caster" | "miniboss" | "boss";

export interface ScenarioItem {
  id: string;
  name: string;
  kind: "healing" | "utility" | "key" | "treasure" | "escape" | "cure" | "focus";
  tier: number;
  price?: number;
  sellValue?: number;
  healAmount?: number;
  restoreMp?: number;
  curesStatuses?: CombatStatus[];
  locales?: LocalizedNameDescription;
}

export interface ScenarioEquipment {
  id: string;
  name: string;
  description?: string;
  slot: EquipmentSlot;
  tier: number;
  attackBonus?: number;
  defenseBonus?: number;
  accuracyBonus?: number;
  speedBonus?: number;
  hpBonus?: number;
  mpBonus?: number;
  resistBonus?: Partial<Record<CombatStatus, number>>;
  /** A weapon's damage element: the wielder's basic attack deals this instead of physical, so a
   *  salt-brand or an iron edge can hit an enemy's weakness. Weapons only; omitted = physical. */
  element?: Element;
  /** Incoming-damage multipliers per element (<1 = resistant). Armour/charms carry these so a
   *  prepared party is not hurt by the threat it expected. Multiplied across worn gear. */
  elementResist?: Partial<Record<string, number>>;
  allowedClasses?: CharacterClassId[];
  tags?: string[];
  price?: number;
  sellValue?: number;
  locales?: LocalizedNameDescription;
}

export interface ScenarioShop {
  id: string;
  name: string;
  service: "general_store" | "armory" | "recovery";
  stock?: ShopStockItem[];
  locales?: LocalizedNameDescription;
}

export interface ShopStockItem {
  itemId: string;
  price: number;
  availability?: "always" | "limited" | "unlocked";
  unlockFlag?: string;
}

export interface EncounterTable {
  id: string;
  floorId?: string;
  groupsMax?: number;
  entries: EncounterEntry[];
}

export interface EncounterEntry {
  enemyId: string;
  weight: number;
  minCount?: number;
  maxCount?: number;
}

export interface TreasureTable {
  id: string;
  tier: number;
  entries: TreasureEntry[];
}

export interface TreasureEntry {
  itemId: string;
  weight: number;
  quantity?: number;
}

export interface ExplorationGate {
  id: string;
  direction?: Direction;
  kind: "lock" | "hidden" | "one_way" | "dark_zone" | "shortcut";
  requiredKeyId?: string;
  requiredFlag?: string;
  grantsFlag?: string;
  clue?: string;
  locales?: Partial<Record<string, { clue?: string }>>;
}

export interface ProgressionFlag {
  id: string;
  description: string;
}

export type LocalizedNameDescription = Partial<Record<string, { name?: string; description?: string }>>;

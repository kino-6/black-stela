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
  | { type: "investigate_chest" }
  | { type: "disarm_chest" }
  | { type: "open_chest" }
  | { type: "attack" }
  | { type: "defend" }
  | { type: "use_item"; itemId: string; targetCharacterId: string }
  | { type: "discard_item"; itemId: string; plus?: number; affix?: string }
  | { type: "set_member_row"; characterId: string; row: CombatRow }
  | { type: "swap_member_rows"; characterId: string; targetCharacterId: string }
  | { type: "accept_quest"; questId: string }
  | { type: "claim_quest"; questId: string }
  | { type: "change_vocation"; characterId: string; vocationId: string }
  | { type: "set_loadout"; characterId: string; loadout: string[] }
  | { type: "appraise_item"; instanceId: string }
  | { type: "toggle_item_lock"; instanceId: string }
  | { type: "toggle_item_favorite"; instanceId: string }
  | { type: "bulk_convert"; mode: "sell" | "dismantle"; rarities?: ItemRarity[] }
  | { type: "buy_item"; shopId: string; itemId: string }
  | { type: "sell_item"; itemId: string; plus?: number; affix?: string }
  | { type: "equip_item"; characterId: string; equipmentId: string; plus?: number; affix?: string }
  | { type: "reinforce_equipment"; characterId: string; slot: EquipmentSlot }
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

// What a growth item permanently grants on use. Any aptitude, any core stat, and/or direct XP.
export interface ItemGrants {
  might?: number;
  agility?: number;
  spirit?: number;
  wit?: number;
  luck?: number;
  maxHp?: number;
  maxMp?: number;
  attack?: number;
  xp?: number;
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

export interface CharacterVisualProfile {
  /** Embedded data URL or durable app-data reference used in compact/profile contexts. */
  baseRef?: string;
  /** Optional transparent bust/character art used when the adventurer owns the scene. */
  battleRef?: string;
  /** Percentage focal point shared by all crops; defaults to the face-friendly 50/38. */
  focusX: number;
  focusY: number;
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
    visualProfile?: CharacterVisualProfile;
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

// A vocation id is data-extensible (like Element): the 12 built-in classes use their class id;
// authored ADVANCED vocations add their own. Nothing hard-codes "a vocation is one of twelve".
export type VocationId = string;

// IMP-021A: an adventurer's build IS the history of vocations they have mastered. Level lives on
// Character; this tracks vocation identity, per-vocation mastery, and the techniques kept across
// every vocation change. Optional on Character for incremental adoption — resolveVocationState
// (domain/vocations) materialises a default from `classId` when absent. See docs/design/vocation-mastery.md.
export interface CharacterVocationState {
  /** The active vocation — a built-in class id or an authored advanced id. */
  current: VocationId;
  /** Mastery rank reached per vocation ever worked (0 = touched, capped at its mastered rank). */
  mastery: Record<VocationId, number>;
  /** Mastery points banked toward the CURRENT vocation's next rank. */
  progress: Record<VocationId, number>;
  /** Technique ids (spells/skills) learned and RETAINED across vocation changes (a union). */
  learned: string[];
  /** The bounded set active in combat (a subset of `learned`). */
  loadout: string[];
}

export interface Character {
  id: string;
  name: string;
  notes: string;
  title: string;
  classId: CharacterClassId;
  /** IMP-021A vocation/mastery state. Optional so existing characters/tests need no change;
   *  resolveVocationState fills a default from `classId`. */
  vocation?: CharacterVocationState;
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
  visualProfile?: CharacterVisualProfile;
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
  kind: "healing" | "utility" | "key" | "treasure" | "equipment" | "escape" | "cure" | "focus" | "growth";
  /** Permanent growth this item grants on use (outside combat). Aptitudes and core stats raise the
   *  member; `xp` is a DIRECT grant that bypasses the out-levelling falloff by construction (it never
   *  touches the combat-reward path). This is the player's "工夫" the design keeps rewarding. */
  grants?: ItemGrants;
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
  // IMP-022A — rare-loot instance identity. A COMMON drop is known on acquisition (identified) and
  // still stacks. A RARE-or-higher drop is a UNIQUE instance (its own instanceId) that may conceal
  // its rolled affix until appraised, and can be locked / favorited to protect it from bulk
  // conversion. See docs/design/rare-loot.md.
  instanceId?: string;
  rarity?: ItemRarity;
  identified?: boolean;
  locked?: boolean;
  favorite?: boolean;
}

export type ItemRarity = "common" | "rare" | "epic";

// IMP-022D — what the party has OBSERVED of an enemy. Defeating it reveals its weaknesses and its
// rare-drop sources; the raw HP/coefficients are never stored here.
export interface EnemyRecordEntry {
  encountered: number;
  defeated: number;
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
  | { type: "chest_appeared"; cellId: string; roomId: string }
  | { type: "chest_investigated"; result: "clear" | "trapped" | "uncertain"; handlerName?: string }
  | { type: "chest_disarmed"; success: boolean; handlerName?: string }
  | { type: "chest_trap_sprung"; trapKind: ChestTrapKind; damage: number }
  | { type: "chest_opened" }
  | { type: "command_blocked_chest"; reason: "no_chest" | "guarded" | "already_open" | "already_tried" | "no_trap" }
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
  | { type: "equipment_reinforced"; characterName: string; itemId: string; itemName: string; slot: EquipmentSlot; plus: number; cost: number }
  | { type: "quest_accepted"; questId: string; questName: string }
  | { type: "quest_claimed"; questId: string; questName: string; gold: number; xp: number; itemName?: string }
  | { type: "vocation_changed"; characterId: string; characterName: string; vocationId: string; vocationName: string }
  | { type: "item_appraised"; itemId: string; itemName: string; affix?: string; rarity: ItemRarity; cost?: number }
  | { type: "bulk_converted"; mode: "sell" | "dismantle"; count: number; gold: number; materials: number }
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
  /** The level this fight is meant for (XP falloff compares the party to it). Derived from
   *  dangerTier when omitted. */
  level?: number;
  /** A deliberate growth reward — a bounty target or a rare "prized" runner (metal-slime style).
   *  Its XP bypasses the out-levelling falloff and pays in full at any level. */
  prizedXp?: boolean;
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

/** Who an enemy ability strikes. `front` is the default (positional melee — the tank soaks it);
 *  `back` reaches OVER the front line to the exposed casters (a spell / spore cloud / lashing
 *  vine) — this is the "protect your back row" threat basic melee cannot express; `any` picks the
 *  most vulnerable target regardless of row. Omitted ⇒ `front`. */
export type EnemyAbilityTarget = "front" | "back" | "any";

export interface EnemyAbility {
  name: string;
  chance: number;
  target?: EnemyAbilityTarget;
  /** Localized ability name for the combat log (falls back to `name`). Keyed by locale. */
  locales?: Partial<Record<string, { name?: string }>>;
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
  /** The level this fight is meant for + whether its XP bypasses the out-levelling falloff.
   *  Carried from the enemy so the victory reward can trim (or not trim) XP per party member. */
  level?: number;
  dangerTier?: number;
  prizedXp?: boolean;
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
  /** IMP-022C — salvage materials from dismantling. Optional in the save schema (defaults to 0). */
  materials?: number;
  /** IMP-022D — the enemy record (bestiary): observations that accumulate as the party fights.
   *  Keyed by enemyId. Optional in the save schema. Coarse only — never exact HP or raw coefficients. */
  enemyRecord?: Record<string, EnemyRecordEntry>;
  claimedTreasures: string[];
  /** Treasure rooms looted on the CURRENT floor visit — resets with the floor, so a
   *  re-entered floor's chambers hold loot again. */
  floorClaimedTreasures: string[];
  map: DungeonMapState;
  log: AdventureLogEntry[];
  turn: number;
  aiEnabled: boolean;
  /** Accepted quests and their progress. Absence of an entry = the quest is still on the board,
   *  unaccepted. Optional in the save schema (defaults to []) so old saves load — same pattern
   *  as `expeditions`. */
  quests: QuestProgress[];
  /** IMP-029 — treasure chests spawned on the current floor. A chamber's reward is NOT auto-taken
   *  on room entry; a closed chest is left on the cell (after the fight, if the room has one) and the
   *  party investigates/disarms/opens it. Floor-scoped like floorClaimedTreasures (re-arms on floor
   *  re-entry). Optional in the save schema (defaults to []) so old saves load. */
  chests?: ChestState[];
}

/** IMP-029 — a chest trap kind. Authored in scenario data; a plain (untrapped) chest has none. */
export type ChestTrapKind = "needle" | "gas" | "rune" | "snare";

/** IMP-029 — scenario-authored chest on a room: a reward table plus an optional trap. A room with a
 *  bare `treasureTable` and no `chest` loads as a safe plain chest (back-compat). */
export interface ScenarioChest {
  treasureTable: string;
  trap?: { kind: ChestTrapKind; difficulty: number; damage: number };
}

export type ChestPhase = "closed" | "opened";

/** IMP-029 — a live chest instance in game state. One investigate and one disarm attempt each; the
 *  result is fixed per chest (seeded on its identity) so a failure cannot be reloaded to success. */
export interface ChestState {
  cellId: string;
  roomId: string;
  treasureTable: string;
  /** The authored trap, or null for a plain chest. `sprung`/`disarmed` track its resolution. */
  trap: { kind: ChestTrapKind; difficulty: number; damage: number } | null;
  phase: ChestPhase;
  /** Whether an investigation has been spent, and what it concluded. "uncertain" never lies "clear". */
  investigated: boolean;
  investigateResult: "clear" | "trapped" | "uncertain" | null;
  /** Whether a disarm attempt has been spent, and whether it removed the trap. */
  disarmAttempted: boolean;
  disarmed: boolean;
  /** Set once the trap has fired (on a bad open) so it cannot bite twice. */
  sprung: boolean;
}

export type QuestKind = "bounty" | "delivery";

export interface QuestReward {
  gold?: number;
  /** A direct XP grant to each active member. Because the out-levelling falloff lives only in the
   *  combat-reward path, a quest reward pays full value by construction — the same reason a growth
   *  item's `xp` bypasses it. */
  xp?: number;
  itemId?: string;
  itemQuantity?: number;
}

/** A quest authored in `content/worlds/<id>/quests.md`. A bounty tallies kills of `targetEnemyId`;
 *  a delivery hands over `targetItemId`. Both grant `reward` on claim. `repeatable` bounties/
 *  deliveries can be turned in again and again — often against a `prizedXp` runner. */
export interface ScenarioQuest {
  id: string;
  kind: QuestKind;
  name: string;
  description: string;
  targetEnemyId?: string;
  targetItemId?: string;
  /** Kills (bounty) or items (delivery) needed for one completion. */
  requiredCount: number;
  repeatable?: boolean;
  reward: QuestReward;
  locales?: LocalizedNameDescription;
}

/** Per-run progress on one accepted quest. */
export interface QuestProgress {
  questId: string;
  /** active = accepted, in progress or ready to claim; done = a non-repeatable quest already claimed. */
  status: "active" | "done";
  /** Bounty kill tally toward the CURRENT completion; resets to 0 on each repeatable claim. */
  killCount: number;
  /** How many times this quest's reward has been claimed. */
  claims: number;
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
  /** Difficulty knobs (domain/balance.ts): enemy-damage scalar + counterplay boost, tuned so a
   *  prepared party can clear ~10 levels under a naive one. Applied once when the world is loaded. */
  balance?: { threatScalar?: number; counterplayBoost?: number };
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
  quests: ScenarioQuest[];
  /** Authored advanced vocations (+ optional basic re-skins). Built-in classes are merged in by
   *  resolveVocationCatalog; this holds only what the world adds. */
  vocations: ScenarioVocation[];
  /** Authored equipment affixes, merged with the built-in pool (resolveAffixCatalog). */
  affixes: ScenarioAffix[];
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
  /** IMP-029 — an authored chest (reward table + optional trap). A bare `treasureTable` still works as
   *  a plain chest; `chest` is how a scenario adds a trap and difficulty to a chamber's reward. */
  chest?: ScenarioChest;
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
  kind: "healing" | "utility" | "key" | "treasure" | "escape" | "cure" | "focus" | "growth";
  grants?: ItemGrants;
  tier: number;
  price?: number;
  sellValue?: number;
  healAmount?: number;
  restoreMp?: number;
  curesStatuses?: CombatStatus[];
  locales?: LocalizedNameDescription;
}

// IMP-022A: an authored equipment affix (a "named enchant"). Merged with the built-in pool
// (EQUIPMENT_AFFIXES) — authored wins on a shared id. `rarity` sets how exclusive the roll is and
// which tier of drop it can appear on. See docs/design/rare-loot.md.
export interface ScenarioAffix {
  id: string;
  label: string;
  slots: EquipmentSlot[];
  minFloor: number;
  rarity: ItemRarity;
  weight?: number;
  attackBonus?: number;
  defenseBonus?: number;
  accuracyBonus?: number;
  speedBonus?: number;
  // IMP-022: richer affix answers — resilience, status/element wards, regen, and species-specific bite.
  hpBonus?: number;
  mpBonus?: number;
  resistBonus?: Partial<Record<CombatStatus, number>>;
  elementResist?: Partial<Record<string, number>>;
  regen?: number;
  speciesBonus?: { tag: string; multiplier: number };
  locales?: Partial<Record<string, { label?: string }>>;
}

// IMP-021A: an authored vocation (usually ADVANCED). `basic`-tier entries with a built-in id
// re-skin that class; advanced entries are new destinations gated by `requires`. See
// docs/design/vocation-mastery.md.
export interface ScenarioVocation {
  id: VocationId;
  tier: "basic" | "advanced";
  name: string;
  signature?: string;
  /** Unlock gate: vocations that must be MASTERED (plus an optional character level). */
  requires?: { mastered?: VocationId[]; minLevel?: number };
  /** Applied on top of the aptitude-derived base when this vocation is active. */
  statModifiers?: Partial<Pick<Character, "maxHp" | "maxMp" | "attack" | "damageMin" | "damageMax" | "accuracy" | "armor" | "speed">>;
  allowedSlots?: EquipmentSlot[];
  /** Technique ids learned on adopting this vocation and kept forever after. */
  grantsTechniques?: string[];
  locales?: Partial<Record<string, { name?: string; signature?: string }>>;
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

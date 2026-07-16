import { appendEventLogs } from "./replayLog";
import { applyLevelUps, rewardXpFor } from "./leveling";
import { PARTY_SIZE_LIMIT, findClass, importAdventurer, reclassCharacter } from "./characterCreation";
import { SPELLS, knownSpells } from "./spells";
import { getCriticalChance, getEvasionChance, getInitiativeScore, getSpellPowerBonus, getStatusSpellChance } from "./combatMath";
import { FEAR_ACCURACY_PENALTY, POISON_DAMAGE, STATUS_WEAR_OFF, statusResistPct } from "./status";
import {
  getExit,
  getFloorForRoom,
  getFloorIdForRoom,
  getGridCellForRoom,
  getGridEdge,
  getKnownGridDirections,
  getRoom,
  isBossFloor,
  secretKey
} from "./scenario";
import {
  addInventoryItem,
  calculateRecoveryCost,
  effectiveMaxHp,
  effectiveMaxMp,
  createInventoryItemFromCatalog,
  findEquipment,
  getEffectiveCharacterStats,
  getEquipmentSlot,
  isEquipmentUsableBy,
  removeInventoryItem,
  weaponReaches
} from "./economy";
import { EQUIPMENT_AFFIXES, equipmentInstanceKey } from "./affixes";
import { findQuest, getQuestProgress, isQuestReadyToClaim, recordQuestKills } from "./quests";
import {
  applyMastery,
  canAdoptVocation,
  changeCharacterVocation,
  findVocation,
  localizedVocationName,
  combatLoadout,
  masteryGain,
  resolveVocationState,
  setLoadout
} from "./vocations";
import { appraiseInstance, dismantleYield, isProtectedFromBulk, isUnidentifiedRare, rollEquipmentDrop, sellValueOf } from "./loot";
import type {
  Character,
  CharacterClassId,
  CombatActionDeclaration,
  CombatBeat,
  CombatEnemyGroup,
  CombatStatus,
  CombatRow,
  CombatState,
  Command,
  Direction,
  DungeonFloor,
  DungeonRoom,
  Element,
  Enemy,
  EquipmentSlot,
  EnemyAbility,
  ExplorationGate,
  GameEvent,
  GameState,
  InventoryItem,
  PortableAdventurer,
  RoomEntryMotion,
  ScenarioWorld
} from "./types";

export interface CommandResult {
  state: GameState;
  events: GameEvent[];
}

const leftOf: Record<Direction, Direction> = {
  north: "west",
  west: "south",
  south: "east",
  east: "north"
};

const rightOf: Record<Direction, Direction> = {
  north: "east",
  east: "south",
  south: "west",
  west: "north"
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: "south",
  south: "north",
  east: "west",
  west: "east"
};

const CRIT_MULTIPLIER = 1.5;

// Element weakness multiplier applied to incoming damage of a given element
// (>1 = weak, <1 = resistant, default 1).
function elementMultiplier(weaknesses: Partial<Record<Element, number>> | undefined, element: Element): number {
  return weaknesses?.[element] ?? 1;
}

// Enemy AI: pick the first ability whose chance roll lands this turn (else the
// enemy makes a plain attack).
function selectEnemyAbility(abilities: EnemyAbility[] | undefined, seed: string): EnemyAbility | null {
  for (const ability of abilities ?? []) {
    if (rollPercent(`${seed}:${ability.name}`) < ability.chance) {
      return ability;
    }
  }
  return null;
}

// Apply damage to one party member, wounding (not killing) them at 0 HP.
function damagePartyMember(
  party: GameState["party"],
  targetId: string,
  damage: number,
  injuredEvents: GameEvent[]
): GameState["party"] {
  return party.map((member) => {
    if (member.id !== targetId) {
      return member;
    }
    const hp = member.hp - damage;
    if (hp <= 0) {
      injuredEvents.push({ type: "character_injured", characterId: member.id, characterName: member.name, injury: "wounded" });
      return {
        ...member,
        hp: 1,
        injury: "wounded" as const,
        status: clearRoundStatuses(member.status),
        memory: { ...member.memory, injuries: member.memory.injuries + 1 }
      };
    }
    return { ...member, hp, status: clearRoundStatuses(member.status) };
  });
}

export function executeCommand(state: GameState, world: ScenarioWorld, command: Command): GameState {
  return resolveCommand(state, world, command).state;
}

export function resolveCommand(state: GameState, world: ScenarioWorld, command: Command): CommandResult {
  if (state.combatConclusion && command.type !== "continue_after_combat") {
    return noChange(state);
  }
  switch (command.type) {
    case "enter_dungeon":
      return enterDungeon(state, world);
    case "bench_member":
      return benchMember(state, command.characterId);
    case "recall_member":
      return recallMember(state, command.characterId);
    case "reclass_member":
      return reclassMemberCommand(state, world, command.characterId, command.classId);
    case "retire_member":
      return retireMember(state, command.characterId);
    case "unretire_member":
      return unretireMember(state, command.characterId);
    case "erase_member":
      return eraseMember(state, command.characterId);
    case "edit_member_identity":
      return editMemberIdentity(state, command);
    case "import_member":
      return importMember(state, world, command.adventurer);
    case "resume_at_checkpoint":
      return resumeAtCheckpoint(state, world, command.roomId);
    case "turn_left":
      return turn(state, "left");
    case "turn_right":
      return turn(state, "right");
    case "move_forward":
      return moveForward(state, world);
    case "move_backward":
      return moveForward(state, world, state.position ? OPPOSITE_DIRECTION[state.position.facing] : undefined, "backward");
    case "strafe_left":
      return moveForward(state, world, state.position ? leftOf[state.position.facing] : undefined, "left");
    case "strafe_right":
      return moveForward(state, world, state.position ? rightOf[state.position.facing] : undefined, "right");
    case "use_stairs":
      return useStairs(state, world);
    case "inspect_wall":
      return logOnly(state, { type: "inspection_made", mode: "inspect_wall" });
    case "listen":
      return logOnly(state, { type: "inspection_made", mode: "listen" });
    case "search":
      return search(state, world);
    case "open_door":
      return logOnly(state, { type: "inspection_made", mode: "open_door" });
    case "disarm_trap":
      return disarmTrap(state, world);
    case "attack":
      return attack(state, world);
    case "defend":
      return defend(state);
    case "use_item":
      return useItem(state, world, command.itemId, command.targetCharacterId);
    case "discard_item":
      return discardItem(state, command.itemId, command.plus, command.affix);
    case "set_member_row":
      return setMemberRow(state, command.characterId, command.row);
    case "swap_member_rows":
      return swapMemberRows(state, command.characterId, command.targetCharacterId);
    case "accept_quest":
      return acceptQuest(state, world, command.questId);
    case "claim_quest":
      return claimQuest(state, world, command.questId);
    case "change_vocation":
      return changeVocationCommand(state, world, command.characterId, command.vocationId);
    case "set_loadout":
      return setLoadoutCommand(state, command.characterId, command.loadout);
    case "appraise_item":
      return appraiseItemCommand(state, command.instanceId);
    case "toggle_item_lock":
      return toggleItemFlagCommand(state, command.instanceId, "locked");
    case "toggle_item_favorite":
      return toggleItemFlagCommand(state, command.instanceId, "favorite");
    case "bulk_convert":
      return bulkConvertCommand(state, world, command.mode);
    case "buy_item":
      return buyItem(state, world, command.shopId, command.itemId);
    case "sell_item":
      return sellItem(state, world, command.itemId, command.plus, command.affix);
    case "equip_item":
      return equipItem(state, world, command.characterId, command.equipmentId, command.plus, command.affix);
    case "declare_round":
      return declareRound(state, world, command.actions);
    case "continue_after_combat":
      return continueAfterCombat(state);
    case "retreat":
      return retreat(state);
    case "recover_party":
      return recoverParty(state, world);
    case "return_to_town":
      return returnToTown(state, world);
    case "debug_force_victory":
      return debugForceVictory(state, world);
    case "debug_revive_party":
      return debugReviveParty(state);
    default:
      return noChange(state);
  }
}

// Move an active member between the front and back combat rows. Available while
// exploring (the camp menu) or in town — never mid-combat, when the formation is
// locked. A no-op if the member is missing or already in that row.
function setMemberRow(state: GameState, characterId: string, row: CombatRow): CommandResult {
  if (state.phase === "combat") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  if (!member || member.row === row) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    party: state.party.map((candidate) => (candidate.id === characterId ? { ...candidate, row } : candidate))
  };
  return withEvents(next, [{ type: "party_member_reformed", characterName: member.name, row }]);
}

function swapMemberRows(state: GameState, characterId: string, targetCharacterId: string): CommandResult {
  if (state.phase === "combat") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  const target = state.party.find((candidate) => candidate.id === targetCharacterId);
  if (!member || !target || member.row === target.row) {
    return noChange(state);
  }

  const party = state.party.map((candidate) =>
    candidate.id === member.id
      ? { ...candidate, row: target.row }
      : candidate.id === target.id
        ? { ...candidate, row: member.row }
        : candidate
  );
  return withEvents({ ...state, party, turn: state.turn + 1 }, [
    { type: "party_member_reformed", characterName: member.name, row: target.row },
    { type: "party_member_reformed", characterName: target.name, row: member.row }
  ]);
}

// Move an active party member to the guild bench (reserve). Town-only.
function benchMember(state: GameState, characterId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  if (!member) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    party: state.party.filter((candidate) => candidate.id !== characterId),
    reserve: [...state.reserve, member]
  };
  return withEvents(next, [{ type: "party_member_benched", characterName: member.name }]);
}

// Recall a benched adventurer into the active party (up to the size limit). Town-only.
function recallMember(state: GameState, characterId: string): CommandResult {
  if (state.phase !== "town" || state.party.length >= PARTY_SIZE_LIMIT) {
    return noChange(state);
  }
  const member = state.reserve.find((candidate) => candidate.id === characterId);
  if (!member) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    party: [...state.party, member],
    reserve: state.reserve.filter((candidate) => candidate.id !== characterId)
  };
  return withEvents(next, [{ type: "party_member_recalled", characterName: member.name }]);
}

// Retrain a party or benched adventurer into a new class. Town-only.
function reclassMemberCommand(
  state: GameState,
  world: ScenarioWorld,
  characterId: string,
  classId: CharacterClassId
): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const inParty = state.party.find((candidate) => candidate.id === characterId);
  const inReserve = state.reserve.find((candidate) => candidate.id === characterId);
  const member = inParty ?? inReserve;
  if (!member || member.classId === classId) {
    return noChange(state);
  }
  const reclassed = reclassCharacter(member, classId, world);
  const next: GameState = {
    ...state,
    party: state.party.map((candidate) => (candidate.id === characterId ? reclassed : candidate)),
    reserve: state.reserve.map((candidate) => (candidate.id === characterId ? reclassed : candidate))
  };
  return withEvents(next, [
    { type: "party_member_reclassed", characterName: reclassed.name, className: findClass(classId).label.en }
  ]);
}

// Reversible retire: move an active/benched adventurer to the retired roll,
// records preserved and recallable later. Town-only.
function retireMember(state: GameState, characterId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.party.find((c) => c.id === characterId) ?? state.reserve.find((c) => c.id === characterId);
  if (!member) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    party: state.party.filter((c) => c.id !== characterId),
    reserve: state.reserve.filter((c) => c.id !== characterId),
    retired: [...state.retired, member]
  };
  return withEvents(next, [{ type: "party_member_retired", characterName: member.name }]);
}

// Recall a retired adventurer back to the guild bench. Town-only.
function unretireMember(state: GameState, characterId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.retired.find((c) => c.id === characterId);
  if (!member) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    retired: state.retired.filter((c) => c.id !== characterId),
    reserve: [...state.reserve, member]
  };
  return withEvents(next, [{ type: "party_member_unretired", characterName: member.name }]);
}

// Permanent erasure: irreversibly remove an adventurer from every roster. The
// two-step confirmation that guards this lives in the UI. Town-only.
function eraseMember(state: GameState, characterId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member =
    state.party.find((c) => c.id === characterId) ??
    state.reserve.find((c) => c.id === characterId) ??
    state.retired.find((c) => c.id === characterId);
  if (!member) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    party: state.party.filter((c) => c.id !== characterId),
    reserve: state.reserve.filter((c) => c.id !== characterId),
    retired: state.retired.filter((c) => c.id !== characterId)
  };
  return withEvents(next, [{ type: "party_member_erased", characterName: member.name }]);
}

// Revise an adventurer's identity (name/epithet/record/accent) without touching
// their build. Town-only; the name is required.
function editMemberIdentity(
  state: GameState,
  patch: { characterId: string; name: string; title: string; notes: string; accentColor: string }
): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const name = patch.name.trim();
  if (!name) {
    return noChange(state);
  }
  let editedName = "";
  const revise = (member: Character): Character => {
    if (member.id !== patch.characterId) {
      return member;
    }
    editedName = name;
    return { ...member, name, title: patch.title.trim(), notes: patch.notes.trim(), accentColor: patch.accentColor };
  };
  const next: GameState = {
    ...state,
    party: state.party.map(revise),
    reserve: state.reserve.map(revise),
    retired: state.retired.map(revise)
  };
  if (!editedName) {
    return noChange(state);
  }
  return withEvents(next, [{ type: "party_member_edited", characterName: editedName }]);
}

// Copy a vault adventurer into the guild reserve, clamped by the target world's
// import policy. Imports always land in the reserve so the active party is never
// silently overfilled. Town-only.
function importMember(state: GameState, world: ScenarioWorld, adventurer: PortableAdventurer): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const { character, adjustments } = importAdventurer(adventurer, world);
  const next: GameState = { ...state, reserve: [...state.reserve, character] };
  return withEvents(next, [{ type: "party_member_imported", characterName: character.name, adjustments }]);
}

function enterDungeon(state: GameState, world: ScenarioWorld): CommandResult {
  if (state.party.length === 0) {
    return logOnly(state, { type: "command_blocked", reason: "party_required", command: "enter_dungeon" });
  }

  // Face the party into the dungeon: toward the entrance's actual open exit, not
  // a hardcoded east. Prefer east when available so floors built around an eastward
  // trunk read unchanged; otherwise turn to the way on (a corner maze mouth).
  const entranceExits = Object.keys(getRoom(world, world.startRoom).exits ?? {}) as Direction[];
  const entranceFacing: Direction = entranceExits.includes("east") ? "east" : entranceExits[0] ?? "east";
  const roomVisit = visitRoom(state, world, world.startRoom, entranceFacing);
  const startCell = getGridCellForRoom(world, world.startRoom);
  let next: GameState = {
    ...state,
    phase: "dungeon",
    position: {
      roomId: world.startRoom,
      cellId: startCell?.id,
      facing: entranceFacing
    },
    combat: null,
    party: markExpeditionStarted(state.party, roomVisit.map.floorId ?? world.startDungeon, state.turn + 1),
    map: roomVisit.map,
    floorClearedEnemies: [],
    floorClaimedTreasures: [],
    // The town greets a party differently once it has been below. Count the descents.
    expeditions: state.expeditions + 1,
    turn: state.turn + 1
  };
  const startRoom = getRoom(world, world.startRoom);
  const treasure = collectRoomTreasure(next, world, startRoom.id, startRoom.treasureTable);
  next = treasure.state;

  return withEvents(next, [
    {
      type: "dungeon_entered",
      roomId: world.startRoom,
      facing: entranceFacing
    },
    ...roomVisit.events,
    ...treasure.events
  ]);
}

export interface CheckpointInfo {
  roomId: string;
  floorId: string;
  roomName: string;
}

export function listUnlockedCheckpoints(state: GameState, world: ScenarioWorld): CheckpointInfo[] {
  return world.dungeons
    .flatMap((floor) => floor.rooms.map((room) => ({ floor, room })))
    .filter(({ room }) => room.restPoint && state.map.visitedRooms.includes(room.id))
    .map(({ floor, room }) => ({ roomId: room.id, floorId: floor.id, roomName: room.name }));
}

function resumeAtCheckpoint(state: GameState, world: ScenarioWorld, roomId: string): CommandResult {
  if (state.party.length === 0) {
    return logOnly(state, { type: "command_blocked", reason: "party_required", command: "enter_dungeon" });
  }

  const room = getRoom(world, roomId);
  const unlocked = Boolean(room.restPoint) && state.map.visitedRooms.includes(roomId);
  if (!unlocked) {
    return noChange(state);
  }

  const roomVisit = visitRoom(state, world, roomId, "east");
  const startCell = getGridCellForRoom(world, roomId);
  const next: GameState = {
    ...state,
    phase: "dungeon",
    position: {
      roomId,
      cellId: startCell?.id,
      facing: "east"
    },
    combat: null,
    party: markExpeditionStarted(state.party, roomVisit.map.floorId ?? world.startDungeon, state.turn + 1),
    map: roomVisit.map,
    floorClearedEnemies: [],
    floorClaimedTreasures: [],
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "room_entered", roomId, roomName: room.name }, ...roomVisit.events]);
}

function turn(state: GameState, side: "left" | "right"): CommandResult {
  if (!state.position || state.phase !== "dungeon") {
    return noChange(state);
  }

  const facing = side === "left" ? leftOf[state.position.facing] : rightOf[state.position.facing];

  const next: GameState = {
    ...state,
    position: {
      ...state.position,
      facing
    },
    map: {
      ...state.map,
      currentFacing: facing
    },
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "party_turned", side, facing }]);
}

// Moves the party one cell along `requestedDirection` (their facing by default,
// or the opposite direction for a backward step). The party's facing never
// changes here — only their position — so forward and backward share all of the
// edge/gate/secret/treasure/encounter handling below.
function moveForward(
  state: GameState,
  world: ScenarioWorld,
  requestedDirection?: Direction,
  motion?: RoomEntryMotion
): CommandResult {
  if (!state.position || state.phase !== "dungeon") {
    return noChange(state);
  }

  const moveDirection = requestedDirection ?? state.position.facing;

  const forwardEdge = getGridEdge(world, state.position.roomId, moveDirection);
  if (forwardEdge?.kind === "stairs") {
    const next: GameState = {
      ...state,
      turn: state.turn + 1
    };

    return withEvents(next, [
      {
        type: "movement_blocked",
        reason: "stairs",
        roomId: state.position.roomId,
        facing: moveDirection
      }
    ]);
  }

  const forwardGate = getRoom(world, state.position.roomId).gates?.find((gate) => gate.direction === moveDirection);
  if (forwardGate && !isGateOpen(forwardGate, state)) {
    return withEvents({ ...state, turn: state.turn + 1 }, [
      {
        type: "movement_blocked",
        reason: "locked",
        roomId: state.position.roomId,
        facing: moveDirection
      }
    ]);
  }

  // An open gate lets the party through its otherwise-impassable edge (e.g. a
  // locked vault opened with the right key); a discovered secret edge (hidden
  // passage) likewise becomes traversable once searched out.
  const secretRevealed =
    forwardEdge?.kind === "secret" &&
    Boolean(forwardEdge.targetRoomId) &&
    state.discoveredSecrets.includes(secretKey(state.position.roomId, moveDirection));
  const exit =
    (forwardGate && forwardEdge?.targetRoomId) || secretRevealed
      ? forwardEdge?.targetRoomId
      : getExit(world, state.position.roomId, moveDirection);
  if (!exit) {
    const floorId = state.map.floorId ?? getFloorIdForRoom(world, state.position.roomId);
    const next: GameState = {
      ...state,
      map: {
        ...state.map,
        blockedExits: appendDirection(state.map.blockedExits, state.position.roomId, moveDirection)
      },
      turn: state.turn + 1
    };

    return withEvents(next, [
      {
        type: "movement_blocked",
        reason: "wall",
        roomId: state.position.roomId,
        facing: moveDirection
      },
      {
        type: "map_exit_blocked",
        floorId,
        roomId: state.position.roomId,
        direction: moveDirection
      }
    ]);
  }

  const room = getRoom(world, exit);
  const roomVisit = visitRoom(state, world, exit, state.position.facing);
  const targetCell = getGridCellForRoom(world, exit);
  const events: GameEvent[] = [
    { type: "room_entered", roomId: room.id, roomName: room.name, motion },
    ...roomVisit.events
  ];
  let next: GameState = {
    ...state,
    position: {
      ...state.position,
      roomId: exit,
      cellId: targetCell?.id
    },
    party: markDeepestFloor(state.party, roomVisit.map.floorId ?? state.map.floorId),
    map: roomVisit.map,
    stepsSinceEncounter: state.stepsSinceEncounter + 1,
    turn: state.turn + 1
  };

  const treasure = collectRoomTreasure(next, world, room.id, room.treasureTable);
  next = treasure.state;
  events.push(...treasure.events);

  if (room.trap && !state.resolvedTraps.includes(room.trap.id)) {
    next = {
      ...next,
      party: next.party.map((member) => ({
        ...member,
        hp: Math.max(1, member.hp - room.trap!.damage)
      })),
      resolvedTraps: [...next.resolvedTraps, room.trap.id]
    };
    events.push({
      type: "trap_triggered",
      trapId: room.trap.id,
      trapName: room.trap.name,
      damage: room.trap.damage
    });
  }

  if (room.event) {
    events.push({ type: "room_event_triggered", roomId: room.id, text: room.event });
  }

  const grantedFlags = (room.gates ?? [])
    .map((gate) => gate.grantsFlag)
    .filter((flag): flag is string => typeof flag === "string" && !next.discoveredSecrets.includes(flag));
  if (grantedFlags.length > 0) {
    next = { ...next, discoveredSecrets: [...next.discoveredSecrets, ...grantedFlags] };
    if ((room.gates ?? []).some((gate) => gate.kind === "shortcut" && gate.grantsFlag && grantedFlags.includes(gate.grantsFlag))) {
      events.push({ type: "shortcut_opened" });
    }
  }

  const effects = applyCellEffects(next, world, room, events);
  next = effects.state;

  // A room with an authored encounter fires it; otherwise the corridor itself can
  // ambush you — a WANDERING encounter rolled from this floor's table. Without this
  // the dungeon was a fixed set of set-piece rooms and walking was never dangerous.
  // A party with nobody left standing must NOT be dragged into a fight it cannot act in:
  // that combat can never reach a round-end, so the wipe check never fires and the run
  // soft-locks. A fully wounded party is allowed to limp home instead.
  const canFight = next.party.some((member) => member.hp > 0 && !member.injury);
  const started =
    effects.teleported || !canFight
      ? null
      : beginRoomEncounter(world, room, next) ?? beginWanderingEncounter(world, room, next);
  if (started) {
    next = { ...next, phase: "combat", combat: started.combat, stepsSinceEncounter: 0 };
    events.push(started.event);
  }

  return withEvents(next, events);
}

/** Chance, per step, that the corridor throws a wandering pack at the party — and the
 *  SAFETY WINDOW that must pass since the last fight before it can. Without the window a
 *  bad streak chain-ambushes the party step after step; with it, the expected spacing is
 *  COOLDOWN + 1/rate steps (~33 here), which is the classic DRPG cadence. */
export const WANDERING_ENCOUNTER_PCT = 4;
export const WANDERING_COOLDOWN_STEPS = 8;

// A wandering encounter: rolled from the CURRENT FLOOR's encounter table when the room
// the party stepped into has no authored fight of its own. Floor-scoped suppression
// still applies, so a type already cleared on this floor visit stays quiet until the
// floor is re-entered.
function beginWanderingEncounter(
  world: ScenarioWorld,
  room: DungeonRoom,
  state: GameState
): { combat: CombatState; event: GameEvent } | null {
  if (room.encounter || room.encounterTable || room.encounterSquad) {
    return null; // authored rooms own their fight
  }
  if (room.stairsToTown || room.restPoint) {
    return null; // safe ground: landings and rest points never ambush
  }
  const floor = floorForRoom(world, room.id);
  if (!floor) {
    return null;
  }
  if (state.stepsSinceEncounter < WANDERING_COOLDOWN_STEPS) {
    return null; // safety window since the last fight
  }
  if (rollPercent(`${state.turn}:${room.id}:wander`) >= WANDERING_ENCOUNTER_PCT) {
    return null;
  }

  const table = world.encounterTables.find((candidate) => candidate.floorId === floor.id);
  if (!table) {
    return null;
  }
  const rolled = resolveEncounterTable(world, table.id, state.turn);
  const fresh = selectEncounterGroups(rolled, state.floorClearedEnemies, table.groupsMax ?? 1);
  if (fresh.length === 0) {
    return null;
  }

  const scaled = fresh.map((group) => ({
    enemy: group.enemy,
    count: scaledEncounterCount(group.count, state.party, floor)
  }));
  const combat =
    scaled.length === 1
      ? createCombatState(room.id, scaled[0].enemy, scaled[0].count)
      : createMultiGroupCombatState(room.id, scaled);
  const label = scaled
    .map((group) => (group.count > 1 ? `${group.enemy.name} x${group.count}` : group.enemy.name))
    .join(" & ");
  return {
    combat,
    event: { type: "enemy_encountered", enemyId: scaled[0].enemy.id, enemyName: label, roomId: room.id }
  };
}

function useStairs(state: GameState, world: ScenarioWorld): CommandResult {
  if (!state.position || state.phase !== "dungeon") {
    return noChange(state);
  }

  const stair = roomStairsEdge(world, state.position.roomId, state.position.facing);
  if (!stair?.edge.targetRoomId) {
    return logOnly(state, { type: "command_blocked", reason: "stairs_unavailable", command: "use_stairs" });
  }
  const edge = stair.edge;

  // A locked gate on the stair's direction bars the descent until it is opened
  // (e.g. a branch crank frees the drop-pin) — checked on the stair itself, not the
  // way the party happens to face, since descending is a current-cell action.
  const stairGate = getRoom(world, state.position.roomId).gates?.find((gate) => gate.direction === stair.direction);
  if (stairGate && !isGateOpen(stairGate, state)) {
    return withEvents({ ...state, turn: state.turn + 1 }, [
      { type: "movement_blocked", reason: "locked", roomId: state.position.roomId, facing: state.position.facing }
    ]);
  }

  const targetRoom = getRoom(world, edge.targetRoomId!);
  const roomVisit = visitRoom(state, world, targetRoom.id, state.position.facing);
  const targetCell = getGridCellForRoom(world, targetRoom.id);
  const events: GameEvent[] = [
    {
      type: "stairs_used",
      fromRoomId: state.position.roomId,
      toRoomId: targetRoom.id,
      toFloorId: edge.targetFloorId ?? roomVisit.map.floorId ?? null
    },
    ...roomVisit.events
  ];

  let next: GameState = {
    ...state,
    position: {
      ...state.position,
      roomId: targetRoom.id,
      cellId: targetCell?.id
    },
    party: markDeepestFloor(state.party, roomVisit.map.floorId ?? state.map.floorId),
    map: roomVisit.map,
    // Changing floors repopulates the one you arrive on: the floor-scoped clear state
    // resets, so its chambers (玄室) hold enemies and treasure again.
    floorClearedEnemies: [],
    floorClaimedTreasures: [],
    turn: state.turn + 1
  };

  const treasure = collectRoomTreasure(next, world, targetRoom.id, targetRoom.treasureTable);
  next = treasure.state;
  events.push(...treasure.events);

  if (targetRoom.event) {
    events.push({ type: "room_event_triggered", roomId: targetRoom.id, text: targetRoom.event });
  }

  const effects = applyCellEffects(next, world, targetRoom, events);
  next = effects.state;

  // Arriving on a floor by stairs is SAFE — no forced fight on the landing. Monsters
  // are met by walking the floor (chambers, corridors), never the moment you descend.

  return withEvents(next, events);
}

function search(state: GameState, world: ScenarioWorld): CommandResult {
  if (!state.position) {
    return noChange(state);
  }

  const room = getRoom(world, state.position.roomId);

  // Hidden passage: searching reveals any secret grid edges of this cell.
  const cell = getGridCellForRoom(world, room.id);
  const secretDirections = cell
    ? (Object.keys(cell.edges) as Direction[]).filter(
        (direction) => cell.edges[direction]?.kind === "secret" && !state.discoveredSecrets.includes(secretKey(room.id, direction))
      )
    : [];
  if (secretDirections.length > 0) {
    const next: GameState = {
      ...state,
      discoveredSecrets: [...state.discoveredSecrets, ...secretDirections.map((direction) => secretKey(room.id, direction))],
      turn: state.turn + 1
    };
    return withEvents(next, [{ type: "secret_found" }]);
  }

  // Gather point: a searchable resource node that yields its item once.
  const gatherKey = `gather:${room.id}`;
  if (room.gatherItem && !state.discoveredSecrets.includes(gatherKey)) {
    const item = createInventoryItemFromCatalog(world, room.gatherItem, 1);
    if (item) {
      const next: GameState = {
        ...state,
        inventory: addInventoryItem(state.inventory, item),
        discoveredSecrets: [...state.discoveredSecrets, gatherKey],
        turn: state.turn + 1
      };
      return withEvents(next, [
        { type: "inventory_item_gained", itemId: item.id, itemName: item.name, quantity: 1, source: "reward" }
      ]);
    }
  }

  if (!room.trap || state.resolvedTraps.includes(room.trap.id)) {
    return logOnly(state, { type: "search_completed", result: "none" });
  }

  const next: GameState = {
    ...state,
    discoveredSecrets: [...state.discoveredSecrets, room.trap.id],
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "trap_detected", trapId: room.trap.id, trapName: room.trap.name }]);
}

function disarmTrap(state: GameState, world: ScenarioWorld): CommandResult {
  if (!state.position) {
    return noChange(state);
  }

  const room = getRoom(world, state.position.roomId);
  if (!room.trap || state.resolvedTraps.includes(room.trap.id)) {
    return logOnly(state, { type: "trap_disarm_failed", reason: "none_active" });
  }

  const next: GameState = {
    ...state,
    resolvedTraps: [...state.resolvedTraps, room.trap.id],
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "trap_disarmed", trapId: room.trap.id, trapName: room.trap.name }]);
}

function attack(state: GameState, world: ScenarioWorld): CommandResult {
  if (state.phase !== "combat" || !state.combat) {
    return noChange(state);
  }

  const combat = normalizeCombat(state.combat);
  const actor = state.party.find((member) => member.hp > 0 && !member.injury && member.row === "front") ?? state.party[0];
  // Melee lands on the front line first; the back line only once it is exposed.
  const target =
    combat.enemyGroups.find((group) => meleeTargetableGroup(group, combat.enemyGroups)) ??
    combat.enemyGroups.find((group) => group.count > 0);
  if (!actor || !target) {
    return noChange(state);
  }

  return declareRound({ ...state, combat }, world, [{ actorId: actor.id, action: "attack", targetGroupId: target.id }]);
}

function declareRound(state: GameState, world: ScenarioWorld, actions: CombatActionDeclaration[]): CommandResult {
  if (state.phase !== "combat" || !state.combat) {
    return noChange(state);
  }

  const combat = normalizeCombat(state.combat);
  const validation = validateRoundActions(state.party, combat, actions, world);
  if (validation.event) {
    return withEvents({ ...state, combat }, [validation.event]);
  }

  const summaries: string[] = [];
  const beats: CombatBeat[] = [];
  const injuredEvents: GameEvent[] = [];
  let party = state.party;
  let inventory = state.inventory;
  let enemyGroups = combat.enemyGroups;

  // Record a beat: the text line plus a snapshot of the battlefield right AFTER it
  // resolved, so the UI can play the round forward one blow at a time. Reads the
  // live `party`/`enemyGroups` bindings at call time.
  const beat = (text: string, meta: Omit<Partial<CombatBeat>, "text" | "groups" | "party"> & { kind: CombatBeat["kind"] }): void => {
    summaries.push(text);
    beats.push({
      text,
      groups: enemyGroups.map((group) => ({ id: group.id, count: group.count, hpEach: group.hpEach })),
      party: party.map((member) => ({ id: member.id, hp: member.hp })),
      ...meta
    });
  };

  const orderedActions = [...validation.actions].sort((left, right) => {
    const leftActor = party.find((member) => member.id === left.actorId);
    const rightActor = party.find((member) => member.id === right.actorId);
    return (rightActor ? getInitiativeScore(rightActor, world) : 0) - (leftActor ? getInitiativeScore(leftActor, world) : 0);
  });

  for (const action of orderedActions) {
    const actor = party.find((member) => member.id === action.actorId);
    if (!actor || actor.hp <= 0 || actor.injury) {
      continue;
    }

    if (actor.status?.includes("sleep")) {
      beat(`${actor.name} is fast asleep.`, { kind: "asleep", actorId: actor.id, actorName: actor.name });
      continue;
    }

    if (action.action === "defend") {
      party = party.map((member) => (member.id === actor.id ? { ...member, status: uniqueStatuses([...(member.status ?? []), "ward"]) } : member));
      beat(`${actor.name} holds the line.`, { kind: "defend", actorId: actor.id, actorName: actor.name });
      continue;
    }

    if (action.action === "use_item" && action.itemId && action.targetCharacterId) {
      const used = applyHealingItemToParty(party, inventory, action.itemId, action.targetCharacterId, world);
      party = used.party;
      inventory = used.inventory;
      const healed = party.find((member) => member.id === action.targetCharacterId);
      beat(used.summary, { kind: "heal", actorId: actor.id, actorName: actor.name, targetCharacterId: action.targetCharacterId, targetName: healed?.name });
      continue;
    }

    if (action.action === "cast" && action.spellId) {
      const spell = SPELLS[action.spellId];
      // IMP-021C: an actor may cast only a technique on its combat loadout (which defaults to the
      // class's known spells until a player edits it).
      if (!spell || !combatLoadout(actor).includes(spell.id)) {
        continue;
      }
      if (actor.status?.includes("silence")) {
        beat(`${actor.name} is silenced and cannot cast.`, { kind: "cast", actorId: actor.id, actorName: actor.name, spellId: spell.id });
        continue;
      }
      if (actor.mp < spell.mpCost) {
        beat(`${actor.name} lacks the focus to cast ${spell.id}.`, { kind: "cast", actorId: actor.id, actorName: actor.name, spellId: spell.id });
        continue;
      }
      party = party.map((member) => (member.id === actor.id ? { ...member, mp: member.mp - spell.mpCost } : member));

      if (spell.effect.kind === "heal" && action.targetCharacterId) {
        const amount = spell.effect.amount + (spell.kind === "spell" ? getSpellPowerBonus(actor) : 0);
        let healedName = "";
        party = party.map((member) => {
          if (member.id !== action.targetCharacterId) {
            return member;
          }
          healedName = member.name;
          return { ...member, hp: Math.min(effectiveMaxHp(member, world), member.hp + amount) };
        });
        beat(`${actor.name} heals ${healedName}.`, { kind: "heal", actorId: actor.id, actorName: actor.name, targetCharacterId: action.targetCharacterId, targetName: healedName, spellId: spell.id });
      } else if (spell.effect.kind === "damage" && action.targetGroupId) {
        const group = enemyGroups.find((candidate) => candidate.id === action.targetGroupId && candidate.count > 0);
        if (group) {
          const raw = rollDamage(`${state.turn}:${combat.round}:${actor.id}:${group.id}:spell`, spell.effect.min, spell.effect.max, 0);
          const weakness = elementMultiplier(group.weaknesses, spell.effect.element);
          const spellPower = spell.kind === "spell" ? getSpellPowerBonus(actor) : 0;
          const damage = Math.round((raw + spellPower) * weakness);
          enemyGroups = damageGroup(enemyGroups, group.id, damage);
          const updated = enemyGroups.find((candidate) => candidate.id === group.id);
          // Martial 特技 land as strikes; arcane bolts scorch.
          const verb = spell.kind === "skill" ? "strikes" : "scorches";
          beat(
            `${actor.name} ${verb} ${group.name} for ${damage}${weakness > 1 ? " (weak!)" : ""}. ${updated?.count ?? 0} remain.`,
            { kind: spell.kind === "skill" ? "hit" : "cast", actorId: actor.id, actorName: actor.name, targetGroupId: group.id, targetEnemyId: group.enemyId, damage, remaining: updated?.count ?? 0, weak: weakness > 1, spellId: spell.id }
          );
        }
      } else if (spell.effect.kind === "status" && action.targetGroupId) {
        const ailment = spell.effect.status;
        const targetGroup = enemyGroups.find((group) => group.id === action.targetGroupId);
        const resist = statusResistPct(targetGroup?.resistances, ailment);
        const roll = rollPercent(`${state.turn}:${combat.round}:${actor.id}:${targetGroup?.id}:ailment`);
        if (roll >= getStatusSpellChance(actor, resist)) {
          beat(`${findGroupName(enemyGroups, action.targetGroupId)} resists ${spell.id}.`, { kind: "cast", actorId: actor.id, actorName: actor.name, targetGroupId: action.targetGroupId, targetEnemyId: targetGroup?.enemyId, spellId: spell.id, statusName: ailment });
        } else {
          enemyGroups = enemyGroups.map((group) =>
            group.id === action.targetGroupId ? { ...group, status: uniqueStatuses([...(group.status ?? []), ailment]) } : group
          );
          beat(`${actor.name} casts ${spell.id} on ${findGroupName(enemyGroups, action.targetGroupId)}.`, { kind: "cast", actorId: actor.id, actorName: actor.name, targetGroupId: action.targetGroupId, targetEnemyId: targetGroup?.enemyId, spellId: spell.id, statusName: ailment });
        }
      }
      continue;
    }

    if (action.action !== "attack" || !action.targetGroupId) {
      continue;
    }

    const group = enemyGroups.find((candidate) => candidate.id === action.targetGroupId && candidate.count > 0);
    if (!group) {
      continue;
    }

    const actorStats = getEffectiveCharacterStats(actor, world);
    const feared = actor.status?.includes("fear");
    const effectiveAccuracy = actorStats.accuracy - (feared ? FEAR_ACCURACY_PENALTY : 0);
    const hitRoll = rollPercent(`${state.turn}:${combat.round}:${actor.id}:${group.id}:hit`);
    if (hitRoll > effectiveAccuracy) {
      beat(`${actor.name} ${feared ? "flinches and misses" : "misses"} ${group.name}.`, { kind: "miss", actorId: actor.id, actorName: actor.name, targetGroupId: group.id, targetEnemyId: group.enemyId });
      continue;
    }

    const rawDamage = rollDamage(`${state.turn}:${combat.round}:${actor.id}:${group.id}:damage`, actorStats.damageMin, actorStats.damageMax, group.armor);
    const weakened = Math.round(rawDamage * elementMultiplier(group.weaknesses, actorStats.attackElement));
    const critChance = getCriticalChance(actor);
    const crit = rollPercent(`${state.turn}:${combat.round}:${actor.id}:${group.id}:crit`) < critChance;
    const damage = crit ? Math.round(weakened * CRIT_MULTIPLIER) : weakened;
    enemyGroups = damageGroup(enemyGroups, group.id, damage);
    const updated = enemyGroups.find((candidate) => candidate.id === group.id);
    beat(
      `${actor.name} ${crit ? "crits" : "hits"} ${group.name} for ${damage}. ${updated?.count ?? 0} remain.`,
      { kind: "hit", actorId: actor.id, actorName: actor.name, targetGroupId: group.id, targetEnemyId: group.enemyId, damage, remaining: updated?.count ?? 0, crit }
    );
  }

  const livingGroups = enemyGroups.filter((group) => group.count > 0);
  if (livingGroups.length === 0) {
    const xp = combat.enemyGroups.reduce((total, group) => total + group.xp * group.count, 0);
    const gold = combat.enemyGroups.reduce((total, group) => total + group.gold * group.count, 0);
    const defeatedEnemyIds = combat.enemyGroups.map((group) => group.enemyId);
    const defeatedNames = combat.enemyGroups.map((group) => group.name);
    const levelEvents: GameEvent[] = [];
    const grownParty = party.map((member) => {
      const rewarded: typeof member = {
        ...member,
        xp: member.xp + memberXpFromGroups(combat.enemyGroups, member.level),
        gold: member.gold + gold,
        vocation: applyMastery(resolveVocationState(member), memberMasteryFromGroups(combat.enemyGroups, member.level)),
        memory: {
          ...member.memory,
          notableVictories: Array.from(new Set([...member.memory.notableVictories, ...defeatedNames]))
        }
      };
      const leveled = applyLevelUps(rewarded);
      levelEvents.push(...leveled.events);
      return leveled.character;
    });
    const next: GameState = {
      ...state,
      phase: "dungeon",
      combat: null,
      combatConclusion: {
        enemyIds: defeatedEnemyIds,
        enemyNames: defeatedNames,
        xp,
        gold,
        levelUps: levelEvents
          .filter((event) => event.type === "character_leveled_up")
          .map((event) => ({ characterId: event.characterId, name: event.characterName, level: event.level })),
        resumePosition: state.position ? { ...state.position } : null
      },
      party: grownParty,
      partyGold: state.partyGold + gold,
      inventory,
      defeatedEnemies: Array.from(new Set([...state.defeatedEnemies, ...defeatedEnemyIds])),
      floorClearedEnemies: Array.from(new Set([...state.floorClearedEnemies, ...defeatedEnemyIds])),
      quests: recordQuestKills(
        state.quests,
        world,
        combat.enemyGroups.map((group) => ({ enemyId: group.enemyId, bodies: group.initialCount ?? group.count }))
      ),
      turn: state.turn + 1
    };

    return withEvents(next, [
      { type: "combat_round_resolved", round: combat.round, summaries, beats },
      ...defeatedNames.map((enemyName, index) => ({
        type: "enemy_defeated" as const,
        enemyId: defeatedEnemyIds[index],
        enemyName
      })),
      { type: "combat_rewards", xp, gold, enemyNames: defeatedNames, enemyIds: defeatedEnemyIds },
      ...levelEvents
    ]);
  }

  for (const group of livingGroups.sort((left, right) => right.speed - left.speed)) {
    if (group.status?.includes("sleep")) {
      beat(`${group.name} is asleep.`, { kind: "asleep", targetGroupId: group.id, targetEnemyId: group.enemyId });
      continue;
    }

    const target = chooseEnemyTarget(party);
    if (!target) {
      continue;
    }

    const ability = selectEnemyAbility(group.abilities, `${state.turn}:${combat.round}:${group.id}`);
    if (ability) {
      if (ability.effect.kind === "damage") {
        const targetStats = getEffectiveCharacterStats(target, world);
        const guarded = target.status?.includes("ward");
        const armor = targetStats.armor + (guarded ? 2 : 0);
        const rawAbilityDamage = rollDamage(
          `${state.turn}:${combat.round}:${group.id}:${target.id}:ability`,
          ability.effect.min,
          ability.effect.max,
          armor
        );
        const resistMult = targetStats.elementResist[ability.effect.element] ?? 1;
        const damage = Math.max(0, Math.round(rawAbilityDamage * resistMult));
        party = damagePartyMember(party, target.id, damage, injuredEvents);
        beat(`${group.name} looses ${ability.name} at ${target.name} for ${damage}.`, { kind: "enemyHit", actorEnemyId: group.enemyId, targetCharacterId: target.id, targetName: target.name, damage, abilityName: ability.name });
      } else {
        const resist = statusResistPct(getEffectiveCharacterStats(target, world).resistance, ability.effect.status);
        const roll = rollPercent(`${state.turn}:${combat.round}:${group.id}:${target.id}:ability-resist`);
        if (roll >= resist) {
          const ailment = ability.effect.status;
          party = party.map((member) =>
            member.id === target.id && !member.injury
              ? { ...member, status: uniqueStatuses([...(member.status ?? []), ailment]) }
              : member
          );
          beat(`${group.name} works ${ability.name}, afflicting ${target.name} with ${ailment}.`, { kind: "status", actorEnemyId: group.enemyId, targetCharacterId: target.id, targetName: target.name, abilityName: ability.name, statusName: ailment });
        } else {
          beat(`${target.name} shrugs off ${group.name}'s ${ability.name}.`, { kind: "status", actorEnemyId: group.enemyId, targetCharacterId: target.id, targetName: target.name, abilityName: ability.name });
        }
      }
      continue;
    }

    const hitRoll = rollPercent(`${state.turn}:${combat.round}:${group.id}:${target.id}:hit`);
    if (hitRoll > Math.max(5, group.accuracy - getEvasionChance(target, world))) {
      beat(`${group.name} misses ${target.name}.`, { kind: "miss", actorEnemyId: group.enemyId, targetCharacterId: target.id, targetName: target.name });
      continue;
    }

    const targetStats = getEffectiveCharacterStats(target, world);
    const guarded = target.status?.includes("ward");
    const armor = targetStats.armor + (guarded ? 2 : 0);
    const damage = rollDamage(`${state.turn}:${combat.round}:${group.id}:${target.id}:damage`, group.damageMin, group.damageMax, armor);
    party = damagePartyMember(party, target.id, damage, injuredEvents);
    beat(`${group.name} wounds ${target.name} for ${damage}.`, { kind: "enemyHit", actorEnemyId: group.enemyId, targetCharacterId: target.id, targetName: target.name, damage });

    if (group.inflicts) {
      const ailment = group.inflicts;
      const resist = statusResistPct(getEffectiveCharacterStats(target, world).resistance, ailment.status);
      const inflictRoll = rollPercent(`${state.turn}:${combat.round}:${group.id}:${target.id}:inflict`);
      const resistRoll = rollPercent(`${state.turn}:${combat.round}:${group.id}:${target.id}:resist`);
      if (inflictRoll < ailment.chance && resistRoll >= resist) {
        party = party.map((member) =>
          member.id === target.id && !member.injury
            ? { ...member, status: uniqueStatuses([...(member.status ?? []), ailment.status]) }
            : member
        );
        beat(`${target.name} is afflicted with ${ailment.status}.`, { kind: "status", targetCharacterId: target.id, targetName: target.name, statusName: ailment.status });
      }
    }
  }

  // Round-end: poison bites the party and ailments roll to wear off.
  party = party.map((member) => {
    const tick = tickStatusList(member.status, `${state.turn}:${combat.round}:${member.id}`);
    if (tick.poisonDamage > 0 && !member.injury) {
      summaries.push(`Poison gnaws ${member.name} for ${tick.poisonDamage}.`);
    }
    const hp = member.injury ? member.hp : Math.max(1, member.hp - tick.poisonDamage);
    return { ...member, hp, status: tick.statuses };
  });
  const tickedGroups = livingGroups.map((group) => {
    const tick = tickStatusList(group.status, `${state.turn}:${combat.round}:${group.id}`);
    tick.wornOff
      .filter((status) => status !== "ward")
      .forEach((status) => summaries.push(`${group.name} shakes off ${status}.`));
    return { ...group, status: tick.statuses };
  });
  const nextCombat = syncCombatEnemy({
    ...combat,
    round: combat.round + 1,
    enemyGroups: tickedGroups,
    pendingActions: []
  });

  // PARTY WIPE. Nobody dies in this game — hp<=0 becomes hp:1 + `wounded`, and a
  // wounded member cannot act. So once EVERY member is wounded there are zero able
  // actors and the fight can never be advanced, fled, or won: the run soft-locked in
  // combat forever. The expedition now FAILS instead: the party is dragged back to
  // town, still wounded (they must pay the infirmary), minus a rescue fee.
  const noOneCanAct = party.every((member) => member.injury || member.hp <= 0);
  if (noOneCanAct) {
    const rescueFee = Math.floor(state.partyGold / 2);
    const wiped: GameState = {
      ...state,
      phase: "town",
      position: null,
      combat: null,
      party,
      inventory,
      partyGold: state.partyGold - rescueFee,
      map: {
        ...state.map,
        currentRoomId: null,
        currentCellId: null,
        currentFacing: null
      },
      turn: state.turn + 1
    };

    return withEvents(wiped, [
      { type: "combat_round_resolved", round: combat.round, summaries, beats },
      ...injuredEvents,
      { type: "party_wiped", rescueFee }
    ]);
  }

  const next: GameState = {
    ...state,
    combat: nextCombat,
    party,
    inventory,
    turn: state.turn + 1
  };

  return withEvents(next, [
    { type: "combat_round_resolved", round: combat.round, summaries, beats },
    ...injuredEvents
  ]);
}

function defend(state: GameState): CommandResult {
  if (state.phase !== "combat" || !state.combat) {
    return noChange(state);
  }

  const damage = Math.max(0, state.combat.enemy.attack - 2);
  const next: GameState = {
    ...state,
    party: state.party.map((member) => ({ ...member, hp: Math.max(1, member.hp - damage) })),
    turn: state.turn + 1
  };

  return withEvents(next, [
    {
      type: "party_defended",
      enemyId: state.combat.enemy.id,
      enemyName: state.combat.enemy.name,
      damage
    }
  ]);
}

// Debug: end the current fight as a win, awarding the same rewards / level-ups /
// first-contact bookkeeping the party would earn by clearing it normally. Lets a
// playtester skip a fight that isn't what they're testing. No-op outside combat.
function debugForceVictory(state: GameState, world: ScenarioWorld): CommandResult {
  const combat = state.combat;
  if (state.phase !== "combat" || !combat) {
    return noChange(state);
  }

  const xp = combat.enemyGroups.reduce((total, group) => total + group.xp * group.count, 0);
  const gold = combat.enemyGroups.reduce((total, group) => total + group.gold * group.count, 0);
  const defeatedEnemyIds = combat.enemyGroups.map((group) => group.enemyId);
  const defeatedNames = combat.enemyGroups.map((group) => group.name);
  const levelEvents: GameEvent[] = [];
  const grownParty = state.party.map((member) => {
    const rewarded: typeof member = {
      ...member,
      xp: member.xp + memberXpFromGroups(combat.enemyGroups, member.level),
      gold: member.gold + gold,
      vocation: applyMastery(resolveVocationState(member), memberMasteryFromGroups(combat.enemyGroups, member.level)),
      memory: {
        ...member.memory,
        notableVictories: Array.from(new Set([...member.memory.notableVictories, ...defeatedNames]))
      }
    };
    const leveled = applyLevelUps(rewarded);
    levelEvents.push(...leveled.events);
    return leveled.character;
  });

  const next: GameState = {
    ...state,
    phase: "dungeon",
    combat: null,
    combatConclusion: {
      enemyIds: defeatedEnemyIds,
      enemyNames: defeatedNames,
      xp,
      gold,
      levelUps: levelEvents
        .filter((event) => event.type === "character_leveled_up")
        .map((event) => ({ characterId: event.characterId, name: event.characterName, level: event.level })),
      resumePosition: state.position ? { ...state.position } : null
    },
    party: grownParty,
    partyGold: state.partyGold + gold,
    defeatedEnemies: Array.from(new Set([...state.defeatedEnemies, ...defeatedEnemyIds])),
    floorClearedEnemies: Array.from(new Set([...state.floorClearedEnemies, ...defeatedEnemyIds])),
    quests: recordQuestKills(
      state.quests,
      world,
      combat.enemyGroups.map((group) => ({ enemyId: group.enemyId, bodies: group.initialCount ?? group.count }))
    ),
    turn: state.turn + 1
  };

  return withEvents(next, [
    ...defeatedNames.map((enemyName, index) => ({
      type: "enemy_defeated" as const,
      enemyId: defeatedEnemyIds[index],
      enemyName
    })),
    { type: "combat_rewards", xp, gold, enemyNames: defeatedNames, enemyIds: defeatedEnemyIds },
    ...levelEvents
  ]);
}

function continueAfterCombat(state: GameState): CommandResult {
  const conclusion = state.combatConclusion;
  if (!conclusion) {
    return noChange(state);
  }

  const position = conclusion.resumePosition ? { ...conclusion.resumePosition } : state.position;
  return {
    state: {
      ...state,
      phase: "dungeon",
      combatConclusion: null,
      position,
      map: position
        ? {
            ...state.map,
            currentRoomId: position.roomId,
            currentCellId: position.cellId ?? state.map.currentCellId ?? null,
            currentFacing: position.facing
          }
        : state.map
    },
    events: []
  };
}

// Debug: fully restore the party in place — HP, MP, injuries, and round statuses.
// Meant for the "revive after a wipe and keep playing" playtest loop; works mid-
// combat (unsticks a downed party) or while exploring.
function debugReviveParty(state: GameState): CommandResult {
  const party = state.party.map((member) => ({
    ...member,
    hp: member.maxHp,
    mp: member.maxMp,
    injury: undefined,
    status: []
  }));

  return withEvents({ ...state, party }, [
    { type: "debug_started", text: "Debug: party fully revived and restored." }
  ]);
}

function useEscapeItem(state: GameState, world: ScenarioWorld, item: GameState["inventory"][number]): CommandResult {
  if (state.phase !== "dungeon" || !state.position) {
    return noChange(state);
  }

  // The escape charm is barred on the boss floor: the finale is a commitment.
  if (isBossFloor(world, state.map.floorId)) {
    return logOnly(state, { type: "command_blocked", reason: "town_return_unavailable", command: "return_to_town" });
  }

  const next: GameState = {
    ...state,
    phase: "town",
    position: null,
    combat: null,
    map: {
      ...state.map,
      currentRoomId: null,
      currentCellId: null,
      currentFacing: null
    },
    inventory: state.inventory.map((candidate) =>
      candidate.id === item.id ? { ...candidate, quantity: Math.max(0, candidate.quantity - 1) } : candidate
    ),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "returned_to_town" }]);
}

function useItem(state: GameState, world: ScenarioWorld, itemId: string, targetCharacterId: string): CommandResult {
  const item = state.inventory.find((candidate) => candidate.id === itemId && candidate.quantity > 0);
  if (item?.kind === "escape") {
    return useEscapeItem(state, world, item);
  }
  if (item?.kind === "growth" && item.grants) {
    return useGrowthItem(state, world, item, targetCharacterId);
  }

  const target = state.party.find((member) => member.id === targetCharacterId);
  const isConsumable = item && (item.kind === "healing" || item.kind === "cure" || item.kind === "focus");
  if (!item || !target || !isConsumable) {
    return noChange(state);
  }

  const applied = applyHealingItemToParty(state.party, state.inventory, itemId, targetCharacterId, world);
  const next: GameState = {
    ...state,
    party: applied.party,
    inventory: applied.inventory,
    turn: state.turn + 1
  };

  return withEvents(next, [
    {
      type: "item_used",
      itemId: item.id,
      itemName: item.name,
      targetCharacterId: target.id,
      targetName: target.name,
      healAmount: item.healAmount ?? 0
    }
  ]);
}


// A growth item raises a member permanently, or grants XP directly. Used OUTSIDE combat only, so
// the XP grant never routes through the combat-reward path and is untouched by the out-levelling
// falloff — this is the mechanical reason "成長アイテムでの稼ぎはOK" holds. Consumes one.
function useGrowthItem(state: GameState, world: ScenarioWorld, item: InventoryItem, targetCharacterId: string): CommandResult {
  if (state.phase === "combat") {
    return noChange(state);
  }
  const target = state.party.find((member) => member.id === targetCharacterId);
  const grants = item.grants;
  if (!target || !grants) {
    return noChange(state);
  }

  const levelBefore = target.level;
  const grown = state.party.map((member) => {
    if (member.id !== target.id) {
      return member;
    }
    const raisedAptitude = {
      ...member.aptitude,
      might: member.aptitude.might + (grants.might ?? 0),
      agility: member.aptitude.agility + (grants.agility ?? 0),
      spirit: member.aptitude.spirit + (grants.spirit ?? 0),
      wit: member.aptitude.wit + (grants.wit ?? 0),
      luck: member.aptitude.luck + (grants.luck ?? 0)
    };
    const maxHp = member.maxHp + (grants.maxHp ?? 0);
    const maxMp = member.maxMp + (grants.maxMp ?? 0);
    let next: Character = {
      ...member,
      aptitude: raisedAptitude,
      maxHp,
      hp: member.hp + (grants.maxHp ?? 0), // the new HP is usable immediately
      maxMp,
      mp: member.mp + (grants.maxMp ?? 0),
      attack: member.attack + (grants.attack ?? 0),
      damageMin: member.damageMin + (grants.attack ?? 0),
      damageMax: member.damageMax + (grants.attack ?? 0),
      xp: member.xp + (grants.xp ?? 0)
    };
    if (grants.xp) {
      next = applyLevelUps(next).character;
    }
    return next;
  });

  const grownTarget = grown.find((member) => member.id === target.id)!;
  const next: GameState = {
    ...state,
    party: grown,
    inventory: state.inventory.map((candidate) =>
      candidate.id === item.id ? { ...candidate, quantity: Math.max(0, candidate.quantity - 1) } : candidate
    ),
    turn: state.turn + 1
  };
  const events: GameEvent[] = [
    { type: "item_used", itemId: item.id, itemName: item.name, targetCharacterId: target.id, targetName: target.name, healAmount: 0 }
  ];
  if (grownTarget.level > levelBefore) {
    events.push({ type: "character_leveled_up", characterId: target.id, characterName: target.name, level: grownTarget.level });
  }
  return withEvents(next, events);
}

function discardItem(state: GameState, itemId: string, plus?: number, affix?: string): CommandResult {
  if (state.phase === "combat") {
    return noChange(state);
  }

  const key = equipmentInstanceKey(itemId, plus, affix);
  const item = state.inventory.find(
    (candidate) => equipmentInstanceKey(candidate.id, candidate.plus, candidate.affix) === key && candidate.quantity > 0
  );
  const protectedKind = item && ["key", "treasure", "escape"].includes(item.kind);
  const equippedCount = state.party.reduce(
    (count, member) =>
      count +
      Object.values(member.equipment).filter(
        (entry) => entry && equipmentInstanceKey(entry.id, entry.plus, entry.affix) === key
      ).length,
    0
  );
  if (!item || protectedKind || item.quantity <= equippedCount) {
    return noChange(state);
  }

  return withEvents(
    {
      ...state,
      inventory: removeInventoryItem(state.inventory, itemId, 1, plus, affix),
      turn: state.turn + 1
    },
    [{ type: "item_discarded", itemId: item.id, itemName: item.name }]
  );
}

// Take a quest off the board. Only in town, and only once: an already-accepted quest keeps its
// record (a repeatable one stays "active" across claims; a one-shot ends "done"), so getQuestProgress
// being set blocks re-accepting either.
function acceptQuest(state: GameState, world: ScenarioWorld, questId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const quest = findQuest(world, questId);
  if (!quest || getQuestProgress(state, questId)) {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    quests: [...state.quests, { questId, status: "active", killCount: 0, claims: 0 }],
    turn: state.turn + 1
  };
  return withEvents(next, [{ type: "quest_accepted", questId, questName: quest.name }]);
}

// Turn a met quest in for its reward. A bounty must have tallied enough kills; a delivery must be
// carrying enough of its target item (which it hands over). Gold and item rewards land in the
// party's purse/pack; an XP reward is granted DIRECTLY to each active member, so — like a growth
// item's xp — it never runs through the out-levelling falloff. A repeatable quest resets to active
// for another run; a one-shot is marked done.
function claimQuest(state: GameState, world: ScenarioWorld, questId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const quest = findQuest(world, questId);
  const progress = getQuestProgress(state, questId);
  if (!quest || !progress || !isQuestReadyToClaim(state, quest, progress)) {
    return noChange(state);
  }

  const levelEvents: GameEvent[] = [];
  const xpGrant = quest.reward.xp ?? 0;
  const party = state.party.map((member) => {
    if (xpGrant <= 0) {
      return member;
    }
    const leveled = applyLevelUps({ ...member, xp: member.xp + xpGrant });
    levelEvents.push(...leveled.events);
    return leveled.character;
  });

  // A delivery consumes the items it hands over.
  let inventory = state.inventory;
  if (quest.kind === "delivery" && quest.targetItemId) {
    inventory = removeInventoryItem(inventory, quest.targetItemId, quest.requiredCount);
  }
  // An item reward drops into the pack.
  let rewardItemName: string | undefined;
  if (quest.reward.itemId) {
    const rewardItem = createInventoryItemFromCatalog(world, quest.reward.itemId, quest.reward.itemQuantity ?? 1);
    if (rewardItem) {
      inventory = addInventoryItem(inventory, rewardItem);
      rewardItemName = rewardItem.name;
    }
  }

  const claimedProgress = {
    ...progress,
    claims: progress.claims + 1,
    killCount: 0,
    status: quest.repeatable ? ("active" as const) : ("done" as const)
  };

  const next: GameState = {
    ...state,
    party,
    partyGold: state.partyGold + (quest.reward.gold ?? 0),
    inventory,
    quests: state.quests.map((entry) => (entry.questId === questId ? claimedProgress : entry)),
    turn: state.turn + 1
  };
  return withEvents(next, [
    {
      type: "quest_claimed",
      questId,
      questName: quest.name,
      gold: quest.reward.gold ?? 0,
      xp: xpGrant,
      itemName: rewardItemName
    },
    ...levelEvents
  ]);
}

// IMP-021C: change an adventurer's vocation in town. Only if its prerequisites are met; keeps level
// and every learned technique (changeCharacterVocation). A basic vocation reclasses the base stats;
// an advanced one layers its modifiers.
function changeVocationCommand(state: GameState, world: ScenarioWorld, characterId: string, vocationId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  const vocation = findVocation(world, vocationId);
  if (!member || !vocation || !canAdoptVocation(member, vocationId, world)) {
    return noChange(state);
  }
  if (resolveVocationState(member).current === vocationId) {
    return noChange(state);
  }
  const changed = changeCharacterVocation(member, vocation, world);
  const next: GameState = {
    ...state,
    party: state.party.map((candidate) => (candidate.id === characterId ? changed : candidate)),
    turn: state.turn + 1
  };
  return withEvents(next, [
    { type: "vocation_changed", characterId, characterName: member.name, vocationId, vocationName: localizedVocationName(world, vocationId, "en") }
  ]);
}

// IMP-021C: set an adventurer's bounded combat loadout (a subset of learned techniques). Town only.
function setLoadoutCommand(state: GameState, characterId: string, loadout: string[]): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  if (!member) {
    return noChange(state);
  }
  const nextVocation = setLoadout(resolveVocationState(member), loadout);
  return {
    state: {
      ...state,
      party: state.party.map((candidate) => (candidate.id === characterId ? { ...candidate, vocation: nextVocation } : candidate))
    },
    events: []
  };
}

// The equipmentInstanceKeys currently worn by the party — bulk conversion must not touch worn gear.
function equippedInstanceKeys(state: GameState): Set<string> {
  const keys = new Set<string>();
  for (const member of state.party) {
    for (const equipped of Object.values(member.equipment)) {
      if (equipped) {
        keys.add(equipmentInstanceKey(equipped.id, equipped.plus, equipped.affix));
      }
    }
  }
  return keys;
}

// IMP-022C: appraise an unidentified rare, revealing its rolled affix. Town only.
function appraiseItemCommand(state: GameState, instanceId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const item = state.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!item || !isUnidentifiedRare(item)) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    inventory: state.inventory.map((candidate) => (candidate.instanceId === instanceId ? appraiseInstance(candidate) : candidate)),
    turn: state.turn + 1
  };
  return withEvents(next, [
    { type: "item_appraised", itemId: item.id, itemName: item.name, affix: item.affix, rarity: item.rarity ?? "rare" }
  ]);
}

// IMP-022C: toggle a per-instance protection flag (lock / favorite). Town only, no turn cost.
function toggleItemFlagCommand(state: GameState, instanceId: string, flag: "locked" | "favorite"): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const item = state.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!item) {
    return noChange(state);
  }
  return {
    state: {
      ...state,
      inventory: state.inventory.map((candidate) =>
        candidate.instanceId === instanceId ? { ...candidate, [flag]: !candidate[flag] } : candidate
      )
    },
    events: []
  };
}

// IMP-022C: convert every UNPROTECTED equipment item at once — sell for gold or dismantle for
// materials. Equipped / locked / favorite / unidentified-rare items are left untouched (the guard).
function bulkConvertCommand(state: GameState, world: ScenarioWorld, mode: "sell" | "dismantle"): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const equippedKeys = equippedInstanceKeys(state);
  const convertible = state.inventory.filter(
    (item) => item.kind === "equipment" && !isProtectedFromBulk(item, equippedKeys)
  );
  if (convertible.length === 0) {
    return noChange(state);
  }
  const goldGained = mode === "sell" ? convertible.reduce((total, item) => total + sellValueOf(item) * item.quantity, 0) : 0;
  const materialsGained = mode === "dismantle" ? convertible.reduce((total, item) => total + dismantleYield(item), 0) : 0;
  const convertedCount = convertible.reduce((total, item) => total + item.quantity, 0);
  const convertedKeys = new Set(convertible.map((item) => item.instanceId ?? equipmentInstanceKey(item.id, item.plus, item.affix)));

  const next: GameState = {
    ...state,
    inventory: state.inventory.filter(
      (item) => !convertedKeys.has(item.instanceId ?? equipmentInstanceKey(item.id, item.plus, item.affix))
    ),
    partyGold: state.partyGold + goldGained,
    materials: (state.materials ?? 0) + materialsGained,
    turn: state.turn + 1
  };
  return withEvents(next, [
    { type: "bulk_converted", mode, count: convertedCount, gold: goldGained, materials: materialsGained }
  ]);
}

function buyItem(state: GameState, world: ScenarioWorld, shopId: string, itemId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const shop = world.shops.find((candidate) => candidate.id === shopId);
  const stock = shop?.stock?.find((candidate) => candidate.itemId === itemId);
  if (!shop || !stock || !isStockAvailable(stock, state)) {
    return noChange(state);
  }

  if (state.partyGold < stock.price) {
    return noChange(state);
  }

  const item = createInventoryItemFromCatalog(world, itemId, 1);
  if (!item) {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    partyGold: state.partyGold - stock.price,
    inventory: addInventoryItem(state.inventory, item),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "item_bought", itemId, itemName: item.name, gold: stock.price }]);
}

function sellItem(state: GameState, world: ScenarioWorld, itemId: string, plus?: number, affix?: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const key = equipmentInstanceKey(itemId, plus, affix);
  const item = state.inventory.find(
    (candidate) => equipmentInstanceKey(candidate.id, candidate.plus, candidate.affix) === key && candidate.quantity > 0
  );
  if (!item) {
    return noChange(state);
  }
  // Only the exact equipped instance is protected from selling.
  if (
    state.party.some((member) =>
      Object.values(member.equipment).some((slot) => slot && equipmentInstanceKey(slot.id, slot.plus, slot.affix) === key)
    )
  ) {
    return noChange(state);
  }

  const catalogValue =
    item.sellValue ??
    world.items.find((candidate) => candidate.id === itemId)?.sellValue ??
    world.equipment.find((candidate) => candidate.id === itemId)?.sellValue ??
    0;
  if (catalogValue <= 0) {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    partyGold: state.partyGold + catalogValue,
    inventory: removeInventoryItem(state.inventory, itemId, 1, plus, affix),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "item_sold", itemId, itemName: item.name, gold: catalogValue }]);
}

function equipItem(
  state: GameState,
  world: ScenarioWorld,
  characterId: string,
  equipmentId: string,
  plus?: number,
  affix?: string
): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const key = equipmentInstanceKey(equipmentId, plus, affix);
  const item = state.inventory.find(
    (candidate) => equipmentInstanceKey(candidate.id, candidate.plus, candidate.affix) === key && candidate.quantity > 0
  );
  const equipment = findEquipment(world, equipmentId);
  const slot = getEquipmentSlot(world, equipmentId);
  const character = state.party.find((member) => member.id === characterId);
  if (!item || item.kind !== "equipment" || !equipment || !slot || !character || !isEquipmentUsableBy(equipment, character)) {
    return noChange(state);
  }

  const equippedOwners = state.party.flatMap((member) =>
    Object.entries(member.equipment)
      .filter(([, equipped]) => equipped && equipmentInstanceKey(equipped.id, equipped.plus, equipped.affix) === key)
      .map(([memberSlot]) => ({ characterId: member.id, slot: memberSlot as EquipmentSlot }))
  );
  const targetAlreadyHasInstance = equippedOwners.some((owner) => owner.characterId === characterId);
  const transferFrom = !targetAlreadyHasInstance && equippedOwners.length >= item.quantity
    ? equippedOwners.find((owner) => owner.characterId !== characterId)
    : undefined;

  const next: GameState = {
    ...state,
    party: state.party.map((member) => {
      const nextEquipment = { ...member.equipment };
      if (transferFrom?.characterId === member.id) {
        delete nextEquipment[transferFrom.slot];
      }
      if (member.id === characterId) {
        nextEquipment[slot] = { id: equipmentId, plus, affix };
      }
      return { ...member, equipment: nextEquipment };
    }),
    turn: state.turn + 1
  };

  return withEvents(next, [
    { type: "equipment_changed", itemId: equipmentId, characterName: character.name, itemName: equipment.name, slot }
  ]);
}

function retreat(state: GameState): CommandResult {
  if (state.phase !== "combat") {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    phase: "dungeon",
    combat: null,
    party: state.party.map((member) => ({
      ...member,
      memory: { ...member.memory, retreats: member.memory.retreats + 1 }
    })),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "party_retreated" }]);
}

// Under-strength descents are punished by numbers, not by a gate: a party below a
// floor's recommended level and/or head-count meets bigger packs. Tuned so an
// adequate party sees the base count, while a low-level solo faces a swarm.
const UNDERPOWER = { levelWeight: 0.5, sizeWeight: 0.35, maxFactor: 2.5, maxExtraUnits: 4, absoluteMax: 8 };

export function floorForRoom(world: ScenarioWorld, roomId: string): DungeonFloor | undefined {
  return world.dungeons.find((dungeon) => dungeon.rooms.some((room) => room.id === roomId));
}

export function underpowerFactor(party: Character[], floor: DungeonFloor | undefined): number {
  if (!floor || party.length === 0) {
    return 1;
  }
  const recommendedLevel = floor.recommendedPartyLevel ?? 1;
  const recommendedSize = floor.recommendedPartySize ?? 1;
  const averageLevel = party.reduce((total, member) => total + (member.level ?? 1), 0) / party.length;
  const levelShortfall = Math.max(0, recommendedLevel - averageLevel);
  const sizeShortfall = Math.max(0, recommendedSize - party.length);
  const factor = 1 + UNDERPOWER.levelWeight * levelShortfall + UNDERPOWER.sizeWeight * sizeShortfall;
  return Math.min(factor, UNDERPOWER.maxFactor);
}

// Scale a rolled pack up for an under-strength party (capped so a group stays
// readable). Fixed single-enemy teaching fights are never routed through this.
export function scaledEncounterCount(baseCount: number, party: Character[], floor: DungeonFloor | undefined): number {
  const scaled = Math.round(baseCount * underpowerFactor(party, floor));
  return Math.min(scaled, baseCount + UNDERPOWER.maxExtraUnits, UNDERPOWER.absoluteMax);
}

// Resolve whatever fight a room begins on entry: a fixed squad (front + back line),
// a fixed teaching fight, or a rolled pack (swelled for an under-strength party).
// Returns null when nothing fires (already cleared, or no encounter).
function beginRoomEncounter(
  world: ScenarioWorld,
  room: DungeonRoom,
  state: GameState
): { combat: CombatState; event: GameEvent } | null {
  const squad = room.encounterSquad
    ?.map((enemyId) => world.enemies.find((enemy) => enemy.id === enemyId))
    .filter((enemy): enemy is Enemy => Boolean(enemy));
  if (squad && squad.length >= 2 && !state.floorClearedEnemies.includes(squad[0].id)) {
    return {
      combat: createSquadCombatState(room.id, squad),
      event: { type: "enemy_encountered", enemyId: squad[0].id, enemyName: squad.map((enemy) => enemy.name).join(" & "), roomId: room.id }
    };
  }

  const fixedFight = Boolean(room.encounter);
  const rolled = room.encounter
    ? [{ enemy: world.enemies.find((enemy) => enemy.id === room.encounter?.id) ?? room.encounter, count: 1 }]
    : room.encounterTable
      ? resolveEncounterTable(world, room.encounterTable, state.turn)
      : [];
  // First-contact model: drop groups whose type is already down this run; if the
  // whole roll is stale there is no fight. EXCEPTION — a designed multi-group table
  // (groupsMax >= 2) that rolled distinct types fires while ANY type is still fresh,
  // keeping the whole pack, so mixed-type fights actually appear despite first
  // contact (a carryover type may reappear once as a side group). Both types are
  // then marked defeated, so the mixed fight never repeats.
  const table = room.encounterTable
    ? world.encounterTables.find((candidate) => candidate.id === room.encounterTable)
    : undefined;
  // Suppression is scoped to THIS FLOOR VISIT: leave and come back and the chambers
  // (玄室) are repopulated. Run-long `defeatedEnemies` is only the record.
  const fresh = selectEncounterGroups(rolled, state.floorClearedEnemies, table?.groupsMax ?? 1);
  if (fresh.length === 0) {
    return null;
  }

  const floorId = floorForRoom(world, room.id);
  // A rolled pack swells for an under-strength party; the fixed teaching fight does not.
  const scaled = fresh.map((group) => ({
    enemy: group.enemy,
    count: fixedFight ? group.count : scaledEncounterCount(group.count, state.party, floorId)
  }));
  const combat = scaled.length === 1
    ? createCombatState(room.id, scaled[0].enemy, scaled[0].count)
    : createMultiGroupCombatState(room.id, scaled);
  const label = scaled.map((group) => (group.count > 1 ? `${group.enemy.name} x${group.count}` : group.enemy.name)).join(" & ");
  return {
    combat,
    event: {
      type: "enemy_encountered",
      enemyId: scaled[0].enemy.id,
      enemyName: label,
      roomId: room.id
    }
  };
}

// Pick which rolled groups actually fight, honoring the first-contact model. A
// single-type roll keeps only fresh (undefeated) types. A DESIGNED mixed roll
// (groupsMax >= 2, more than one distinct type) fires while ANY type is still fresh
// and keeps the whole pack — so mixed-type fights show up even when one type has
// been met before (that carryover type reappears once, then is marked defeated with
// the rest). This is the deliberate exception that makes 複数種 fights visible.
export function selectEncounterGroups<T extends { enemy: { id: string } }>(
  rolled: T[],
  defeated: readonly string[],
  groupsMax: number
): T[] {
  const isFresh = (id: string) => !defeated.includes(id);
  const designedMixed = groupsMax >= 2 && rolled.length > 1;
  if (designedMixed) {
    return rolled.some((group) => isFresh(group.enemy.id)) ? rolled : [];
  }
  return rolled.filter((group) => isFresh(group.enemy.id));
}

export function createCombatState(roomId: string, enemy: Enemy, count = 1): CombatState {
  const group = createEnemyGroup(enemy, count);
  return {
    enemy: { ...enemy },
    roomId,
    round: 1,
    enemyGroups: [group],
    pendingActions: [],
    selectedTargetId: group.id
  };
}

// A multi-group encounter (distinct types side by side). All groups are front-line
// and freely targetable — no squad shielding (that is createSquadCombatState).
export function createMultiGroupCombatState(roomId: string, groups: { enemy: Enemy; count: number }[]): CombatState {
  const enemyGroups = groups.map((group) => createEnemyGroup(group.enemy, group.count));
  return {
    enemy: { ...groups[0].enemy },
    roomId,
    round: 1,
    enemyGroups,
    pendingActions: [],
    selectedTargetId: enemyGroups[0].id
  };
}

// Roll an encounter into 1..groupsMax DISTINCT enemy groups (FC-style multi-group
// fights), each with its own count. Distinct entries are drawn by weight without
// replacement so a fight can field different monster types side by side.
export function resolveEncounterTable(world: ScenarioWorld, tableId: string, seed: number): { enemy: Enemy; count: number }[] {
  const table = world.encounterTables.find((candidate) => candidate.id === tableId);
  if (!table || table.entries.length === 0) {
    return [];
  }

  const groupsMax = Math.min(Math.max(1, table.groupsMax ?? 1), table.entries.length);
  // A designed multi-group table (groupsMax >= 2) reliably fields its full spread of
  // distinct types — with only ~one fight per floor under first contact, a coin-flip
  // group count would too often hide the mixed fight. Single tables field one group.
  const groupCount = groupsMax;

  const remaining = [...table.entries];
  const chosen: typeof table.entries = [];
  for (let picked = 0; picked < groupCount && remaining.length > 0; picked += 1) {
    const totalWeight = remaining.reduce((total, entry) => total + entry.weight, 0);
    let roll = hashSeed(`${tableId}:${seed}:pick${picked}`) % totalWeight;
    const index = remaining.findIndex((candidate) => {
      roll -= candidate.weight;
      return roll < 0;
    });
    chosen.push(remaining.splice(index < 0 ? 0 : index, 1)[0]);
  }

  return chosen
    .map((entry, groupIndex) => {
      const enemy = world.enemies.find((candidate) => candidate.id === entry.enemyId);
      if (!enemy) {
        return null;
      }
      const min = entry.minCount ?? 1;
      const max = entry.maxCount ?? min;
      const count = min + (hashSeed(`${tableId}:${seed}:count${groupIndex}`) % (max - min + 1));
      return { enemy, count };
    })
    .filter((group): group is { enemy: Enemy; count: number } => group !== null);
}

// XP one member banks from a cleared fight: each defeated group's base XP, trimmed by how far the
// member has out-levelled it (or paid in full for a prized runner). Members earn different amounts
// — a fresh recruit gets the fight's full worth, a veteran who has outgrown the floor gets a
// trickle — which is the whole point of the falloff. See leveling.rewardXpFor.
function memberXpFromGroups(groups: CombatEnemyGroup[], memberLevel: number): number {
  return groups.reduce(
    (total, group) => total + rewardXpFor(group.xp * group.count, memberLevel, group),
    0
  );
}

// IMP-021A: mastery a fight grants a member — one masteryGain per defeated group, through the same
// out-levelling falloff as XP, so grinding weak floors does not race a vocation to mastery.
function memberMasteryFromGroups(groups: CombatEnemyGroup[], memberLevel: number): number {
  return groups.reduce((total, group) => total + masteryGain(memberLevel, group), 0);
}

function createEnemyGroup(enemy: Enemy, count: number): CombatEnemyGroup {
  return {
    id: `group.${enemy.id}`,
    enemyId: enemy.id,
    name: enemy.name,
    count,
    initialCount: count,
    hpEach: enemy.hp,
    maxHpEach: enemy.hp,
    attack: enemy.attack,
    armor: enemy.armor ?? 0,
    accuracy: enemy.accuracy ?? 70,
    damageMin: enemy.damageMin ?? Math.max(1, enemy.attack - 1),
    damageMax: enemy.damageMax ?? Math.max(1, enemy.attack + 1),
    speed: enemy.speed ?? 4,
    morale: enemy.morale ?? 7,
    xp: enemy.xp ?? Math.max(1, enemy.dangerTier ?? 1),
    gold: enemy.gold ?? Math.max(0, enemy.dangerTier ?? 1),
    level: enemy.level,
    dangerTier: enemy.dangerTier,
    prizedXp: enemy.prizedXp,
    role: enemy.role,
    elevation: enemy.elevation,
    status: [],
    resistances: enemy.resistances,
    inflicts: enemy.inflicts,
    weaknesses: enemy.weaknesses,
    abilities: enemy.abilities
  };
}

// Enemy line: a group standing back (mid/air) is shielded from melee while any
// front (ground/default) group still stands — the party must break the front line
// or reach past it with a spell. This is what stops Repeat-spam on a squad.
function enemyGroupIsBack(group: CombatEnemyGroup): boolean {
  return group.elevation === "air" || group.elevation === "mid";
}

export function hasStandingFrontEnemy(groups: CombatEnemyGroup[]): boolean {
  return groups.some((group) => group.count > 0 && !enemyGroupIsBack(group));
}

// A group a melee attack may land on: front groups always; a back group only once
// no front group shields it.
export function meleeTargetableGroup(group: CombatEnemyGroup, groups: CombatEnemyGroup[]): boolean {
  return group.count > 0 && (!enemyGroupIsBack(group) || !hasStandingFrontEnemy(groups));
}

// A fixed squad fight: the first enemy is the front line, the rest hang back.
export function createSquadCombatState(roomId: string, enemies: Enemy[]): CombatState {
  const groups = enemies.map((enemy, index) => {
    const group = createEnemyGroup(enemy, 1);
    // Force the intended line even if content omits elevation: first = front, rest = back.
    return { ...group, id: `${group.id}.${index}`, elevation: enemy.elevation ?? (index === 0 ? "ground" : "air") };
  });
  return {
    enemy: { ...enemies[0] },
    roomId,
    round: 1,
    enemyGroups: groups,
    pendingActions: [],
    selectedTargetId: groups.find((group) => meleeTargetableGroup(group, groups))?.id ?? groups[0].id
  };
}

function collectRoomTreasure(
  state: GameState,
  world: ScenarioWorld,
  roomId: string,
  treasureTableId: string | undefined
): { state: GameState; events: GameEvent[] } {
  if (!treasureTableId || state.floorClaimedTreasures.includes(roomId)) {
    return { state, events: [] };
  }

  const entry = resolveTreasureTable(world, treasureTableId, `${roomId}:${state.turn}`);
  if (!entry) {
    return { state, events: [] };
  }

  const item = createInventoryItemFromCatalog(world, entry.itemId, entry.quantity ?? 1);
  if (!item) {
    return { state, events: [] };
  }

  // Dropped equipment rolls a numeric "+N" upgrade and a RARITY (IMP-022A): a common stacks and is
  // known, a rare/epic is a unique unidentified instance carrying an authored affix. Deterministic
  // on (room, turn) so replays match.
  if (item.kind === "equipment") {
    const equipment = findEquipment(world, entry.itemId);
    if (equipment) {
      const floor = floorNumberForRoom(world, roomId);
      const seed = `${roomId}:${state.turn}`;
      item.plus = rollEquipmentInstance(equipment.slot, floor, seed).plus;
      const drop = rollEquipmentDrop(world, entry.itemId, floor, seed);
      if (drop) {
        item.rarity = drop.rarity;
        item.identified = drop.identified;
        item.instanceId = drop.instanceId;
        // A rare's rolled affix wins; a common keeps whatever the +N roll gave it (if any).
        if (drop.affix) item.affix = drop.affix;
      }
    }
  }

  return {
    state: {
      ...state,
      inventory: addInventoryItem(state.inventory, item),
      claimedTreasures: Array.from(new Set([...state.claimedTreasures, roomId])),
      floorClaimedTreasures: [...state.floorClaimedTreasures, roomId]
    },
    events: [
      {
        type: "inventory_item_gained",
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        source: "treasure",
        plus: item.plus,
        affix: item.affix
      }
    ]
  };
}

function floorNumberForRoom(world: ScenarioWorld, roomId: string): number {
  const match = (getFloorIdForRoom(world, roomId) ?? "").match(/[a-z](\d+)f/i);
  return match ? Number(match[1]) : 1;
}

// Roll instance data for a dropped equipment piece. Chances rise with depth; a
// "+2" only appears from floor 4, and enchants are drawn from the slot- and
// depth-appropriate pool.
export function rollEquipmentInstance(
  slot: EquipmentSlot,
  floor: number,
  seed: string
): { plus?: number; affix?: string } {
  const result: { plus?: number; affix?: string } = {};

  if (hashSeed(`${seed}:plus`) % 100 < 20 + floor * 5) {
    result.plus = floor >= 4 && hashSeed(`${seed}:plus2`) % 100 < 30 ? 2 : 1;
  }

  if (hashSeed(`${seed}:affix`) % 100 < 15 + floor * 5) {
    const pool = EQUIPMENT_AFFIXES.filter((affix) => affix.slots.includes(slot) && affix.minFloor <= floor);
    if (pool.length > 0) {
      result.affix = pool[hashSeed(`${seed}:affixpick`) % pool.length].id;
    }
  }

  return result;
}

function resolveTreasureTable(world: ScenarioWorld, tableId: string, seed: string) {
  const table = world.treasureTables.find((candidate) => candidate.id === tableId);
  if (!table || table.entries.length === 0) {
    return null;
  }

  const totalWeight = table.entries.reduce((total, entry) => total + entry.weight, 0);
  let roll = hashSeed(seed) % totalWeight;
  return table.entries.find((entry) => {
    roll -= entry.weight;
    return roll < 0;
  }) ?? table.entries[0];
}

function isStockAvailable(stock: NonNullable<ScenarioWorld["shops"][number]["stock"]>[number], state: GameState) {
  if (stock.availability === "unlocked" && stock.unlockFlag) {
    return state.discoveredSecrets.includes(stock.unlockFlag);
  }

  return stock.availability !== "unlocked";
}

function normalizeCombat(combat: CombatState): CombatState {
  const sourceGroups = combat.enemyGroups?.length > 0 ? combat.enemyGroups : [createEnemyGroup(combat.enemy, 1)];
  // Saves from before group-condition bars do not carry the encounter's starting
  // count. Preserve compatibility and ensure the denominator can never fall below
  // the number of bodies that currently stand.
  const enemyGroups = sourceGroups.map((group) => ({
    ...group,
    initialCount: Math.max(group.initialCount ?? group.count, group.count, 1)
  }));
  return syncCombatEnemy({
    ...combat,
    round: combat.round ?? 1,
    enemyGroups,
    pendingActions: combat.pendingActions ?? [],
    selectedTargetId: combat.selectedTargetId ?? enemyGroups[0]?.id
  });
}

function syncCombatEnemy(combat: CombatState): CombatState {
  const firstLiving = combat.enemyGroups.find((group) => group.count > 0) ?? combat.enemyGroups[0];
  if (!firstLiving) {
    return combat;
  }

  return {
    ...combat,
    enemy: {
      ...combat.enemy,
      id: firstLiving.enemyId,
      name: firstLiving.name,
      hp: firstLiving.hpEach,
      attack: firstLiving.attack,
      role: firstLiving.role
    }
  };
}

// リピート (Repeat): re-issue a previous round's declared orders against the CURRENT
// board. Actors who have fallen are dropped; attack/cast orders aimed at a group that
// no longer stands are retargeted to the first living group (so a killed target does
// not waste the swing). Pure so it can be unit-locked apart from the React wiring.
export function remapRepeatOrders(
  lastOrders: CombatActionDeclaration[],
  livingActorIds: Set<string>,
  livingGroupIds: string[]
): CombatActionDeclaration[] {
  const fallbackGroupId = livingGroupIds[0];
  return lastOrders
    .filter((order) => livingActorIds.has(order.actorId))
    .map((order) => {
      if ((order.action === "attack" || order.action === "cast") && order.targetGroupId) {
        if (!livingGroupIds.includes(order.targetGroupId)) {
          return fallbackGroupId ? { ...order, targetGroupId: fallbackGroupId } : order;
        }
      }
      return order;
    });
}

function validateRoundActions(
  party: Character[],
  combat: CombatState,
  actions: CombatActionDeclaration[],
  world: ScenarioWorld
): { actions: CombatActionDeclaration[]; event?: GameEvent } {
  if (actions.length === 0) {
    return { actions: [] };
  }

  const standingFront = party.some((member) => member.row === "front" && member.hp > 0 && !member.injury);
  for (const action of actions) {
    const actor = party.find((member) => member.id === action.actorId);
    if (!actor) {
      return { actions: [], event: { type: "combat_action_blocked", reason: "invalid_actor" } };
    }

    if (action.action === "attack") {
      // Melee from the back row is blocked while a front line stands — unless the
      // actor carries a reach weapon (bow / long spear), which strikes over it.
      if (actor.row === "back" && standingFront && !weaponReaches(actor, world)) {
        return {
          actions: [],
          event: { type: "combat_action_blocked", reason: "back_row_blocked", actorName: actor.name }
        };
      }

      const target = combat.enemyGroups.find((group) => group.id === action.targetGroupId && group.count > 0);
      if (!target) {
        return {
          actions: [],
          event: { type: "combat_action_blocked", reason: "invalid_target", actorName: actor.name }
        };
      }

      // A back-line enemy can't be reached by melee while the front line shields it.
      if (!meleeTargetableGroup(target, combat.enemyGroups)) {
        return {
          actions: [],
          event: { type: "combat_action_blocked", reason: "enemy_guarded", actorName: actor.name }
        };
      }
    }
  }

  return { actions };
}

function applyHealingItemToParty(
  party: Character[],
  inventory: GameState["inventory"],
  itemId: string,
  targetCharacterId: string,
  world: ScenarioWorld
): { party: Character[]; inventory: GameState["inventory"]; summary: string } {
  const item = inventory.find((candidate) => candidate.id === itemId && candidate.quantity > 0);
  const target = party.find((member) => member.id === targetCharacterId);
  const isConsumable = item && (item.kind === "healing" || item.kind === "cure" || item.kind === "focus");
  if (!item || !target || !isConsumable) {
    return { party, inventory, summary: "The item fails to help." };
  }

  return {
    party: party.map((member) => {
      if (member.id !== target.id) {
        return member;
      }
      let next = member;
      if (item.healAmount) {
        next = { ...next, hp: Math.min(effectiveMaxHp(next, world), next.hp + item.healAmount) };
      }
      if (item.restoreMp) {
        next = { ...next, mp: Math.min(effectiveMaxMp(next, world), next.mp + item.restoreMp) };
      }
      if (item.curesStatuses?.length) {
        const cured = new Set<string>(item.curesStatuses);
        next = { ...next, status: (next.status ?? []).filter((status) => !cured.has(status)) };
      }
      return next;
    }),
    inventory: inventory.map((candidate) =>
      candidate.id === item.id ? { ...candidate, quantity: Math.max(0, candidate.quantity - 1) } : candidate
    ),
    summary: `${target.name} uses ${item.name}.`
  };
}

function damageGroup(groups: CombatEnemyGroup[], groupId: string, damage: number): CombatEnemyGroup[] {
  return groups.map((group) => {
    if (group.id !== groupId) {
      return group;
    }

    const remainingHp = group.hpEach - damage;
    if (remainingHp > 0) {
      return { ...group, hpEach: remainingHp };
    }

    const count = Math.max(0, group.count - 1);
    return {
      ...group,
      count,
      hpEach: count > 0 ? group.maxHpEach : 0
    };
  });
}

function chooseEnemyTarget(party: Character[]): Character | null {
  return (
    party.find((member) => member.row === "front" && member.hp > 0 && !member.injury) ??
    party.find((member) => member.hp > 0 && !member.injury) ??
    null
  );
}

function findGroupName(groups: CombatEnemyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId)?.name ?? "the enemy";
}

function rollPercent(seed: string) {
  return (hashSeed(seed) % 100) + 1;
}

function rollDamage(seed: string, min: number, max: number, armor: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const span = high - low + 1;
  return Math.max(1, low + (hashSeed(seed) % span) - armor);
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function uniqueStatuses(statuses: CombatStatus[]) {
  return Array.from(new Set(statuses));
}

function clearRoundStatuses(statuses: CombatStatus[] = []) {
  return statuses.filter((status) => status !== "ward");
}

// Round-end processing for one combatant's ailments: poison bites, ward drops,
// and each persistent ailment rolls to wear off.
function tickStatusList(
  statuses: CombatStatus[] = [],
  seed: string
): { statuses: CombatStatus[]; poisonDamage: number; wornOff: CombatStatus[] } {
  let poisonDamage = 0;
  const kept: CombatStatus[] = [];
  const wornOff: CombatStatus[] = [];
  for (const status of statuses) {
    if (status === "ward") {
      wornOff.push(status);
      continue;
    }
    if (status === "poison") {
      poisonDamage += POISON_DAMAGE;
    }
    if (rollPercent(`${seed}:${status}:wearoff`) < (STATUS_WEAR_OFF[status] ?? 0)) {
      wornOff.push(status);
      continue;
    }
    kept.push(status);
  }
  return { statuses: kept, poisonDamage, wornOff };
}

function returnToTown(state: GameState, world: ScenarioWorld): CommandResult {
  if (state.phase !== "dungeon" || !state.position) {
    return noChange(state);
  }

  const room = getRoom(world, state.position.roomId);
  if (!room.stairsToTown && !room.restPoint) {
    return logOnly(state, { type: "command_blocked", reason: "town_return_unavailable", command: "return_to_town" });
  }

  const next: GameState = {
    ...state,
    phase: "town",
    position: null,
    combat: null,
    map: {
      ...state.map,
      currentRoomId: null,
      currentCellId: null,
      currentFacing: null
    },
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "returned_to_town" }]);
}

function recoverParty(state: GameState, world: ScenarioWorld): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const cost = calculateRecoveryCost(state.party);
  if (state.partyGold < cost) {
    return withEvents(
      {
        ...state,
        turn: state.turn + 1
      },
      [{ type: "recovery_blocked", goldRequired: cost, goldAvailable: state.partyGold }]
    );
  }

  const next: GameState = {
    ...state,
    party: state.party.map((member) => ({ ...member, hp: effectiveMaxHp(member, world), mp: effectiveMaxMp(member, world), injury: undefined })),
    partyGold: state.partyGold - cost,
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "party_recovered", gold: cost }]);
}

function markExpeditionStarted(party: Character[], floorId: string | null, turn: number) {
  return markDeepestFloor(
    party.map((member) => ({
      ...member,
      memory: {
        ...member.memory,
        firstExpeditionTurn: member.memory.firstExpeditionTurn ?? turn
      }
    })),
    floorId
  );
}

function markDeepestFloor(party: Character[], floorId: string | null) {
  if (!floorId) {
    return party;
  }

  return party.map((member) => ({
    ...member,
    memory: {
      ...member.memory,
      deepestFloorId: chooseDeeperFloor(member.memory.deepestFloorId, floorId)
    }
  }));
}

function chooseDeeperFloor(current: string | undefined, next: string) {
  if (!current) {
    return next;
  }

  return floorRank(next) > floorRank(current) ? next : current;
}

function floorRank(floorId: string) {
  const match = floorId.match(/[a-z](\d+)f/i);
  return match ? Number(match[1]) : 0;
}

function logOnly(state: GameState, event: GameEvent): CommandResult {
  const next: GameState = {
    ...state,
    turn: state.turn + 1
  };

  return withEvents(next, [event]);
}

function withEvents(state: GameState, events: GameEvent[]): CommandResult {
  return {
    state: {
      ...state,
      log: appendEventLogs(state, events)
    },
    events
  };
}

function noChange(state: GameState): CommandResult {
  return { state, events: [] };
}

function visitRoom(state: GameState, world: ScenarioWorld, roomId: string, facing: Direction) {
  const room = getRoom(world, roomId);
  const floorId = getFloorIdForRoom(world, roomId) ?? world.startDungeon;
  const cell = getGridCellForRoom(world, roomId);
  const visitedRooms = appendUnique(state.map.visitedRooms, roomId);
  const visitedCells = cell ? appendUnique(state.map.visitedCells ?? [], cell.id) : (state.map.visitedCells ?? []);
  const exits = getKnownGridDirections(world, room.id);

  return {
    events: [
      { type: "map_room_visited", floorId, roomId },
      { type: "map_exits_known", floorId, roomId, exits }
    ] satisfies GameEvent[],
    map: {
      ...state.map,
      floorId,
      currentRoomId: roomId,
      currentCellId: cell?.id ?? null,
      currentFacing: facing,
      visitedRooms,
      visitedCells,
      knownExits: {
        ...state.map.knownExits,
        [roomId]: exits
      }
    }
  };
}

function appendUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

const SPIN_ORDER: Direction[] = ["north", "east", "south", "west"];

// Wizardry-style spinner floor: standing on it turns the party to a new facing.
// Deterministic on the turn counter so it is disorienting but replayable.
function applySpinner(state: GameState, room: DungeonRoom, events: GameEvent[]): GameState {
  if (!room.spinner || !state.position) {
    return state;
  }
  const facing = SPIN_ORDER[state.turn % SPIN_ORDER.length];
  events.push({ type: "spinner_triggered", facing });
  return {
    ...state,
    position: { ...state.position, facing },
    map: { ...state.map, currentFacing: facing }
  };
}

// Wizardry-style teleporter floor: stepping onto it silently warps the party to
// another room. Transit only — the source room's content is skipped.
function applyTeleport(
  state: GameState,
  world: ScenarioWorld,
  room: DungeonRoom,
  events: GameEvent[]
): { state: GameState; teleported: boolean } {
  if (!room.teleportTo || !state.position) {
    return { state, teleported: false };
  }

  const targetRoom = getRoom(world, room.teleportTo);
  const roomVisit = visitRoom(state, world, targetRoom.id, state.position.facing);
  const targetCell = getGridCellForRoom(world, targetRoom.id);
  events.push({ type: "teleported", toRoomId: targetRoom.id, toRoomName: targetRoom.name });
  events.push(...roomVisit.events);

  return {
    state: {
      ...state,
      position: { ...state.position, roomId: targetRoom.id, cellId: targetCell?.id },
      map: roomVisit.map
    },
    teleported: true
  };
}

// Etrian-style damage floor: standing on it bleeds every party member. Repeatable
// (unlike a one-shot trap), so it is real attrition each time it is crossed.
function applyHazard(state: GameState, room: DungeonRoom, events: GameEvent[]): GameState {
  if (!room.damageTile || state.party.length === 0) {
    return state;
  }
  const damage = room.damageTile;
  events.push({ type: "hazard_damage", damage });
  return {
    ...state,
    party: state.party.map((member) => ({ ...member, hp: Math.max(1, member.hp - damage) }))
  };
}

// Single dispatch point for on-cell floor effects, so entering a room applies
// them in one fixed order from every call site (move, stairs). New tile types
// are added here once.
function applyCellEffects(
  state: GameState,
  world: ScenarioWorld,
  room: DungeonRoom,
  events: GameEvent[]
): { state: GameState; teleported: boolean } {
  let next = applySpinner(state, room, events);
  next = applyHazard(next, room, events);
  return applyTeleport(next, world, room, events);
}

// Fraction of the current floor's reachable grid cells the party has visited.
export function floorExploredRatio(world: ScenarioWorld, state: GameState): number {
  if (!state.position) {
    return 0;
  }
  const cells = getFloorForRoom(world, state.position.roomId)?.grid?.cells ?? [];
  if (cells.length === 0) {
    return 0;
  }
  const visited = new Set(state.map.visitedRooms);
  const seen = cells.filter((cell: { roomId: string }) => visited.has(cell.roomId)).length;
  return seen / cells.length;
}

// The gate barring the stair the party currently faces (if any), so the UI can
// show why a descent is refused instead of a dead "Use stairs" button.
// The stair a party standing on this cell can take: the one it faces if that's a
// stair, else the cell's sole stair. Descending is a current-cell action, so the
// command must not depend on which way the party looks or on the authored edge
// direction — the engine finds the stair, the data just says where it goes.
const STAIR_DIRECTIONS: Direction[] = ["north", "east", "south", "west"];
export function roomStairsEdge(
  world: ScenarioWorld,
  roomId: string,
  facing: Direction
): { edge: NonNullable<ReturnType<typeof getGridEdge>>; direction: Direction } | null {
  const faced = getGridEdge(world, roomId, facing);
  if (faced?.kind === "stairs") {
    return { edge: faced, direction: facing };
  }
  for (const direction of STAIR_DIRECTIONS) {
    const edge = getGridEdge(world, roomId, direction);
    if (edge?.kind === "stairs") {
      return { edge, direction };
    }
  }
  return null;
}

export function stairGateAhead(world: ScenarioWorld, state: GameState): ExplorationGate | null {
  if (!state.position) {
    return null;
  }
  const stair = roomStairsEdge(world, state.position.roomId, state.position.facing);
  if (!stair) {
    return null;
  }
  const gate = getRoom(world, state.position.roomId).gates?.find((g) => g.direction === stair.direction);
  return gate && !isGateOpen(gate, state) ? gate : null;
}

export function isGateOpen(gate: ExplorationGate, state: GameState): boolean {
  if (gate.requiredKeyId && !state.inventory.some((item) => item.id === gate.requiredKeyId && item.quantity > 0)) {
    return false;
  }
  if (gate.requiredFlag && !state.discoveredSecrets.includes(gate.requiredFlag)) {
    return false;
  }
  return true;
}

function appendDirection(
  current: Partial<Record<string, Direction[]>>,
  roomId: string,
  direction: Direction
): Partial<Record<string, Direction[]>> {
  const directions = current[roomId] ?? [];
  if (directions.includes(direction)) {
    return current;
  }

  return {
    ...current,
    [roomId]: [...directions, direction]
  };
}

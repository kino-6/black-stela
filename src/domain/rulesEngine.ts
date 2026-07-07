import { appendEventLogs } from "./replayLog";
import { applyLevelUps } from "./leveling";
import {
  getExit,
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
  createInventoryItemFromCatalog,
  findEquipment,
  getEffectiveCharacterStats,
  getEquipmentSlot,
  isEquipmentUsableBy,
  removeInventoryItem
} from "./economy";
import type {
  Character,
  CombatActionDeclaration,
  CombatEnemyGroup,
  CombatStatus,
  CombatState,
  Command,
  Direction,
  DungeonRoom,
  Enemy,
  ExplorationGate,
  GameEvent,
  GameState,
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

export function executeCommand(state: GameState, world: ScenarioWorld, command: Command): GameState {
  return resolveCommand(state, world, command).state;
}

export function resolveCommand(state: GameState, world: ScenarioWorld, command: Command): CommandResult {
  switch (command.type) {
    case "enter_dungeon":
      return enterDungeon(state, world);
    case "resume_at_checkpoint":
      return resumeAtCheckpoint(state, world, command.roomId);
    case "turn_left":
      return turn(state, "left");
    case "turn_right":
      return turn(state, "right");
    case "move_forward":
      return moveForward(state, world);
    case "move_backward":
      return moveForward(state, world, state.position ? OPPOSITE_DIRECTION[state.position.facing] : undefined);
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
    case "buy_item":
      return buyItem(state, world, command.shopId, command.itemId);
    case "sell_item":
      return sellItem(state, world, command.itemId);
    case "equip_item":
      return equipItem(state, world, command.characterId, command.equipmentId);
    case "declare_round":
      return declareRound(state, world, command.actions);
    case "retreat":
      return retreat(state);
    case "recover_party":
      return recoverParty(state);
    case "return_to_town":
      return returnToTown(state, world);
    default:
      return noChange(state);
  }
}

function enterDungeon(state: GameState, world: ScenarioWorld): CommandResult {
  if (state.party.length === 0) {
    return logOnly(state, { type: "command_blocked", reason: "party_required", command: "enter_dungeon" });
  }

  const roomVisit = visitRoom(state, world, world.startRoom, "east");
  const startCell = getGridCellForRoom(world, world.startRoom);
  let next: GameState = {
    ...state,
    phase: "dungeon",
    position: {
      roomId: world.startRoom,
      cellId: startCell?.id,
      facing: "east"
    },
    combat: null,
    party: markExpeditionStarted(state.party, roomVisit.map.floorId ?? world.startDungeon, state.turn + 1),
    map: roomVisit.map,
    turn: state.turn + 1
  };
  const startRoom = getRoom(world, world.startRoom);
  const treasure = collectRoomTreasure(next, world, startRoom.id, startRoom.treasureTable);
  next = treasure.state;

  return withEvents(next, [
    {
      type: "dungeon_entered",
      roomId: world.startRoom,
      facing: "east"
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
function moveForward(state: GameState, world: ScenarioWorld, requestedDirection?: Direction): CommandResult {
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
  const isBackward = moveDirection !== state.position.facing;
  const events: GameEvent[] = [
    { type: "room_entered", roomId: room.id, roomName: room.name, backward: isBackward },
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

  const encounter = room.encounter
    ? { enemy: world.enemies.find((enemy) => enemy.id === room.encounter?.id) ?? room.encounter, count: 1 }
    : room.encounterTable
      ? resolveEncounterTable(world, room.encounterTable, state.turn)
      : null;

  if (!effects.teleported && encounter && !state.defeatedEnemies.includes(encounter.enemy.id)) {
    next = {
      ...next,
      phase: "combat",
      combat: createCombatState(room.id, encounter.enemy, encounter.count)
    };
    events.push({
      type: "enemy_encountered",
      enemyId: encounter.enemy.id,
      enemyName: encounter.count > 1 ? `${encounter.enemy.name} x${encounter.count}` : encounter.enemy.name,
      roomId: room.id
    });
  }

  return withEvents(next, events);
}

function useStairs(state: GameState, world: ScenarioWorld): CommandResult {
  if (!state.position || state.phase !== "dungeon") {
    return noChange(state);
  }

  const edge = getGridEdge(world, state.position.roomId, state.position.facing);
  if (edge?.kind !== "stairs" || !edge.targetRoomId) {
    return logOnly(state, { type: "command_blocked", reason: "stairs_unavailable", command: "use_stairs" });
  }

  const targetRoom = getRoom(world, edge.targetRoomId);
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

  const encounter = targetRoom.encounter
    ? { enemy: world.enemies.find((enemy) => enemy.id === targetRoom.encounter?.id) ?? targetRoom.encounter, count: 1 }
    : targetRoom.encounterTable
      ? resolveEncounterTable(world, targetRoom.encounterTable, state.turn)
      : null;

  if (!effects.teleported && encounter && !state.defeatedEnemies.includes(encounter.enemy.id)) {
    next = {
      ...next,
      phase: "combat",
      combat: createCombatState(targetRoom.id, encounter.enemy, encounter.count)
    };
    events.push({
      type: "enemy_encountered",
      enemyId: encounter.enemy.id,
      enemyName: encounter.count > 1 ? `${encounter.enemy.name} x${encounter.count}` : encounter.enemy.name,
      roomId: targetRoom.id
    });
  }

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
  const target = combat.enemyGroups.find((group) => group.count > 0);
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
  const validation = validateRoundActions(state.party, combat, actions);
  if (validation.event) {
    return withEvents({ ...state, combat }, [validation.event]);
  }

  const summaries: string[] = [];
  const injuredEvents: GameEvent[] = [];
  let party = state.party;
  let inventory = state.inventory;
  let enemyGroups = combat.enemyGroups;

  const orderedActions = [...validation.actions].sort((left, right) => {
    const leftActor = party.find((member) => member.id === left.actorId);
    const rightActor = party.find((member) => member.id === right.actorId);
    return (rightActor?.speed ?? 0) - (leftActor?.speed ?? 0);
  });

  for (const action of orderedActions) {
    const actor = party.find((member) => member.id === action.actorId);
    if (!actor || actor.hp <= 0 || actor.injury) {
      continue;
    }

    if (action.action === "defend") {
      party = party.map((member) => (member.id === actor.id ? { ...member, status: uniqueStatuses([...(member.status ?? []), "ward"]) } : member));
      summaries.push(`${actor.name} holds the line.`);
      continue;
    }

    if (action.action === "use_item" && action.itemId && action.targetCharacterId) {
      const used = applyHealingItemToParty(party, inventory, action.itemId, action.targetCharacterId);
      party = used.party;
      inventory = used.inventory;
      summaries.push(used.summary);
      continue;
    }

    if (action.action === "cast" && action.spellId === "sleep" && action.targetGroupId) {
      enemyGroups = enemyGroups.map((group) =>
        group.id === action.targetGroupId ? { ...group, status: uniqueStatuses([...(group.status ?? []), "sleep"]) } : group
      );
      summaries.push(`${actor.name} casts Sleep on ${findGroupName(enemyGroups, action.targetGroupId)}.`);
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
    const hitRoll = rollPercent(`${state.turn}:${combat.round}:${actor.id}:${group.id}:hit`);
    if (hitRoll > actorStats.accuracy) {
      summaries.push(`${actor.name} misses ${group.name}.`);
      continue;
    }

    const damage = rollDamage(`${state.turn}:${combat.round}:${actor.id}:${group.id}:damage`, actorStats.damageMin, actorStats.damageMax, group.armor);
    enemyGroups = damageGroup(enemyGroups, group.id, damage);
    const updated = enemyGroups.find((candidate) => candidate.id === group.id);
    summaries.push(`${actor.name} hits ${group.name} for ${damage}. ${updated?.count ?? 0} remain.`);
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
        xp: member.xp + xp,
        gold: member.gold + gold,
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
      party: grownParty,
      partyGold: state.partyGold + gold,
      inventory,
      defeatedEnemies: Array.from(new Set([...state.defeatedEnemies, ...defeatedEnemyIds])),
      turn: state.turn + 1
    };

    return withEvents(next, [
      { type: "combat_round_resolved", round: combat.round, summaries },
      ...defeatedNames.map((enemyName, index) => ({
        type: "enemy_defeated" as const,
        enemyId: defeatedEnemyIds[index],
        enemyName
      })),
      { type: "combat_rewards", xp, gold, enemyNames: defeatedNames },
      ...levelEvents
    ]);
  }

  for (const group of livingGroups.sort((left, right) => right.speed - left.speed)) {
    if (group.status?.includes("sleep")) {
      summaries.push(`${group.name} is asleep.`);
      continue;
    }

    const target = chooseEnemyTarget(party);
    if (!target) {
      continue;
    }

    const hitRoll = rollPercent(`${state.turn}:${combat.round}:${group.id}:${target.id}:hit`);
    if (hitRoll > group.accuracy) {
      summaries.push(`${group.name} misses ${target.name}.`);
      continue;
    }

    const targetStats = getEffectiveCharacterStats(target, world);
    const guarded = target.status?.includes("ward");
    const armor = targetStats.armor + (guarded ? 2 : 0);
    const damage = rollDamage(`${state.turn}:${combat.round}:${group.id}:${target.id}:damage`, group.damageMin, group.damageMax, armor);
    party = party.map((member) => {
      if (member.id !== target.id) {
        return member;
      }
      const hp = member.hp - damage;
      if (hp <= 0) {
        injuredEvents.push({
          type: "character_injured",
          characterId: member.id,
          characterName: member.name,
          injury: "wounded"
        });
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
    summaries.push(`${group.name} wounds ${target.name} for ${damage}.`);
  }

  party = party.map((member) => ({ ...member, status: clearRoundStatuses(member.status) }));
  const nextCombat = syncCombatEnemy({
    ...combat,
    round: combat.round + 1,
    enemyGroups: livingGroups,
    pendingActions: []
  });

  const next: GameState = {
    ...state,
    combat: nextCombat,
    party,
    inventory,
    turn: state.turn + 1
  };

  return withEvents(next, [
    { type: "combat_round_resolved", round: combat.round, summaries },
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

  const target = state.party.find((member) => member.id === targetCharacterId);
  if (!item || !target || item.kind !== "healing" || !item.healAmount) {
    return noChange(state);
  }

  const healAmount = item.healAmount;
  const next: GameState = {
    ...state,
    party: state.party.map((member) =>
      member.id === target.id ? { ...member, hp: Math.min(member.maxHp, member.hp + healAmount) } : member
    ),
    inventory: state.inventory.map((candidate) =>
      candidate.id === item.id ? { ...candidate, quantity: Math.max(0, candidate.quantity - 1) } : candidate
    ),
    turn: state.turn + 1
  };

  return withEvents(next, [
    {
      type: "item_used",
      itemId: item.id,
      itemName: item.name,
      targetCharacterId: target.id,
      targetName: target.name,
      healAmount
    }
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

function sellItem(state: GameState, world: ScenarioWorld, itemId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const item = state.inventory.find((candidate) => candidate.id === itemId && candidate.quantity > 0);
  if (!item) {
    return noChange(state);
  }
  if (state.party.some((member) => Object.values(member.equipment).includes(itemId))) {
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
    inventory: removeInventoryItem(state.inventory, itemId, 1),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "item_sold", itemId, itemName: item.name, gold: catalogValue }]);
}

function equipItem(state: GameState, world: ScenarioWorld, characterId: string, equipmentId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const item = state.inventory.find((candidate) => candidate.id === equipmentId && candidate.quantity > 0);
  const equipment = findEquipment(world, equipmentId);
  const slot = getEquipmentSlot(world, equipmentId);
  const character = state.party.find((member) => member.id === characterId);
  if (!item || item.kind !== "equipment" || !equipment || !slot || !character || !isEquipmentUsableBy(equipment, character)) {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    party: state.party.map((member) =>
      member.id === characterId
        ? {
            ...member,
            equipment: {
              ...member.equipment,
              [slot]: equipmentId
            }
          }
        : member
    ),
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

function createCombatState(roomId: string, enemy: Enemy, count = 1): CombatState {
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

function resolveEncounterTable(world: ScenarioWorld, tableId: string, seed: number): { enemy: Enemy; count: number } | null {
  const table = world.encounterTables.find((candidate) => candidate.id === tableId);
  if (!table || table.entries.length === 0) {
    return null;
  }

  const totalWeight = table.entries.reduce((total, entry) => total + entry.weight, 0);
  let roll = hashSeed(`${tableId}:${seed}`) % totalWeight;
  const entry = table.entries.find((candidate) => {
    roll -= candidate.weight;
    return roll < 0;
  }) ?? table.entries[0];
  const enemy = world.enemies.find((candidate) => candidate.id === entry.enemyId);
  if (!enemy) {
    return null;
  }

  const min = entry.minCount ?? 1;
  const max = entry.maxCount ?? min;
  const count = min + (hashSeed(`${tableId}:${seed}:count`) % (max - min + 1));
  return { enemy, count };
}

function createEnemyGroup(enemy: Enemy, count: number): CombatEnemyGroup {
  return {
    id: `group.${enemy.id}`,
    enemyId: enemy.id,
    name: enemy.name,
    count,
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
    role: enemy.role,
    status: []
  };
}

function collectRoomTreasure(
  state: GameState,
  world: ScenarioWorld,
  roomId: string,
  treasureTableId: string | undefined
): { state: GameState; events: GameEvent[] } {
  if (!treasureTableId || state.claimedTreasures.includes(roomId)) {
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

  return {
    state: {
      ...state,
      inventory: addInventoryItem(state.inventory, item),
      claimedTreasures: [...state.claimedTreasures, roomId]
    },
    events: [
      {
        type: "inventory_item_gained",
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        source: "treasure"
      }
    ]
  };
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
  const enemyGroups = combat.enemyGroups?.length > 0 ? combat.enemyGroups : [createEnemyGroup(combat.enemy, 1)];
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

function validateRoundActions(
  party: Character[],
  combat: CombatState,
  actions: CombatActionDeclaration[]
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
      if (actor.row === "back" && standingFront) {
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
    }
  }

  return { actions };
}

function applyHealingItemToParty(
  party: Character[],
  inventory: GameState["inventory"],
  itemId: string,
  targetCharacterId: string
): { party: Character[]; inventory: GameState["inventory"]; summary: string } {
  const item = inventory.find((candidate) => candidate.id === itemId && candidate.quantity > 0);
  const target = party.find((member) => member.id === targetCharacterId);
  if (!item || !target || item.kind !== "healing" || !item.healAmount) {
    return { party, inventory, summary: "The item fails to help." };
  }

  return {
    party: party.map((member) => (member.id === target.id ? { ...member, hp: Math.min(member.maxHp, member.hp + item.healAmount!) } : member)),
    inventory: inventory.map((candidate) =>
      candidate.id === item.id ? { ...candidate, quantity: Math.max(0, candidate.quantity - 1) } : candidate
    ),
    summary: `${target.name} drinks ${item.name}.`
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

function recoverParty(state: GameState): CommandResult {
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
    party: state.party.map((member) => ({ ...member, hp: member.maxHp, injury: undefined })),
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
  const match = floorId.match(/b(\d+)f/i);
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

function isGateOpen(gate: ExplorationGate, state: GameState): boolean {
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

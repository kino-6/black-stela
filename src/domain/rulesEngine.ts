import { appendEventLogs } from "./replayLog";
import { getExit, getRoom } from "./scenario";
import type {
  Character,
  CombatActionDeclaration,
  CombatEnemyGroup,
  CombatStatus,
  CombatState,
  Command,
  Direction,
  Enemy,
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

export function executeCommand(state: GameState, world: ScenarioWorld, command: Command): GameState {
  return resolveCommand(state, world, command).state;
}

export function resolveCommand(state: GameState, world: ScenarioWorld, command: Command): CommandResult {
  switch (command.type) {
    case "enter_dungeon":
      return enterDungeon(state, world);
    case "turn_left":
      return turn(state, "left");
    case "turn_right":
      return turn(state, "right");
    case "move_forward":
      return moveForward(state, world);
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
      return attack(state);
    case "defend":
      return defend(state);
    case "use_item":
      return useItem(state, command.itemId, command.targetCharacterId);
    case "declare_round":
      return declareRound(state, command.actions);
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
  const next: GameState = {
    ...state,
    phase: "dungeon",
    position: {
      roomId: world.startRoom,
      facing: "east"
    },
    combat: null,
    map: roomVisit.map,
    turn: state.turn + 1
  };

  return withEvents(next, [
    {
      type: "dungeon_entered",
      roomId: world.startRoom,
      facing: "east"
    },
    ...roomVisit.events
  ]);
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

function moveForward(state: GameState, world: ScenarioWorld): CommandResult {
  if (!state.position || state.phase !== "dungeon") {
    return noChange(state);
  }

  const exit = getExit(world, state.position.roomId, state.position.facing);
  if (!exit) {
    const floorId = state.map.floorId ?? getFloorIdForRoom(world, state.position.roomId);
    const next: GameState = {
      ...state,
      map: {
        ...state.map,
        blockedExits: appendDirection(state.map.blockedExits, state.position.roomId, state.position.facing)
      },
      turn: state.turn + 1
    };

    return withEvents(next, [
      {
        type: "movement_blocked",
        reason: "wall",
        roomId: state.position.roomId,
        facing: state.position.facing
      },
      {
        type: "map_exit_blocked",
        floorId,
        roomId: state.position.roomId,
        direction: state.position.facing
      }
    ]);
  }

  const room = getRoom(world, exit);
  const roomVisit = visitRoom(state, world, exit, state.position.facing);
  const events: GameEvent[] = [{ type: "room_entered", roomId: room.id, roomName: room.name }, ...roomVisit.events];
  let next: GameState = {
    ...state,
    position: {
      ...state.position,
      roomId: exit
    },
    map: roomVisit.map,
    turn: state.turn + 1
  };

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

  const encounter = room.encounter
    ? { enemy: room.encounter, count: 1 }
    : room.encounterTable
      ? resolveEncounterTable(world, room.encounterTable, state.turn)
      : null;

  if (encounter && !state.defeatedEnemies.includes(encounter.enemy.id)) {
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

function search(state: GameState, world: ScenarioWorld): CommandResult {
  if (!state.position) {
    return noChange(state);
  }

  const room = getRoom(world, state.position.roomId);
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

function attack(state: GameState): CommandResult {
  if (state.phase !== "combat" || !state.combat) {
    return noChange(state);
  }

  const combat = normalizeCombat(state.combat);
  const actor = state.party.find((member) => member.hp > 0 && !member.injury && member.row === "front") ?? state.party[0];
  const target = combat.enemyGroups.find((group) => group.count > 0);
  if (!actor || !target) {
    return noChange(state);
  }

  return declareRound({ ...state, combat }, [{ actorId: actor.id, action: "attack", targetGroupId: target.id }]);
}

function declareRound(state: GameState, actions: CombatActionDeclaration[]): CommandResult {
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

    const hitRoll = rollPercent(`${state.turn}:${combat.round}:${actor.id}:${group.id}:hit`);
    if (hitRoll > actor.accuracy) {
      summaries.push(`${actor.name} misses ${group.name}.`);
      continue;
    }

    const damage = rollDamage(`${state.turn}:${combat.round}:${actor.id}:${group.id}:damage`, actor.damageMin, actor.damageMax, group.armor);
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
    const next: GameState = {
      ...state,
      phase: "dungeon",
      combat: null,
      party: party.map((member) => ({ ...member, xp: member.xp + xp, gold: member.gold + gold })),
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
      { type: "combat_rewards", xp, gold, enemyNames: defeatedNames }
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

    const guarded = target.status?.includes("ward");
    const armor = target.armor + (guarded ? 2 : 0);
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
        return { ...member, hp: 1, injury: "wounded" as const, status: clearRoundStatuses(member.status) };
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

function useItem(state: GameState, itemId: string, targetCharacterId: string): CommandResult {
  const item = state.inventory.find((candidate) => candidate.id === itemId && candidate.quantity > 0);
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

function retreat(state: GameState): CommandResult {
  if (state.phase !== "combat") {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    phase: "dungeon",
    combat: null,
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
  if (!room.stairsToTown) {
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
      currentFacing: null
    },
    party: state.party.map((member) => ({ ...member, hp: member.maxHp })),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "returned_to_town" }]);
}

function recoverParty(state: GameState): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    party: state.party.map((member) => ({ ...member, hp: member.maxHp, injury: undefined })),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "party_recovered" }]);
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
  const visitedRooms = state.map.visitedRooms.includes(roomId)
    ? state.map.visitedRooms
    : [...state.map.visitedRooms, roomId];
  const exits = Object.keys(room.exits) as Direction[];

  return {
    events: [
      { type: "map_room_visited", floorId, roomId },
      { type: "map_exits_known", floorId, roomId, exits }
    ] satisfies GameEvent[],
    map: {
      ...state.map,
      floorId,
      currentRoomId: roomId,
      currentFacing: facing,
      visitedRooms,
      knownExits: {
        ...state.map.knownExits,
        [roomId]: exits
      }
    }
  };
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

function getFloorIdForRoom(world: ScenarioWorld, roomId: string) {
  return world.dungeons.find((dungeon) => dungeon.rooms.some((room) => room.id === roomId))?.id ?? null;
}

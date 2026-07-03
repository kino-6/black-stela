import { appendEventLogs } from "./replayLog";
import { getExit, getRoom } from "./scenario";
import type { Command, Direction, GameEvent, GameState, ScenarioWorld } from "./types";

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
    case "retreat":
      return retreat(state);
    case "return_to_town":
      return returnToTown(state);
    default:
      return noChange(state);
  }
}

function enterDungeon(state: GameState, world: ScenarioWorld): CommandResult {
  if (state.party.length === 0) {
    return logOnly(state, { type: "command_blocked", reason: "party_required", command: "enter_dungeon" });
  }

  const next: GameState = {
    ...state,
    phase: "dungeon",
    position: {
      roomId: world.startRoom,
      facing: "east"
    },
    combat: null,
    map: visitRoom(state, world, world.startRoom),
    turn: state.turn + 1
  };

  return withEvents(next, [
    {
      type: "dungeon_entered",
      roomId: world.startRoom,
      facing: "east"
    }
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
    return logOnly(state, {
      type: "movement_blocked",
      reason: "wall",
      roomId: state.position.roomId,
      facing: state.position.facing
    });
  }

  const room = getRoom(world, exit);
  const events: GameEvent[] = [{ type: "room_entered", roomId: room.id, roomName: room.name }];
  let next: GameState = {
    ...state,
    position: {
      ...state.position,
      roomId: exit
    },
    map: visitRoom(state, world, exit),
    turn: state.turn + 1
  };

  if (room.trap && !state.resolvedTraps.includes(room.trap.id)) {
    next = {
      ...next,
      party: next.party.map((member) => ({
        ...member,
        hp: Math.max(1, member.hp - room.trap!.damage)
      })),
      resolvedTraps: [...next.resolvedTraps, room.trap.id],
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

  if (room.encounter && !state.defeatedEnemies.includes(room.encounter.id)) {
    next = {
      ...next,
      phase: "combat",
      combat: {
        enemy: { ...room.encounter },
        roomId: room.id
      },
    };
    events.push({
      type: "enemy_encountered",
      enemyId: room.encounter.id,
      enemyName: room.encounter.name,
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

  const partyDamage = state.party.reduce((total, member) => total + member.attack, 0);
  const enemyHp = state.combat.enemy.hp - partyDamage;

  if (enemyHp <= 0) {
    const next: GameState = {
      ...state,
      phase: "dungeon",
      combat: null,
      defeatedEnemies: [...state.defeatedEnemies, state.combat.enemy.id],
      turn: state.turn + 1
    };

    return withEvents(next, [
      {
        type: "enemy_defeated",
        enemyId: state.combat.enemy.id,
        enemyName: state.combat.enemy.name
      }
    ]);
  }

  const enemy = {
    ...state.combat.enemy,
    hp: enemyHp
  };

  const next: GameState = {
    ...state,
    combat: {
      ...state.combat,
      enemy
    },
    party: state.party.map((member) => ({
      ...member,
      hp: Math.max(1, member.hp - state.combat!.enemy.attack)
    })),
    turn: state.turn + 1
  };

  return withEvents(next, [
    {
      type: "enemy_damaged",
      enemyId: enemy.id,
      enemyName: enemy.name,
      remainingHp: enemy.hp
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

function returnToTown(state: GameState): CommandResult {
  const next: GameState = {
    ...state,
    phase: "town",
    position: null,
    combat: null,
    party: state.party.map((member) => ({ ...member, hp: member.maxHp })),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "returned_to_town" }]);
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

function visitRoom(state: GameState, world: ScenarioWorld, roomId: string) {
  const room = getRoom(world, roomId);
  const visitedRooms = state.map.visitedRooms.includes(roomId)
    ? state.map.visitedRooms
    : [...state.map.visitedRooms, roomId];

  return {
    ...state.map,
    visitedRooms,
    knownExits: {
      ...state.map.knownExits,
      [roomId]: Object.keys(room.exits) as Direction[]
    }
  };
}

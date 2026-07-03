import { appendLog } from "./gameState";
import { getExit, getRoom } from "./scenario";
import type { Command, Direction, GameState, ScenarioWorld } from "./types";

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
      return logOnly(state, "The party studies the stonework without changing the route.", ["inspect"]);
    case "listen":
      return logOnly(state, "A low draft moves somewhere beyond the fitted blocks.", ["listen"]);
    case "search":
      return search(state, world);
    case "open_door":
      return logOnly(state, "The door yields to a careful push.", ["door"]);
    case "disarm_trap":
      return disarmTrap(state, world);
    case "attack":
      return attack(state);
    case "retreat":
      return retreat(state);
    case "return_to_town":
      return returnToTown(state);
    default:
      return state;
  }
}

function enterDungeon(state: GameState, world: ScenarioWorld): GameState {
  if (state.party.length === 0) {
    return logOnly(state, "A party is required before entering the labyrinth.", ["blocked"]);
  }

  return {
    ...state,
    phase: "dungeon",
    position: {
      roomId: world.startRoom,
      facing: "east"
    },
    combat: null,
    map: visitRoom(state, world, world.startRoom),
    turn: state.turn + 1,
    log: appendLog(state, "The party descends beneath the black stela.", ["dungeon"])
  };
}

function turn(state: GameState, side: "left" | "right"): GameState {
  if (!state.position || state.phase !== "dungeon") {
    return state;
  }

  const facing = side === "left" ? leftOf[state.position.facing] : rightOf[state.position.facing];

  return {
    ...state,
    position: {
      ...state.position,
      facing
    },
    turn: state.turn + 1,
    log: appendLog(state, `The party turns ${side}, now facing ${facing}.`, ["move"])
  };
}

function moveForward(state: GameState, world: ScenarioWorld): GameState {
  if (!state.position || state.phase !== "dungeon") {
    return state;
  }

  const exit = getExit(world, state.position.roomId, state.position.facing);
  if (!exit) {
    return logOnly(state, "A cold wall blocks the way.", ["blocked"]);
  }

  const room = getRoom(world, exit);
  let next: GameState = {
    ...state,
    position: {
      ...state.position,
      roomId: exit
    },
    map: visitRoom(state, world, exit),
    turn: state.turn + 1,
    log: appendLog(state, `The party advances into ${room.name}.`, ["move"])
  };

  if (room.trap && !state.resolvedTraps.includes(room.trap.id)) {
    next = {
      ...next,
      party: next.party.map((member) => ({
        ...member,
        hp: Math.max(1, member.hp - room.trap!.damage)
      })),
      resolvedTraps: [...next.resolvedTraps, room.trap.id],
      log: appendLog(next, `${room.trap.name} snaps shut. The party is injured, but nobody is erased.`, ["trap"])
    };
  }

  if (room.event) {
    next = {
      ...next,
      log: appendLog(next, room.event, ["event"])
    };
  }

  if (room.encounter && !state.defeatedEnemies.includes(room.encounter.id)) {
    next = {
      ...next,
      phase: "combat",
      combat: {
        enemy: { ...room.encounter },
        roomId: room.id
      },
      log: appendLog(next, `${room.encounter.name} blocks the passage.`, ["combat"])
    };
  }

  return next;
}

function search(state: GameState, world: ScenarioWorld): GameState {
  if (!state.position) {
    return state;
  }

  const room = getRoom(world, state.position.roomId);
  if (!room.trap || state.resolvedTraps.includes(room.trap.id)) {
    return logOnly(state, "The search finds no active danger.", ["search"]);
  }

  return {
    ...state,
    discoveredSecrets: [...state.discoveredSecrets, room.trap.id],
    turn: state.turn + 1,
    log: appendLog(state, `The party notices ${room.trap.name}.`, ["search"])
  };
}

function disarmTrap(state: GameState, world: ScenarioWorld): GameState {
  if (!state.position) {
    return state;
  }

  const room = getRoom(world, state.position.roomId);
  if (!room.trap || state.resolvedTraps.includes(room.trap.id)) {
    return logOnly(state, "There is no active trap to disarm.", ["trap"]);
  }

  return {
    ...state,
    resolvedTraps: [...state.resolvedTraps, room.trap.id],
    turn: state.turn + 1,
    log: appendLog(state, `${room.trap.name} is made safe.`, ["trap"])
  };
}

function attack(state: GameState): GameState {
  if (state.phase !== "combat" || !state.combat) {
    return state;
  }

  const partyDamage = state.party.reduce((total, member) => total + member.attack, 0);
  const enemyHp = state.combat.enemy.hp - partyDamage;

  if (enemyHp <= 0) {
    return {
      ...state,
      phase: "dungeon",
      combat: null,
      defeatedEnemies: [...state.defeatedEnemies, state.combat.enemy.id],
      turn: state.turn + 1,
      log: appendLog(state, `${state.combat.enemy.name} falls. The route is clear.`, ["combat"])
    };
  }

  const enemy = {
    ...state.combat.enemy,
    hp: enemyHp
  };

  return {
    ...state,
    combat: {
      ...state.combat,
      enemy
    },
    party: state.party.map((member) => ({
      ...member,
      hp: Math.max(1, member.hp - state.combat!.enemy.attack)
    })),
    turn: state.turn + 1,
    log: appendLog(state, `${enemy.name} reels, then wounds the front line.`, ["combat"])
  };
}

function retreat(state: GameState): GameState {
  if (state.phase !== "combat") {
    return state;
  }

  return {
    ...state,
    phase: "dungeon",
    combat: null,
    turn: state.turn + 1,
    log: appendLog(state, "The party retreats and regroups without losing anyone.", ["combat", "retreat"])
  };
}

function returnToTown(state: GameState): GameState {
  return {
    ...state,
    phase: "town",
    position: null,
    combat: null,
    party: state.party.map((member) => ({ ...member, hp: member.maxHp })),
    turn: state.turn + 1,
    log: appendLog(state, "The party returns to town. Wounds are treated and the record is preserved.", ["town"])
  };
}

function logOnly(state: GameState, text: string, tags: string[]): GameState {
  return {
    ...state,
    turn: state.turn + 1,
    log: appendLog(state, text, tags)
  };
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

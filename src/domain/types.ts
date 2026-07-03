export type Direction = "north" | "east" | "south" | "west";

export type Command =
  | { type: "enter_dungeon" }
  | { type: "move_forward" }
  | { type: "turn_left" }
  | { type: "turn_right" }
  | { type: "inspect_wall" }
  | { type: "listen" }
  | { type: "search" }
  | { type: "open_door" }
  | { type: "disarm_trap" }
  | { type: "attack" }
  | { type: "retreat" }
  | { type: "return_to_town" };

export interface Character {
  id: string;
  name: string;
  notes: string;
  portraitRef?: string;
  hp: number;
  maxHp: number;
  attack: number;
}

export interface AdventureLogEntry {
  id: string;
  turn: number;
  text: string;
  tags: string[];
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  attack: number;
}

export interface Trap {
  id: string;
  name: string;
  damage: number;
  detectDc: number;
}

export interface CombatState {
  enemy: Enemy;
  roomId: string;
}

export interface DungeonPosition {
  roomId: string;
  facing: Direction;
}

export interface DungeonMapState {
  visitedRooms: string[];
  knownExits: Partial<Record<string, Direction[]>>;
}

export interface GameState {
  phase: "town" | "dungeon" | "combat";
  party: Character[];
  position: DungeonPosition | null;
  combat: CombatState | null;
  defeatedEnemies: string[];
  resolvedTraps: string[];
  discoveredSecrets: string[];
  map: DungeonMapState;
  log: AdventureLogEntry[];
  turn: number;
  aiEnabled: boolean;
}

export interface ScenarioWorld {
  id: string;
  title: string;
  startDungeon: string;
  startRoom: string;
  aiPolicy: AiPolicy;
  dungeons: DungeonFloor[];
}

export interface AiPolicy {
  allowed: string[];
  forbidden: string[];
}

export interface DungeonFloor {
  id: string;
  name: string;
  startRoom: string;
  rooms: DungeonRoom[];
}

export interface DungeonRoom {
  id: string;
  name: string;
  description: string;
  exits: Partial<Record<Direction, string>>;
  doors?: Direction[];
  stairsToTown?: boolean;
  trap?: Trap;
  encounter?: Enemy;
  event?: string;
}

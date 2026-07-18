import { createInitialGameState } from "../domain/gameState";
import { createGuildCharacter } from "../domain/characterCreation";
import { createCombatState } from "../domain/rulesEngine";
import { createDebugStateFromProgress } from "../debug/debugStart";
import { withDeterministicIds } from "../domain/ids";
import { runTrace, hashState } from "../headless/traceFixture";
import { canonicalize } from "./packExport";
import type { Command, GameState, ScenarioWorld } from "../domain/types";

// S1 of the Godot migration: emit golden trace fixtures — the parity targets a GDScript port must
// reproduce. Each fixture is a serialized initial state, a command sequence, and the per-step events
// and canonical state hashes the TS oracle produced. Godot loads the initial state, replays the
// commands through its own rules, and must match every event and hash.

export const TRACE_SCHEMA_VERSION = 1;

export interface TraceFixtureFile {
  schemaVersion: number;
  name: string;
  worldId: string;
  initialState: GameState;
  initialStateHash: string;
  commands: Command[];
  steps: { command: Command; events: unknown[]; stateHash: string }[];
  finalStateHash: string;
}

// A route builds a reproducible initial state + the commands to replay from it. Building under a fixed
// deterministic-id seed keeps character ids stable, so re-exporting produces byte-identical fixtures.
export interface TraceRoute {
  name: string;
  worldId: string;
  build: (world: ScenarioWorld) => { initial: GameState; commands: Command[] };
}

// Assemble one fixture. The initial state is built under `<name>:init` ids (stable character ids); the
// replay fold uses `<name>:run` ids for anything minted mid-route (log entries — excluded from the
// hash — so no collision matters).
export function buildTraceFixture(route: TraceRoute, world: ScenarioWorld): TraceFixtureFile {
  const { initial, commands } = withDeterministicIds(`${route.name}:init`, () => route.build(world));
  const trace = runTrace(world, initial, commands, `${route.name}:run`);
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    name: route.name,
    worldId: route.worldId,
    initialState: canonicalize(initial),
    initialStateHash: hashState(initial),
    commands,
    steps: trace.steps,
    finalStateHash: trace.finalStateHash
  };
}

export function traceFixtureToJson(route: TraceRoute, world: ScenarioWorld): string {
  return `${JSON.stringify(canonicalize(buildTraceFixture(route, world)), null, 2)}\n`;
}

// --- The vertical-slice routes ----------------------------------------------------------------------

// A front-line vanguard vs. the first B1F slime: three attack rounds, resolving to victory. Exercises
// the seeded combat RNG and the victory/result transition — the parity-critical path.
function combatRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const hero = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "slice" }), row: "front" as const };
  const enemy = world.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime") ?? world.enemies[0];
  const base = { ...createInitialGameState(), party: [hero] };
  const initial: GameState = {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 1)
  };
  const group = initial.combat!.enemyGroups[0];
  const actions = initial.party
    .filter((member) => member.hp > 0)
    .map((member) => ({ actorId: member.id, action: "attack" as const, targetGroupId: group.id }));
  const commands: Command[] = Array.from({ length: 3 }, () => ({ type: "declare_round", actions }));
  return { initial, commands };
}

// A short exploration route from a known B1F progress state: turn, search, listen, turn back. Exercises
// dungeon movement + current-cell probes without minting characters.
function dungeonRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const initial = createDebugStateFromProgress(world, "after_encounter");
  const commands: Command[] = [
    { type: "turn_left" },
    { type: "search" },
    { type: "listen" },
    { type: "turn_right" }
  ];
  return { initial, commands };
}

// Turning and listening only — no world lookup, no RNG. The first route brought to full GDScript
// parity (S3); movement/search/combat routes follow as their rules are ported.
function turnsRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const initial = createDebugStateFromProgress(world, "after_encounter");
  const commands: Command[] = [
    { type: "turn_left" },
    { type: "turn_right" },
    { type: "turn_right" },
    { type: "turn_left" },
    { type: "listen" }
  ];
  return { initial, commands };
}

// Turn to face a wall (east at room.b1f.002 has no exit) and step into it — exercises move_forward's
// blocked-wall branch (movement_blocked + map_exit_blocked, blockedExits updated). Room entry and
// encounter creation are the larger remaining move_forward work.
function wallRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const initial = createDebugStateFromProgress(world, "after_encounter");
  const commands: Command[] = [
    { type: "turn_left" }, // face east from the default south facing
    { type: "move_forward" }
  ];
  return { initial, commands };
}

// The slice's golden routes. More can be added as the vertical slice grows.
export const SLICE_ROUTES: TraceRoute[] = [
  { name: "b1f-turns", worldId: "default", build: turnsRoute },
  { name: "b1f-wall", worldId: "default", build: wallRoute },
  { name: "b1f-combat-victory", worldId: "default", build: combatRoute },
  { name: "b1f-exploration", worldId: "default", build: dungeonRoute }
];

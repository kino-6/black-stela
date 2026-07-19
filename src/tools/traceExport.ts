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

// A MULTI-ROUND fight: one hero vs. a PACK of two slimes. A single attack kills at most one body, so
// the pack survives round 1 and the ENEMY TURN fires (basic front-first swings) before the party
// finishes them — the parity path for the ported enemy turn + round-end + round advance.
function combatRoundsRoute(world: ScenarioWorld): { initial: GameState; commands: Command[] } {
  const hero = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "slice" }), row: "front" as const };
  const enemy = world.enemies.find((candidate) => candidate.id === "enemy.b1f.ash-slime") ?? world.enemies[0];
  const base = { ...createInitialGameState(), party: [hero] };
  const initial: GameState = {
    ...base,
    phase: "combat",
    position: { roomId: "room.b1f.001", facing: "east" },
    map: { ...base.map, floorId: "dungeon.b1f" },
    combat: createCombatState("room.b1f.001", enemy, 2)
  };
  const group = initial.combat!.enemyGroups[0];
  const actions = initial.party
    .filter((member) => member.hp > 0)
    .map((member) => ({ actorId: member.id, action: "attack" as const, targetGroupId: group.id }));
  const commands: Command[] = Array.from({ length: 5 }, () => ({ type: "declare_round", actions }));
  return { initial, commands };
}

// A fight vs. a chosen enemy pack — parameterized so a route can exercise a specific enemy turn path
// (an authored ability, a poison inflict) against the ported rules.
function combatVsRoute(enemyId: string, count: number, rounds: number) {
  return (world: ScenarioWorld): { initial: GameState; commands: Command[] } => {
    const hero = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "slice" }), row: "front" as const };
    const enemy = world.enemies.find((candidate) => candidate.id === enemyId) ?? world.enemies[0];
    const base = { ...createInitialGameState(), party: [hero] };
    const initial: GameState = {
      ...base,
      phase: "combat",
      position: { roomId: "room.b1f.001", facing: "east" },
      map: { ...base.map, floorId: "dungeon.b1f" },
      combat: createCombatState("room.b1f.001", enemy, count)
    };
    const group = initial.combat!.enemyGroups[0];
    const actions = initial.party
      .filter((member) => member.hp > 0)
      .map((member) => ({ actorId: member.id, action: "attack" as const, targetGroupId: group.id }));
    const commands: Command[] = Array.from({ length: rounds }, () => ({ type: "declare_round", actions }));
    return { initial, commands };
  };
}

// M2 roster commands: build a town party of four and reshuffle it — set-row, swap-rows, bench→recall,
// retire→unretire, erase. Exercises every ported roster op (party/reserve/retired moves + events).
function rosterRoute(): { initial: GameState; commands: Command[] } {
  const party = ["vanguard", "mender", "arcanist", "seeker"].map((classId, index) =>
    createGuildCharacter({ name: `M${index}`, classId: classId as never, seed: "roster" })
  );
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party, reserve: [], retired: [] };
  const commands: Command[] = [
    { type: "set_member_row", characterId: party[0].id, row: "back" },
    { type: "swap_member_rows", characterId: party[0].id, targetCharacterId: party[1].id },
    { type: "bench_member", characterId: party[3].id },
    { type: "recall_member", characterId: party[3].id },
    { type: "retire_member", characterId: party[2].id },
    { type: "unretire_member", characterId: party[2].id },
    { type: "edit_member_identity", characterId: party[1].id, name: "Renamed", title: "Hero", notes: "revised", accentColor: "#ff3366" },
    { type: "erase_member", characterId: party[3].id }
  ];
  return { initial, commands };
}

// M3 economy: a town shopping trip — buy consumables + gear, equip a clean slot, sell one, discard one.
// Exercises buy_item (item + equipment), equip_item, sell_item, discard_item + the inventory helpers.
function economyRoute(): { initial: GameState; commands: Command[] } {
  const hero = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "econ" });
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party: [hero], partyGold: 300 };
  const commands: Command[] = [
    { type: "buy_item", shopId: "shop.stela-general", itemId: "item.healing-draught" },
    { type: "buy_item", shopId: "shop.stela-general", itemId: "item.healing-draught" },
    { type: "buy_item", shopId: "shop.stela-general", itemId: "equip.iron-cap" },
    { type: "equip_item", characterId: hero.id, equipmentId: "equip.iron-cap" },
    { type: "sell_item", itemId: "item.healing-draught" },
    { type: "discard_item", itemId: "item.healing-draught" }
  ];
  return { initial, commands };
}

// M3 recovery (infirmary): a wounded party is healed for gold, then a no-cost re-heal, then a blocked
// heal when the purse is empty. Exercises recover_party (cost, injury clear, block).
function recoveryRoute(): { initial: GameState; commands: Command[] } {
  const hurt = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "rec" }), hp: 5, injury: "wounded" as const };
  const mender = { ...createGuildCharacter({ name: "Sella", classId: "mender", seed: "rec" }), hp: 4 };
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party: [hurt, mender], partyGold: 100 };
  const commands: Command[] = [
    { type: "recover_party" }, // heals both, docks cost
    { type: "recover_party" } // already full → cost 0, party_recovered gold 0
  ];
  return { initial, commands };
}

function recoveryBlockedRoute(): { initial: GameState; commands: Command[] } {
  const hurt = { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "recb" }), hp: 3, injury: "wounded" as const };
  const base = createInitialGameState();
  const initial: GameState = { ...base, phase: "town", party: [hurt], partyGold: 2 };
  return { initial, commands: [{ type: "recover_party" }] }; // too poor → recovery_blocked
}

// M3 quests: accept a fresh bounty, then claim a met bounty whose 55-XP reward crosses several level
// thresholds — exercises accept_quest, claim_quest, the XP grant, and applyLevelUps (level growth).
function questRoute(): { initial: GameState; commands: Command[] } {
  const hero = createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "quest" });
  const base = createInitialGameState();
  const initial: GameState = {
    ...base,
    phase: "town",
    party: [hero],
    partyGold: 0,
    quests: [{ questId: "quest.glimmer-hunt", status: "active", killCount: 1, claims: 0 }]
  };
  const commands: Command[] = [
    { type: "accept_quest", questId: "quest.cull-the-ash" },
    { type: "claim_quest", questId: "quest.glimmer-hunt" }
  ];
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
  { name: "b1f-combat-rounds", worldId: "default", build: combatRoundsRoute },
  // Enemy-turn coverage: b2f ash-caller fires the "Cinder Lash" damage ABILITY; b3f bitter-mote lands a
  // poison INFLICT that then bites at round-end. Both exercise the ported enemy turn beyond basic melee.
  { name: "b2f-ability", worldId: "default", build: combatVsRoute("enemy.b2f.ash-caller", 2, 6) },
  { name: "b3f-poison", worldId: "default", build: combatVsRoute("enemy.b3f.bitter-mote", 2, 8) },
  // b4f lantern-ward mixes a damage ability + a status ability (Blinding Glare) — exercises the enemy
  // ability STATUS branch. rootheart out-damages a lone hero over many rounds → the PARTY-WIPE path
  // (every member wounded → dragged back to town minus a rescue fee).
  { name: "b4f-caster", worldId: "default", build: combatVsRoute("enemy.b4f.lantern-ward", 1, 8) },
  { name: "verdant-wipe", worldId: "verdant", build: combatVsRoute("enemy.verdant.g8.rootheart", 1, 14) },
  { name: "roster", worldId: "default", build: rosterRoute },
  { name: "economy", worldId: "default", build: economyRoute },
  { name: "recovery", worldId: "default", build: recoveryRoute },
  { name: "recovery-blocked", worldId: "default", build: recoveryBlockedRoute },
  { name: "quests", worldId: "default", build: questRoute },
  { name: "b1f-exploration", worldId: "default", build: dungeonRoute }
];

// Descent combat+growth simulation.
//
// The headless *reachability* probes already prove the party can physically walk
// each floor and reach a town-return anchor. What they do NOT prove is whether a
// starter party's *growth* keeps it alive through the fights of a full B1F -> B8F
// descent. This module answers that with logic, not walking: it feeds the fights a
// descent would face through the real combat engine (createCombatState +
// declare_round + applyLevelUps), carrying party level/HP forward, and reports the
// survival margin per floor.
//
// It mirrors the engine's first-contact encounter model (rulesEngine: an encounter
// only fires while `!defeatedEnemies.includes(enemy.id)`): each enemy *type* is
// fought exactly once per run, in the group size its table declares. So the sim
// fights, per floor, each not-yet-seen fixed encounter and each new random-table
// enemy type once — not a fabricated stream of random battles.
//
// Two recovery models bracket the truth:
//   "town" — full heal between floors (standard DRPG play: return to town to heal).
//            Isolates the difficulty curve: is any single floor lethal at the level
//            you would naturally have reached by then?
//   "none" — carry HP across floors, healing only from level-ups (pessimistic
//            one-push lower bound with no consumables).
import { createCombatState, executeCommand } from "../domain/rulesEngine";
import { createDebugStateFromProgress } from "../debug/debugStart";
import { floorName } from "../domain/scenario";
import type { Character, Enemy, GameState, ScenarioWorld } from "../domain/types";

const DESCENT_ORDER = [
  "dungeon.b1f",
  "dungeon.b2f",
  "dungeon.b3f",
  "dungeon.b4f",
  "dungeon.b5f",
  "dungeon.b6f",
  "dungeon.b7f",
  "dungeon.b8f"
] as const;

export interface FloorSimResult {
  floorId: string;
  floorName: string;
  fights: number;
  arrivalLevel: number;
  departLevel: number;
  arrivalHpPct: number;
  lowestHpPct: number;
  departHpPct: number;
  downed: number;
  wiped: boolean;
}

export interface DescentSimResult {
  heal: "town" | "none";
  floors: FloorSimResult[];
  survived: boolean;
  finalLevel: number;
}

const alive = (member: Character) => member.hp > 0 && !member.injury;
const hpPct = (member: Character) => (member.maxHp > 0 ? member.hp / member.maxHp : 0);
const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const avgLevel = (party: Character[]) => avg(party.map((m) => m.level));
const avgHpPct = (party: Character[]) => avg(party.map(hpPct));
const lowestHpPct = (party: Character[]) => Math.min(...party.map(hpPct));

interface PlannedEncounter {
  enemy: Enemy;
  count: number;
}

// The distinct enemy types a floor introduces, in the group sizes its content
// declares: fixed room encounters (count 1) plus each new random-table type at its
// maxCount (the fuller, harder group). `seen` gates by type across the whole run,
// exactly like the engine's defeatedEnemies check.
function planFloor(world: ScenarioWorld, floorId: string, seen: Set<string>): PlannedEncounter[] {
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  if (!floor) {
    return [];
  }

  const encounters: PlannedEncounter[] = [];
  const planned = new Set<string>();
  const take = (enemy: Enemy, count: number) => {
    if (seen.has(enemy.id) || planned.has(enemy.id)) {
      return;
    }
    planned.add(enemy.id);
    encounters.push({ enemy, count });
  };

  for (const room of floor.rooms) {
    if (room.encounter) {
      const enemy = world.enemies.find((candidate) => candidate.id === room.encounter?.id) ?? room.encounter;
      take(enemy, 1);
    }
    // A tactical squad (front-blocker + back-caster) is a single planned fight of all
    // its members — otherwise the sim under-counts squad floors (e.g. verdant G2).
    for (const enemyId of room.encounterSquad ?? []) {
      const enemy = world.enemies.find((candidate) => candidate.id === enemyId);
      if (enemy) {
        take(enemy, 1);
      }
    }
  }

  const tableIds = new Set<string>();
  for (const room of floor.rooms) {
    if (room.encounterTable) {
      tableIds.add(room.encounterTable);
    }
  }
  for (const tableId of tableIds) {
    const table = world.encounterTables.find((candidate) => candidate.id === tableId);
    if (!table) {
      continue;
    }
    for (const entry of table.entries) {
      const enemy = world.enemies.find((candidate) => candidate.id === entry.enemyId);
      if (enemy) {
        take(enemy, entry.maxCount ?? entry.minCount ?? 1);
      }
    }
  }

  return encounters;
}

// Resolve one encounter to completion through the real engine, front row first.
// Also reports the lowest party HP% reached *during* the fight — the real danger
// trough, which the post-victory state hides because winning awards XP that
// level-ups then heal away.
function resolveFight(
  state: GameState,
  world: ScenarioWorld,
  encounter: PlannedEncounter
): { state: GameState; midFightLow: number } {
  let current: GameState = {
    ...state,
    phase: "combat",
    combat: createCombatState(state.position?.roomId ?? "sim", encounter.enemy, encounter.count)
  };
  let midFightLow = lowestHpPct(current.party);

  for (let round = 0; round < 80 && current.phase === "combat"; round += 1) {
    const target = current.combat?.enemyGroups.find((group) => group.count > 0);
    const front = current.party.filter((member) => member.row === "front" && alive(member));
    const actors = front.length > 0 ? front : current.party.filter(alive);
    if (!target || actors.length === 0) {
      break;
    }
    current = executeCommand(current, world, {
      type: "declare_round",
      actions: actors.map((actor) => ({ actorId: actor.id, action: "attack", targetGroupId: target.id }))
    });
    // Sample while still in combat (before the victory level-up heal tops HP off).
    if (current.phase === "combat") {
      midFightLow = Math.min(midFightLow, lowestHpPct(current.party));
    }
  }

  return { state: current, midFightLow };
}

export function simulateDescent(world: ScenarioWorld, options: { heal?: "town" | "none" } = {}): DescentSimResult {
  const heal = options.heal ?? "town";

  const base = createDebugStateFromProgress(world, "ready");
  let party = base.party.map((member) => ({ ...member }));
  const seen = new Set<string>();
  const floors: FloorSimResult[] = [];

  // The world's own dungeon order (registry orders by floor level): b1..b8 for the
  // default world, g1..g8 for verdant, etc. Falls back to the default constant.
  const descentOrder = world.dungeons.length > 0 ? world.dungeons.map((dungeon) => dungeon.id) : DESCENT_ORDER;
  for (const floorId of descentOrder) {
    if (heal === "town") {
      party = party.map((member) => ({ ...member, hp: member.maxHp, mp: member.maxMp, injury: undefined, status: [] }));
    }

    const encounters = planFloor(world, floorId, seen);
    const arrivalLevel = avgLevel(party);
    const arrivalHpPct = avgHpPct(party);
    let lowest = arrivalHpPct;
    let wiped = false;

    const floorRoom = world.dungeons.find((dungeon) => dungeon.id === floorId)?.startRoom ?? "sim";
    let workState: GameState = { ...base, phase: "dungeon", party, position: { roomId: floorRoom, facing: "north" } };

    for (const encounter of encounters) {
      const outcome = resolveFight(workState, world, encounter);
      workState = outcome.state;
      party = workState.party;
      seen.add(encounter.enemy.id);
      lowest = Math.min(lowest, outcome.midFightLow);
      if (party.filter(alive).length === 0) {
        wiped = true;
        break;
      }
    }

    floors.push({
      floorId,
      floorName: floorName(world, floorId),
      fights: encounters.length,
      arrivalLevel,
      departLevel: avgLevel(party),
      arrivalHpPct,
      lowestHpPct: lowest,
      departHpPct: avgHpPct(party),
      downed: party.filter((member) => !alive(member)).length,
      wiped
    });

    if (wiped) {
      break;
    }
  }

  return {
    heal,
    floors,
    survived: !floors.some((floor) => floor.wiped),
    finalLevel: floors.length ? floors[floors.length - 1].departLevel : avgLevel(party)
  };
}

// Descent combat+growth simulation.
//
// The headless *reachability* probes already prove the party can physically walk
// each floor and reach a town-return anchor. What they do NOT prove is whether a
// starter party's *growth* keeps pace with the encounter difficulty as it
// descends B1F -> B8F. This module answers that with logic, not walking: it feeds
// the fights a descent would face through the real combat engine (createCombatState
// + declare_round + applyLevelUps), carrying party level/HP forward, and reports
// the survival margin per floor.
//
// Two recovery models bracket the truth:
//   "town" — full heal between floors (standard DRPG play: return to town to heal).
//            Isolates the difficulty *curve*: is any single floor lethal at the
//            level you would naturally have reached by then?
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
  randomLoad: number;
  seed: number;
  floors: FloorSimResult[];
  survived: boolean;
  finalLevel: number;
}

// Small deterministic LCG so a (seed, load) pair reproduces the same descent.
function makeRng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
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

// The fights a descent of one floor would face: every fixed room encounter, plus
// `randomLoad` weighted draws from the floor's random encounter tables.
function planFloor(world: ScenarioWorld, floorId: string, randomLoad: number, rng: () => number): PlannedEncounter[] {
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  if (!floor) {
    return [];
  }

  const encounters: PlannedEncounter[] = [];
  for (const room of floor.rooms) {
    if (room.encounter) {
      encounters.push({ enemy: room.encounter, count: 1 });
    }
  }

  const pool: Array<{ enemy: Enemy; weight: number; minCount: number; maxCount: number }> = [];
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
        pool.push({
          enemy,
          weight: entry.weight,
          minCount: entry.minCount ?? 1,
          maxCount: entry.maxCount ?? entry.minCount ?? 1
        });
      }
    }
  }

  const totalWeight = pool.reduce((total, item) => total + item.weight, 0);
  for (let i = 0; i < randomLoad && totalWeight > 0; i += 1) {
    let roll = rng() * totalWeight;
    const picked = pool.find((item) => (roll -= item.weight) < 0) ?? pool[pool.length - 1];
    const span = picked.maxCount - picked.minCount;
    const count = picked.minCount + Math.floor(rng() * (span + 1));
    encounters.push({ enemy: picked.enemy, count });
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

export function simulateDescent(
  world: ScenarioWorld,
  options: { heal?: "town" | "none"; randomLoad?: number; seed?: number } = {}
): DescentSimResult {
  const heal = options.heal ?? "town";
  const randomLoad = options.randomLoad ?? 4;
  const seed = options.seed ?? 1;
  const rng = makeRng(seed);

  const base = createDebugStateFromProgress(world, "ready");
  let party = base.party.map((member) => ({ ...member }));
  const floors: FloorSimResult[] = [];

  for (const floorId of DESCENT_ORDER) {
    if (heal === "town") {
      party = party.map((member) => ({ ...member, hp: member.maxHp, mp: member.maxMp, injury: undefined, status: [] }));
    }

    const encounters = planFloor(world, floorId, randomLoad, rng);
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
    randomLoad,
    seed,
    floors,
    survived: !floors.some((floor) => floor.wiped),
    finalLevel: floors.length ? floors[floors.length - 1].departLevel : avgLevel(party)
  };
}

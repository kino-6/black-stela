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
import { applyLevelUps, xpForLevel } from "../domain/leveling";
import { createDebugStateFromProgress } from "../debug/debugStart";
import { analyzeFloorGraph } from "../domain/floorGraph";
import { WANDERING_COOLDOWN_STEPS, WANDERING_ENCOUNTER_PCT } from "../domain/rulesEngine";
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
// How many wandering packs a floor throws at a party that is actually descending it.
// Expected spacing between ambushes is COOLDOWN + 100/RATE steps; the walk is the
// entrance→down-stair shortest path times an exploration factor (players detour for
// chambers and treasure, they do not beeline). Each ambush is a roll on that floor's
// table, so we take its heaviest entry at maxCount.
const EXPLORE_FACTOR = 2.5;

function planWanderingFights(world: ScenarioWorld, floorId: string): PlannedEncounter[] {
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  const table = world.encounterTables.find((candidate) => candidate.floorId === floorId);
  if (!floor || !table) {
    return [];
  }

  const graph = analyzeFloorGraph(world, floorId);
  const downStairRoom = (floor.grid?.cells ?? []).find((cell) =>
    Object.values(cell.edges).some((edge) => edge?.kind === "stairs" && edge.targetFloorId)
  )?.roomId;
  const shortest = downStairRoom
    ? Math.max(1, graph.shortestPathCells(floor.startRoom, downStairRoom).length - 1)
    : 30;
  const walkSteps = Math.round(shortest * EXPLORE_FACTOR);
  const spacing = WANDERING_COOLDOWN_STEPS + 100 / WANDERING_ENCOUNTER_PCT;
  // Every floor is walked, so it always draws SOME ambushes — a floor whose down-stair
  // happens to sit near its landing must not read as encounter-free.
  const count = Math.round(walkSteps / spacing);

  const entry = table.entries.reduce((heaviest, candidate) =>
    (candidate.weight ?? 1) > (heaviest.weight ?? 1) ? candidate : heaviest
  );
  const enemy = world.enemies.find((candidate) => candidate.id === entry.enemyId);
  if (!enemy || count <= 0) {
    return [];
  }
  return Array.from({ length: count }, () => ({
    enemy,
    count: entry.maxCount ?? entry.minCount ?? 1
  }));
}

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
      if (enemy && !enemy.prizedXp) {
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

// Two ways to play a descent, so the Gate can measure what preparation is worth. The design the
// user set: "対策装備・対策アイテムがあればLvが多少低くてもなんとかなる … 埋める差はLv10." So we run
// the SAME descent two ways and compare the lowest level each can clear at.
export type SimPolicy = "naive" | "prepared";

// Bring a party to a target level by granting the XP for it and applying the real level-ups, so
// stats/HP grow exactly as they would in play.
function partyAtLevel(party: Character[], level: number): Character[] {
  return party.map((member) => {
    const raised = applyLevelUps({ ...member, level: 1, xp: xpForLevel(level) });
    return { ...raised.character, hp: raised.character.maxHp, mp: raised.character.maxMp };
  });
}

// The element this enemy is MOST weak to, and a world weapon that deals it (if one exists). This
// is the "prepared" party's offense: carry the right tool and swap to it per fight.
function bestWeaponFor(world: ScenarioWorld, enemy: Enemy): string | undefined {
  const weaknesses = enemy.weaknesses ?? {};
  let bestElement: string | undefined;
  let bestMult = 1.0001; // must actually be a weakness (>1) to bother
  for (const [element, mult] of Object.entries(weaknesses)) {
    if ((mult ?? 1) > bestMult) {
      bestMult = mult ?? 1;
      bestElement = element;
    }
  }
  if (!bestElement) {
    return undefined;
  }
  return world.equipment.find((gear) => gear.slot === "weapon" && gear.element === bestElement)?.id;
}

// A body/charm that resists this enemy's elemental THREAT (its damage abilities), if one exists.
function bestResistFor(world: ScenarioWorld, enemy: Enemy): string | undefined {
  const threats = new Set(
    (enemy.abilities ?? [])
      .map((ability) => (ability.effect.kind === "damage" ? ability.effect.element : undefined))
      .filter((element): element is string => Boolean(element) && element !== "physical")
  );
  if (threats.size === 0) {
    return undefined;
  }
  return world.equipment.find(
    (gear) => gear.slot !== "weapon" && Object.entries(gear.elementResist ?? {}).some(([el, m]) => threats.has(el) && (m ?? 1) < 1)
  )?.id;
}

// Kit the party for THIS enemy. Prepared: the counter weapon + the resisting armour where they
// exist. Naive: a plain physical weapon, no resist — the loadout of a party that read nothing.
function equipPartyForEnemy(party: Character[], world: ScenarioWorld, enemy: Enemy, policy: SimPolicy): Character[] {
  // Naive keeps the party's own starter loadout untouched — the point is only that it brought no
  // COUNTERPLAY, so the existing (naive) balance curve is unchanged. Prepared layers the counter
  // weapon and the resisting armour on top, per this enemy.
  if (policy === "naive") {
    return party;
  }
  const weapon = bestWeaponFor(world, enemy);
  const resist = bestResistFor(world, enemy);
  if (!weapon && !resist) {
    return party;
  }
  return party.map((member) => ({
    ...member,
    equipment: {
      ...member.equipment,
      ...(weapon ? { weapon: { id: weapon } } : {}),
      ...(resist ? { body: { id: resist } } : {})
    }
  }));
}

function resolveFight(
  state: GameState,
  world: ScenarioWorld,
  encounter: PlannedEncounter,
  policy: SimPolicy = "naive"
): { state: GameState; midFightLow: number } {
  const kitted = { ...state, party: equipPartyForEnemy(state.party, world, encounter.enemy, policy) };
  const readyState = kitted.combatConclusion
    ? executeCommand(kitted, world, { type: "continue_after_combat" })
    : kitted;
  let current: GameState = {
    ...readyState,
    phase: "combat",
    combat: createCombatState(readyState.position?.roomId ?? "sim", encounter.enemy, encounter.count)
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
  options: { heal?: "town" | "none"; policy?: SimPolicy; startLevel?: number } = {}
): DescentSimResult {
  const heal = options.heal ?? "town";
  const policy = options.policy ?? "naive";

  const base = createDebugStateFromProgress(world, "ready");
  let party = base.party.map((member) => ({ ...member }));
  if (options.startLevel && options.startLevel > 1) {
    party = partyAtLevel(party, options.startLevel);
  }
  const floors: FloorSimResult[] = [];

  // The world's own dungeon order (registry orders by floor level): b1..b8 for the
  // default world, g1..g8 for verdant, etc. Falls back to the default constant.
  const descentOrder = world.dungeons.length > 0 ? world.dungeons.map((dungeon) => dungeon.id) : DESCENT_ORDER;
  for (const floorId of descentOrder) {
    if (heal === "town") {
      party = party.map((member) => ({ ...member, hp: member.maxHp, mp: member.maxMp, injury: undefined, status: [] }));
    }

    // The encounter economy changed: suppression is now scoped to the FLOOR VISIT, so a
    // floor fights ALL of its own authored types (no run-long first-contact dedup), and
    // walking it also draws WANDERING packs. Both must be simulated or the sim measures
    // a game that no longer exists.
    const encounters = [
      ...planFloor(world, floorId, new Set<string>()),
      ...planWanderingFights(world, floorId)
    ];
    const arrivalLevel = avgLevel(party);
    const arrivalHpPct = avgHpPct(party);
    let lowest = arrivalHpPct;
    let wiped = false;

    const floorRoom = world.dungeons.find((dungeon) => dungeon.id === floorId)?.startRoom ?? "sim";
    let workState: GameState = { ...base, phase: "dungeon", party, position: { roomId: floorRoom, facing: "north" } };

    for (const encounter of encounters) {
      const outcome = resolveFight(workState, world, encounter, policy);
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
    floors,
    survived: !floors.some((floor) => floor.wiped),
    finalLevel: floors.length ? floors[floors.length - 1].departLevel : avgLevel(party)
  };
}

// Does a party STARTING at `startLevel` clear the whole descent (no wipe on any floor) under a
// given policy? Uses the pessimistic `none` heal model so the answer is "can they actually take
// it", not "with a town trip between every floor".
export function clearsAtLevel(world: ScenarioWorld, startLevel: number, policy: SimPolicy, margin = 0.25): boolean {
  const result = simulateDescent(world, { heal: "none", policy, startLevel });
  if (!result.survived) {
    return false;
  }
  // Not "survived at 3% HP" — clears with room to spare. Surviving on a knife-edge is the naive
  // floor preparation is meant to lift the party off.
  const deepest = Math.min(...result.floors.map((floor) => floor.lowestHpPct));
  return deepest >= margin;
}

// The lowest start level at which a party clears under `policy`. Monotonic in level (more level
// never hurts), so a plain scan up to a cap is exact. Returns cap + 1 if it never clears.
export function minClearLevel(world: ScenarioWorld, policy: SimPolicy, cap = 24, margin = 0.25): number {
  for (let level = 1; level <= cap; level += 1) {
    if (clearsAtLevel(world, level, policy, margin)) {
      return level;
    }
  }
  return cap + 1;
}

// What preparation is worth, in levels: how many levels LOWER a prepared party can start and still
// clear, versus a naive one. This is the number the whole balance design turns on — the user's
// target is around ten. Positive = preparation genuinely substitutes for levels.
export interface PreparationValue {
  naiveMinLevel: number;
  preparedMinLevel: number;
  levelsSaved: number;
}
export function preparationValue(world: ScenarioWorld, cap = 24): PreparationValue {
  const naiveMinLevel = minClearLevel(world, "naive", cap);
  const preparedMinLevel = minClearLevel(world, "prepared", cap);
  // levelsSaved = how many levels a prepared party can shave off and still clear comfortably.
  return { naiveMinLevel, preparedMinLevel, levelsSaved: naiveMinLevel - preparedMinLevel };
}

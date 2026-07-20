// §9.4e — VARIED-PARTY simulation.
//
// `descentSim` answers "does the level curve keep a party alive down eight floors". It cannot answer
// the question §9.4 actually asks, for one blunt reason: it only ever issues `attack`. A Priest and a
// Warrior behave identically in it, so adding a class axis to that module would have produced four
// identical columns and called it evidence.
//
// So this module adds the two things the question needs:
//   1. COMPOSITION — parties built from named classes and stocked inventories.
//   2. TACTICS — actors that actually use what they are: heal the hurt, ward before the fight, throw
//      the flask they were given. Without this, "specialist present" and "no coverage" are the same run.
//
// It measures the three problems §10 names — recovery, ward/status, and traps/locks — at four coverage
// levels each, and reports COST and CEILING rather than a pass/fail. The design rule being tested
// (class-system.md §4, §8) is not "every party wins"; it is:
//
//   - no single class is compulsory: every problem is survivable without its specialist, and
//   - the specialist is still the best answer: cheaper, safer, or reaching further.
//
// A world where the item route matched the specialist would fail the second half as surely as a world
// where the specialist was mandatory fails the first.
import { createCombatState, executeCommand } from "../domain/rulesEngine";
import { addCharacter, createInitialGameState } from "../domain/gameState";
import { createGuildCharacter } from "../domain/characterCreation";
import { createInventoryItemFromCatalog } from "../domain/economy";
import { combatLoadout } from "../domain/vocations";
import { TECHNIQUES } from "../domain/techniques";
import { classProficiency } from "../domain/classCapabilities";
import { successChance, trapSkill } from "../domain/chests";
import { withDeterministicIds } from "../domain/ids";
import { spellTargeting } from "../domain/spells";
import type { CharacterClassId, CombatActionDeclaration, Enemy, GameState, ScenarioWorld } from "../domain/types";

/** How well a party is equipped to answer one problem. */
export type Coverage = "specialist" | "secondary" | "item" | "none";

/** The three problems §10 requires a specialist, a secondary and an item-only party to each resolve. */
export type Problem = "recovery" | "ward" | "traps";

export interface PartyPlan {
  classes: CharacterClassId[];
  items: string[];
}

export interface CoverageOutcome {
  problem: Problem;
  coverage: Coverage;
  /** Whether the party resolved the problem at all — the "never a dead end" half of §8. */
  resolved: boolean;
  /** Problem-specific cost: rounds spent afflicted, fights survived, turns and charges spent. */
  cost: number;
  /** Gold the answer cost to bring, so an item route reads as the expensive one it is. */
  gold: number;
  /** Charges consumed — an item answer runs out; a class does not. */
  charges: number;
  detail: string;
}

const LEVEL = 6;
/** How many of each item the party shops for before descending. */
const STOCK_PER_ITEM = 8;

/**
 * Parties are seeded on their CLASS LIST, not on the coverage label. The `item` and `none` parties are
 * the same four classes and differ only by what is in the pack — but seeding them separately gave them
 * different character ids, and every roll in the engine is seeded on those ids. The result was an
 * item party scoring WORSE than an empty one, which a +6 tool cannot mechanically do. Same classes now
 * means same ids, so the inventory is genuinely the only variable between those two columns.
 */
function buildParty(world: ScenarioWorld, plan: PartyPlan, seed: string): GameState {
  void seed;
  return withDeterministicIds(`coverage-${plan.classes.join("-")}`, () => {
    let state = createInitialGameState();
    for (const [index, classId] of plan.classes.entries()) {
      state = addCharacter(state, createGuildCharacter({ name: `${classId}${index}`, classId, seed: `${seed}-${index}` }));
    }
    // A real shopping trip, not three of each. Three potions across a whole descent is not the item
    // route being weak, it is the item route not being bought — and it made the "item" column identical
    // to "none" while still printing a price tag.
    const inventory = plan.items
      .map((id) => createInventoryItemFromCatalog(world, id, STOCK_PER_ITEM))
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const party = state.party.map((member, index) => ({
      ...member,
      row: index < 3 ? ("front" as const) : ("back" as const),
      level: LEVEL,
      mp: 40,
      maxMp: 40
    }));
    return { ...state, party, inventory };
  });
}

/** The best disarm bonus the party is carrying, or 0 — what a tool adds to the attempt. */
function toolBonus(world: ScenarioWorld, state: GameState, action: string): number {
  return state.inventory.reduce((best, held) => {
    if (held.quantity <= 0) return best;
    const aid = world.items.find((item) => item.id === held.id)?.explorationAid;
    return aid && (aid.actions as string[]).includes(action) ? Math.max(best, aid.bonus) : best;
  }, 0);
}

/** What the party actually SPENT — price times the quantity carried, not one unit's sticker price. */
function goldOf(world: ScenarioWorld, itemIds: string[]): number {
  return itemIds.reduce((total, id) => total + (world.items.find((item) => item.id === id)?.price ?? 0) * STOCK_PER_ITEM, 0);
}

/**
 * One round of orders for a party that USES ITSELF. Deliberately simple and readable rather than
 * optimal — the point is that a class's answer gets played at all, not that it is played perfectly.
 * Priorities, in order: revive nobody (there is no revive), heal anyone badly hurt, put up a ward that
 * is not yet up, then attack.
 */
function planRound(state: GameState, wardedIds: Set<string>): CombatActionDeclaration[] {
  const target = state.combat?.enemyGroups.find((group) => group.count > 0);
  if (!target) return [];
  const able = state.party.filter((member) => member.hp > 0 && !member.injury);
  const hurt = able.filter((member) => member.hp / member.maxHp < 0.55).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

  return able.map((actor) => {
    const known = combatLoadout(actor);

    // 1. A ward, once, before anything else — that is what a ward is for.
    const ward = known.find((id) => TECHNIQUES[id].effects.some((effect) => effect.kind === "ward"));
    if (ward && !wardedIds.has(actor.id) && actor.mp >= (TECHNIQUES[ward].cost.mp ?? 0)) {
      wardedIds.add(actor.id);
      return { actorId: actor.id, action: "cast" as const, spellId: ward };
    }

    // 1b. No class ward — break the charm instead. Without this the item column was never an item
    // column at all: the charm sat in the pack and the party scored whatever an unequipped party scores.
    if (!ward && !wardedIds.has(actor.id)) {
      const charm = state.inventory.find((item) => item.kind === "ward" && item.quantity > 0);
      if (charm) {
        for (const member of able) wardedIds.add(member.id);
        return { actorId: actor.id, action: "use_item" as const, itemId: charm.id };
      }
    }

    // 2. Heal whoever is worst off, with the biggest heal this actor knows.
    if (hurt) {
      const heals = known
        .filter((id) => TECHNIQUES[id].effects.some((effect) => effect.kind === "heal") && spellTargeting(TECHNIQUES[id].target) !== "group")
        .sort((a, b) => healAmount(b) - healAmount(a));
      const heal = heals.find((id) => actor.mp >= (TECHNIQUES[id].cost.mp ?? 0));
      if (heal) {
        const scope = spellTargeting(TECHNIQUES[heal].target);
        return {
          actorId: actor.id,
          action: "cast" as const,
          spellId: heal,
          ...(scope === "ally" ? { targetCharacterId: hurt.id } : {})
        };
      }
      // 3. No class answer — spend a potion instead. This is the item route doing its job.
      const potion = state.inventory.find((item) => item.kind === "healing" && item.quantity > 0);
      if (potion) {
        return { actorId: actor.id, action: "use_item" as const, itemId: potion.id, targetCharacterId: hurt.id };
      }
    }

    return { actorId: actor.id, action: "attack" as const, targetGroupId: target.id };
  });
}

function healAmount(id: keyof typeof TECHNIQUES): number {
  const effect = TECHNIQUES[id].effects.find((candidate) => candidate.kind === "heal");
  return effect && effect.kind === "heal" ? effect.amount : 0;
}

/** Fight one enemy to a conclusion, playing the party's own kit. */
function fight(
  state: GameState,
  world: ScenarioWorld,
  enemy: Enemy,
  count: number,
  _unused: Set<string>,
  sample?: (state: GameState) => void
): GameState {
  // Wards live on CombatState and die with the fight, so who is warded resets here. Threading one set
  // through a whole gauntlet meant the chanter sang once, in the first fight, and silently stopped.
  const wardedIds = new Set<string>();
  let current: GameState = {
    ...state,
    phase: "combat",
    combat: createCombatState("sim", enemy, count)
  };
  for (let round = 0; round < 60 && current.phase === "combat"; round += 1) {
    const actions = planRound(current, wardedIds);
    if (actions.length === 0) break;
    current = executeCommand(current, world, { type: "declare_round", actions });
    sample?.(current);
  }
  return current.combatConclusion ? executeCommand(current, world, { type: "continue_after_combat" }) : current;
}

// ---------------------------------------------------------------------------
// The three problems
// ---------------------------------------------------------------------------

/** RECOVERY — a gauntlet with no town between fights. How far does each answer carry the party? */
function runRecovery(world: ScenarioWorld, coverage: Coverage, plan: PartyPlan): CoverageOutcome {
  // A gauntlet with no town, run until the party FALLS. A fixed six fights told us nothing: every
  // coverage level cleared it without a scratch, so the measurement had no resolution at all. What
  // separates a healer from no healer is how long the party keeps going, so that is what is counted.
  const roster = world.enemies.filter((enemy) => (enemy.level ?? 1) <= LEVEL + 2);
  let state = buildParty(world, plan, `recovery-${coverage}`);
  const startCharges = state.inventory.reduce((total, item) => total + item.quantity, 0);
  const warded = new Set<string>();
  let survived = 0;

  for (let round = 0; round < 40; round += 1) {
    const enemy = roster[round % roster.length];
    state = fight(state, world, enemy, 3, warded);
    if (state.party.every((member) => member.injury || member.hp <= 0)) break;
    survived += 1;
  }

  const charges = startCharges - state.inventory.reduce((total, item) => total + item.quantity, 0);
  return {
    problem: "recovery",
    coverage,
    resolved: survived > 0,
    cost: survived,
    gold: goldOf(world, plan.items),
    charges,
    detail: `${survived} consecutive fights before the party fell (no town heal)`
  };
}

/** WARD / STATUS — an enemy that afflicts. How many member-rounds are lost to the condition? */
function runWard(world: ScenarioWorld, coverage: Coverage, plan: PartyPlan): CoverageOutcome {
  // EVERY enemy that can afflict, not the first one found. Picking one meant measuring the Bitter Mote's
  // poison alone — which no ward in the game covers — so the ward line scored WORSE than bringing
  // nothing (it spent a turn casting and prevented exactly zero). The ward answers fear and sleep; a
  // metric that never presents fear or sleep is measuring the wrong thing.
  const inflictors = world.enemies.filter(
    (enemy) => enemy.inflicts || (enemy.abilities ?? []).some((ability) => ability.effect.kind === "status")
  );
  let state = buildParty(world, plan, `ward-${coverage}`);
  const startCharges = state.inventory.reduce((total, item) => total + item.quantity, 0);
  const warded = new Set<string>();

  // MEMBER-ROUNDS lost to the condition, sampled every round. Counting who was still afflicted at the
  // END measured nothing: the fight ends when the enemy dies, so a party that spent every round poisoned
  // and a party that was never touched could both finish clean.
  let landed = 0;
  // Total member-rounds SAMPLED, so the score can be a rate. Raw counts punished any party that spends
  // turns supporting: healing and warding lengthen a fight, and a longer fight eats more status rolls,
  // so the Priest scored worse than a party with no ward purely by fighting longer. A rate asks the
  // question that was meant — "how much of the time was someone afflicted" — not "how long did it take".
  let exposedRounds = 0;
  // REPEATED, and against full packs. A single fight per enemy produced zero afflictions for every
  // coverage level — the packs died in a round or two, so the ability rolls barely fired and the metric
  // had no signal at all. Status pressure is a rate; measuring it needs enough rounds to express one.
  const TRIALS = 120;
  for (let trial = 0; trial < TRIALS; trial += 1) {
    for (const inflictor of inflictors) {
      state = fight(state, world, inflictor, 4, warded, (mid) => {
        // Count AFFLICTIONS LANDING, not bodies currently afflicted. Every "who is afflicted right now"
        // formulation was confounded: a member who falls stops being afflictable and drops out of the
        // count, so the parties that let people go down scored best, and the Priest's healing — which
        // keeps four valid targets upright — read as though the ward were causing afflictions.
        // A ward's whole job is to stop the status LANDING, so that is the event to count.
        const able = mid.party.filter((member) => member.hp > 0 && !member.injury);
        exposedRounds += able.length;
      });
      // Patch up between fights: this measures STATUS pressure, not attrition.
      state = {
        ...state,
        party: state.party.map((member) => ({ ...member, hp: member.maxHp, mp: member.maxMp, injury: undefined }))
      };
    }
  }

  const charges = startCharges - state.inventory.reduce((total, item) => total + item.quantity, 0);
  const standing = state.party.filter((member) => !member.injury && member.hp > 0).length;
  // Scanned ONCE, at the end: the log accumulates across the whole run, so counting it inside the
  // per-round sampler re-counted every earlier affliction on every subsequent round.
  for (const entry of state.log) {
    if (entry.event?.type !== "combat_round_resolved") continue;
    for (const beat of entry.event.beats ?? []) {
      if (beat.kind === "status" && beat.targetCharacterId && beat.statusName) landed += 1;
    }
  }
  const rate = exposedRounds > 0 ? Math.round((landed / exposedRounds) * 1000) : 0;
  return {
    problem: "ward",
    coverage,
    resolved: standing > 0,
    cost: rate,
    gold: goldOf(world, plan.items),
    charges,
    detail: `${rate}/1000 afflictions landed per able member-round (${landed}/${exposedRounds}) over ${TRIALS} passes`
  };
}

/** TRAPS / LOCKS — the authored room traps, attempted by each kind of party. */
function runTraps(world: ScenarioWorld, coverage: Coverage, plan: PartyPlan): CoverageOutcome {
  const traps = world.dungeons.flatMap((dungeon) => dungeon.rooms).flatMap((room) => (room.trap ? [{ room, trap: room.trap }] : []));
  let state = buildParty(world, plan, `traps-${coverage}`);
  const startCharges = state.inventory.reduce((total, item) => total + item.quantity, 0);
  // Captured BEFORE the run: the attempts spend the tools, so reading the bonus afterwards measured an
  // empty pack and made the item column identical to carrying nothing.
  const startTool = toolBonus(world, state, "disarm");
  const bestSkill = trapSkill(state.party.reduce((a, b) => (trapSkill(a) > trapSkill(b) ? a : b)));
  let disarmed = 0;
  let turns = 0;

  for (const { room, trap } of traps) {
    const floorId = world.dungeons.find((dungeon) => dungeon.rooms.some((candidate) => candidate.id === room.id))?.id ?? null;
    const tool = state.inventory.find((item) => item.quantity > 0 && (world.items.find((catalog) => catalog.id === item.id)?.explorationAid?.actions ?? []).includes("disarm"));
    const at: GameState = {
      ...state,
      position: { roomId: room.id, facing: "north" },
      map: { ...state.map, floorId }
    };
    const after = executeCommand(at, world, { type: "disarm_trap", ...(tool ? { itemId: tool.id } : {}) });
    turns += 1;
    if (after.log.some((entry) => entry.event?.type === "trap_disarmed")) {
      disarmed += 1;
    }
    state = { ...state, inventory: after.inventory };
    void trap;
  }

  const charges = startCharges - state.inventory.reduce((total, item) => total + item.quantity, 0);
  // EXPECTED successes, not sampled ones. Each room trap carries one fixed roll per actor, so four
  // authored traps are four coin flips — and the specialist and no-coverage parties have different
  // class lists, hence different actor ids and different flips. Sampling that compared luck, not
  // classes: it showed the Thief clearing 3 of 4 where an untrained party cleared 4 of 4. The chance
  // each party brings to each trap is deterministic, and it is the thing the specialism actually buys.
  const expected = traps.reduce(
    (total, { trap }, index) =>
      // A tool covers only as many attempts as it has charges — the ceiling an item route always has.
      total + successChance(bestSkill + (index < startCharges ? startTool : 0), trap.detectDc, 45) / 100,
    0
  );
  return {
    problem: "traps",
    coverage,
    // A world with NO authored room traps has nothing to fail at. Reporting `resolved: false` there
    // would read as a broken party rather than as an empty content axis.
    resolved: traps.length === 0 ? true : expected > 0,
    cost: Math.round((traps.length - expected) * 100),
    gold: goldOf(world, plan.items),
    charges,
    detail:
      traps.length === 0
        ? "this world authors NO room traps"
        : `expected ${expected.toFixed(2)}/${traps.length} disarmed (sampled ${disarmed}/${traps.length} in ${turns} turn(s))`
  };
}

// ---------------------------------------------------------------------------
// The party plans
// ---------------------------------------------------------------------------

/**
 * Four coverage levels per problem.
 *
 * NOTE the gap this makes visible: for TRAPS there is no `secondary` party, because §4's roster gives
 * exploration proficiency to the Thief and to nobody else — `classProficiency` returns "untrained" for
 * all seven other classes on every exploration action. Recovery and ward have a real second-best class;
 * traps have only specialist, item, or nothing. That asymmetry is reported, not hidden.
 */
export function partyPlans(problem: Problem, world: ScenarioWorld): Partial<Record<Coverage, PartyPlan>> {
  const filler: CharacterClassId[] = ["warrior", "knight", "swordmaster"];
  // Items are chosen from the WORLD BY KIND, never by hardcoded id. They were hardcoded to the default
  // pack at first, so every item party in Verdant carried nothing at all — the "item" column silently
  // became a second "none" column and still printed a number. A scenario must need no code change
  // (CLAUDE.md), and that applies to the tools that measure it too.
  const byKind = (kind: string) => (world.items ?? []).filter((item) => item.kind === kind).map((item) => item.id);
  const byAid = (action: string) =>
    (world.items ?? []).filter((item) => (item.explorationAid?.actions ?? []).includes(action as never)).map((item) => item.id);

  switch (problem) {
    case "recovery":
      return {
        specialist: { classes: [...filler, "priest"], items: [] },
        secondary: { classes: [...filler, "chanter"], items: [] },
        item: { classes: [...filler, "mage"], items: byKind("healing") },
        none: { classes: [...filler, "mage"], items: [] }
      };
    case "ward":
      return {
        specialist: { classes: [...filler, "chanter"], items: [] },
        secondary: { classes: [...filler, "priest"], items: [] },
        item: { classes: [...filler, "mage"], items: byKind("ward") },
        none: { classes: [...filler, "mage"], items: [] }
      };
    case "traps":
      return {
        specialist: { classes: [...filler, "thief"], items: [] },
        item: { classes: [...filler, "mage"], items: byAid("disarm") },
        none: { classes: [...filler, "mage"], items: [] }
      };
  }
}

/** True if any class other than the Thief has ANY exploration proficiency (see partyPlans). */
export function hasSecondaryExplorationClass(): boolean {
  const classes: CharacterClassId[] = ["warrior", "knight", "swordmaster", "priest", "chanter", "mage", "occultist"];
  return classes.some((classId) =>
    (["investigate", "disarm", "unlock", "detectSecret"] as const).some((action) => classProficiency(classId, action) !== "untrained")
  );
}

export function simulateCoverage(world: ScenarioWorld): CoverageOutcome[] {
  const runners = { recovery: runRecovery, ward: runWard, traps: runTraps } as const;
  const out: CoverageOutcome[] = [];
  for (const problem of ["recovery", "ward", "traps"] as Problem[]) {
    for (const [coverage, plan] of Object.entries(partyPlans(problem, world)) as [Coverage, PartyPlan][]) {
      out.push(runners[problem](world, coverage, plan));
    }
  }
  return out;
}

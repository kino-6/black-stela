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
import { createCombatState, executeCommand, scaledEncounterCount } from "../domain/rulesEngine";
import { applyLevelUps, xpForLevel } from "../domain/leveling";
import { createInventoryItemFromCatalog } from "../domain/economy";
import { createDebugStateFromProgress } from "../debug/debugStart";
import { analyzeFloorGraph } from "../domain/floorGraph";
import { WANDERING_COOLDOWN_STEPS, WANDERING_ENCOUNTER_PCT } from "../domain/rulesEngine";
import { floorName } from "../domain/scenario";
import type { Character, Enemy, GameState, InventoryItem, ScenarioItem, ScenarioWorld } from "../domain/types";

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
  // MP/気力 attrition — the resource an over-extended caster runs out of. The auto-attack sim
  // barely spends it (actors only swing), so it reads near-full until spellcasting is modelled;
  // the columns exist so the economy Gate and report have the channel wired.
  arrivalMpPct: number;
  lowestMpPct: number;
  departMpPct: number;
  // The two danger channels, measured apart (difficulty-design.md §2). trash = random/wandering
  // packs (the smooth drain); spike = the telegraphed fixed encounter / tactical squad (玄室 guardian,
  // 番所 keep). The trough is 1 when the floor had no fight of that kind OR the party took no damage
  // from it — the fight COUNT disambiguates (0 = none authored; a trivialised spike reads 100%/0-burn).
  trashLowestHpPct: number;
  spikeLowestHpPct: number;
  trashFights: number;
  spikeFights: number;
  // Resource-economy axis (only populated when provisioned). Consumables burned ON THIS FLOOR and
  // what the kit has left after it — the retreat trigger is the floor where `kitRemaining` hits 0.
  healsUsed: number;
  curesUsed: number;
  kitRemaining: number;
  goldEarned: number;
}

export interface DescentSimResult {
  heal: "town" | "none";
  floors: FloorSimResult[];
  survived: boolean;
  finalLevel: number;
  // Resource-economy summary (provisioned runs only; zeros/null otherwise).
  provisioned: boolean;
  kitCost: number; // gold to buy the starting kit
  totalGold: number; // gold earned across the whole descent (dive income)
  economyBalance: number; // dive income ÷ one full re-provision (Infinity when the kit is free/empty)
  kitExhaustedFloor: string | null; // floorId where heals+cures first hit 0 (the retreat trigger)
}

const alive = (member: Character) => member.hp > 0 && !member.injury;
const hpPct = (member: Character) => (member.maxHp > 0 ? member.hp / member.maxHp : 0);
const mpPct = (member: Character) => (member.maxMp > 0 ? member.mp / member.maxMp : 1);
const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const avgLevel = (party: Character[]) => avg(party.map((m) => m.level));
const avgHpPct = (party: Character[]) => avg(party.map(hpPct));
const lowestHpPct = (party: Character[]) => Math.min(...party.map(hpPct));
const avgMpPct = (party: Character[]) => avg(party.map(mpPct));
const lowestMpPct = (party: Character[]) => Math.min(...party.map(mpPct));

export type EncounterKind = "trash" | "spike";

export interface PlannedEncounter {
  enemy: Enemy;
  count: number;
  // trash = random/wandering pack (the smooth drain); spike = a telegraphed fixed encounter or
  // tactical squad (玄室 guardian, 番所 keep). Optional so existing callers (simParity) stay valid;
  // defaults to trash where unset.
  kind?: EncounterKind;
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
  const cooldown = world.balance?.wanderingCooldownSteps ?? WANDERING_COOLDOWN_STEPS;
  const encounterPct = world.balance?.wanderingEncounterPct ?? WANDERING_ENCOUNTER_PCT;
  const spacing = cooldown + 100 / encounterPct;
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
    count: entry.maxCount ?? entry.minCount ?? 1,
    kind: "trash" as const
  }));
}

function planFloor(world: ScenarioWorld, floorId: string, seen: Set<string>): PlannedEncounter[] {
  const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
  if (!floor) {
    return [];
  }

  const encounters: PlannedEncounter[] = [];
  const planned = new Set<string>();
  const take = (enemy: Enemy, count: number, kind: EncounterKind) => {
    if (seen.has(enemy.id) || planned.has(enemy.id)) {
      return;
    }
    planned.add(enemy.id);
    encounters.push({ enemy, count, kind });
  };

  for (const room of floor.rooms) {
    // A fixed room encounter and a tactical squad are TELEGRAPHED — the player walks into a placed
    // fight, sees it, and chooses to engage. Those are the spike channel (difficulty-design.md §2).
    if (room.encounter) {
      const enemy = world.enemies.find((candidate) => candidate.id === room.encounter?.id) ?? room.encounter;
      take(enemy, 1, "spike");
    }
    // A tactical squad (front-blocker + back-caster) is a single planned fight of all
    // its members — otherwise the sim under-counts squad floors (e.g. verdant G2).
    for (const enemyId of room.encounterSquad ?? []) {
      const enemy = world.enemies.find((candidate) => candidate.id === enemyId);
      if (enemy) {
        take(enemy, 1, "spike");
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
        take(enemy, entry.maxCount ?? entry.minCount ?? 1, "trash");
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
export function equipPartyForEnemy(party: Character[], world: ScenarioWorld, enemy: Enemy, policy: SimPolicy): Character[] {
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

// The PROVISIONED descent (difficulty-design.md §"PROVISIONED descent"): the party carries a kit
// bounded by the carry cap and the affordable gold, and a competent player auto-uses it — cure a
// blocking status, else heal the most-wounded once HP drops. This is what turns "consumables exist"
// into a MEASURABLE scarcity axis: how much of the kit a floor burns, and where it runs dry.
export interface ProvisionOptions {
  /** Heal a member once its HP falls below this fraction of max (a competent player's reflex). */
  healThreshold: number;
}

interface ProvisionKit {
  inventory: InventoryItem[];
  cost: number; // gold to buy this kit at the world's list prices
}

// Build the starting kit from the world's own `balance.economy.provisionKit` counts, drawing the
// CHEAPEST real item of each kind (the rationed, affordable choice — a pessimistic lower bound on
// healing, matching the `none` model's philosophy). Clamped to the Act I carry cap so the cap is a
// real bound, not decoration. A world without an `economy` block yields an empty (free) kit.
function buildProvisionKit(world: ScenarioWorld): ProvisionKit {
  const economy = world.balance?.economy;
  const spec = economy?.provisionKit;
  if (!spec) {
    return { inventory: [], cost: 0 };
  }
  const carryCap = economy?.carryCap?.[0] ?? Infinity;
  const inventory: InventoryItem[] = [];
  let cost = 0;
  let carried = 0;

  const cheapest = (predicate: (item: ScenarioItem) => boolean): ScenarioItem | undefined =>
    world.items
      .filter(predicate)
      .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];

  const stock = (chosen: ScenarioItem | undefined, requested: number | undefined) => {
    if (!chosen || !requested || requested <= 0) {
      return;
    }
    const qty = Math.max(0, Math.min(requested, carryCap - carried));
    if (qty <= 0) {
      return;
    }
    const item = createInventoryItemFromCatalog(world, chosen.id, qty);
    if (!item) {
      return;
    }
    inventory.push(item);
    cost += (chosen.price ?? 0) * qty;
    carried += qty;
  };

  stock(cheapest((item) => item.kind === "healing" && (item.healAmount ?? 0) > 0), spec.heals);
  stock(cheapest((item) => item.kind === "cure"), spec.cures);
  // `revives`: no engine item-revive path exists yet (a heal does not clear an injury), so the
  // count is reserved but unstocked. When a revive item/technique lands, stock it here.
  return { inventory, cost };
}

// One medic action for this round, or null. A competent player cures a blocking status before it
// wastes a turn, otherwise tops up whoever is closest to going down. At most one item per round —
// the medic trades their swing for it, so healing has a real opportunity cost in the sim.
function chooseMedicAction(
  state: GameState,
  actors: Character[],
  provision: ProvisionOptions
): { actorId: string; action: "use_item"; itemId: string; targetCharacterId: string } | null {
  if (actors.length === 0) {
    return null;
  }
  const medic = actors[0];
  const standing = state.party.filter(alive);

  const cure = state.inventory.find((item) => item.kind === "cure" && item.quantity > 0 && item.curesStatuses?.length);
  if (cure) {
    const cured = new Set<string>(cure.curesStatuses ?? []);
    const statused = standing.find((member) => (member.status ?? []).some((status) => cured.has(status)));
    if (statused) {
      return { actorId: medic.id, action: "use_item", itemId: cure.id, targetCharacterId: statused.id };
    }
  }

  const heal = state.inventory.find((item) => item.kind === "healing" && (item.healAmount ?? 0) > 0 && item.quantity > 0);
  if (heal) {
    const wounded = [...standing].filter((member) => hpPct(member) < provision.healThreshold).sort((a, b) => hpPct(a) - hpPct(b))[0];
    if (wounded) {
      return { actorId: medic.id, action: "use_item", itemId: heal.id, targetCharacterId: wounded.id };
    }
  }
  return null;
}

// Exported for the IMP-023V parity gate: it must resolve a fight ONLY through the production engine
// (createCombatState + declare_round), never a re-implemented formula, so the simulator can never
// drift from what a browser session actually rolls. tests/simParity.test.ts locks that.
export function resolveFight(
  state: GameState,
  world: ScenarioWorld,
  encounter: PlannedEncounter,
  policy: SimPolicy = "naive",
  provision?: ProvisionOptions
): { state: GameState; midFightLow: number; midFightMpLow: number } {
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
  let midFightMpLow = lowestMpPct(current.party);

  for (let round = 0; round < 80 && current.phase === "combat"; round += 1) {
    const target = current.combat?.enemyGroups.find((group) => group.count > 0);
    const front = current.party.filter((member) => member.row === "front" && alive(member));
    const actors = front.length > 0 ? front : current.party.filter(alive);
    if (!target || actors.length === 0) {
      break;
    }
    // The medic (if provisioned and someone needs help) trades their swing for an item this round.
    const medicAction = provision ? chooseMedicAction(current, actors, provision) : null;
    const attackers = medicAction ? actors.filter((actor) => actor.id !== medicAction.actorId) : actors;
    current = executeCommand(current, world, {
      type: "declare_round",
      actions: [
        ...(medicAction ? [medicAction] : []),
        ...attackers.map((actor) => ({ actorId: actor.id, action: "attack" as const, targetGroupId: target.id }))
      ]
    });
    // Sample while still in combat (before the victory level-up heal tops HP off).
    if (current.phase === "combat") {
      midFightLow = Math.min(midFightLow, lowestHpPct(current.party));
      midFightMpLow = Math.min(midFightMpLow, lowestMpPct(current.party));
    }
  }

  return { state: current, midFightLow, midFightMpLow };
}

// Default medic reflex when a run is provisioned without an explicit threshold: a competent player
// tops a member up as it crosses HALF, before a spike can drop it — not the reckless "heal only at
// near-death" line (which left the kit untouched and scarcity unmeasurable). 0.5 makes the kit
// load-bearing at the floors that actually bite, so burn/exhaustion become real signals.
const DEFAULT_HEAL_THRESHOLD = 0.5;

const kitSize = (inventory: InventoryItem[]) =>
  inventory
    .filter((item) => item.kind === "healing" || item.kind === "cure")
    .reduce((total, item) => total + item.quantity, 0);
const kindCount = (inventory: InventoryItem[], kind: InventoryItem["kind"]) =>
  inventory.filter((item) => item.kind === kind).reduce((total, item) => total + item.quantity, 0);

export function simulateDescent(
  world: ScenarioWorld,
  options: {
    heal?: "town" | "none";
    policy?: SimPolicy;
    startLevel?: number;
    partySize?: number;
    /** Carry & auto-use the world's affordable consumable kit (the resource-economy axis). `true`
     *  uses the default medic threshold; pass an object to set it. */
    provision?: boolean | ProvisionOptions;
  } = {}
): DescentSimResult {
  const heal = options.heal ?? "town";
  const policy = options.policy ?? "naive";
  const provision: ProvisionOptions | undefined = options.provision
    ? typeof options.provision === "object"
      ? options.provision
      : { healThreshold: DEFAULT_HEAL_THRESHOLD }
    : undefined;

  const base = createDebugStateFromProgress(world, "ready");
  let party = base.party.map((member) => ({ ...member }));
  // The PARTY-SIZE axis (Wiz-style proportional attrition): an under-strength party keeps the front
  // line first, so a solo run is the lead fighter alone — fewer actions per round → slower kills →
  // deeper attrition. The engine's own scaledEncounterCount (below) swells each pack for the shortfall,
  // so this measures the SAME under-strength danger the real crawl deals, not a toy.
  if (options.partySize && options.partySize < party.length) {
    const ordered = [...party].sort((a, b) => (a.row === "front" ? 0 : 1) - (b.row === "front" ? 0 : 1));
    party = ordered.slice(0, Math.max(1, options.partySize));
  }
  if (options.startLevel && options.startLevel > 1) {
    party = partyAtLevel(party, options.startLevel);
  }
  const floors: FloorSimResult[] = [];

  // Resource-economy state carried ACROSS floors (the whole point of scarcity — one tank of kit for
  // the whole push, not a fresh stack per floor). `town` heal re-provisions each floor; `none` holds
  // the kit, so it can run dry mid-descent (the retreat trigger the Gate reads).
  const startingKit = provision ? buildProvisionKit(world) : { inventory: [], cost: 0 };
  let inventory: InventoryItem[] = startingKit.inventory.map((item) => ({ ...item }));
  let partyGold = 0; // dive income accumulator (ignores the starting purse — this is what the crawl EARNS)
  let kitExhaustedFloor: string | null = null;

  // The world's own dungeon order (registry orders by floor level): b1..b8 for the
  // default world, g1..g8 for verdant, etc. Falls back to the default constant.
  const descentOrder = world.dungeons.length > 0 ? world.dungeons.map((dungeon) => dungeon.id) : DESCENT_ORDER;
  for (const floorId of descentOrder) {
    if (heal === "town") {
      party = party.map((member) => ({ ...member, hp: member.maxHp, mp: member.maxMp, injury: undefined, status: [] }));
      // A town trip also restocks — scarcity only bites on a `none` one-push, which is what the Gate reads.
      inventory = startingKit.inventory.map((item) => ({ ...item }));
    }

    // The encounter economy changed: suppression is now scoped to the FLOOR VISIT, so a
    // floor fights ALL of its own authored types (no run-long first-contact dedup), and
    // walking it also draws WANDERING packs. Both must be simulated or the sim measures
    // a game that no longer exists.
    const encounters = [
      ...planFloor(world, floorId, new Set<string>()),
      ...planWanderingFights(world, floorId)
    ];
    const spikeFights = encounters.filter((encounter) => (encounter.kind ?? "trash") === "spike").length;
    const trashFights = encounters.length - spikeFights;
    const arrivalLevel = avgLevel(party);
    const arrivalHpPct = avgHpPct(party);
    const arrivalMpPct = avgMpPct(party);
    let lowest = arrivalHpPct;
    let lowestMp = arrivalMpPct;
    let trashLow = 1;
    let spikeLow = 1;
    let wiped = false;

    const healsBefore = kindCount(inventory, "healing");
    const curesBefore = kindCount(inventory, "cure");
    const goldBefore = partyGold;

    const floor = world.dungeons.find((dungeon) => dungeon.id === floorId);
    const floorRoom = floor?.startRoom ?? "sim";
    let workState: GameState = {
      ...base,
      phase: "dungeon",
      party,
      inventory,
      partyGold,
      position: { roomId: floorRoom, facing: "north" }
    };

    for (const encounter of encounters) {
      // Swell the pack for an under-strength/under-levelled party exactly as beginRoomEncounter does in
      // play (the sim used the RAW count and so under-modelled a small party). With a floor that authors no
      // recommendation this is a no-op, so the full-party curve — and its Gate — is unchanged.
      const scaledCount = scaledEncounterCount(encounter.count, party, floor);
      const outcome = resolveFight(workState, world, { ...encounter, count: scaledCount }, policy, provision);
      workState = outcome.state;
      party = workState.party;
      inventory = workState.inventory;
      partyGold = workState.partyGold;
      lowest = Math.min(lowest, outcome.midFightLow);
      lowestMp = Math.min(lowestMp, outcome.midFightMpLow);
      if ((encounter.kind ?? "trash") === "spike") {
        spikeLow = Math.min(spikeLow, outcome.midFightLow);
      } else {
        trashLow = Math.min(trashLow, outcome.midFightLow);
      }
      if (party.filter(alive).length === 0) {
        wiped = true;
        break;
      }
    }

    // The retreat trigger — but only for a world that actually authored a kit; an empty kit (no
    // economy block) must not read as "ran dry on floor 1".
    if (provision && kitExhaustedFloor === null && startingKit.inventory.length > 0 && kitSize(inventory) === 0) {
      kitExhaustedFloor = floorId;
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
      wiped,
      arrivalMpPct,
      lowestMpPct: lowestMp,
      departMpPct: avgMpPct(party),
      trashLowestHpPct: trashLow,
      spikeLowestHpPct: spikeLow,
      trashFights,
      spikeFights,
      healsUsed: Math.max(0, healsBefore - kindCount(inventory, "healing")),
      curesUsed: Math.max(0, curesBefore - kindCount(inventory, "cure")),
      kitRemaining: kitSize(inventory),
      goldEarned: partyGold - goldBefore
    });

    if (wiped) {
      break;
    }
  }

  return {
    heal,
    floors,
    survived: !floors.some((floor) => floor.wiped),
    finalLevel: floors.length ? floors[floors.length - 1].departLevel : avgLevel(party),
    provisioned: Boolean(provision),
    kitCost: startingKit.cost,
    totalGold: partyGold,
    economyBalance: startingKit.cost > 0 ? partyGold / startingKit.cost : Infinity,
    kitExhaustedFloor
  };
}

// Does a party STARTING at `startLevel` clear the whole descent (no wipe on any floor) under a
// given policy? Uses the pessimistic `none` heal model so the answer is "can they actually take
// it", not "with a town trip between every floor".
export function clearsAtLevel(
  world: ScenarioWorld,
  startLevel: number,
  policy: SimPolicy,
  margin = 0.25,
  partySize?: number,
  provision?: boolean
): boolean {
  const result = simulateDescent(world, { heal: "none", policy, startLevel, partySize, provision });
  if (!result.survived) {
    return false;
  }
  // Not "survived at 3% HP" — clears with room to spare. Surviving on a knife-edge is the naive
  // floor preparation is meant to lift the party off.
  const deepest = Math.min(...result.floors.map((floor) => floor.lowestHpPct));
  return deepest >= margin;
}

// The lowest start level at which a party clears under `policy` (optionally under-strength / provisioned).
// Monotonic in level (more level never hurts), so a plain scan up to a cap is exact. Returns cap + 1 if it
// never clears.
export function minClearLevel(
  world: ScenarioWorld,
  policy: SimPolicy,
  cap = 24,
  margin = 0.25,
  partySize?: number,
  provision?: boolean
): number {
  for (let level = 1; level <= cap; level += 1) {
    if (clearsAtLevel(world, level, policy, margin, partySize, provision)) {
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

// What a FULL PARTY is worth, in levels — the party-size counterpart of preparationValue (the design the
// user set: Wiz-style proportional attrition, "ソロ徒歩は危険、だが上級者には道が残る"). Measured under the
// PREPARED policy by default so it isolates the size axis from the preparation axis: how many more levels a
// solo (or `soloSize`) run needs to clear the same descent versus the full party. Positive & large = an
// under-strength run is genuinely harder, but still has a path (more levels), not an impossible wall.
export interface PartySizeValue {
  fullSize: number;
  fullMinLevel: number;
  soloSize: number;
  soloMinLevel: number;
  levelsCost: number;
}
export function partySizeValue(
  world: ScenarioWorld,
  policy: SimPolicy = "prepared",
  soloSize = 1,
  cap = 24
): PartySizeValue {
  const fullSize = createDebugStateFromProgress(world, "ready").party.length;
  const fullMinLevel = minClearLevel(world, policy, cap, 0.25, fullSize);
  const soloMinLevel = minClearLevel(world, policy, cap, 0.25, soloSize);
  return { fullSize, fullMinLevel, soloSize, soloMinLevel, levelsCost: soloMinLevel - fullMinLevel };
}

// What the KIT is worth, in levels — the resource-economy counterpart of the other two axes. How many
// levels lower a prepared party can start and still clear when it CARRIES and rations its consumables,
// versus bare-handed. A kit worth ≥1 level means scarcity is a real lever (it buys survival); a kit worth
// too MANY levels means the consumables trivialise the crawl (buy-99-heals-faceroll — the scarcity design
// exists to prevent that). Measured under the prepared policy so it isolates the kit from the other axes.
export interface ProvisionValue {
  bareMinLevel: number;
  kittedMinLevel: number;
  levelsSaved: number;
}
export function provisionValue(world: ScenarioWorld, policy: SimPolicy = "prepared", cap = 24): ProvisionValue {
  const bareMinLevel = minClearLevel(world, policy, cap);
  const kittedMinLevel = minClearLevel(world, policy, cap, 0.25, undefined, true);
  return { bareMinLevel, kittedMinLevel, levelsSaved: bareMinLevel - kittedMinLevel };
}

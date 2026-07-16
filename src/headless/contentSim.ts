// IMP-023A/B — a deterministic content & economy simulator over the PRODUCTION loaders and rules
// (no second copy of the drop / mastery / economy formulas). Given a world + seed it replays the
// same report every time, so a scenario's affix coverage, rarity distribution, mastery timing, and
// conversion income can be checked in a bounded range BEFORE browser play. The seeded ECONOMY
// numbers here are balance evidence only — browser play remains required for feel. The AI-assisted
// authoring loop (IMP-023C) layers on top of this report; it is Codex-owned.
import { dismantleYield, resolveAffixCatalog, rollEquipmentDrop, sellValueOf } from "../domain/loot";
import { BUILTIN_VOCATION_IDS, MASTERED_RANK, MASTERY_POINTS_PER_RANK, masteryGain } from "../domain/vocations";
import { validateScenarioGraph } from "../services/scenarioPackLoader";
import type { Enemy, ItemRarity, ScenarioAffix, ScenarioVocation, ScenarioWorld } from "../domain/types";

export interface ContentSimOptions {
  /** Seed — identical seed + world + options ⇒ identical report. */
  seed: string;
  /** How many equipment drops to roll. */
  drops: number;
  /** The floor depth the drops roll at. */
  floor: number;
  /** Party member level used for the mastery-timing probe. */
  memberLevel?: number;
  /** Thresholds (versioned, scenario-overridable). */
  thresholds?: Partial<ContentSimThresholds>;
}

export interface ContentSimThresholds {
  /** An authored affix that rolls in fewer than this fraction of eligible slots is flagged. */
  version: number;
  minRareRate: number;
  maxRareRate: number;
}

export const DEFAULT_THRESHOLDS: ContentSimThresholds = { version: 1, minRareRate: 0.05, maxRareRate: 0.45 };

export interface ContentSimReport {
  seed: string;
  drops: number;
  rarity: Record<ItemRarity, number>;
  rareRate: number;
  /** authored affix id → times it rolled across the run. */
  affixUsage: Record<string, number>;
  /** authored affixes that never rolled — candidate dead/over-rare content. */
  unusedAffixes: string[];
  economy: { sellGold: number; dismantleMaterials: number };
  /** Fights (at memberLevel, against a representative floor enemy) to bank one mastery rank. */
  fightsToFirstMasteryRank: number;
  vocations: {
    advancedCount: number;
    prerequisiteUse: Record<string, number>;
    uncoveredBasics: string[];
    requiredByAllAdvanced: string[];
    weakFloorMasteryGain: number;
    matchedFloorMasteryGain: number;
    estimatedFightsToUnlock: Record<string, number>;
  };
  enemyCounters: {
    strategiesByEnemy: Record<string, AffixStrategy[]>;
    uncoveredEnemies: string[];
  };
  findings: string[];
}

type AffixStrategy = "attack" | "defense" | "accuracy" | "speed";

function inferEnemyFloor(enemy: Enemy): number {
  const authoredFloor = enemy.id.match(/(?:^|\.)(?:b|g)(\d+)f?(?:\.|$)/i)?.[1];
  return authoredFloor ? Number(authoredFloor) : Math.max(1, enemy.dangerTier ?? enemy.level ?? 1);
}

function affixStrategiesAtFloor(world: ScenarioWorld, floor: number): Set<AffixStrategy> {
  const strategies = new Set<AffixStrategy>();
  for (const affix of world.affixes.filter((candidate) => candidate.minFloor <= floor)) {
    if ((affix.attackBonus ?? 0) > 0) strategies.add("attack");
    if ((affix.defenseBonus ?? 0) > 0) strategies.add("defense");
    if ((affix.accuracyBonus ?? 0) > 0) strategies.add("accuracy");
    if ((affix.speedBonus ?? 0) > 0) strategies.add("speed");
  }
  return strategies;
}

function usefulStrategiesAgainst(enemy: Enemy): Set<AffixStrategy> {
  const useful = new Set<AffixStrategy>();
  const role = enemy.role ?? "attrition";
  const hasStatusPressure =
    Boolean(enemy.inflicts) ||
    enemy.abilities?.some((ability) => ability.effect.kind === "status") ||
    role === "status";
  const hasHeavyPressure =
    (enemy.damageMax ?? enemy.attack + 1) >= 6 ||
    role === "ambusher" ||
    role === "caster" ||
    role === "miniboss" ||
    role === "boss";
  const isHardTarget =
    (enemy.armor ?? 0) >= 2 ||
    enemy.hp >= 15 ||
    role === "blocker" ||
    role === "miniboss" ||
    role === "boss";
  const rewardsTempoOrPrecision =
    (enemy.speed ?? 4) >= 6 ||
    enemy.elevation === "air" ||
    role === "ambusher" ||
    role === "caster" ||
    role === "status";

  if (isHardTarget) useful.add("attack");
  if (hasHeavyPressure || hasStatusPressure) useful.add("defense");
  if (rewardsTempoOrPrecision) {
    useful.add("accuracy");
    useful.add("speed");
  }
  return useful;
}

// Round-robin the world's equipment so every slot gets sampled; the drop roller decides rarity/affix.
export function simulateContent(world: ScenarioWorld, options: ContentSimOptions): ContentSimReport {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
  const equipmentIds = world.equipment.map((gear) => gear.id);
  const authoredAffixes = world.affixes.map((affix) => affix.id);
  const rarity: Record<ItemRarity, number> = { common: 0, rare: 0, epic: 0 };
  const affixUsage: Record<string, number> = Object.fromEntries(authoredAffixes.map((id) => [id, 0]));
  let sellGold = 0;
  let dismantleMaterials = 0;

  for (let index = 0; index < options.drops && equipmentIds.length > 0; index += 1) {
    const baseId = equipmentIds[index % equipmentIds.length];
    const drop = rollEquipmentDrop(world, baseId, options.floor, `${options.seed}:${index}`);
    if (!drop) continue;
    rarity[drop.rarity ?? "common"] += 1;
    if (drop.affix && drop.affix in affixUsage) affixUsage[drop.affix] += 1;
    sellGold += sellValueOf(drop);
    dismantleMaterials += dismantleYield(drop);
  }

  const totalDrops = rarity.common + rarity.rare + rarity.epic;
  const rareRate = totalDrops > 0 ? (rarity.rare + rarity.epic) / totalDrops : 0;
  const unusedAffixes = authoredAffixes.filter((id) => affixUsage[id] === 0);

  // Mastery-timing probe: how many fights (at memberLevel vs a mid-tier floor enemy) to bank one rank.
  const probeLevel = options.memberLevel ?? Math.max(1, options.floor);
  const probeEnemy = { level: options.floor, dangerTier: Math.max(1, Math.min(5, options.floor)) };
  const perFight = Math.max(1, masteryGain(probeLevel, probeEnemy));
  const fightsToFirstMasteryRank = Math.ceil(MASTERY_POINTS_PER_RANK / perFight);
  const weakFloorMasteryGain = masteryGain(probeLevel, { level: 1, dangerTier: 1 });
  const matchedFloorMasteryGain = masteryGain(probeLevel, {
    level: probeLevel,
    dangerTier: Math.max(1, Math.min(5, probeLevel))
  });

  const advancedVocations = world.vocations.filter((vocation) => vocation.tier === "advanced");
  const prerequisiteUse = Object.fromEntries(BUILTIN_VOCATION_IDS.map((id) => [id, 0]));
  for (const vocation of advancedVocations) {
    for (const prerequisite of vocation.requires?.mastered ?? []) {
      if (prerequisite in prerequisiteUse) {
        prerequisiteUse[prerequisite] += 1;
      }
    }
  }
  const uncoveredBasics = BUILTIN_VOCATION_IDS.filter((id) => prerequisiteUse[id] === 0);
  const requiredByAllAdvanced =
    advancedVocations.length === 0
      ? []
      : BUILTIN_VOCATION_IDS.filter((id) =>
          advancedVocations.every((vocation) => (vocation.requires?.mastered ?? []).includes(id))
        );
  const estimatedFightsToUnlock = Object.fromEntries(
    advancedVocations.map((vocation) => {
      const requiredCount = vocation.requires?.mastered?.length ?? 0;
      const targetLevel = vocation.requires?.minLevel ?? probeLevel;
      const pointsPerFight = Math.max(
        1,
        masteryGain(targetLevel, {
          level: targetLevel,
          dangerTier: Math.max(1, Math.min(5, targetLevel))
        })
      );
      const fightsPerMastery = Math.ceil((MASTERY_POINTS_PER_RANK * MASTERED_RANK) / pointsPerFight);
      return [vocation.id, requiredCount * fightsPerMastery];
    })
  );

  const dangerousEnemies = world.enemies.filter(
    (enemy) =>
      (enemy.dangerTier ?? 1) >= 3 ||
      enemy.role === "status" ||
      enemy.role === "ambusher" ||
      enemy.role === "caster" ||
      enemy.role === "miniboss" ||
      enemy.role === "boss"
  );
  const strategiesByEnemy: Record<string, AffixStrategy[]> = {};
  const uncoveredEnemies: string[] = [];
  for (const enemy of dangerousEnemies) {
    const available = affixStrategiesAtFloor(world, inferEnemyFloor(enemy));
    const useful = usefulStrategiesAgainst(enemy);
    const supported = Array.from(useful).filter((strategy) => available.has(strategy));
    strategiesByEnemy[enemy.id] = supported;
    if (supported.length < 2) {
      uncoveredEnemies.push(enemy.id);
    }
  }

  const findings: string[] = [];
  if (authoredAffixes.length > 0 && unusedAffixes.length > 0) {
    findings.push(`Affixes never rolled in ${options.drops} drops at floor ${options.floor}: ${unusedAffixes.join(", ")}`);
  }
  if (totalDrops > 0 && rareRate < thresholds.minRareRate) {
    findings.push(`Rare rate ${(rareRate * 100).toFixed(1)}% is below the ${(thresholds.minRareRate * 100).toFixed(0)}% floor — rares feel absent.`);
  }
  if (rareRate > thresholds.maxRareRate) {
    findings.push(`Rare rate ${(rareRate * 100).toFixed(1)}% is above the ${(thresholds.maxRareRate * 100).toFixed(0)}% cap — rarity is cheap.`);
  }
  // Sanity: the affix catalog the economy actually reads must be non-empty for a world that authors affixes.
  if (world.affixes.length > 0 && resolveAffixCatalog(world).every((affix) => affix.rarity === "common")) {
    findings.push("The world authors affixes but none resolve above common rarity.");
  }
  if (uncoveredBasics.length > 0) {
    findings.push(`Basic vocations with no authored advanced destination: ${uncoveredBasics.join(", ")}`);
  }
  if (requiredByAllAdvanced.length > 0) {
    findings.push(`Basic vocations required by every advanced destination: ${requiredByAllAdvanced.join(", ")}`);
  }
  if (weakFloorMasteryGain >= matchedFloorMasteryGain) {
    findings.push(
      `Weak-floor mastery (${weakFloorMasteryGain}) is not below matched-floor mastery (${matchedFloorMasteryGain}).`
    );
  }
  if (uncoveredEnemies.length > 0) {
    findings.push(`Dangerous enemies with fewer than two authored affix strategies: ${uncoveredEnemies.join(", ")}`);
  }

  return {
    seed: options.seed,
    drops: options.drops,
    rarity,
    rareRate,
    affixUsage,
    unusedAffixes,
    economy: { sellGold, dismantleMaterials },
    fightsToFirstMasteryRank,
    vocations: {
      advancedCount: advancedVocations.length,
      prerequisiteUse,
      uncoveredBasics,
      requiredByAllAdvanced,
      weakFloorMasteryGain,
      matchedFloorMasteryGain,
      estimatedFightsToUnlock
    },
    enemyCounters: {
      strategiesByEnemy,
      uncoveredEnemies
    },
    findings
  };
}

// IMP-023C — the deterministic ACCEPTANCE HARNESS of the AI-assisted authoring loop. An external
// proposer (Codex/AI, out of scope here — it never touches runtime GameState) suggests a new affix
// or vocation; this merges it into a candidate world and runs the SAME loaders + simulator a release
// would. It returns accept/reject with the reasons, so a bad proposal is bounced on evidence, not
// vibes. A human/browser review still owns the final "does it feel good" call.
export interface ProposalReview {
  accepted: boolean;
  errors: string[];
  findings: string[];
}

function reviewCandidate(candidate: ScenarioWorld, seed: string): ProposalReview {
  const errors = validateScenarioGraph(candidate)
    .filter((error) => error.severity !== "warning")
    .map((error) => `${error.fieldPath}: ${error.reason}`);
  const report = simulateContent(candidate, { seed, drops: 1200, floor: 8 });
  return { accepted: errors.length === 0 && report.findings.length === 0, errors, findings: report.findings };
}

export function reviewAffixProposal(world: ScenarioWorld, proposal: ScenarioAffix, seed = "proposal"): ProposalReview {
  return reviewCandidate({ ...world, affixes: [...world.affixes, proposal] }, seed);
}

export function reviewVocationProposal(world: ScenarioWorld, proposal: ScenarioVocation, seed = "proposal"): ProposalReview {
  return reviewCandidate({ ...world, vocations: [...world.vocations, proposal] }, seed);
}

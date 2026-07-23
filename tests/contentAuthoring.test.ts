import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { SPELLS, knownSpells } from "../src/domain/spells";
import { BUILTIN_VOCATION_IDS } from "../src/domain/vocations";
import type { CharacterClassId, ScenarioAffix, ScenarioWorld } from "../src/domain/types";

const shippedWorlds = [
  ["default", worldRegistry.default],
  ["verdant", worldRegistry.verdant]
] as const;

function affixStrategyCount(affixes: ScenarioAffix[], key: "attackBonus" | "defenseBonus" | "accuracyBonus" | "speedBonus") {
  return affixes.filter((affix) => (affix[key] ?? 0) > 0).length;
}

function expectCompleteVocationGraph(worldId: string, world: ScenarioWorld) {
  const advanced = world.vocations.filter((vocation) => vocation.tier === "advanced");
  expect(advanced.length, `${worldId}: authored advanced vocation count`).toBeGreaterThanOrEqual(6);

  const prerequisiteUse = new Set(advanced.flatMap((vocation) => vocation.requires?.mastered ?? []));
  expect(
    BUILTIN_VOCATION_IDS.filter((id) => !prerequisiteUse.has(id)),
    `${worldId}: every basic vocation should open at least one advanced destination`
  ).toEqual([]);

  const requiredByEveryDestination = BUILTIN_VOCATION_IDS.filter((id) =>
    advanced.every((vocation) => (vocation.requires?.mastered ?? []).includes(id))
  );
  expect(requiredByEveryDestination, `${worldId}: no basic vocation should be compulsory for every route`).toEqual([]);

  // §7A: the prerequisite PAIRS are distinct. Two advanced vocations bridging the exact same two
  // classes are two names for one destination — the "empty class names" §7 warns against. This is the
  // rule the interim scaffolding failed: three vocations reused the same grant off overlapping pairs.
  const pairKeys = advanced.map((vocation) => [...(vocation.requires?.mastered ?? [])].sort().join("+"));
  expect(new Set(pairKeys).size, `${worldId}: advanced vocations must bridge DISTINCT pairs`).toBe(advanced.length);

  for (const vocation of advanced) {
    expect(vocation.requires?.mastered?.length ?? 0, `${worldId}:${vocation.id} prerequisite texture`).toBeGreaterThanOrEqual(2);
    // §7A: an advanced vocation is a gated destination — a real level floor, never available from turn 1.
    expect(vocation.requires?.minLevel ?? 0, `${worldId}:${vocation.id} has no level floor`).toBeGreaterThanOrEqual(6);
    expect(vocation.locales?.ja?.name, `${worldId}:${vocation.id} Japanese name`).toBeTruthy();
    expect(vocation.locales?.ja?.signature, `${worldId}:${vocation.id} Japanese signature`).toBeTruthy();
    expect(vocation.locales?.ja?.signature ?? "", `${worldId}:${vocation.id} leaked an implementation id`).not.toMatch(
      new RegExp(BUILTIN_VOCATION_IDS.join("|"), "i")
    );
    for (const technique of vocation.grantsTechniques ?? []) {
      expect(technique in SPELLS, `${worldId}:${vocation.id} grants unknown technique ${technique}`).toBe(true);
      // §7A: an advanced vocation may not grant a technique EITHER of its two parent classes already
      // teaches — that grant is redundant (the adopter learned it by mastering the parent, §6) and it
      // fakes a signature. Only an EXCLUSIVE technique (7B) may be granted; until then, none.
      const parentClasses = vocation.requires?.mastered ?? [];
      const parentTechniques = new Set<string>(parentClasses.flatMap((classId) => knownSpells(classId as CharacterClassId, 99)));
      expect(
        parentTechniques.has(technique),
        `${worldId}:${vocation.id} grants ${technique}, which a parent class already teaches — that is scaffolding, not a signature`
      ).toBe(false);
    }
  }
}

function expectCompleteAffixPool(worldId: string, world: ScenarioWorld) {
  expect(world.affixes.length, `${worldId}: authored affix count`).toBeGreaterThanOrEqual(8);

  const equipmentSlots = new Set(world.equipment.map((equipment) => equipment.slot));
  for (const slot of equipmentSlots) {
    expect(
      world.affixes.some((affix) => affix.slots.includes(slot)),
      `${worldId}: ${slot} has no authored rare affix`
    ).toBe(true);
  }

  for (const key of ["attackBonus", "defenseBonus", "accuracyBonus", "speedBonus"] as const) {
    expect(affixStrategyCount(world.affixes, key), `${worldId}: ${key} needs more than one authored answer`).toBeGreaterThanOrEqual(2);
  }

  for (const affix of world.affixes) {
    expect(affix.locales?.ja?.label, `${worldId}:${affix.id} Japanese label`).toBeTruthy();
    expect(affix.locales?.ja?.label ?? "", `${worldId}:${affix.id} Japanese label contains stray English`).not.toMatch(/[A-Za-z]/);
  }
}

describe("IMP-021B / IMP-022B authored content", () => {
  for (const [worldId, world] of shippedWorlds) {
    it(`${worldId} has a complete vocation graph`, () => {
      expectCompleteVocationGraph(worldId, world);
    });

    it(`${worldId} has a complete rare-affix pool`, () => {
      expectCompleteAffixPool(worldId, world);
    });
  }
});

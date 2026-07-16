import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { SPELLS } from "../src/domain/spells";
import { BUILTIN_VOCATION_IDS } from "../src/domain/vocations";
import type { ScenarioAffix, ScenarioWorld } from "../src/domain/types";

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

  for (const vocation of advanced) {
    expect(vocation.requires?.mastered?.length ?? 0, `${worldId}:${vocation.id} prerequisite texture`).toBeGreaterThanOrEqual(2);
    expect(vocation.locales?.ja?.name, `${worldId}:${vocation.id} Japanese name`).toBeTruthy();
    expect(vocation.locales?.ja?.signature, `${worldId}:${vocation.id} Japanese signature`).toBeTruthy();
    expect(vocation.locales?.ja?.signature ?? "", `${worldId}:${vocation.id} leaked an implementation id`).not.toMatch(
      new RegExp(BUILTIN_VOCATION_IDS.join("|"), "i")
    );
    for (const technique of vocation.grantsTechniques ?? []) {
      expect(technique in SPELLS, `${worldId}:${vocation.id} grants unknown technique ${technique}`).toBe(true);
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

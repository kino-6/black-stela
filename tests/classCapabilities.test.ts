import { describe, expect, it } from "vitest";
import { classCatalog, createGuildCharacter } from "../src/domain/characterCreation";
import {
  CLASS_CAPABILITIES,
  classProficiency,
  classTechniqueGrants,
  proficiencyBonus
} from "../src/domain/classCapabilities";
import { TECHNIQUES, findTechnique, validateTechnique, type Technique } from "../src/domain/techniques";
import { CLASS_ABILITIES, SPELLS, baseMaxMpForClass, isCasterClass, isMartialSkillClass, knownSpells, toLegacySpell } from "../src/domain/spells";
import { trapSkill } from "../src/domain/chests";
import type { CharacterAptitudes, CharacterClassId } from "../src/domain/types";

/**
 * The class contract (docs/design/class-system.md §8.1), and the promise that installing it changed
 * NOTHING about how the game currently plays.
 *
 * Two halves:
 *   1. PRESERVATION — the old ability tables are pinned against literals written out by hand from the
 *      previous implementation. If the derivation drifts by one level or one MP, these fail.
 *   2. CAPACITY — the technique model can express the families §5 calls for (recovery, cures, wards,
 *      buffs, debuffs, party scope, duration, non-MP costs) BEFORE any of them are authored, and it
 *      rejects definitions that contradict themselves.
 */

// The ability table exactly as it was written before the catalog existed (src/domain/spells.ts, the
// hand-maintained CLASS_ABILITIES literal). Copied here on purpose: a test that derived its expectation
// the same way the code does would prove nothing.
const LEGACY_CLASS_ABILITIES: Partial<Record<CharacterClassId, { level: number; spellId: string }[]>> = {
  mender: [{ level: 1, spellId: "heal" }],
  chanter: [
    { level: 1, spellId: "heal" },
    { level: 3, spellId: "sleep" }
  ],
  occultist: [
    { level: 1, spellId: "firebolt" },
    { level: 3, spellId: "sleep" }
  ],
  arcanist: [{ level: 1, spellId: "firebolt" }],
  vanguard: [{ level: 1, spellId: "power-strike" }],
  seeker: [{ level: 1, spellId: "power-strike" }]
};

const LEGACY_SPELLS = {
  heal: { kind: "spell", mpCost: 3, target: "ally", effect: { kind: "heal", amount: 8 } },
  firebolt: { kind: "spell", mpCost: 4, target: "enemyGroup", effect: { kind: "damage", min: 4, max: 9, element: "fire" } },
  sleep: { kind: "spell", mpCost: 3, target: "enemyGroup", effect: { kind: "status", status: "sleep" } },
  "power-strike": { kind: "skill", mpCost: 3, target: "enemyGroup", effect: { kind: "damage", min: 6, max: 12, element: "physical" } }
} as const;

const ALL_CLASSES = classCatalog.map((definition) => definition.id);
const APTITUDE: CharacterAptitudes = { might: 3, agility: 2, spirit: 4, wit: 5, luck: 1 };

describe("class capabilities — existing behaviour is preserved", () => {
  it("derives the same ability table the hand-written one held", () => {
    expect(CLASS_ABILITIES).toEqual(LEGACY_CLASS_ABILITIES);
  });

  it("derives the same spell numbers — cost, target and effect", () => {
    for (const [id, legacy] of Object.entries(LEGACY_SPELLS)) {
      const spell = SPELLS[id as keyof typeof SPELLS];
      expect(spell, `${id} disappeared from the legacy view`).toBeDefined();
      expect(spell.kind).toBe(legacy.kind);
      expect(spell.mpCost).toBe(legacy.mpCost);
      expect(spell.target).toBe(legacy.target);
      expect(spell.effect).toMatchObject(legacy.effect);
    }
    expect(Object.keys(SPELLS).sort()).toEqual(Object.keys(LEGACY_SPELLS).sort());
  });

  it("teaches every class the same techniques at the same levels, 1 through 10", () => {
    for (const classId of ALL_CLASSES) {
      for (let level = 1; level <= 10; level += 1) {
        const expected = (LEGACY_CLASS_ABILITIES[classId] ?? [])
          .filter((entry) => level >= entry.level)
          .map((entry) => entry.spellId);
        expect(knownSpells(classId, level), `${classId} at level ${level}`).toEqual(expected);
      }
    }
  });

  it("keeps caster / martial classification and the MP pools that follow from it", () => {
    const casters = ALL_CLASSES.filter((id) => isCasterClass(id));
    const martial = ALL_CLASSES.filter((id) => isMartialSkillClass(id));
    expect(casters.sort()).toEqual(["arcanist", "chanter", "mender", "occultist"]);
    expect(martial.sort()).toEqual(["seeker", "vanguard"]);

    // 4 + (spirit + wit) * 2 for casters, 3 + might for 特技 classes, 0 for the rest.
    expect(baseMaxMpForClass("mender", APTITUDE)).toBe(4 + (4 + 5) * 2);
    expect(baseMaxMpForClass("vanguard", APTITUDE)).toBe(3 + 3);
    expect(baseMaxMpForClass("bulwark", APTITUDE)).toBe(0);
  });

  it("leaves every class's trap skill exactly where the roleTag left it", () => {
    // The three trap classes are worth +8 over an identical adventurer of another class; nobody else
    // gained or lost a point when the contract moved off roleTags.
    const skillFor = (classId: CharacterClassId) =>
      trapSkill(createGuildCharacter({ name: "Probe", classId, seed: `trap:${classId}` }));

    const specialists: CharacterClassId[] = ["seeker", "scout", "cutpurse"];
    for (const classId of ALL_CLASSES) {
      const character = createGuildCharacter({ name: "Probe", classId, seed: `trap:${classId}` });
      const apt = character.aptitude;
      const base = character.level + (apt.agility ?? 0) * 2 + (apt.wit ?? 0) + (apt.luck ?? 0);
      const expected = base + (specialists.includes(classId) ? 8 : 0);
      expect(skillFor(classId), `${classId} trap skill`).toBe(expected);
    }
  });

  it("still honours a trap tag carried by an already-saved character whose class is not a specialist", () => {
    // A save written before this change stores roleTags on the character. Reading the contract must not
    // quietly take a skill away from an adventurer who has been using it.
    const veteran = createGuildCharacter({ name: "Veteran", classId: "vanguard", seed: "trap:legacy" });
    const tagged = { ...veteran, roleTags: [...veteran.roleTags, "trap_handling"] };
    expect(trapSkill(tagged)).toBe(trapSkill(veteran) + 8);
  });
});

describe("class capabilities — every class states a rules identity", () => {
  it("covers every selectable class", () => {
    expect(Object.keys(CLASS_CAPABILITIES).sort()).toEqual([...ALL_CLASSES].sort());
  });

  it("agrees with the catalog about where a class stands", () => {
    for (const definition of classCatalog) {
      expect(CLASS_CAPABILITIES[definition.id].rowPreference, definition.id).toBe(definition.rowPreference);
    }
  });

  it("names an observable weakness and an equipment shape for each class", () => {
    for (const classId of ALL_CLASSES) {
      const capabilities = CLASS_CAPABILITIES[classId];
      expect(capabilities.weakness.ja.length, `${classId} has no stated weakness`).toBeGreaterThan(0);
      expect(capabilities.weakness.en.length, `${classId} has no stated weakness`).toBeGreaterThan(0);
      expect(capabilities.equipmentProfile.slots.length, `${classId} wears nothing`).toBeGreaterThan(0);
    }
  });

  it("grants only techniques that exist in the catalog", () => {
    for (const classId of ALL_CLASSES) {
      for (const grant of classTechniqueGrants(classId)) {
        expect(findTechnique(grant.techniqueId), `${classId} grants an unknown technique`).toBeDefined();
        expect(grant.level).toBeGreaterThan(0);
      }
    }
  });

  it("never forbids an exploration action — an untrained party may still try", () => {
    // §2.3: proficiency changes odds and information, never permission. Untrained is worth zero, not a
    // refusal, and it is what any unlisted action resolves to.
    expect(classProficiency("bulwark", "disarm")).toBe("untrained");
    expect(proficiencyBonus("untrained")).toBe(0);
    expect(proficiencyBonus("trained")).toBeGreaterThan(proficiencyBonus("untrained"));
    expect(proficiencyBonus("specialist")).toBeGreaterThan(proficiencyBonus("trained"));
  });

  it("records the current-state finding rather than hiding it: most classes carry no technique yet", () => {
    // docs/design/class-system.md §3 — twelve labels standing on four abilities. This test exists so the
    // gap stays VISIBLE and fails the day it is fixed, rather than being quietly forgotten.
    const withoutTechniques = ALL_CLASSES.filter((id) => classTechniqueGrants(id).length === 0);
    expect(withoutTechniques.sort()).toEqual(["bulwark", "cutpurse", "duelist", "scout", "sellsword", "wayfinder"]);
  });
});

describe("technique catalog — the model can carry the families the design calls for", () => {
  it("accepts every technique already shipped", () => {
    for (const technique of Object.values(TECHNIQUES)) {
      expect(validateTechnique(technique), technique.id).toEqual([]);
    }
  });

  // Written as definitions rather than as content: these prove the SHAPE holds the priest / chanter /
  // occultist families of §5 before anyone authors them. They are not registered in the catalog, so
  // nothing in play changes.
  const futureFamilies: { name: string; technique: Technique }[] = [
    {
      name: "a cure that lifts several afflictions at once (priest)",
      technique: {
        id: "heal" as Technique["id"],
        kind: "spell",
        target: "party",
        cost: { mp: 6 },
        effects: [{ kind: "cure", statuses: ["poison", "sleep"] }],
        duration: { kind: "instant" }
      }
    },
    {
      name: "a ward that raises resistance for the fight (chanter)",
      technique: {
        id: "heal" as Technique["id"],
        kind: "spell",
        target: "party",
        cost: { mp: 5 },
        effects: [{ kind: "ward", statusResist: { fear: 25 }, elementResist: { fire: 0.8 } }],
        duration: { kind: "combat" }
      }
    },
    {
      name: "a buff with a fixed lifetime (chanter)",
      technique: {
        id: "heal" as Technique["id"],
        kind: "spell",
        target: "ally",
        cost: { mp: 4 },
        effects: [{ kind: "buff", stat: "armor", amount: 3 }],
        duration: { kind: "rounds", rounds: 3 }
      }
    },
    {
      name: "a debuff that weakens what it touches (occultist)",
      technique: {
        id: "heal" as Technique["id"],
        kind: "spell",
        target: "enemyGroup",
        cost: { mp: 4 },
        effects: [{ kind: "debuff", stat: "accuracy", amount: -15 }],
        duration: { kind: "rounds", rounds: 2 }
      }
    },
    {
      name: "a scroll: an item-cost technique anyone can carry (§4 items are valid answers)",
      technique: {
        id: "firebolt" as Technique["id"],
        kind: "spell",
        target: "allEnemies",
        cost: { itemId: "item.scroll-of-cinders" },
        effects: [{ kind: "damage", min: 5, max: 10, element: "fire" }],
        duration: { kind: "instant" }
      }
    },
    {
      name: "a once-per-expedition art paid for in blood",
      technique: {
        id: "power-strike" as Technique["id"],
        kind: "skill",
        target: "enemyGroup",
        cost: { hp: 4, usesPerExpedition: 1 },
        effects: [
          { kind: "damage", min: 10, max: 16, element: "physical" },
          { kind: "debuff", stat: "armor", amount: -2 }
        ],
        duration: { kind: "rounds", rounds: 2 }
      }
    }
  ];

  for (const { name, technique } of futureFamilies) {
    it(`can express ${name}`, () => {
      expect(validateTechnique(technique)).toEqual([]);
    });
  }

  it("refuses definitions that contradict themselves", () => {
    const instantWard: Technique = {
      id: "heal" as Technique["id"],
      kind: "spell",
      target: "party",
      cost: { mp: 2 },
      effects: [{ kind: "ward", statusResist: { poison: 10 } }],
      duration: { kind: "instant" }
    };
    expect(validateTechnique(instantWard).join(" ")).toContain("needs a duration");

    const freeStrike: Technique = {
      id: "power-strike" as Technique["id"],
      kind: "skill",
      target: "enemyGroup",
      cost: {},
      effects: [{ kind: "damage", min: 3, max: 5, element: "physical" }],
      duration: { kind: "instant" }
    };
    expect(freeStrike.cost.mp).toBeUndefined();
    expect(validateTechnique(freeStrike).join(" ")).toContain("spends nothing");

    const invertedDamage: Technique = {
      id: "firebolt" as Technique["id"],
      kind: "spell",
      target: "enemyGroup",
      cost: { mp: 2 },
      effects: [{ kind: "damage", min: 9, max: 4, element: "fire" }],
      duration: { kind: "instant" }
    };
    expect(validateTechnique(invertedDamage).join(" ")).toContain("inverted");

    const curesNothing: Technique = {
      id: "heal" as Technique["id"],
      kind: "spell",
      target: "ally",
      cost: { mp: 2 },
      effects: [{ kind: "cure", statuses: [] }],
      duration: { kind: "instant" }
    };
    expect(validateTechnique(curesNothing).join(" ")).toContain("cures nothing");
  });

  it("keeps a technique the current resolver cannot carry out OUT of the legacy view", () => {
    // The combat resolver understands one effect, an MP cost, and ally/enemyGroup. Anything wider must
    // not be flattened into it — a party-wide ward silently resolving as a single-target nothing is the
    // failure this guard exists to prevent. Teaching the resolver the wider model is §8.2.
    const partyWard: Technique = {
      id: "heal" as Technique["id"],
      kind: "spell",
      target: "party",
      cost: { mp: 5 },
      effects: [{ kind: "ward", statusResist: { fear: 25 } }],
      duration: { kind: "combat" }
    };
    expect(toLegacySpell(partyWard)).toBeNull();

    const scroll: Technique = {
      id: "firebolt" as Technique["id"],
      kind: "spell",
      target: "enemyGroup",
      cost: { itemId: "item.scroll-of-cinders" },
      effects: [{ kind: "damage", min: 5, max: 10, element: "fire" }],
      duration: { kind: "instant" }
    };
    expect(toLegacySpell(scroll)).toBeNull();

    // ...while everything currently shipped does fit, which is why play is unchanged.
    for (const technique of Object.values(TECHNIQUES)) {
      expect(toLegacySpell(technique), technique.id).not.toBeNull();
    }
  });
});

import { describe, expect, it } from "vitest";
import { classCatalog, createGuildCharacter, resolveClassId } from "../src/domain/characterCreation";
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

// The ability table exactly as the twelve-class build wrote it (the hand-maintained CLASS_ABILITIES
// literal), keyed by the LEGACY ids. Copied here on purpose: a test that derived its expectation the same
// way the code does would prove nothing.
const LEGACY_CLASS_ABILITIES: Record<string, { level: number; spellId: string }[]> = {
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

// The twelve → eight consolidation (§8.3). Each old id resolves to the class it became; the six on the
// left of a 1:1 arrow keep exactly what they knew, and the four that were MERGED AWAY inherit their new
// class's line — which is the point of merging them, and is asserted rather than glossed over.
const CONSOLIDATION: Record<string, CharacterClassId> = {
  vanguard: "warrior",
  sellsword: "warrior",
  bulwark: "knight",
  duelist: "swordmaster",
  seeker: "thief",
  scout: "thief",
  cutpurse: "thief",
  mender: "priest",
  chanter: "chanter",
  occultist: "occultist",
  arcanist: "mage",
  wayfinder: "thief"
};

const LEGACY_SPELLS = {
  heal: { kind: "spell", mpCost: 3, target: "ally", effect: { kind: "heal", amount: 8 } },
  firebolt: { kind: "spell", mpCost: 4, target: "enemyGroup", effect: { kind: "damage", min: 4, max: 9, element: "fire" } },
  sleep: { kind: "spell", mpCost: 3, target: "enemyGroup", effect: { kind: "status", status: "sleep" } },
  "power-strike": { kind: "skill", mpCost: 3, target: "enemyGroup", effect: { kind: "damage", min: 6, max: 12, element: "physical" } }
} as const;

const ALL_CLASSES = classCatalog.map((definition) => definition.id);
const APTITUDE: CharacterAptitudes = { might: 3, agility: 2, spirit: 4, wit: 5, luck: 1 };

describe("the consolidation — twelve ids became eight classes without losing anyone", () => {
  it("resolves every legacy id, and only to a selectable class", () => {
    for (const [legacy, target] of Object.entries(CONSOLIDATION)) {
      expect(resolveClassId(legacy), legacy).toBe(target);
      expect(ALL_CLASSES).toContain(target);
    }
    expect(ALL_CLASSES.length).toBe(8);
  });

  it("never takes away what a surviving line knew — same techniques, same levels, 1 through 10", () => {
    // The six disciplines that map 1:1 onto a new class must not LOSE anything to the rename. This was
    // an exact-equality check while §9.1—§9.3 were pure vocabulary changes; §9.4 authors new techniques
    // onto these same classes, so the guard is now containment: the old line survives intact, and
    // anything extra is deliberate content. What it still catches is the real regression — a
    // consolidation or a re-author quietly dropping an ability a class used to have.
    // §9.4b removes exactly TWO grants, both because §5 says the class should never have had them. They
    // are listed here, one line each, so a removal is always a decision someone wrote down: anything
    // else that disappears still fails this test. Neither is a loss of capability — each class got its
    // own replacement in the same slice.
    const deliberatelyRemoved: Record<string, { spellId: string; why: string }[]> = {
      // §5: "Mage damage and Occult control must not be duplicated." Replaced by `dread` + `life-siphon`.
      occultist: [{ spellId: "firebolt", why: "the Occultist was handed the Mage's own attack spell" }],
      // §5: the Chanter's heal is "a deliberately weaker emergency heal". Replaced by `lesser-heal`.
      chanter: [{ spellId: "heal", why: "the Chanter healed exactly as well as the Priest" }]
    };

    for (const legacy of ["vanguard", "bulwark", "duelist", "seeker", "mender", "arcanist", "chanter", "occultist"]) {
      const expectedTable = LEGACY_CLASS_ABILITIES[legacy] ?? [];
      const removed = new Set((deliberatelyRemoved[legacy] ?? []).map((entry) => entry.spellId));
      for (let level = 1; level <= 10; level += 1) {
        const expected = expectedTable
          .filter((entry) => level >= entry.level && !removed.has(entry.spellId))
          .map((entry) => entry.spellId);
        const known = knownSpells(CONSOLIDATION[legacy], level);
        for (const spellId of expected) {
          expect(known, `${legacy} at level ${level} must still know ${spellId}`).toContain(spellId);
        }
      }
      // A removal must be a REPLACEMENT, never a subtraction: the class ends up with more, not less.
      const before = new Set(expectedTable.map((entry) => entry.spellId));
      expect(knownSpells(CONSOLIDATION[legacy], 10).length, `${legacy} lost ground`).toBeGreaterThanOrEqual(before.size);
    }
  });

  it("gives the merged-away ids their new class's line, deliberately", () => {
    // 傭兵 knew nothing; as a 戦士 it strikes. 斥候 and 鍵師 and 道標師 knew nothing; as 盗賊 they do — and
    // they gain the trap specialism the Thief carries. That is what consolidating them MEANT.
    expect(knownSpells("sellsword" as CharacterClassId, 1)).toEqual(["power-strike", "shield-splitter"]);
    for (const legacy of ["scout", "cutpurse", "wayfinder"]) {
      expect(knownSpells(legacy as CharacterClassId, 1), legacy).toEqual(["power-strike", "hamstring"]);
      expect(classProficiency(legacy as CharacterClassId, "disarm"), legacy).toBe("specialist");
    }
  });

  it("reads a character stored under an old id with the new class's contract, without touching the record", () => {
    const stored = { ...createGuildCharacter({ name: "Old", classId: "warrior", seed: "stored" }), classId: "scout" as CharacterClassId };
    expect(classProficiency(stored.classId, "disarm")).toBe("specialist");
    // The stored value itself is left exactly as written — rewriting saves is a beta-time migration.
    expect(stored.classId).toBe("scout");
  });
});

describe("class capabilities — existing behaviour is preserved", () => {
  it("derives the ability table from the class contract", () => {
    // §9.4 added the first cure/ward/buff/debuff, so this is the table as it now stands. The point it
    // pins is that CLASS_ABILITIES is DERIVED — nothing here is hand-maintained, and a grant that the
    // castable view refuses would show up as a missing row rather than as a silent no-op in combat.
    expect(CLASS_ABILITIES).toEqual({
      warrior: [
        { level: 1, spellId: "power-strike" },
        { level: 1, spellId: "shield-splitter" },
        { level: 3, spellId: "war-cry" },
        { level: 5, spellId: "sweeping-blow" },
        { level: 7, spellId: "second-wind" },
        { level: 9, spellId: "executioner" }
      ],
      knight: [
        { level: 1, spellId: "bulwark-blow" },
        { level: 1, spellId: "shield-wall" },
        { level: 3, spellId: "cover" },
        { level: 5, spellId: "challenge" },
        { level: 7, spellId: "iron-oath" },
        { level: 9, spellId: "unbroken" }
      ],
      swordmaster: [
        { level: 1, spellId: "precise-thrust" },
        { level: 1, spellId: "flowing-stance" },
        { level: 3, spellId: "riposte" },
        { level: 5, spellId: "crescent-cut" },
        { level: 7, spellId: "still-water" },
        { level: 9, spellId: "finishing-cut" }
      ],
      thief: [
        { level: 1, spellId: "power-strike" },
        { level: 1, spellId: "hamstring" },
        { level: 3, spellId: "smoke-veil" },
        { level: 5, spellId: "shadow-step" },
        { level: 7, spellId: "blinding-dust" },
        { level: 9, spellId: "backstab" }
      ],
      priest: [
        { level: 1, spellId: "heal" },
        { level: 1, spellId: "purge" },
        { level: 4, spellId: "greater-heal" },
        { level: 6, spellId: "blessing" },
        { level: 8, spellId: "purification" },
        { level: 10, spellId: "sanctuary" }
      ],
      chanter: [
        { level: 1, spellId: "lesser-heal" },
        { level: 1, spellId: "ward-hymn" },
        { level: 3, spellId: "sleep" },
        { level: 5, spellId: "battle-hymn" },
        { level: 7, spellId: "ember-chant" },
        { level: 9, spellId: "clarion-hymn" }
      ],
      mage: [
        { level: 1, spellId: "firebolt" },
        { level: 1, spellId: "force-lance" },
        { level: 4, spellId: "flame-wave" },
        { level: 6, spellId: "enfeeble" },
        { level: 8, spellId: "conflagration" },
        { level: 10, spellId: "immolation" }
      ],
      occultist: [
        { level: 1, spellId: "dread" },
        { level: 1, spellId: "life-siphon" },
        { level: 3, spellId: "sleep" },
        { level: 4, spellId: "sunder" },
        { level: 6, spellId: "silence-hex" },
        { level: 8, spellId: "wither" }
      ]
    });
  });

  it("derives the same spell numbers — cost, target and effect", () => {
    for (const [id, legacy] of Object.entries(LEGACY_SPELLS)) {
      const spell = SPELLS[id as keyof typeof SPELLS];
      expect(spell, `${id} disappeared from the legacy view`).toBeDefined();
      expect(spell.kind).toBe(legacy.kind);
      expect(spell.mpCost).toBe(legacy.mpCost);
      expect(spell.target).toBe(legacy.target);
      expect(spell.effects).toHaveLength(1);
      expect(spell.effects[0]).toMatchObject(legacy.effect);
    }
    // The four originals must keep their exact numbers through every re-shaping of the catalog; the
    // catalog itself is free to grow past them.
    for (const id of Object.keys(LEGACY_SPELLS)) {
      expect(Object.keys(SPELLS)).toContain(id);
    }
  });

  it("keeps caster / martial classification and the MP pools that follow from it", () => {
    const casters = ALL_CLASSES.filter((id) => isCasterClass(id));
    const martial = ALL_CLASSES.filter((id) => isMartialSkillClass(id));
    expect(casters.sort()).toEqual(["chanter", "mage", "occultist", "priest"]);
    // §9.4b: Knight and Swordmaster became 特技 classes. They previously had NO technique at all, which
    // meant `baseMaxMpForClass` gave them a pool of ZERO — a selectable class with no resource and no
    // move but Attack. Giving them a line necessarily gives them the martial 気力 pool.
    expect(martial.sort()).toEqual(["knight", "swordmaster", "thief", "warrior"]);

    // 4 + (spirit + wit) * 2 for casters, 3 + might for 特技 classes, 0 for the rest.
    expect(baseMaxMpForClass("priest", APTITUDE)).toBe(4 + (4 + 5) * 2);
    expect(baseMaxMpForClass("warrior", APTITUDE)).toBe(3 + 3);
    expect(baseMaxMpForClass("knight", APTITUDE)).toBe(3 + 3);
  });

  it("leaves the trap specialist worth exactly what the roleTag was worth", () => {
    const specialists: CharacterClassId[] = ["thief"];
    for (const classId of ALL_CLASSES) {
      const character = createGuildCharacter({ name: "Probe", classId, seed: `trap:${classId}` });
      const apt = character.aptitude;
      const base = character.level + (apt.agility ?? 0) * 2 + (apt.wit ?? 0) + (apt.luck ?? 0);
      const expected = base + (specialists.includes(classId) ? 8 : 0);
      expect(trapSkill(character), `${classId} trap skill`).toBe(expected);
    }
  });

  it("still honours a trap tag carried by an already-saved character whose class is not a specialist", () => {
    const veteran = createGuildCharacter({ name: "Veteran", classId: "warrior", seed: "trap:legacy" });
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
    expect(classProficiency("knight", "disarm")).toBe("untrained");
    expect(proficiencyBonus("untrained")).toBe(0);
    expect(proficiencyBonus("trained")).toBeGreaterThan(proficiencyBonus("untrained"));
    expect(proficiencyBonus("specialist")).toBeGreaterThan(proficiencyBonus("trained"));
  });

  it("closes the §3 finding: every class now has a growth line, not a label", () => {
    // This assertion is INVERTED from the one it replaces, and that inversion is the point. §9.1 wrote
    // it to say "six of twelve classes have no technique at all" and to FAIL the day that was fixed,
    // rather than let the gap be quietly forgotten. §9.3 cut it to two of eight (knight, swordmaster);
    // §9.4b closed it. Knight and Swordmaster were selectable classes that could do nothing but Attack.
    for (const classId of ALL_CLASSES) {
      const grants = classTechniqueGrants(classId);
      expect(grants.length, `${classId} still has no technique — the §3 finding has reopened`).toBeGreaterThan(0);
      // §5 asks for "roughly six to ten across the intended level range", and LOADOUT_LIMIT is 6: a
      // seventh would be silently dropped from the default loadout, which takes the SIX LOWEST levels.
      expect(grants.length, `${classId} exceeds the bounded loadout`).toBe(6);
      // "normally two or three usable choices at creation" (§5) — nobody starts with a single move.
      const atCreation = grants.filter((grant) => grant.level === 1);
      expect(atCreation.length, `${classId} offers ${atCreation.length} choice(s) at level 1`).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps the §5 lines that must not duplicate each other", () => {
    const learned = (classId: (typeof ALL_CLASSES)[number]) => classTechniqueGrants(classId).map((grant) => grant.techniqueId);

    // §5: "Mage damage and Occult control must not be duplicated." The Occultist used to be handed the
    // Mage's own `firebolt`, so at level 1 the two classes WERE the same class.
    expect(learned("occultist")).not.toContain("firebolt");
    // §5: the Chanter's heal is "a deliberately weaker emergency heal". It used to be the priest's
    // `heal`, identical in every number, which made "a specialist does it better" false for healing.
    expect(learned("chanter")).not.toContain("heal");
    expect(learned("chanter")).toContain("lesser-heal");
    const priestHeal = TECHNIQUES.heal.effects[0];
    const chanterHeal = TECHNIQUES["lesser-heal"].effects[0];
    expect(priestHeal.kind === "heal" && chanterHeal.kind === "heal" && chanterHeal.amount < priestHeal.amount).toBe(true);
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

  it("now carries the wider families through to the castable view (§9.4)", () => {
    // This assertion is INVERTED from the one §9.1 shipped. Back then the resolver understood only one
    // effect, an MP cost and ally/enemyGroup, so a party-wide ward was refused rather than half-applied.
    // §9.4 taught the resolver ward/buff/debuff/cure, multi-effect and every target scope, so a party
    // ward must now reach the class that learns it — if this ever returns null again, the four families
    // in §5 have silently stopped shipping.
    const partyWard: Technique = {
      id: "heal" as Technique["id"],
      kind: "spell",
      target: "party",
      cost: { mp: 5 },
      effects: [{ kind: "ward", statusResist: { fear: 25 } }],
      duration: { kind: "combat" }
    };
    const projected = toLegacySpell(partyWard);
    expect(projected).not.toBeNull();
    expect(projected?.target).toBe("party");
    expect(projected?.effects).toEqual([{ kind: "ward", statusResist: { fear: 25 } }]);

    const strikeAndWeaken: Technique = {
      id: "power-strike" as Technique["id"],
      kind: "skill",
      target: "enemyGroup",
      cost: { mp: 4 },
      effects: [
        { kind: "damage", min: 4, max: 8, element: "physical" },
        { kind: "debuff", stat: "armor", amount: 2, duration: { kind: "rounds", rounds: 2 } }
      ],
      duration: { kind: "instant" }
    };
    expect(toLegacySpell(strikeAndWeaken)?.effects).toHaveLength(2);

    // What is still held back is a cost combat cannot SPEND yet — the item routes arrive in the same
    // slice, and until they do this must keep refusing rather than casting a scroll for free.
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

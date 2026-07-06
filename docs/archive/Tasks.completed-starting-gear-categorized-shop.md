# Completed Tasks: Starting Gear, Categorized Shop, and Pre-Purchase Preview

Archived: 2026-07-06

Lane W. Make equipment feel like a DRPG preparation layer from registration
through shopping. On inspection, eligibility checks, the pre-purchase stat-delta
comparison, party-member switching, and unaffordable-purchase blocking already
existed; the real gaps were that starting gear was cosmetic-only, the shop was a
flat list, and gear was never shown during registration.

## BS-194: Equip Class-Appropriate Starting Gear At Registration

- [x] Class starting loadouts were display-only strings whose ids
  (`"militia sabre"`) did not even match the catalog (`equip.militia-sabre`), and
  `createGuildCharacter` set `equipment: {}` — every adventurer entered the
  labyrinth empty-handed with no stat bonuses and no baseline for shop comparison.
- [x] Changed each class definition's `equipment` from an id list to a
  slot→catalog-id map (`{ weapon: "equip.militia-sabre", body: "equip.padded-jack" }`),
  world-free, so registration equips the loadout on every path (unit, headless, app).
- [x] `createGuildCharacter` now equips the loadout and `startingEquipment`
  carries real catalog ids; roster/profile display uses localized catalog names
  and effective (gear-inclusive) attack.
- Human expectation: adventurers arrive with class-appropriate weapon + protection.
- Balance fallout (all resolved): equip-mechanic unit tests isolated with
  `equipment: {}`; characterCreation id assertion updated; JA shop e2e scoped to
  the stock section (militia sabre now appears both in stock and as equipped gear).
- Browser evidence: party-ready shows gear-inclusive attack; shop comparison now
  reads "no change" for the already-equipped weapon and "-1" for a weaker one.
- Regression: `characterCreation.test.ts` locks that every class equips a loadout
  and effective attack/armor exceed the base stats.
- Headless: reachability still true; combat probes still clear (gear strengthens
  the party); headless proves none of the shop UX.

## BS-195: Categorized Shop With Stable JP/EN Switching

- [x] Split flat shop stock into six controller-first category tabs
  (武器 / 防具 / 盾・副手 / 頭・手・装身具 / 道具 / 消耗品), mapped from equipment
  slot and item kind; only non-empty categories render.
- [x] Category state falls back to the first available tab; tabs are keyboard/
  controller reachable; per-item eligibility and stat-delta comparison preserved.
- Browser evidence: `town.spec.ts` and `controller.spec.ts` traverse categories
  (mouse and keyboard); JA mobile shop stays overflow-free; screenshots reviewed.

## BS-196: Show Starting Gear During Registration And Suggested Recruits

- [x] Each class card in the Class step shows its starting loadout
  ("装備: 民兵の湾刀 / 綿入れの胴衣") in a warm accent; the suggested-recruit
  confirmation card shows the recruit's starting gear before acceptance.
- Browser evidence: `character-creation.spec.ts` asserts 12 class-gear lines and
  the suggestion card's equipment; the JA gear line passes the line-layout gate
  (no orphan tail, no stranded punctuation).

## BS-197: Browser Evidence And Archive

- [x] Full suite green: 103 unit tests, 48 Playwright e2e, tsc, build, headless
  reachability, combat probes.
- Evidence coverage: category traversal (mouse + controller), equippable
  comparison (shop-delta), JP labels/mobile, starting-gear display.
- Unequippable warning: the shop's cannot-use branch is wired and reachable
  (militia-sabre is martial-only, ashwood-staff caster-only); the block itself is
  unit-covered by economy's "blocks class-ineligible equipment".

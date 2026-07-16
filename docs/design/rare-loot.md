# IMP-022 — Rare equipment, appraisal, bulk conversion (contract: IMP-022A)

Common drops must not create appraisal chores; a rare find should be a short keep / equip / sell /
dismantle decision. This is the frozen contract for IMP-022A; the appraisal + bulk-conversion UI is
IMP-022C, the enemy record is IMP-022D, and Codex authors the affix pools (IMP-022B) + simulator
(IMP-023).

## Decisions (following the IMP-021 pattern)

- **Affix pools are data** (`content/worlds/<id>/affixes.md`, `ScenarioAffix`), merged with the
  built-in `EQUIPMENT_AFFIXES` (authored wins on id) — same move as vocations/elements.
- **Rarity** `common | rare | epic`. A COMMON drop is known on acquisition and still STACKS. A
  RARE-or-higher drop is a UNIQUE instance (`instanceId`) that may conceal its rolled affix until
  APPRAISED, and can be LOCKED / FAVORITED to protect it from bulk conversion.
- **Save-compat is not a concern yet** — InventoryItem gains optional instance fields; legacy items
  (no rarity) read as identified commons.

## Instance fields (InventoryItem, added this slice)

`instanceId?`, `rarity?`, `identified?`, `locked?`, `favorite?` (the rolled affix stays `affix`).
A rare instance is created unidentified; appraisal flips `identified` to true. Bulk conversion is
REFUSED for any item that is equipped, `locked`, `favorite`, or an unidentified rare.

## Rules (`domain/loot.ts`)

- `resolveAffixCatalog(world)` — built-in + authored affixes; `getEffectiveCharacterStats` reads it
  so authored affixes work in combat.
- `rollEquipmentDrop(world, baseEquipId, floor, seed)` — deterministic: a seeded roll picks a rarity
  by floor, and a rare rolls one eligible affix (by slot + minFloor + rarity, weighted). Returns an
  InventoryItem instance (common = identified+stackable; rare = unidentified unique).
- `appraiseInstance(item)` → identified. `isProtectedFromBulk(item, equippedKeys)` → the guard above.
- `sellValueOf(item, world)` / `dismantleYield(item, world)` — deliberately small; dismantle yields a
  material count, sell yields gold. No buy→dismantle or appraise→resale profit loop (yields < cost).

## Loader validation (IMP-022A)

Authored affixes must roll on a real slot and name a known rarity (schema). The deeper "every effect
family has ≥2 answers / no dead affix" balance check is IMP-023 (the simulator).

## Acceptance the contract serves (from IMP-022)

- Common items known on acquisition; rare+ can conceal authored affixes while category + equip
  eligibility stay readable before appraisal.
- Bulk sell/dismantle is filterable, reversible before confirm, shows exact totals, and never
  consumes equipped / locked / favorite / unidentified items (IMP-022C UI enforces via the guard).
- Currency/material count stays small; no profit loops.

## IMP-022B — authored affix pools (DONE 2026-07-17)

- 黒碑 and 翠碑 each ship eight original rare/epic affixes.
- Every equipment slot has an authored roll, and attack, defense, accuracy, and
  speed each have more than one authored answer.
- The seeded simulator derives useful strategy axes from dangerous enemy data
  and reports any enemy that has fewer than two affix-supported approaches by
  the floor where it appears.
- `tests/contentAuthoring.test.ts` and `tests/contentSim.test.ts` lock both world
  packs.

`IMP-022V` remains open: appraisal is currently free, bulk conversion has no
confirmation/filter stage, dismantled materials have no spending rule, and the
appraiser does not show equipment comparison.

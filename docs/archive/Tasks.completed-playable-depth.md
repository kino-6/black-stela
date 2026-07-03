# Completed Tasks: Playable Depth

Completed: 2026-07-04

## Scope

Lane E made post-registration choices matter through shared gold, inventory,
equipment, treasure, shop service, paid recovery, and browser-visible reward
feedback.

## Completed Items

- [x] BS-104: Item/equipment/currency domain.
  - Item catalog, equipment slots, shared party gold, quantities, and save
    migration are covered.
- [x] BS-105: Equipment affects combat.
  - Weapon and armor stats feed deterministic character combat stats.
- [x] BS-106: Treasure and loot rewards.
  - Authored room treasure and combat rewards update canonical state once and
    produce visible feedback.
- [x] BS-107: Town shop service.
  - Town shop supports buy/sell/equip flows without exposing debug/admin
    editing controls.
- [x] BS-108: Recovery costs and attrition.
  - Return no longer heals. Recovery spends shared gold and blocks when
    unaffordable.
- [x] BS-109: Inventory/equipment UI.
  - Town exposes inventory/equipment choices; dungeon/combat stay compact.
- [x] BS-110: Scenario data pass.
  - Starter stock, equipment, treasure, and recovery assumptions are covered by
    scenario summary tests.
- [x] BS-111: Economy balance probes.
  - Headless reachability reports gold, consumables, HP pressure, loot, and
    return outcome separately from UX proof.
- [x] BS-112: Docs and Japanese coverage.
  - README documents economy/debug behavior; Japanese item log projection and
    town E2E are covered.
- [x] BS-113: Human Requirement Gate update.
  - Gate now rejects free recovery, free escape leakage, generic shop UI, and
    invisible rewards; screenshot review covers reward/shop states.

## Verification

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] `npm run headless:reachability`
- [x] `git diff --check`

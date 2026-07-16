# IMP-021 — Career / vocation mastery (contract: IMP-021A)

A build is the history of vocations an adventurer has mastered (DQ6/7-style, original data). Character
LEVEL persists; vocation MASTERY advances separately; mastered techniques stay learned; authored
prerequisites gate stronger advanced vocations. This file is the **frozen contract** IMP-021A owns —
Codex's content/simulation (IMP-021B) and the player routes (IMP-021C) build on it and must not edit
the runtime types in parallel.

## Decisions taken with the user (2026-07-16)

- **Basic vocations = the existing 12 classes, kept as built-in for now.** They aren't the appeal —
  the authored ADVANCED vocations are — so the base stays code while everything new is data.
- **Vocation id is a `string`, data-extensible** (the same move that made `Element` a string for
  world-authored cosmology). Built-in basics use the 12 class ids; advanced vocations are authored
  and merged in. Nothing hard-codes "a vocation is one of 12".
- **Externalize incrementally:** advanced vocations, mastery rules knobs, unlock prerequisites, and
  granted techniques are authored in `content/worlds/<id>/vocations.md`. The base 12 stay in code.
- **Save compatibility is NOT a concern at this stage** — the Character/save schema may change freely
  (no migration path required yet).
- **Changing vocation keeps LEVEL and learned techniques** (today's `reclassCharacter` wrongly resets
  to level 1 and re-derives everything — that is corrected here).
- **Mastery gain runs through the same out-levelling FALLOFF** as XP, so farming weak early floors is
  not the optimal mastery route (an IMP-021 acceptance check).

## Data (authored — `content/worlds/<id>/vocations.md`)

```yaml
vocations:
  - id: vocation.ash-reaver          # advanced
    tier: advanced
    name: Ash Reaver
    # Vocations mastered (to `masteryRankToUnlock`) that open this one, + optional character level.
    requires:
      mastered: [vanguard, sellsword]   # built-in or authored ids
      minLevel: 6
    statModifiers: { attack: 3, maxHp: 8, speed: -1 }   # applied on top of aptitude-derived base
    allowedSlots: [weapon, offhand, body, head, hands, accessory]
    signature: "…"                      # the vocation's identity line (localized)
    grantsTechniques: [spell.emberlash, skill.sunder]   # learned on adopting; retained forever
    locales: { ja: { name: 灰の刃, signature: … } }
```

- `tier`: `basic` | `advanced`. Basic ids that appear here OVERRIDE the built-in of the same id
  (lets a world re-skin a basic); absent basics fall back to the code catalog.
- The loader validates: every `requires.mastered` id resolves; the unlock graph has **no cycles**;
  every advanced vocation is **reachable** from the basics; `grantsTechniques` resolve to known
  spells/skills. (The deeper balance simulation is IMP-023.)

## Character / save schema (runtime — added this slice)

```ts
interface CharacterVocationState {
  current: VocationId;                 // the active vocation (a class id or an authored id)
  mastery: Record<VocationId, number>; // rank per vocation worked (0 = touched, N = mastered)
  progress: Record<VocationId, number>;// mastery points toward the next rank of `current`
  learned: string[];                   // technique ids kept across vocation changes (union)
  loadout: string[];                   // the bounded set active in combat (subset of learned)
}
```

- `VocationId = string`. `Character.vocation: CharacterVocationState`. `current` seeds from the
  creation `classId`.
- `MASTERY_RANKS` (code): points per rank, and `LOADOUT_LIMIT` (bounded combat list). Per-world
  override knobs may move to `world.md` later; not required this slice.

## Rules (code — `domain/vocations.ts`)

- `resolveVocationCatalog(world)` — merge built-in basics with authored vocations (authored wins on id).
- `masteryGain(enemyLevel, memberLevel)` — reuse `leveling.rewardXpFor`'s falloff so weak farming decays.
- `canAdoptVocation(character, vocationId, catalog)` — prerequisites met (mastered ranks + level).
- `adoptVocation(character, vocationId, world)` — swap stat modifiers / equipment permissions /
  signature; **keep level, hp/mp ratios, and `learned`**; union in the new vocation's `grantsTechniques`.
- `applyMastery(character, points)` — advance `progress`/`mastery` of `current`, capping at mastered.

## Acceptance the contract must satisfy (from IMP-021)

- Advanced vocations are intentional destinations; every unlock route is visible before committing.
- Changing vocation does not reset level or erase mastered techniques; the current vocation still owns
  stat modifiers, equipment permissions, and its signature.
- Learned techniques persist; a bounded, reorderable combat loadout keeps the command list sane.
- Weak early-floor encounters cannot be the optimal mastery strategy (falloff).
- Japanese labels/descriptions come from localization/scenario data.

## IMP-021C — town career service + combat loadout (DONE 2026-07-16)

- Commands `change_vocation` / `set_loadout` (town-only). `change_vocation` calls
  `changeCharacterVocation`: a BASIC target reclasses the base at the current level (reclassCharacter
  re-levels from retained xp, so level is kept) and learns that class's techniques; an ADVANCED
  target keeps the base and layers modifiers. Learned techniques are always a UNION.
- Combat now draws each actor's abilities from its `combatLoadout` (defaults to the class's known
  spells until edited — so untouched characters are unchanged); the cast-validation path honours it too.
- UI: `components/CareerPanel.tsx`, town service `town-service-career` (surface `town-career`).
  Shows current vocation + mastery, every vocation with adopt/current/locked-with-requirements, and
  a bounded loadout editor. Copy in `career.*` + `events.vocationChanged`. Locked by
  `tests/e2e/career.spec.ts` + the command tests in `tests/vocations.test.ts`.

## Out of scope (later sub-IMPs)

- IMP-021B (Codex): the authored basic→advanced graph + seeded progression fixtures (黒碑 ships two
  advanced vocations now as a stand-in; Codex enriches the graph).
- IMP-023: the deterministic simulator that gates dominant/compulsory routes.

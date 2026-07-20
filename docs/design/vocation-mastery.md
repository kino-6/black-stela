# IMP-021 — Career / vocation mastery (contract: IMP-021A)

> **Supersession note (2026-07-20):** the mastery/loadout mechanics in this
> document remain the contract. Its former assumption that the existing twelve
> basic classes are a fixed player-facing roster is superseded by
> [`class-system.md`](class-system.md). Do not use this document to justify a
> Godot-only class UI or to retain a basic class that has no distinct rules
> identity. Class-id, prerequisite, and save changes must be made together in
> the TypeScript oracle and then ported through parity.

A build is the history of vocations an adventurer has mastered (DQ6/7-style, original data). Character
LEVEL persists; vocation MASTERY advances separately; mastered techniques stay learned; authored
prerequisites gate stronger advanced vocations. This file is the **frozen contract** IMP-021A owns —
Codex's content/simulation (IMP-021B) and the player routes (IMP-021C) build on it and must not edit
the runtime types in parallel.

## Decisions taken with the user (2026-07-16)

- **Historical baseline:** the implementation used the existing twelve classes as built-in basics.
  That player-facing taxonomy is now under revision; see `class-system.md`. The
  vocation graph remains data-extensible, and the final basic ids must remain
  stable and save-migrated once the new roster is accepted.
- **Vocation id is a `string`, data-extensible** (the same move that made `Element` a string for
  world-authored cosmology). The current built-in basics use the former 12 class
  ids; advanced vocations are authored and merged in. Nothing hard-codes "a
  vocation is one of 12".
- **Externalize incrementally:** advanced vocations, mastery rules knobs, unlock prerequisites, and
  granted techniques are authored in `content/worlds/<id>/vocations.md`. The
  current base catalog is code, but it is not a permanent player-facing roster.
- **Historical baseline:** this slice originally treated save compatibility as
  out of scope. That is no longer valid for a class-id or capability revision:
  the versioned save DTO needs an explicit, tested migration before old ids or
  learned techniques change.
- **Changing vocation keeps LEVEL and learned techniques** (today's `reclassCharacter` wrongly resets
  to level 1 and re-derives everything — that is corrected here).
- **Changing vocation widens a build, not weakens it.** Starting discipline,
  previously earned exploration access, learned techniques, and legitimately
  equipped gear persist. The active vocation changes a positive signature and
  the recommended bounded loadout; it must not impose a crippling stat or
  equipment reset. See `class-system.md` for the full player-facing rule.
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
- `adoptVocation(character, vocationId, world)` — retain starting discipline,
  acquired proficiencies, usable gear, level, hp/mp ratios, and `learned`;
  union in the new vocation's `grantsTechniques`. Change only the active
  vocation's positive signature and bounded recommended loadout. Do not model a
  basic vocation change as a destructive reclass.
- `applyMastery(character, points)` — advance `progress`/`mastery` of `current`, capping at mastered.

## Acceptance the contract must satisfy (from IMP-021)

- Advanced vocations are intentional destinations; every unlock route is visible before committing.
- Changing vocation does not reset level, erase mastered techniques, revoke
  earned exploration access, or invalidate legitimately equipped gear. The
  active vocation adds its positive signature and recommends the bounded
  loadout; it does not replace the developed adventurer beneath it.
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

- IMP-023: the deterministic simulator that gates dominant/compulsory routes.

## IMP-021B — authored vocation graphs (DONE 2026-07-17)

- 黒碑 and 翠碑 each ship six original advanced destinations.
- Every one of the 12 shared basic vocations opens at least one destination; no
  basic vocation is required by every destination.
- `tests/contentAuthoring.test.ts` locks prerequisite coverage, localized names
  and signatures, known technique ids, and the absence of leaked class ids in
  Japanese copy.
- `simulateContent` reports prerequisite use, uncovered/compulsory basics,
  estimated fights per destination, and weak-floor versus matched-floor mastery
  gain.

`IMP-021V` remains open because the current town screen does not display the
authored signature, stat changes, equipment access, or granted techniques.

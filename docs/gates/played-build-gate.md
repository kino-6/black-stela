# Played-Build Gate — the mechanism that would have caught the 3-minute playtest

**Status:** authored 2026-07-25, in response to a human playing the real Godot
build for ~3 minutes and finding ~21 player-facing defects that **every green
gate missed**. This document is the durable "do not repeat the same rut"
mechanism the review demanded. It is a spec for executable gates plus a small
number of process rules. It exists because the failure was structural, not a
one-off bug.

Read this alongside `browser-selfplay-gate.md` (the React-side self-play spec),
`past-trouble-regression-gate.md` (per-bug locks), and the manual review
checklists (`player-facing-red-flags.md`, `drpg-ux-gate.md`,
`human-requirement-gate.md`, `screenshot-review.md`). This gate does **not**
replace them; it closes the holes that let their subjects ship anyway.

---

## Root cause (why 21 defects passed every green gate)

Two layers, both structural.

### Layer 1 — prioritization: known defects were deferred, advanced content built on top

`Improve.md` already recorded most of what the human found, as **"Reproduced"**
and unfixed, months earlier:

- `IMP-024` combat command window covers the enemy → *acting character / enemy not visible*
- `IMP-025` town = ten equal service buttons, "generic service dashboard" → *enterprise-app town*
- `IMP-026` exploration = eleven web-toolbar buttons → *enterprise-app dungeon command bar*
- `IMP-027` dungeon return can land on Adventurer Registration → *broken return loop*
- `IMP-028` creation = card wall + stat-entry form → *enterprise-app character creation*
- `IMP-029` no chamber → fight → chest loop → *玄室 / open rooms absent*

Every one carried a **"Remaining Visual Acceptance"** section marked *"V blocked"*
or *"V pending"* — deferred indefinitely while the team shipped advanced
vocations (§7B) on top. Improve.md itself says it plainly:

> "Passing the route is not visual acceptance. Current tests prove that surfaces
> fit and accept controller input, but they do not yet prove that the screen
> reads like a DRPG rather than a web service."

The base game "reads like a web service," was **known** to, and that was allowed
to persist because visual acceptance was a deferrable checkbox and advanced
content was not gated behind base playability.

### Layer 2 — the truth-gate plays the wrong program

- `gate:final` = `FINAL_GATE=1 playwright test`, and `playwright.config.ts` boots
  its `webServer` with **`npm run dev` = vite = the React reference app**. The
  shipped artifact is **Godot** (`npm run play`, `package:web`, `package:macos`).
  **No gate plays the Godot build end-to-end as a player.** Every runtime bug the
  human hit (auto-return after combat, map reset on return, held-key repeat, Esc
  closing the map modal) is a Godot behavior the truth-gate is architecturally
  blind to.
- `verify_flow.gd` — the only Godot loop check — is **rules-only** ("byte-independent
  of presentation") and, by its own header comment, has been **RED and unwatched**
  ("this script has failed ever since. It was not in any gate, so nothing said so").
- `verify_parity.gd` compares **state hashes + semantic events**, presentation
  "defined out." Pure-black backgrounds, toolbar layouts, unfeatured actors,
  corridor-only floors change no hash.
- `verify_ux_parity.gd` checks that manifest `requiredKeys` render and that a
  **screenshot file exists** — not what is in the pixels, and only for keys
  someone thought to list. The missing shop descriptions and aptitude
  explanations are exactly the keys nobody listed.
- Executable controller gates exist for **town and guild only**. Combat, dungeon,
  shop, and the map modal — where held-key, Esc-modal, and the toolbar feel live —
  have **no interaction gate at all**.
- Copy honesty and design coherence (the "you can dive again" lie, black-view-vs-
  Verdant, 1-wide corridors) are covered **only by prose docs that nothing executes**.

Every defect bucket maps to a gate that **describes** it; not one maps to a gate
that **executes against the Godot binary and can go red on it.**

---

## The mechanism: four executable gates + three process rules

### G1 — `gate:play`: play the Godot build through the whole core loop

New Godot script `godot/tests/verify_played_loop.gd`, driving the **actual scenes**
(not the rules module in isolation), asserting the loop **closes** and state
**persists**. Each assertion is tied to a real defect so it can go red on the
shipped binary:

1. New game → adventurer creation completes → town. *(loop reachable)*
2. **Shop:** for **every stocked item and gear**, its localized `description`
   renders in the Control tree. → kills "consumables show no description" and any
   future silent-drop. *(per-entity, not an allowlist)*
3. **Creation ability step:** for **every aptitude**, its effect text renders. →
   kills "aptitudes unexplained."
4. Descend to the dungeon.
5. **Held-key movement:** hold the forward action for N frames → assert the party
   advanced **more than one** cell. → kills "long-press doesn't repeat."
6. Encounter → run combat to victory → assert the game is **still in the dungeon**
   (not auto-returned to town). → pins the auto-return behavior explicitly
   (fix, or assert-intended — either way it can never silently change).
7. **Combat backdrop:** sample stage pixels → assert **not pure black**. → kills
   "combat background is FC-black."
8. Open the full-map modal → send `ui_cancel` (Esc) → assert the modal **closed**.
   → kills "Esc doesn't close the map."
9. Return to town via a deep-floor marker → **re-enter the dungeon** → assert the
   entire automap record (`visitedCells`, `visitedRooms`, known/blocked exits and
   secret-search records) **persisted across the floor change**. The active
   `floorId` may change what is drawn, never what the party knows. Return must
   also preserve durable expedition state (inventory, gold, claimed treasure,
   discovered secrets and resolved traps). → kills "map resets on return" AND
   closes the loop that every prior gate ended one step before.

   No ordinary scenario command may impose an unannounced rollback of durable
   progress. A deliberate loss mechanic (for example a stated curse) must be
   authored in scenario data, explained before confirmation, and add an explicit
   allowlisted assertion to this gate; silently deleting a collection or map
   record is a failure.

`gate:play` runs on the **real Godot build**, not headless-rules, not React.

### G2 — exhaustive controller/interaction registry

`godot/gates/controller-registry.json` lists **every** `res://scenes/*.tscn`. The
gate asserts each screen has interaction coverage for: a focusable landing
control, every control operable by keyboard **and** gamepad, `ui_cancel`/Esc
resolves exactly one level, held-repeat where movement/steppers apply. **A scene
present in the build but absent from the registry (and not explicitly exempt)
FAILS.** Extends the existing `verify_town_controller.gd` / `verify_guild_controller.gd`
to combat, dungeon, shop, map modal, infirmary, records, quest board, etc. This
is the "no screen may exist that a controller cannot operate" gate the human
asked for.

### G3 — per-entity player-facing completeness

A structural rule, iterated over **data**, not a curated key list:

- For every item/gear in a world pack: a non-empty `description` exists **and**
  renders wherever the entity is shown (shop, inventory, loot).
- For every aptitude: an effect explanation renders on the ability step.
- (Extend as new entity types appear: enemies, techniques, statuses.)

Missing data or an un-surfaced datum FAILS. This is the general form of "an item
with no explanation is forbidden."

### G4 — wire the Godot gates into the truth-gate, and stop the rot

- The **truth-gate** must exercise the shipped artifact: `gate:final` (or a new
  `gate:truth` that supersedes it) runs the React Playwright suite **and**
  `gate:play` + `gate:migration` (controller registry, parity, save, flow).
- **Fix `verify_flow.gd`'s stale RED assertion and wire it into the gate's success
  path** so a Godot loop check can never again be red-and-unwatched.
- A gate script that has been failing is a build break, not background noise.

### Process rules (in force from 2026-07-25)

- **P1 — Definition of Done for player-facing work.** Numeric acceptance **+** a
  locked test **+** `gate:play` green **+** independent visual/feel acceptance by
  the **other agent** on the **real Godot build** (Codex for visual/UX; the
  primary implementer does not self-approve). "V blocked / V pending" is **not a
  done state** and blocks the milestone. Visual acceptance is not deferrable.
- **P2 — Base-playability priority guard.** While any "Reproduced" core-loop or
  feel defect (IMP-024..029 and their kin) is open, **no advanced-content slice
  may be marked complete.** The game must be playable-first. Advanced vocations,
  new worlds, and economy depth wait behind a base that reads and plays like a
  DRPG.
- **P3 — Every hand-found defect earns a lock.** Each defect a human finds by
  playing becomes a regression assertion in `gate:play` or
  `past-trouble-regression-gate.md` the moment it is fixed. A defect found by a
  human that a gate should have caught also earns the **missing gate**, not just
  the fix.

---

## Provenance

Triggered by the 2026-07-25 Verdant 3-minute playtest
(`docs/reviews/2026-07-25-verdant-3min-playtest.md`), which returned the verdict
"not properly playable" and surfaced 21 defects. Gate-gap diagnosis in that
review's appendix.

# Godot Migration — Execution Plan

Status: Active (branch `godot-migration`)

This is the **execution** plan for the migration. The **strategy** (why Godot,
the candidate comparison, product invariants, risks) lives in
`godot-migration-plan.md`; the **system it ports from** is `../architecture.md`.
This document is the concrete "what we build, in what order, how each step is
proven."

## Locked decisions (2026-07-18)

- **Runtime:** Godot 4.7.1 only. No Babylon comparison spike — commit to a Godot
  **vertical slice** rather than building two runtimes. (The strategy doc's
  Babylon control experiment is deliberately skipped to halve the work.)
- **Language:** GDScript. Godot 4 cannot export C# to Web, and browser delivery
  is retained.
- **Delivery:** Web **and** desktop stay supported. This keeps the current
  browser dev/review workflow and forbids C#-only paths.
- **Rules ownership:** TypeScript stays the **oracle** during the whole
  transition. GDScript rules are proven byte-for-byte against TS golden traces
  (`src/headless/traceFixture.ts`); no gameplay truth is duplicated without a
  parity check.
- **Data:** world packs compile to versioned JSON. Godot never becomes a second
  Markdown/YAML parser.

## The vertical slice

One continuous core loop, controller-only, at 1920x1080 and 1280x720:

```
Title → Town (hub) → Dungeon (grid move + one encounter) → Combat
      → Result → back to Dungeon/Town
```

Everything the slice needs — and nothing it doesn't. Guild creation, shops,
quests, vocations, appraisal, forging, records come later (Phase 4 of the
strategy doc), only after the slice proves Godot is worth it.

## Repository layout

```
godot/                  The Godot 4.7.1 project (GDScript). New.
  project.godot
  scenes/               Boot, Title, Town, Dungeon, Combat, Result roots (.tscn)
  scripts/              GDScript: rules port, scene controllers, focus, loader
  data/                 Generated: versioned world-pack JSON + golden traces
  tests/                GdUnit / headless parity + input scripts
src/tools/              TS exporters that FEED godot/data (pack→JSON, trace→JSON)
```

TS authoring, simulation, validation, and the oracle stay where they are. The
React runtime keeps running until the slice passes.

## Sprints

Each sprint ends green — the TS side against `npm run gate:final`, the Godot side
against `godot --headless` run + parity replay + screenshot review.

### S1 — Data + parity artifacts (TypeScript, no Godot yet)

The foundation Godot consumes. Pure TS, in the existing gate, low-risk.

1. **World-pack → versioned JSON exporter** (`src/tools/exportWorldPacks.ts` +
   an `npm run export:packs` script). Reads a validated `ScenarioWorld` from the
   loader and writes `godot/data/worlds/<id>.json` with a schema version. One
   normalized shape; no engine-specific fields.
2. **Golden trace exporter** (`src/tools/exportTraces.ts`). Uses
   `runTrace` + `withDeterministicIds` to emit `godot/data/traces/<route>.json`
   for the slice route (title→town→dungeon→one encounter→result→return), each a
   `{ initialState, commands, steps:[{command, events, stateHash}] }`.
3. Lock both with unit tests (exporter output is stable, re-runnable, and the
   JSON round-trips back to an equivalent world / replays to the same hashes).

Exit: `godot/data/` holds the normalized world JSON and golden traces; a Godot
port has concrete inputs and concrete parity targets before any GDScript exists.

### S2 — Godot project shell

A controllable, controller-first shell — no rules yet.

1. `godot/project.godot`, an **InputMap** with named actions (move fwd/back,
   turn L/R, sidestep L/R, confirm, cancel, menu, actor-cycle, target-cycle,
   Repeat, Auto, Auto-interrupt), a viewport/scaling policy, and a shared theme.
2. A **Control focus** system (the DRPG focus ring + directional navigation that
   `ui/controllerFocus.ts` does today) and a transition layer.
3. Scene roots: Boot → Title → Town → Dungeon → Combat → Result, wired for
   navigation only (placeholder content).
4. A **JSON world loader** that reads `godot/data/worlds/<id>.json`.

Exit: the shell boots headless, navigates the scene roots by keyboard/gamepad
only, and loads a world pack. Verified via `godot --headless` + a screenshot per
scene.

### S3 — Minimum rules port + parity

Port only what the slice needs, prove it matches TS.

1. Port the slice's command/state rules to GDScript (movement, encounter entry,
   `declare_round` resolution, result, return). Reuse the same seeded-RNG and the
   same FNV-1a canonical-state hash so hashes are comparable.
2. A **parity harness** in `godot/tests/` that loads each golden trace, replays
   its commands through the GDScript rules, and asserts every event and
   `stateHash` matches the TS oracle.
3. Load/save through the versioned DTO without destroying TS saves.

Exit: the slice's rules run in GDScript with byte-for-byte parity against the TS
golden traces. TS remains the oracle.

### S4 — Godot slice UI

The real test: does Godot solve the presentation/controller problems.

1. First-person dungeon (grid move, minimap, current-cell actions) from the one
   grid model.
2. Combat: readable enemy staging, 3+3 formation, stable command/message
   regions, target/actor cycling, Auto/Repeat.
3. Town hub, result, and continuous transitions (no app-like page cuts).
4. Japanese line layout carried through.

Exit: the whole slice is playable controller-only at both viewports; screenshot
review confirms no overlap/clipping and a continuous presentation.

### S5 — Go/No-Go review

Against the strategy doc's Phase 2 gate:

- Controller-only traversal, no pointer, no viewport overflow at 1920/1280.
- Town reads as preparation; dungeon commands are contextual; combat keeps enemy
  + formation context.
- Victory → result → resume → return is one continuous presentation.
- Default and Verdant use the **same** scene code with different data/assets.
- The slice is *materially easier to adjust* than the React surfaces — with
  specific, named simplifications, not engine reputation.

Decision: continue to Phase 4 incremental migration, or stop and keep React.

## Verification approach (Godot side)

- **Rules:** golden-trace replay parity (S3 harness) — the TS oracle is truth.
- **Input:** scripted `InputEventAction` routes + physical controller smoke.
- **Visual:** fixed-state screenshots at 1920x1080 / 1280x720, reviewed for
  composition, not just viewport fit.
- **Saves:** round-trip + migration fixtures across both runtimes.
- `godot --headless` runs scripts/scenes in CI-like fashion; no editor GUI needed
  for parity and headless screenshots.

## What does NOT change

TypeScript stays the authoring, simulation, validation, and **oracle** layer.
Content packs and asset contracts are untouched (assets are generated
separately). The React runtime remains runnable until the slice — then each
Phase 4 slice — passes its gate. No gameplay truth is duplicated without a
parity check.

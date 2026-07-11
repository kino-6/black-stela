# Scenario switching

Status: design (feat/scenario-switching). Goal: the running game is no longer
pinned to `defaultWorld` — a scenario (a `content/worlds/<id>/` pack, each with its
own dungeons, enemies, economy, and **art pack**) can be selected at start and
swapped, so every scenario carries its own worldview. "Default-fixed" contradicts
the product concept; this makes worlds first-class.

## Current state (why work is needed)

- `src/data/defaultWorld.ts` builds ONE `ScenarioWorld` from hard-coded `?raw`
  imports pinned to `content/worlds/default/...`. It is a module singleton.
- `defaultWorld` is referenced directly in exactly two places: **`src/App.tsx` (~37)**
  and **`src/ui/catalog.ts` (9)**. Child components (`DungeonView`, `ShopPanel`, …)
  already take `world` as a **prop**, so the swap point is centralized in App.
- `loadScenarioPack` (import UI) only **validates + summarizes** a pack; it never
  replaces the live world. So you cannot *play* another scenario today.
- The **asset resolver is already pack-capable** (globs every
  `content/worlds/*/assets/**`, `setActiveArtPack`, explicit `pack` args). The
  active pack is derived from `world.assetPack`, but because the world is fixed, the
  pack is effectively fixed too.
- Content (dungeon/enemy/economy data) is bundled per-file for `default` only —
  nothing globs other world folders for **scenario** data (unlike assets).
- Save data assumes the default world (no `worldId`).

## Decision: how `world` reaches consumers

Two consumer kinds, two mechanisms (mirrors how assets already work —
`setActiveArtPack` + explicit `pack`):

1. **React components → `WorldContext`.** A `WorldProvider` at App root exposes the
   active `ScenarioWorld`; components read it with `useWorld()` instead of importing
   `defaultWorld`. Children that already take a `world` prop keep working (App
   passes the context value).
2. **Pure non-React helpers (`catalog.ts`) → an active-world accessor.** A tiny
   module `src/data/activeWorld.ts` holds the selected world:
   `setActiveWorld(world)` / `getActiveWorld()`. `catalog.ts` lookups
   (`findEquipmentById`, `localizedCatalogName`, …) read `getActiveWorld()` instead
   of importing the singleton. Set once when a scenario is selected, exactly like
   `setActiveArtPack`. Only ONE world is active at a time, so a controlled
   module accessor is correct and low-churn — no threading `world` through every UI
   call site.

Rationale for the hybrid (chosen over full arg-threading and full Context-ification):
full threading ripples a `world` param through dozens of UI call sites for no
runtime benefit; full Context-ification forces pure/engine helpers to become React
hooks. The hybrid keeps the engine and pure helpers framework-free while giving
components idiomatic context. `setActiveWorld` + `setActiveArtPack` are set together
in one `selectScenario(world)` action so they never drift.

## World registry (data layer)

Generalize `defaultWorld.ts` into a per-folder loader + a registry:

- **Glob** `content/worlds/*/**/*.md` (`?raw`, eager) and group files by world
  folder id (the path segment after `worlds/`).
- Per world: parse `world.md` (+ items/enemies/encounters/treasure/progression) and
  **discover dungeon files** via the same grouping (`worlds/<id>/dungeons/*.md`).
  **Descent order** = sort by each floor's `level` front-matter (fallback: natural
  filename sort `b1f, b2f, …`). world.md MAY later carry an explicit floor order; not
  required for v1.
- Exports: `worldRegistry: Record<worldId, ScenarioWorld>` and
  `listScenarios(): { worldId, title, assetPack }[]`. `defaultWorld` remains the
  `"default"` entry (back-compat + all existing tests keep importing it).
- Validation errors in a world surface at build/load, not silently.

## Active world flow

- App holds `activeWorld` (state), initialized to `worldRegistry.default`.
- `selectScenario(world)`: `setActiveWorld(world)` + `setActiveArtPack(world.assetPack ?? "default")`
  + re-apply `cssArtVariables(pack)` to `:root` + reset run state + provide via
  `WorldContext`.
- The ~37 App refs to `defaultWorld` become `activeWorld`; engine calls pass it.
- De-hardcode `shop.stela-general`: resolve the town shop from the world (a flagged
  town shop, else `shops[0]`).
- `ART_PACK` const is removed; the pack is derived from `activeWorld` reactively.

## Persistence

- `toSaveDataV1` records `worldId`. On load, restore the world from `worldRegistry`;
  if the id is unknown, show an explicit error (never silently load into `default`).
- Legacy saves without `worldId` migrate to `"default"`.

## Selection UX

- Title/start flow gains a **scenario picker** listing `listScenarios()` (title +
  worldview blurb). Selecting sets `activeWorld` and proceeds to the existing
  adventurer-creation → dungeon path. With one scenario present it still works
  (auto-select or a single-card list).
- `loadScenarioPack` success (import) registers the pack and either enters the
  picker or starts it immediately (T7).

## Proof

A minimal **second scenario** (`content/worlds/<second>/`, 1–2 floors + its own
`assetPack`) proves switching end-to-end — not full content, a fixture. e2e: pick
the second scenario → its floor/name/atmosphere loads and is playable; pick default
→ unchanged. Real-play confirmation by the user (`?debug=1`); headless never proves
UX.

## Non-goals (v1)

- Per-scenario classes/spells/curve formulas stay in code (see the content/economy
  boundary) — scenarios vary data (dungeons/enemies/gear/items/art), not the rules
  engine.
- Mid-run scenario hot-swap (switching only happens at start / new game).

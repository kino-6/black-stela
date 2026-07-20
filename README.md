# Black Stela

> **The player runtime is Godot 4.7.1 / GDScript** (`godot/`). The React app under `src/` is the
> **archived UX reference** the migration is measured against — it is no longer the shipping player
> surface. See [ADR 0001](docs/adr/0001-godot-gdscript-as-the-player-runtime.md).
>
> ```sh
> godot --path godot/            # play
> npm run gate:migration         # the migration gate (UX parity + controller + saves + rules parity)
> npm run export:godot           # rebuild the data bridge Godot reads
> ```
>
> TypeScript remains the **rules oracle** and the authoring / simulation / validation toolchain, and
> `src/i18n/ja.ts` is still the single source of the Japanese copy BOTH runtimes read.

Black Stela is a first-person grid dungeon RPG prototype where players bring
their own adventurers into a dangerous labyrinth beneath an ancient black stela.

The MVP is a small playable loop: register a party at the guild, choose quick
or detailed recruits, import a character portrait, enter a 3D grid dungeon,
trigger a trap and deterministic combat, use a discovered return stair, and
review canonical records from town.

Local AI narration is enabled internally by default, stays local-only, and never
controls player characters.

## Product Direction

Black Stela aims to combine a mechanically real, controller-first DRPG with the
reactivity of a tabletop game master. Players bring authored adventurers into
external scenario packs prepared and validated with AI before play. A hidden
local AI then acts as a bounded realtime game master: it frames
situations, notices established character history, and reacts to confirmed
choices. Deterministic rules remain the only authority over movement, checks,
combat, rewards, and saves. Authored fallback content keeps the game playable
when the local provider is unavailable; it does not replace the realtime GM as
a product goal.

The current MVP has the DRPG and policy foundations, but its AI subsystem is
still an advisory service contract rather than a consequential GM loop. The
bounded concept slice and authority model are defined in
[Black Stela AI Scenario + GM Plan](AIPlan.md). The active Godot migration uses
the separate [AI / Godot migration contract](docs/design/ai-godot-migration-contract.md)
so town, dungeon, combat, and save ports preserve the future GM seam without
putting provider logic in scenes.

## Current MVP

- Town screen with guild registration
- Quick recruits, detailed recruits, and starter party templates
- Player-authored character names, titles, notes, portraits, and party identity
- Class, background, trait, aptitude, role coverage, starting equipment, and roster memory
- Custom portrait import from local image files
- One editable dungeon floor in Markdown with YAML front matter
- First-person Three.js dungeon view
- Deterministic commands for movement, search, listening, combat, shop, equipment, and contextual return
- Contextual return-stair action instead of an always-available return command
- Trap, fixed event, tactical enemy encounter, treasure, shared party gold, and paid recovery
- Town shop for basic consumables and starter equipment
- Equipment that changes combat damage and armor through deterministic rules
- Town records for canonical adventure events
- Internal Ollama-compatible local narration proposal with deterministic fallback
- AI policy guard that rejects player-character speech, player-character action, and game-truth mutation
- Vitest unit coverage and Playwright browser smoke tests
- Tauri v2 desktop shell scaffold
- English/Japanese UI and scenario text
- Scenario pack manifest and validation panel
- LocalStorage and Tauri-oriented save repository boundaries

## Quick Start

Requirements:

- Node.js 22 or newer
- npm
- Rust toolchain with Cargo, for Tauri checks and desktop builds

Install dependencies:

```sh
npm install
```

Run the browser development build:

```sh
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Run the Tauri desktop app during development:

```sh
npm run tauri dev
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build the web frontend |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright browser smoke tests |
| `npm run selfplay:browser` | Run browser self-play through the normal player route |
| `npm run headless:reachability` | Run a deterministic reachability probe |
| `npm run headless:clear` | Legacy alias for `headless:reachability` |
| `npm run headless:combat` | Run deterministic tactical-combat balance probes |
| `npm audit --audit-level=moderate` | Check npm dependency advisories |
| `npm run tauri dev` | Run the Tauri desktop app |
| `cargo check` from `src-tauri/` | Verify the Rust/Tauri shell |

Release and packaging references:

- [Windows build notes](docs/windows-build.md)
- [Release readiness checklist](docs/release-checklist.md)
- [ADR-001: Game events and persistence](docs/decisions/ADR-001-game-events-and-persistence.md)
- [Human Requirement Gate](docs/gates/human-requirement-gate.md)
- [Player-facing red flags](docs/gates/player-facing-red-flags.md)
- [Browser self-play gate](docs/gates/browser-selfplay-gate.md)
- [Screenshot review protocol](docs/gates/screenshot-review.md)
- [Current plan](Plan.md)
- [Current tasks](Tasks.md)
- [Completed modernization task archive](docs/archive/Tasks.completed-modernization.md)

If Playwright browsers are missing, install Chromium once:

```sh
npx playwright install chromium
```

## Project Structure

```text
content/worlds/default/      Editable Markdown/YAML scenario files
src/domain/                  GameState, commands, rules, scenario validation
src/services/                Portrait import, narration, AI policy guard
src/components/              Three.js dungeon renderer
src/debug/                   Debug progress start-state builders
src/headless/                Deterministic reachability probe runner
src/App.tsx                  MVP game UI shell
tests/                       Vitest unit tests
tests/e2e/                   Playwright smoke tests
src-tauri/                   Tauri v2 desktop shell
godot/                       Godot migration runtime; consumes generated JSON
```

## Architecture

> **Full reference:** [`docs/architecture.md`](docs/architecture.md) is the
> single map of how the whole system fits together — the four layer boundaries,
> the command loop, every gameplay subsystem, the simulation oracle, and the
> durable-core-vs-UI line the Godot migration works against. The summary below is
> the elevator version.

Migration implementers should then read the
[full Godot migration plan](docs/design/godot-full-migration-plan.md). Work that
touches the future AI scenario or realtime GM boundary follows the
[AI / Godot migration contract](docs/design/ai-godot-migration-contract.md).

The implementation keeps a hard boundary between scenario truth, deterministic
rules, user interface, and local narration.

- `GameState` is the canonical game state.
- `Command` is the player-selected deterministic action.
- `RulesEngine` applies commands and returns the next state.
- `CharacterCreation` derives guild recruits, templates, coverage, stats, and roster memory.
- `WorldRepository` is represented by Markdown/YAML loading plus Zod validation.
- `PortraitManager` imports local portraits and binds them to characters.
- `DungeonRenderer` renders the first-person grid scene with Three.js.
- `ReplayLog` is the canonical record stream stored in `GameState.log`.
- `NarratorService` can request local Ollama-compatible flavor text.
- `AiPolicyGuard` rejects narration that attempts to speak for PCs, move PCs, or mutate truth.

## Debug and Headless Modes

Debug start mode is enabled with `debug=1` in the URL:

```text
http://127.0.0.1:5173/?debug=1&progress=after_encounter
```

Supported progress values:

| Progress | Start State |
| --- | --- |
| `ready` | Expected debug party in town, no dungeon progress |
| `after_encounter` | Party in B1F room 002, first trap resolved, Ash Slime defeated, 2/3 rooms visited |
| `return_ready` | Party in B1F room 003 with full MVP dungeon progress, ready to return |
| `floor_2`..`floor_8` | Party starts at the first authored room of that floor with expected map and inventory context |

The debug panel shows visited-room map progress and can reload a selected
progress state. Its `Headless reachability` button is debug-only. It runs the
same deterministic reachability probe used by automated checks and applies the
resulting `GameState`.

Run the reachability probe from the terminal:

```sh
npm run headless:reachability
npm run headless:reachability -- --progress after_encounter
npm run headless:reachability -- --progress floor_8
npm run headless:reachability -- --progress return_ready
```

`npm run headless:clear` remains as a legacy alias, but "clear" is not the
intended meaning. This probe checks deterministic reachability from a selected
debug progress state. It does not prove a player-facing clear.

The command prints JSON containing `reachable`, `outcome`, selected progress,
max step budget, command sequence, room-by-room trace, knowledge source, final
phase, return outcome, shared party gold, consumables, loot/reward logs, HP
pressure, visited rooms, defeated enemies, and resolved traps. `engineReason`
keeps the internal runner reason for debugging. It exits non-zero if the probe
gets stuck or exceeds its step limit. You can also pass `--max-steps` when
checking longer routes.

Headless output proves deterministic reachability only. It is not proof that
the player can understand the route, see the enemy, see the map, find a stair,
or enjoy the UX. Browser-visible player proof lives in Playwright, especially:

```sh
npm run test:e2e -- tests/e2e/player-clear.spec.ts
```

That test clears through visible controls only and fails if `Return` appears
before the party reaches a room with a return stair.

## Browser Self-Play

Browser Self-Play is the closest automated equivalent to Codex playing the game
as a normal player. It starts at the title screen, uses visible controls only,
creates a six-person party, enters the dungeon, resolves visible combat, uses
authored stairs and return affordances, returns to town, and checks town
services.

```sh
npm run selfplay:browser
```

The command writes screenshots and route reports to `test-results/selfplay/`:

- `browser-selfplay-report.json`
- `browser-selfplay-report.md`
- title, guild, dungeon, combat, stair/return, post-return town, shop,
  recovery, and Japanese shop/recovery screenshots

Browser Self-Play is a player-facing UX gate. It is not a replacement for unit
tests, full Playwright E2E, screenshot review, or scenario validation.

Economy rules are intentionally conservative for the MVP:

- Returning to town is not a free heal. It only works from authored return
  stairs/seals.
- Recovery is a town service that spends shared party gold and is blocked when
  the party cannot pay.
- Treasure tables and combat rewards update canonical state once; browser tests
  assert visible reward feedback.
- Shops expose authored stock and equipment choices, not a debug/admin editor.

Run tactical-combat balance probes separately:

```sh
npm run headless:combat
```

Combat probes cover authored enemy roles and report injuries, HP pressure, and
clearability. They are balance signals, not proof of player UX.

## Scenario Data

Scenario files live outside the compiled game under:

```text
content/worlds/default/
  world.md
  rules.md
  town.md
  dungeons/b1f.md
  ai_style.md
```

YAML front matter is machine-readable scenario truth. Markdown body text is
human-readable description, lore, and authoring context.

Example room data:

```yaml
---
id: dungeon.b1f
name: B1F - Silent Approach
startRoom: room.b1f.001
rooms:
  - id: room.b1f.001
    name: Silent Stone Chamber
    description: Cold fitted blocks surround the party.
    exits:
      east: room.b1f.002
    doors:
      - east
---
```

Keep exits, traps, enemies, events, and AI permissions in YAML so deterministic
systems can validate them before play.

Authoring references:

- `docs/scenario/authoring.md` - pack structure, debug import, validation gates
- `docs/scenario/first-scenario-bible.md` - current eight-floor scenario intent
- `docs/playtest/first-scenario-notes.md` - manual B1F-B8F review checklist

## AI Policy

The game must remain fully playable when the local narrator is unavailable.

AI may help with:

- Environmental flavor
- NPC reactions
- Rumor variation
- Replay-style log prose
- Soft suggestions that require player approval

AI must not:

- Speak for player characters
- Decide player character actions
- Move the party
- Change game state
- Create exits, items, enemies, traps, secrets, or rewards
- Override scenario rules

AI output is treated as a narration proposal only. It is not canon unless a
future explicit approval flow promotes it, and the current MVP never applies AI
output to `GameState`. The proposed GM lane keeps that safety boundary: AI may
offer only scenario-authorized intents, and deterministic rules apply a
player-confirmed choice.

## Testing

Unit tests cover:

- Scenario schema validation
- Command-to-state transitions
- Recovery instead of irreversible character deletion
- Inventory, equipment, treasure, shared gold, shop, and paid recovery rules
- Debug progress start-state construction
- Headless deterministic reachability probe and room trace
- Tactical combat round resolution and balance probes
- AI narration guard behavior
- Portrait reference binding

E2E tests cover:

- Create party
- Import portrait
- Enter dungeon
- Render a nonblank Three.js canvas on desktop and mobile viewports
- Move into combat
- Resolve combat
- Use a discovered stair to return to town
- Buy, sell, equip, and pay recovery in town
- Browser-visible clear using only player controls
- Tactical combat actor/target/round controls
- View the adventure log
- Debug URL start at an in-progress map state
- Debug-only browser-triggered reachability probe

Run the full current check set:

```sh
npm test
npm run build
npm run headless:reachability
npm run test:e2e
npm audit --audit-level=moderate
(cd src-tauri && cargo check)
```

## Notes

The Tauri build script writes a generated fallback icon at
`src-tauri/icons/icon.png` so `cargo check` works without committing a temporary
asset. Replace it with real application icons before packaging for distribution.

The current frontend bundle includes Three.js directly, so Vite may warn that a
chunk is larger than 500 kB after minification. That is acceptable for the MVP
and can be addressed later with code splitting if needed.

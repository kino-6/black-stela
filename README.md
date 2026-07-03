# Black Stela

Black Stela is a first-person grid dungeon RPG prototype where players bring
their own adventurers into a dangerous labyrinth beneath an ancient black stela.

The MVP is a small playable loop: create a party in town, import a character
portrait, enter a 3D grid dungeon, trigger a trap and a deterministic combat,
return to town, and review the canonical adventure log.

AI is optional, local-only, and never controls player characters.

## Current MVP

- Town screen with party creation
- Player-authored character names and notes
- Custom portrait import from local image files
- One editable dungeon floor in Markdown with YAML front matter
- First-person Three.js dungeon view
- Deterministic commands for movement, search, listening, combat, retreat, and return
- Trap, fixed event, simple enemy encounter, and recovery on return to town
- Adventure log for canonical events
- Optional Ollama-compatible local narration proposal
- AI policy guard that rejects player-character speech, player-character action, and game-truth mutation
- Vitest unit coverage and Playwright browser smoke tests
- Tauri v2 desktop shell scaffold

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
| `npm run headless:clear` | Run a deterministic headless clear simulation |
| `npm audit --audit-level=moderate` | Check npm dependency advisories |
| `npm run tauri dev` | Run the Tauri desktop app |
| `cargo check` from `src-tauri/` | Verify the Rust/Tauri shell |

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
src/headless/                Headless deterministic clear runner
src/App.tsx                  MVP game UI shell
tests/                       Vitest unit tests
tests/e2e/                   Playwright smoke tests
src-tauri/                   Tauri v2 desktop shell
```

## Architecture

The implementation keeps a hard boundary between scenario truth, deterministic
rules, user interface, and optional narration.

- `GameState` is the canonical game state.
- `Command` is the player-selected deterministic action.
- `RulesEngine` applies commands and returns the next state.
- `WorldRepository` is represented by Markdown/YAML loading plus Zod validation.
- `PortraitManager` imports local portraits and binds them to characters.
- `DungeonRenderer` renders the first-person grid scene with Three.js.
- `ReplayLog` is the canonical adventure log stored in `GameState.log`.
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
| `clear_ready` | Party in B1F room 003 with full MVP dungeon progress, ready to return |

The debug panel shows visited-room map progress and can reload a selected
progress state. Its `Headless clear` button runs the same deterministic clear
runner used by automated checks and applies the resulting `GameState`.

Run the headless clear from the terminal:

```sh
npm run headless:clear
npm run headless:clear -- after_encounter
```

The command prints JSON containing the command sequence, final phase, visited
rooms, defeated enemies, and resolved traps. It exits non-zero if the clear
runner gets stuck or exceeds its step limit.

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

## AI Policy

The game must remain fully playable with AI disabled.

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
output to `GameState`.

## Testing

Unit tests cover:

- Scenario schema validation
- Command-to-state transitions
- Recovery instead of irreversible character deletion
- Debug progress start-state construction
- Headless deterministic clear simulation
- AI narration guard behavior
- Portrait reference binding

E2E tests cover:

- Create party
- Import portrait
- Enter dungeon
- Render a nonblank Three.js canvas on desktop and mobile viewports
- Move into combat
- Resolve combat
- Return to town
- View the adventure log
- Debug URL start at an in-progress map state
- Browser-triggered headless clear

Run the full current check set:

```sh
npm test
npm run build
npm run headless:clear
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

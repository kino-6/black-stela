# Black Stela — Architecture Reference

Black Stela is a first-person, grid-based DRPG (dungeon RPG) built as a
TypeScript / React / Three.js app inside a Tauri v2 desktop shell. This document
is the single "how the whole system fits together" map. Per-feature design lives
under `docs/design/`; this file is the layer above them — read it first, then
follow the pointers at the end.

> **Why this doc exists now.** A runtime migration to Godot 4.7.1 is active
> (`docs/design/godot-full-migration-plan.md`). That plan keeps the
> deterministic rules, world packs, save format, and simulation as the oracle and
> rebuilds the player-facing UI. This document draws the exact line between the
> **durable core** (ports / stays authoritative) and the **presentation layer**
> (rebuilt), so the migration has a precise contract to work against.

---

## 1. The four hard boundaries

The codebase keeps four responsibilities strictly separated. Nothing below a
boundary may depend on anything above it.

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION      React components, Three.js renderer,       │  rebuilt on
│  (src/App.tsx,     controller focus, i18n rendering           │  migration
│   components/, ui/)                                            │
├─────────────────────────────────────────────────────────────┤
│  NARRATION         Local Ollama-compatible flavor text,       │  optional,
│  (services/)       gated by the AI policy guard — never canon  │  advisory only
├─────────────────────────────────────────────────────────────┤
│  DETERMINISTIC     GameState + Command + RulesEngine +        │  THE ORACLE
│  RULES (domain/)   every gameplay subsystem                    │  (ports)
├─────────────────────────────────────────────────────────────┤
│  SCENARIO TRUTH    content/worlds/<id>/*.md (YAML front       │  data, engine-
│  (content/, data/) matter), loaded + Zod-validated             │  agnostic
└─────────────────────────────────────────────────────────────┘
```

- **Scenario truth** is authored data, not code. Dungeons, enemies, gear, items,
  shops, quests, per-world cosmology (elements), difficulty (balance knobs), and
  player-facing copy all live in `content/worlds/<id>/`. Source holds *formulas*,
  not *content*. A new scenario should require no code change.
- **Deterministic rules** are the game. Given a `GameState`, a `ScenarioWorld`,
  and a `Command`, the rules produce the next state and the events that describe
  the change. This layer is pure, seedable, and UI-free — it is the layer the
  migration keeps and ports.
- **Narration** is advisory flavor only. It can never speak for a PC, move the
  party, or mutate state; the AI policy guard rejects anything that tries.
- **Presentation** renders state and turns input into `Command`s. It holds no
  authoritative game truth of its own.

---

## 2. The durable core vs. the presentation layer (migration contract)

| Concern | Module(s) | On migration |
| --- | --- | --- |
| Game state shape | `domain/types.ts`, `domain/gameState.ts` | **Port** (authoritative schema) |
| Command dispatch + rules | `domain/rulesEngine.ts`, `domain/commands/*` | **Port** (parity-proven) |
| Determinism / replay log | `domain/replayLog.ts`, `domain/combatLog.ts`, `domain/combatBeatText.ts` | **Port** |
| Content schema + loading | `domain/scenario.ts`, `domain/scenarioPack.ts`, `services/scenarioPackLoader.ts`, `data/worldRegistry.ts` | **Port** (packs are engine-agnostic data) |
| Gameplay subsystems | `domain/economy.ts`, `loot.ts`, `affixes.ts`, `vocations.ts`, `quests.ts`, `leveling.ts`, `combatMath.ts`, `spells.ts`, `status.ts`, `tempo.ts`, `bestiary.ts`, `balance.ts` | **Port** |
| Maps / geometry | `domain/floorMap.ts`, `domain/floorGraph.ts` | **Port** |
| Save format + migrations | `domain/saveData.ts` | **Port** (save-compat is a product invariant) |
| Simulation / balance oracle | `headless/descentSim.ts`, `contentSim.ts`, `headlessRunner.ts` | **Port / keep as cross-engine oracle** |
| Player UI, layout, focus | `App.tsx`, `components/*`, `ui/controllerFocus.ts`, `ui/combatFraming.ts` | **Rebuilt** (Godot `Control`/scenes) |
| 3D dungeon renderer | `components/DungeonView.tsx`, `components/dungeonScene.ts` | **Rebuilt** (Godot 3D scene) |
| Localization data | `i18n/en.ts`, `i18n/ja.ts` + world `copy:` | **Port the data**, re-bind rendering |
| Local narration / bounded GM | `services/narrator*`, `aiPolicyGuard.ts`; target contract in `AIPlan.md` | **Adapt behind an engine-neutral service**; see `docs/design/ai-godot-migration-contract.md` |

The rule of thumb: **anything that decides game truth ports; anything that draws
it is rebuilt.** The regression gates (below) are the parity harness that proves
a port matches.

The AI lane adds one further distinction: generated framing is replaceable
presentation, while an accepted intent and its deterministic consequence are
rules truth. Godot consumes normalized scenario JSON, never source Markdown,
and scenes never call a model provider directly. The migration-ready contract,
M3 preservation checklist, and target module map live in
[`docs/design/ai-godot-migration-contract.md`](design/ai-godot-migration-contract.md);
the product direction remains in [`AIPlan.md`](../AIPlan.md).

---

## 3. Deterministic rules (the domain layer)

### 3.1 The command loop

Everything the player does is a `Command` (a discriminated union in
`domain/types.ts`). The engine has one entry point in two forms:

```ts
resolveCommand(state, world, command): CommandResult   // { state, events }
executeCommand(state, world, command): GameState       // convenience: .state only
```

`resolveCommand` is a `switch` over `command.type` that delegates to a named
handler. Each handler is pure: it takes the current `GameState` (plus whatever
the command carries) and returns a `CommandResult` — the next state and the list
of `GameEvent`s that produced it.

Shared handler plumbing lives in `domain/commandResult.ts` (a leaf module so
handler groups and the dispatcher can share it without a circular import):

- `CommandResult` — `{ state, events }`
- `withEvents(state, events)` — builds the next state and **projects the log from
  the same events** (state and log can never drift)
- `noChange(state)` — a legal no-op (a guard failed, nothing to do)

### 3.2 Command handler modules

The dispatcher in `rulesEngine.ts` stays thin; cohesive handler groups are
extracted into `domain/commands/`:

- `economyCommands.ts` — appraise, lock/favorite, reinforce (the Forge),
  bulk-convert, buy, sell, equip
- `vocationCommands.ts` — change vocation, set combat loadout
- `questCommands.ts` — accept / claim quests

Movement, search/listen, roster/guild lifecycle, and the combat group
(`declare_round` and friends) currently still live inside `rulesEngine.ts`. The
extraction pattern is: move the handler verbatim → import `commandResult` plus
leaf domain modules (none of which import `rulesEngine`, so no cycle) → delegate
from the dispatcher → trim now-unused imports → verify against the full gate.

### 3.3 Determinism and the replay log

- Combat uses seeded RNG (`rollDamage`, target selection, status land-rates),
  so a given state + command always yields the same result. This is what makes
  the headless simulators trustworthy as a balance oracle.
- `GameState.log` is **projected from events**, not written imperatively.
  `withEvents` appends via `replayLog.appendEventLogs`; combat beats are rendered
  by `combatLog.ts` / `combatBeatText.ts`. State and its human-readable record
  come from one source. See `docs/decisions/ADR-001-game-events-and-persistence.md`.

### 3.4 Gameplay subsystems (all data-driven where content allows)

| Module | Responsibility |
| --- | --- |
| `economy.ts` | `getEffectiveCharacterStats` (base + equipment + affix + vocation), inventory add/remove, recovery cost, regen/species helpers |
| `loot.ts` / `affixes.ts` | rare drops, rarity, appraisal fee, dismantle/sell yields, reinforce cost & cap, the affix catalog (flat stats + hp/mp/resist/element/regen/species answers) |
| `vocations.ts` | basic→advanced vocation graph, mastery via XP falloff, adopt/prereq rules, bounded combat loadout |
| `quests.ts` | bounty/delivery progress, kill crediting, claim eligibility |
| `leveling.ts` | XP curve with diminishing returns over the enemy's level (a soft cap, not a hard one); direct XP grants bypass it |
| `combatMath.ts` / `spells.ts` / `status.ts` | evasion/crit/initiative/spell power, spell definitions, status effects (poison/sleep/silence/fear/ward…) |
| `tempo.ts` | auto-explore / auto-battle action selection and safety stops |
| `bestiary.ts` | observed enemy record (no exact hidden HP leak) |
| `balance.ts` | `applyBalance(world)` folds the per-world `threatScalar` / `counterplayBoost` knobs into enemy/counterplay values **once at load** |
| `floorMap.ts` / `floorGraph.ts` | ASCII floor-map format → grid geometry; structural graph used for reachability/gates |
| `characterCreation.ts` | guild recruits, templates, aptitudes, role coverage, class catalog |
| `adventurerVault.ts` | portable adventurers (import/export across runs) |
| `saveData.ts` | `GameStateSchema`, `SaveDataV1`, `LATEST_SAVE_SCHEMA_VERSION`, `migrateSaveData` (a versioned migration chain), `parseSaveData` |

### 3.5 Content externalization

A world is a folder of Markdown files with YAML front matter under
`content/worlds/<id>/`. `domain/scenario.ts` (Zod schemas) parses and validates
them; `domain/scenarioPack.ts` + `services/scenarioPackLoader.ts` assemble a
pack; `data/worldRegistry.ts` globs all worlds; `data/activeWorld.ts` is the
selected-world accessor. A world declares its own:

- **cosmology** — `world.md` `elements:` (e.g. 黒碑 fire/salt/star, 翠碑
  fire/wood/metal). `Element` is a `string`, not a fixed engine union.
- **difficulty** — `world.md` `balance:` knobs, applied by `applyBalance`.
- **voice** — `world.md` `copy:` overrides layered over the i18n dictionary by
  `createWorldTranslator` (same `{var}` interpolation).

Dungeons, enemies, gear, items, shops, and quests are all authored data. The
loader validates cross-references (an enemy id, a target item id, a vocation
prereq) before play, so bad content fails fast rather than at runtime.

---

## 4. Simulation & the balance oracle (`headless/`)

The simulators are built **on the production rules**, not a re-implementation, so
they can't drift from the shipping engine:

- `descentSim.ts` — runs a naive vs. a prepared party policy down the floors to
  measure "how many levels does preparation save?" It uses the real
  `createCombatState` + `declare_round` loop; only encounter planning and gear
  kitting are sim-specific. This is the tuning tool behind the prepare-or-wipe
  difficulty model.
- `contentSim.ts` — a seeded content/economy report over the production loaders
  and rules (reward cadence, conversion profit, coverage).
- `headlessRunner.ts` — deterministic reachability probe (does a route exist?)
  plus the auto-explore runner. Reachability is **not** proof of player UX.

`tests/simParity.test.ts` locks the simulator's fight resolution byte-identical
to an independent production combat loop (IMP-023V). See
`docs/design/sim-parity.md`.

### Deterministic trace fixtures (the migration parity oracle)

`headless/traceFixture.ts` is the cross-runtime parity primitive the Godot /
Babylon comparison rests on (`docs/design/godot-migration-plan.md`, Phase 0). A
**trace** is an initial state, a command sequence, and — after each command — the
emitted events plus a **hash of the resulting state**. `runTrace(world, initial,
commands)` folds the production `resolveCommand` and records each step; the hash
is a deliberately trivial, portable function (canonical JSON → FNV-1a 32-bit) so a
GDScript port can reimplement it byte-for-byte and compare. A candidate runtime
that replays the same commands must reproduce the same events and hashes or it has
drifted. `tests/traceFixture.test.ts` locks this.

**Determinism caveat found while building this (a migration prerequisite):** the
combat engine is deterministic (seeded rolls, deterministic loot ids), but three
places mint `crypto.randomUUID()` during normal play — the adventure-log entry id
(`replayLog.ts`), and character ids (`gameState.ts`, `characterCreation.ts`). The
log is a *derived* projection, so `hashState` excludes it (the semantic content —
events — is compared directly instead), and that alone makes combat traces fully
reproducible. But **before full-play golden traces (any route that mints character
ids) can parity-check across runtimes, id generation must be made
injectable/seedable.** That is a concrete, cheap prerequisite the port should land
first — not a blocker discovered mid-port.

---

## 5. Presentation layer (React / Three.js)

> This is the layer the migration rebuilds. It holds no authoritative truth.

- **`App.tsx`** — the orchestrator: owns React state, the global keyboard/gamepad
  handler, the town/dungeon/combat phase routing, controller-focus rescue, save
  persistence wiring, and localization data flow. (It is large; decomposing it is
  optional under the migration since it is rebuilt.)
- **`components/`** — screen surfaces: `TitleScreen`, `ScenarioPicker`,
  `TownEntryPanel` (the two-level town hub), the service panels (`ShopPanel`,
  `CareerPanel`, `LootPanel`, `WorkshopPanel`, `QuestBoardPanel`, `RecordsPanel`,
  `RecoveryPanel`, `PartyMenuPanel`), the dungeon (`DungeonCockpit`,
  `DungeonView` + `dungeonScene.ts`, `DungeonCommandDock`, `MapPanel`/
  `FloorMapOverlay`), and combat (`CombatCockpit`, `CombatEnemyStage`,
  `CombatCommandMenu`/`CombatCommandDock`, `CombatPartyStrip`, `CombatLog`,
  `CombatResultPanel`, `CharacterPresence`).
- **`ui/`** — presentation helpers that are *not* React: `controllerFocus.ts`
  (the focus ring + directional navigation that makes the app controller-first),
  `combatFraming.ts` / `spriteMetrics.ts` / `enemyGroupPresentation.ts` (how
  enemies are grounded and sized on the combat stage — the engine owns size, art
  is never re-ordered), `catalog.ts` (localized name/description lookups),
  `artAssets.ts` (asset URLs + placeholders), `characterVisual.ts` / `portrait`.
- **`i18n/`** — `en.ts` / `ja.ts` dictionaries + `createWorldTranslator`.

### Controller-first UI

The app must be fully operable by keyboard/gamepad with **no pointer**. Every
interactive surface is a controller surface (`data-controller-active` /
`data-controller-surface`); always-present chrome is `data-controller-chrome`.
In the dungeon, arrows/WASD drive movement (they are not focus keys), so command
docks are reached via auto-focus + dedicated keys rather than arrow traversal.
See the `controller-first-ui` skill.

---

## 6. Services

- `portraitManager.ts` — imports local portrait images, binds them to characters.
- `narratorService.ts` / `narratorProvider.ts` / `providers/` — request local
  Ollama-compatible flavor text with a deterministic fallback; the game is fully
  playable with the narrator absent.
- `aiPolicyGuard.ts` — rejects any narration that speaks for a PC, moves the
  party, or mutates truth. AI output is a *proposal*, never canon.
- `saveRepository.ts` — LocalStorage / Tauri-oriented persistence boundary,
  using the `saveData` DTO + migrations.
- `scenarioPackLoader.ts` — assembles and validates a world pack.
- `settingsRepository.ts` / `aiSettings.ts` — persisted settings.

---

## 7. The gate system (the safety net)

The one command that tells the truth:

```sh
npm run gate:final     # FINAL_GATE=1 playwright test — strips any test.fail() marker
```

- `npm run build` (`tsc -b`) is the real typecheck. `npm run test` (Vitest) is
  the unit suite (~447 tests). `gate:final` runs the full Playwright e2e (~132)
  with `test.fail()` markers stripped, so a known gap can't hide as an "expected
  failure." A green `test:e2e` is **not** a green gate.
- **Teeth-proven** is the standard: a regression gate must be shown to *fail*
  without the fix (revert → confirm red → restore), or it isn't a lock. See
  `docs/gates/past-trouble-regression-gate.md` for the record of every shipped
  bug and the assertion that now blocks it.
- Headless/unit determinism proves *reachability and rules*; Playwright + the
  screenshot review prove *player-visible UX*. Both are required.
- **Load caveat:** the heavy WebGL / expedition e2e tests can time out under CPU
  contention. Never run `build`/`vitest` concurrently with a background
  `gate:final`; re-run a suspected failure `--workers=1` before treating it as a
  regression.

Gate references live in `docs/gates/`; the review skills in `.claude/skills/` and
`docs/skills/`.

---

## 8. A command, end to end

A worked example — the player steps forward into a fight:

1. **Input.** `App.tsx`'s key handler sees `ArrowUp`/`w` in the dungeon phase and
   dispatches `run({ type: "move_forward" })`.
2. **Rules.** `resolveCommand(state, world, { type: "move_forward" })` moves the
   party; entering a room with an encounter transitions `phase` to `combat` and
   builds the combat state. It returns `{ state, events }`.
3. **Log projection.** `withEvents` appends the events to `state.log` via
   `appendEventLogs` — the record is derived, not hand-written.
4. **Render.** React re-renders from the new `state`: `CombatCockpit` shows the
   enemy stage (sized/grounded by `combatFraming`), the command menu, and the
   party strip. Controller focus lands on the first actor's command.
5. **Persist.** The save effect writes the new state through `saveRepository`
   using the `saveData` DTO.

No UI code computed damage or decided the encounter; it only rendered the result
and offered the next `Command`. That is why the rules layer can be lifted into a
different engine while the UI is rebuilt.

---

## 9. Directory map

```text
content/worlds/<id>/     Authored scenario data (world/dungeons/enemies/gear/
                         items/shops/quests/vocations/affixes + cosmology,
                         balance, copy). Engine-agnostic.
src/domain/              GameState, Command, RulesEngine + commands/, and every
                         gameplay subsystem. The deterministic core (the oracle).
src/domain/commands/     Extracted cohesive command-handler groups.
src/headless/            Simulators + reachability probe, built on production rules.
src/data/                World registry + active-world accessor + default world.
src/services/            Portrait, narrator + AI policy guard, save repo, pack loader.
src/ui/                  Non-React presentation helpers (controller focus, combat
                         framing, catalog, art assets).
src/components/          React screens + the Three.js dungeon renderer.
src/i18n/                en/ja dictionaries + world-copy translator.
src/App.tsx              Presentation orchestrator (state, input, phase routing).
src/debug/               Debug start-state builders (debug=1&progress=…).
tests/ , tests/e2e/      Vitest unit suite + Playwright e2e gates.
src-tauri/               Tauri v2 desktop shell.
docs/                    Design docs, gates, decisions, skills, handoffs, archive.
```

---

## 10. Where to go next

- **Orientation for an agent:** `CLAUDE.md` → the open-work memory it points to.
- **The rules both agents must follow:** `AGENTS.md`.
- **Difficulty model & the two world knobs:** `.claude/skills/drpg-balance`,
  `docs/design/dungeon-areas.md`, `docs/design/verdant-areas.md`.
- **Combat screen:** `.claude/skills/combat-ui-drpg`,
  `docs/design/combat-stage-plan.md`, `docs/design/combat-ui-redesign.md`.
- **Controller-first UI + writing gates that can fail:**
  `.claude/skills/controller-first-ui`.
- **Authoring a world:** `.claude/skills/drpg-scenario`,
  `docs/scenario/authoring.md`, `docs/scenario/first-scenario-bible.md`.
- **Events & persistence rationale:**
  `docs/decisions/ADR-001-game-events-and-persistence.md`.
- **Rare loot / vocations / quests / sim parity:** `docs/design/rare-loot.md`,
  `vocation-mastery.md`, `growth-and-quests.md`, `sim-parity.md`.
- **The migration question:** `docs/design/godot-migration-plan.md`.
```

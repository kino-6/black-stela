# Black Stela — where we are, and what is next

**This file is the single answer to "where are we".** If something matters to the current state of the
project it is written here or linked from here in one hop. Anything not reachable from this page is
either an authority document (below) or archived.

Last updated: 2026-07-20.

---

## 1. What the game is right now

A first-person grid DRPG. **Godot 4.7.1 / GDScript is the player runtime**; TypeScript is the rules
ORACLE and the authoring/simulation toolchain. The React app still exists in `src/` as the UX reference
the port is measured against — it is not the game any more.

The full loop runs in Godot: Title → scenario picker → guild (five registration steps) → town (nine
counters) → first-person dungeon → combat → result → town, with saves, quests, loot, the forge, vocations
and records.

## 2. The commands that tell the truth

```sh
npm run gate:migration   # UX parity + assets + controller gates + rules parity   ← the migration gate
npm run test             # 512 TypeScript unit tests (the rules oracle)
npm run build            # tsc -b — the real typecheck
npm run export:godot     # re-export packs/traces/engine data after ANY rules change
```

`gate:migration` runs, in order: `gate:ux-parity` (contracts DERIVED from the React panels, not
hand-written) → `verify_assets` → `verify_town_controller` → `verify_guild_controller` →
`verify_front_controller` → `verify_character_creation` → `verify_save` → `verify_parity`.

Evidence screenshots: `godot --path godot/ --script res://tests/capture_ux_evidence.gd`
(**never with `--headless`** — headless has no render viewport and every shot comes out null).

## 3. Status — honest

| Gate | State |
| --- | --- |
| Rules parity (TS ↔ Godot) | **33/33 routes**, byte-for-byte |
| UX parity | **26 of 27 screens** — one red, see below |
| Controller gates (town / guild / front door) | pass |
| Assets, save round-trip, character creation | pass |
| TypeScript unit | 512 pass |

**The one red screen: the title's language switch** (`locale.label` / `locale.ja` / `locale.en`). React
offers Japanese/English; Godot exports `ja` only and ~33 UI strings are still hardcoded Japanese, so a
toggle would half-translate the game. Deferred by decision as its own slice — see §5.

## 4. Active work — the class system

Authority: **[`docs/design/class-system.md`](docs/design/class-system.md)** (its Section 8 sets the
order; do not reorder it). Supporting: [`docs/design/vocation-mastery.md`](docs/design/vocation-mastery.md),
`AGENTS.md` "Class, Ability, and Party-Coverage Rules".

The finding it exists to fix: twelve class labels standing on **four** abilities and a list of
`roleTags`, exactly one of which any rule ever read.

| Section 8 item | State |
| --- | --- |
| 1. TypeScript rules and data | **done** — `src/domain/techniques.ts` (a model that can hold heal / cure / ward / buff / debuff / scope / duration / non-MP cost), `src/domain/classCapabilities.ts` (the class contract: techniques, exploration proficiency, equipment shape, row, stated weakness), `spells.ts` reduced to a derived legacy view. Behaviour unchanged, pinned by `tests/classCapabilities.test.ts`. |
| 2. Deterministic commands | **done** — `src/domain/exploration.ts` + `godot/scripts/rules/exploration.gd`. An attempt names its actor; a declared actor is obeyed, an automatic pick is reported AS automatic, and the event carries actor / action / proficiency / difficulty band / item spent. Items can buy an attempt (`ScenarioItem.explorationAid`). `tests/explorationAttempts.test.ts`. |
| **3. Class consolidation & vocation semantics** | **NEXT.** Target classes, deliberate id migration, and the split of permanent starting discipline / mastered history / active focus — with a versioned save migration and a documented mapping. Nothing may be silently remapped. |
| 4. Content and balance | not started — author the item alternatives and technique families, then simulate specialist / secondary / item-only / no-coverage parties. |
| 5. Godot parity | partly ahead of schedule: item 2 was ported in its own slice to keep the golden traces honest. The rest follows item 3. |
| 6. Player surface (the guild) | last, and only once the above is green. |

Also open in the rules, deliberately deferred to item 4: **room traps, locks and secrets have no skill
check at all today.** Wiring proficiency into them changes difficulty, so it belongs with the balance
pass, not with the plumbing.

## 5. Known gaps (each with a reason, not a shrug)

- **Localization slice** — the language switch above. Needs: export `en` alongside `ja`, a runtime locale
  in `scripts/i18n.gd`, ~33 hardcoded Japanese strings turned into keys, and catalog-name resolution
  taking a locale. Until then the title stays honestly 3 keys red.
- **Floor names render in English** ("B1F - Silent Approach") because no dungeon in either world authors
  `locales.ja`. React does the same — a content gap, not a port regression. Wants authoring.
- **`godot/tests/verify_flow.gd` fails** (expects an `encounter_started` that the route no longer
  produces) and has since before the ①–⑤ fix series. It is NOT in `gate:migration`. **Decide: repair or
  retire.**
- **Desktop bundle verification** — needs a desktop toolchain on macOS + Windows;
  [`docs/desktop-productization.md`](docs/desktop-productization.md).
- **Live-LLM narration** — the whole ops layer is built and mock-tested; needs a real local provider.
  [`AIPlan.md`](AIPlan.md) + [`docs/design/ai-godot-migration-contract.md`](docs/design/ai-godot-migration-contract.md).

## 6. Where the durable knowledge lives (the whole list)

Read these; everything else is archived.

| Document | What it decides |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | The non-negotiable product / controller / Japanese / gate rules for both agents. |
| [`CLAUDE.md`](CLAUDE.md) | Session orientation: what to read first. |
| [`docs/architecture.md`](docs/architecture.md) | Layer boundaries, the command loop, the durable-core-vs-UI line. |
| [`docs/design/class-system.md`](docs/design/class-system.md) | **Active** — the class/ability/coverage authority (§4 above). |
| [`docs/design/godot-full-migration-plan.md`](docs/design/godot-full-migration-plan.md) | The migration record: M0–M7, all done, plus the verification strategy still in use. |
| [`docs/design/ai-godot-migration-contract.md`](docs/design/ai-godot-migration-contract.md) | The AI/narration seam the runtime must keep. |
| [`docs/gates/past-trouble-regression-gate.md`](docs/gates/past-trouble-regression-gate.md) | Every bug that shipped, and the assertion that now blocks it. Read before player-facing work. |
| [`Improve.md`](Improve.md) | Codex-owned capability backlog. Claude does not edit it. |
| [`AIPlan.md`](AIPlan.md) / [`Art.md`](Art.md) | Codex-owned: AI product direction, art direction and asset contracts. |
| `content/worlds/<id>/` | Dungeons, enemies, gear, items, quests, cosmology, balance knobs and voice — **all authored data**. A new scenario should need no code change. |
| `.claude/skills/` | Deep how-to: `drpg-balance`, `controller-first-ui`, `combat-ui-drpg`, `drpg-scenario`. |
| `docs/design/` (rest) | Per-subsystem references: dungeon/verdant areas, growth-and-quests, rare-loot, scenario-switching, sim-parity, content-gate, vocation-mastery. |
| [`docs/archive/`](docs/archive/) | Everything completed or superseded, including the React-era plans. |

## 7. How the two agents split work

- **Claude Code** — rules, state, screens, controller focus, localization data flow, content authoring,
  balance, and the gates.
- **Codex** — art direction, image generation, asset contracts, pack placement, and independent
  browser-visible review. The implementer does not self-approve player-facing visual completion.

## 8. Standing rules (learned the hard way)

- **Check the branch before committing** (`git branch --show-current`), and verify a push against the
  remote itself (`git ls-remote origin main`), never the possibly-stale local ref.
- **Verifying a player-facing change is the implementer's job, as they work** — never a task queued for
  the user, and never "headless proved it".
- **Commit / push / merge only when asked.** Messages end with the Co-Authored-By trailer.
- **A rules change is not finished until `npm run export:godot` has run and parity is green again** — the
  oracle and the runtime must not tell different stories, even for one commit.
- **Do not hand-write a gate's pass condition.** Derive it from the thing being replaced; a contract
  authored by the same understanding that wrote the screen certifies its own blind spots.

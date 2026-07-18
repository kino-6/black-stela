# Claude Code — entry point & orientation

Black Stela is a first-person grid DRPG (TypeScript / React / Three.js / Tauri). This file gets a
fresh session oriented fast. Read it, then the two links under "Start here" — you do not need to
re-read conversation history.

## Start here (in order)

1. **`~/.claude/.../memory/black-stela-open-work.md`** — the live project state: what just shipped,
   what's next, and the traps this codebase sets. Your auto-loaded memory index (`MEMORY.md`) lists
   the rest. This is the single source of "where are we."
2. **`AGENTS.md`** — the canonical product / controller / gameplay / Japanese / Gate / external-
   action rules for both agents. Non-negotiable. Do not weaken or duplicate them elsewhere.

## The one command that tells the truth

```sh
npm run gate:final        # 367+ unit + 109+ e2e. NOT `npm run test:e2e`.
```

`gate:final` (`FINAL_GATE=1`) strips any `test.fail()` marker, so a known gap cannot hide behind
Playwright reporting an expected failure as a pass. A green `test:e2e` is **not** a green gate.
Also: `npm run build` (tsc -b) is the real typecheck; `npm run test` is the unit suite.

## Where durable state lives (so you needn't hold it in context)

- **Architecture** (`docs/architecture.md`) — the single map of how the whole system fits together:
  the four layer boundaries, the command loop, every gameplay subsystem, the simulation oracle, and
  the durable-core-vs-UI line the Godot migration works against. Read it before structural work.
- **Skills** (`.claude/skills/`) — deep, current know-how. Load the one that fits:
  `drpg-balance` (the prepare-or-wipe difficulty model + the two world.md knobs),
  `controller-first-ui` (keyboard/gamepad UI + gates that can fail),
  `combat-ui-drpg` (the combat screen), `drpg-scenario` (building a world; world-owned copy).
- **Design docs** (`docs/design/`) — `dungeon-areas.md` / `verdant-areas.md` (the 3-act curve),
  `growth-and-quests.md` (Q1 growth items + Q2 quest board both done), `combat-stage-plan.md`.
- **Gates** (`docs/gates/`) — `past-trouble-regression-gate.md` is the record of every bug that
  shipped and the assertion that now blocks it. Read it before player-facing work.
- **Content is data** (`content/worlds/<id>/`) — dungeons, enemies, gear, items, and per-world
  cosmology (`world.md` `elements:`), difficulty (`balance:`), and voice (`copy:`) are ALL authored
  here. Source holds formulas only. A new scenario should need no code change.

## Current state (2026-07-16)

B3 (party menu + real aptitudes) is done. The 5-slice elemental balance is done — **a naive party
wipes; a prepared one clears ~10 levels lower**; tune via the `world.md` `balance:` knobs, not per
enemy. The growth/quest slices are done: **Q1 (growth items) and Q2 (the quest board)** — quests are
authored data in `content/worlds/<id>/quests.md`. **Codex's IMP-018..020 (character presence) is
merged**, and the **combat enemy-stage OVERLAY** is done — the HUD is translucent overlays floating
over a full-frame stage (share 36%→71% at 720p; the command menu overlays only while choosing, the
creatures own the screen during playback). Next pre-balance item: **combat FEEL**.
`black-stela-open-work` has the detail.

## How the two agents split work

- **Claude Code** — React/state/layout, controller focus, renderer wiring, localization data flow,
  content authoring, balance, and the E2E gates.
- **Codex** — art direction, image generation/retakes, asset contracts, pack placement, and
  independent browser-visible review. The primary implementer does **not** self-approve player-
  facing visual/controller completion; that handoff is the other agent's.

## Operational rules (learned the hard way)

- **Check your branch before committing** (`git branch --show-current`) and verify a push against
  the remote itself (`git ls-remote origin main`), not the possibly-stale `origin/main` ref. A whole
  session's work once landed on the wrong branch while "pushed to main" was reported — falsely.
- **Verifying a player-facing change in a real browser is YOUR job**, done as you work — never a
  task queued for the user. Do not put "user real-play approval" on a checklist; the user reviews
  continuously and raises what's wrong.
- **Commit / push / merge only when asked.** Commit messages end with the Co-Authored-By trailer.

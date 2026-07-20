# Black Stela — where we are

The single answer to "where are we". Rules live in [`AGENTS.md`](AGENTS.md), orientation in
[`CLAUDE.md`](CLAUDE.md), design in the linked authorities. This page only tracks STATE.

Updated 2026-07-20.

## Runtime

**Godot 4.7.1 / GDScript is the game.** TypeScript is the rules oracle + authoring toolchain; React
(`src/`) is the UX reference the port is measured against, not the product.

## Truth

```sh
npm run gate:migration   # ux-parity → assets → controller gates → parity → flow
npm run test             # 515 unit (the oracle)
npm run build            # tsc -b
npm run export:godot     # after ANY rules change, then re-check parity
```

Screenshots: `godot --path godot/ --script res://tests/capture_ux_evidence.gd` — **never `--headless`**.

## Status

- [x] Migration M0–M7 — see [migration record](docs/design/godot-full-migration-plan.md)
- [x] Rules parity 33/33 · flow · assets · save · character creation
- [x] Controller gates: town · guild · front door
- [x] TypeScript unit 515
- [ ] UX parity **26/27** — the title's language switch (see gaps)

## Active: class system

Authority: [`docs/design/class-system.md`](docs/design/class-system.md) §8 (keep its order).
Supporting: [vocation mastery](docs/design/vocation-mastery.md), AGENTS.md class rules.

- [x] 1 — rules & data: `techniques.ts`, `classCapabilities.ts`, `spells.ts` as a derived view
- [x] 2 — deterministic commands: `exploration.ts` + `exploration.gd`, attempts name their actor
- [x] 3 — consolidation: 12 ids → **8 classes**, old ids resolved (never rewritten), permanent
      `startingDiscipline`, reclass no longer confiscates gear. Ported to Godot in the same slice.
- [ ] **4 — content & balance** ← next. Item alternatives, technique families, varied-party simulation.
      Also picks up: room traps / locks / secrets have no skill check yet, and the INTERIM advanced-vocation
      prerequisites below.
- [ ] 5 — Godot parity for the rest (items 2 and 3 already ported)
- [ ] 6 — **the guild surface, last** — a queued redesign brief exists (staged ceremony, 3+3 preview,
      class promise legible, no coverage scoring). Blocked until 4 and 5 are green.

### Interim, awaiting your redesign

Advanced vocations required mastering a PAIR of old classes; several pairs collapsed to one class under
the mapping, so they are re-paired with an adjacent discipline to keep the graph legal. Scaffolding, not
design. The two that had to change: 灰の刃/茨砕き (was 先鋒+傭兵) and 塵の斥候/樹冠読み (was 探索者+斥候).
Alternative considered: a single mastered discipline plus a level floor.

## Gaps

- [ ] **Localization** — export `en`, runtime locale in `i18n.gd`, ~33 hardcoded JA strings → keys,
      locale-aware catalog names. Until then the title is honestly 3 keys red.
- [ ] **Adventurer art still ships under the twelve old class names** — the portrait fallback collapses
      eight classes onto three faces until Codex re-cuts the masters.
- [ ] **Floor names are English** — no dungeon authors `locales.ja`; React does the same. Content.
- [ ] **Desktop bundle** — needs a macOS + Windows toolchain: [steps](docs/desktop-productization.md)
- [ ] **Live-LLM narration** — ops layer done, needs a provider: [AIPlan](AIPlan.md) ·
      [seam](docs/design/ai-godot-migration-contract.md)

## Map

| Where | What |
| --- | --- |
| [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) | The rules, and what to read first |
| [architecture.md](docs/architecture.md) | Layers, command loop, core-vs-UI line |
| [class-system.md](docs/design/class-system.md) | **Active** design authority |
| [past-trouble-regression-gate.md](docs/gates/past-trouble-regression-gate.md) | Every shipped bug + its assertion |
| [Improve.md](Improve.md) · [AIPlan.md](AIPlan.md) · [Art.md](Art.md) | Codex-owned; Claude does not edit |
| `content/worlds/<id>/` | All authored data — a new scenario needs no code |
| `.claude/skills/` | drpg-balance · controller-first-ui · combat-ui-drpg · drpg-scenario |
| `docs/design/` · [`docs/archive/`](docs/archive/) | Live references · everything superseded |

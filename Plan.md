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
npm run test             # 512 unit (the oracle)
npm run build            # tsc -b
npm run export:godot     # after ANY rules change, then re-check parity
```

Screenshots: `godot --path godot/ --script res://tests/capture_ux_evidence.gd` — **never `--headless`**.

## Status

- [x] Migration M0–M7 — see [migration record](docs/design/godot-full-migration-plan.md)
- [x] Rules parity 33/33 · flow · assets · save · character creation
- [x] Controller gates: town · guild · front door
- [x] TypeScript unit 512
- [ ] UX parity **26/27** — the title's language switch (see gaps)

## Active: class system

Authority: [`docs/design/class-system.md`](docs/design/class-system.md) §8 (keep its order).
Supporting: [vocation mastery](docs/design/vocation-mastery.md), AGENTS.md class rules.

- [x] 1 — rules & data: `techniques.ts`, `classCapabilities.ts`, `spells.ts` as a derived view
- [x] 2 — deterministic commands: `exploration.ts` + `exploration.gd`, attempts name their actor
- [ ] **3 — class consolidation & vocation semantics** ← next (needs a versioned save migration)
- [ ] 4 — content & balance (also picks up: room traps / locks / secrets have no check yet)
- [ ] 5 — Godot parity for the rest (item 2 already ported)
- [ ] 6 — the guild surface, last

## Gaps

- [ ] **Localization** — export `en`, runtime locale in `i18n.gd`, ~33 hardcoded JA strings → keys,
      locale-aware catalog names. Until then the title is honestly 3 keys red.
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

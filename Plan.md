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

Authority: [`docs/design/class-system.md`](docs/design/class-system.md) — remediation order in **§9**
(Codex added an advanced-vocation §7 on 2026-07-20, so the old §8.n numbering in commit messages is now
§9.n). Supporting: [vocation mastery](docs/design/vocation-mastery.md), AGENTS.md class rules.

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

## Queued: advanced vocations (§7)

Codex's brief, 2026-07-20. An advanced vocation is **a new way to play, not a bigger stat line**: each
needs one signature MECHANISM, 2–4 exclusive techniques that use it, and a clear bridge between two (or
rarely three) mastered disciplines. Two-discipline is the main destination; three-discipline is a rare
capstone. Only vocations with real rules ship — never the full 28 pairs — and basic classes stay viable,
never gated behind an advanced one. Changing vocation must not cost level, learned techniques,
exploration proficiency or legitimately worn gear; power is bounded by the loadout, costs and one active
signature, never by deleting what was learned.

Split into three tasks, in this order:

- [ ] **7A — design & rules**: audit which current advanced vocations have any mechanic at all (a stat
      modifier and a signature sentence is NOT implemented), choose the pairs worth authoring, put
      prerequisites in world data, and verify no single class is a prerequisite for everything.
      **Replaces the interim prerequisites below.** Depends on 4 (the technique model must carry
      signatures, durations, buffs/debuffs and exploration effects first).
- [ ] **7B — techniques**: the 2–4 exclusive techniques per adopted vocation, with deterministic tests
      that each one actually changes a combat or exploration OUTCOME. Depends on 7A.
- [ ] **7C — art**: portraits / signature art for the adopted vocations (Codex, as P21). Depends on 7A's
      final list; independent of 7B.

Proof required before it is done: a vocation-change trace and a save migration showing level, learned
techniques, prior proficiency and worn gear all survive; TS traces green before any Godot parity work;
guild presentation last.

### Interim, replaced by 7A

Advanced vocations required mastering a PAIR of old classes; several pairs collapsed to one class under
the mapping, so they are re-paired with an adjacent discipline to keep the graph legal. Scaffolding, not
design. The two that had to change: 灰の刃/茨砕き (was 先鋒+傭兵) and 塵の斥候/樹冠読み (was 探索者+斥候).
Alternative considered: a single mastered discipline plus a level floor.

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

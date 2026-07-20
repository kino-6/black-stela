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

## Class system — DONE (§9.1–§9.6)

All six remediation items are green. Authority: [`docs/design/class-system.md`](docs/design/class-system.md) — order in **§9**
(Codex added an advanced-vocation §7 on 2026-07-20, so the old §8.n numbering in commit messages is now
§9.n). Supporting: [vocation mastery](docs/design/vocation-mastery.md), AGENTS.md class rules.

- [x] 1 — rules & data: `techniques.ts`, `classCapabilities.ts`, `spells.ts` as a derived view
- [x] 2 — deterministic commands: `exploration.ts` + `exploration.gd`, attempts name their actor
- [x] 3 — consolidation: 12 ids → **8 classes**, old ids resolved (never rewritten), permanent
      `startingDiscipline`, reclass no longer confiscates gear. Ported to Godot in the same slice.
- [x] **4 — content & balance.** All five parts done (4a–4e below). Run `npm run sim:coverage` to see
      the varied-party table any balance change moves.
  - [x] **4a — the resolver learned the wide model.** It understood only heal/damage/status, so
        `toLegacySpell` DROPPED cure/ward/buff/debuff, multi-effect and party scope: a class granted one
        silently learned nothing. Now: `combatEffects.ts` (wards/buffs/debuffs live on `CombatState`, never
        on `Character`, so nothing rides home in a save), every target scope, and the first member of each
        family — `purge` (priest), `ward-hymn` + `battle-hymn` (chanter), `sunder` (occultist).
        Browser-verified; `tests/techniqueFamilies.test.ts` + `tests/e2e/technique-families.spec.ts`.
  - [x] **4b — the growth lines, and the four mechanics they needed.** Every class now has **six**
        techniques (2+ at creation); six, not more, because `LOADOUT_LIMIT` is 6 and the default loadout
        takes the six LOWEST levels — a seventh would be a capstone the player never sees. Knight and
        Swordmaster went from **zero** techniques to full lines. Built first, because authoring onto them
        would have shipped no-ops: **cover** (new effect; enemy BASIC attacks hit the Knight — abilities
        deliberately still get through), **enemy fear / silence / poison** (only `sleep` was ever read on
        a pack, so 2/3 of §5's occult promise did nothing), and the **drain** rule (a heal on an
        enemy-scope technique restores the caster). Two §5 corrections: the Occultist no longer carries
        the Mage's `firebolt`, the Chanter heals with its own weaker `lesser-heal`.
        Also fixed a shipped bug this exposed — **levelling never taught anything** to a character with a
        stored vocation (`learned` was only written on a vocation CHANGE), so a level 9 Knight would
        never receive `cover`. Ported to `godot/scripts/rules/vocations.gd` to keep parity green.
        `tests/techniqueLines.test.ts` + browser gate; falsified.
  - [x] **4c — item alternatives.** All five authored in BOTH worlds, and stocked (authored-but-unstocked
        is authored-but-unreachable). Design: **items cast TECHNIQUES** (`useTechnique`), resolved by the
        same applier a class uses, so the item route can never drift from the class route. Two rules were
        missing, not just data: `explorationAid` was absent from the LOADER SCHEMA, so an authored tool
        was silently stripped and did nothing; and `use_item` had no enemy-target path at all. Verdant
        also had **no cure and no focus item whatsoever** — a poisoned party there had no answer.
        Browser-verified (`items-4c.spec.ts`, falsified) plus `itemAlternatives.test.ts`.
  - [x] **4d — room traps / secrets are attempts.** All three were unconditional: the room trap fired on
        entry with no roll (so searching and disarming bought NOTHING — it sprang either way),
        `disarmTrap()` always succeeded, `search()` auto-revealed. The authored `detectDc` on every trap
        on every floor was read by nothing. Now: a known trap is stepped around, an unknown one gets a
        passive reflex check, disarm can fail (leaving it ARMED, never springing — springing would make
        trying strictly worse than ignoring), and secrets are `detectSecret` attempts. Detection is
        **retryable and turn-seeded on purpose**: a one-shot roll would lock a party out of authored
        content forever (the b7f ash-vault cache sits behind such a wall), so the specialist finds it
        SOONER rather than being the only one who can. Ported to Godot; parity green.
        `roomHazards.test.ts`, falsified against both mechanics.
  - [x] **4e — varied-party simulation, and the tuning it drove.** New `coverageSim.ts` +
        `npm run sim:coverage`. It could not be an axis added to `descentSim`, which only ever issues
        `attack` — a Priest and a Warrior are the same party there — so it also needed TACTICS (actors
        that heal, ward and throw what they carry). Measures recovery / ward / traps at four coverage
        levels. Result: **every row resolves (no class compulsory) and the specialist wins every axis**;
        the item route works, costs 360–760 gold, and runs out. Locked in `coverageSim.test.ts`
        (ordering, not magic numbers), falsified.
        **Tuning it drove:** the world inflicted only poison + fear, so `sleep`/`silence` were never
        applied by anything and the whole ward line had nothing to stop — added silence (Ash Caller),
        sleep (Lantern Ward) and fear (Oath Cutter); `blessing` measured WORSE THAN NO WARD (a turn
        spent for too little), raised 15→20/25; `ward-hymn` 25→35; healing items 6/14→11/24 (95 gold of
        potions bought zero extra fights); **`successChance` weighted difficulty 1 against skill 3**, so
        an authored DC was decoration and an untrained party disarmed 4/4 traps — difficulty now weighs
        the same as skill; Verdant had **no room traps at all** (its one trap is on a chest) — three
        authored, one per act.
  - Also still open: the INTERIM advanced-vocation prerequisites below (7A's job).
- [x] **5 — Godot parity.** The combat effect model is ported (`combat_effects.gd` + a rewritten cast
      path reading the exported CATALOG), and — the part that mattered — a `technique-families` parity
      trace now casts a ward, a party buff, an enemy debuff, a cure, cover, a drain, a group spell and
      two items-that-cast. **Proven, not assumed:** with the port deliberately regressed, the old
      `combat-actions` trace still passes 4/4 while the new one fails 3 steps.
      **Five hardcoded tables deleted** (§9.5's "remove class-specific hard-coded lists"): a four-spell
      `SPELLS` dict the loadout filtered against — so a Knight's whole line was silently dropped and
      `cover` did nothing — plus copies of the cost table, the label map (twice) and `SKILL_IDS`, which
      filed every 特技 authored after it under 呪文. The technique label map is exported now, so the
      scenes cannot fall behind the rules again. Godot's combat UI also had the React bug and worse:
      `_stage = "target-ally" if spell_id == "heal" else "target-group"` meant every ally-target
      technique except `heal` asked for an enemy and then healed nobody. Targeting is derived from the
      technique's declared scope. Screenshot evidence: `godot/tests/_technique_menu.png`.
- [x] **6 — the guild surface.** The staged ceremony (説明→職業→来歴→能力→名前), the 3+3 preview and the
      no-coverage-scoring rebuild already existed from the migration; what §9.6 still wanted was the
      **class promise made legible**, and after §9.4 that means what a calling can DO. The class step
      stated what a class WAS — row, aptitudes, starting gear — and never what it could do. It now reads
      **いま使える技 / のちに覚える技（Lv付き）/ 探索 / 弱み**, all from the exported catalog (§9.5 deleted
      five GDScript literals that had fallen behind the rules; a guild listing techniques from memory
      would be the sixth). §9.6's PROHIBITIONS are asserted, not trusted: `verify_guild_controller.gd`
      reads the rendered text of every step and fails on an English class alias, a raw capability tag or
      any coverage score. Both new gates falsified. Evidence: `godot/tests/_guild_class.png`.

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

- [ ] **Five React E2E specs are stale, not broken code** — `career.spec` still adopts `sellsword`, a
      class id the §9.3 consolidation removed; plus two `character-creation` specs, `codex-capability-
      verification` and `japanese-line-layout`. They fail identically on an unmodified tree, so
      `gate:final` has a standing red that is not a regression. Either update them to the eight-class
      roster or retire them as React-reference-only. Until then `gate:migration` is the honest truth.
- [ ] **The debug start is always level 1**, even `progress=floor_8`, so anything learned above level 1
      was unreachable in the browser. §9.4 added an opt-in `&level=N` (and `&items=a,b`); the presets
      themselves still lie.
- [ ] **Nobody can choose WHO searches or disarms a room trap** — the rules carry `characterId` on both
      commands (§9.4d) and both runtimes submit neither, so `resolveAttempt` auto-picks the ablest hand
      and records `selection: "automatic"`. Honest, but §8.2 wants the player to see who took the risk,
      as chests already do. Player-surface work, so it belongs with item 6.
- [ ] **Verdant does not discriminate on recovery** — all four coverage levels survive the sim's cap,
      so that world's fights are too soft at level 6–8 to measure a healer's worth. Its own balance pass.
- [ ] **Item icons for the §9.4c items** are `ICON_PLACEHOLDER` entries pointing at like-shaped existing
      art (Codex, Art.md). Own-basename files win automatically the moment they land.

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

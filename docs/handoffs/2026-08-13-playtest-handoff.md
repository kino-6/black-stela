# Handoff — 2026-08-13/14 terminal-line playtest → #39g design-first pass (slices 1–2 shipped)

All committed + pushed to `main` (HEAD `ce88c0e`; verify `git ls-remote origin main`).
gate:migration + unit (914) green. Tree clean. Design doc: `docs/design/dungeon-interaction-model.md`.

## ✅ #39g — dungeon-interaction UX pass (DESIGN-FIRST) — slices 1–2 DONE

The user was (rightly) frustrated that reactive one-off patches weren't raising UX quality, so we
wrote the model as a design doc, the user locked the forks (A1 facing-decides / generic 「町へ戻る」 +
optional returnStyle / centred surface REPLACES the top-right panel), and it's shipping in slices:

- **Slice 1 (`3ca9786`)** — confirm-before-return (centred Wiz modal, cursor on いいえ; `_show_confirm`),
  generic 帰還 label (`_return_label`; only returnStyle:stairs says 階段で), A1 facing-aware 決定
  (`_context_command` sees the faced door/locked edge first → advance).
- **Slice 2 (`493ee2e`)** — minimap draws gate-sealed ways as a red LOCK bar + doors as a blue leaf
  (`_gate_closed` reads room.gates like the rules), and 決定 facing a sealed gate inspects it
  (`_faced_gate_closed`). Resolves terminal-line's "扉を調べる際に電話へ" (its doors are room-gates).
- **Diegetic clue (`c30e1a5`)** — tl1f shutter clue rewritten from the omniscient "信号を通すと…" to what
  the party sees (#39e part 2).
- **Focus-trap fix (`c7f6cb1`)** — a PRE-EXISTING facility/quest D-pad gap (verify_focus_trap is
  gate:migration-only, so pre-push missed it): the deep 兵装工廠 「強化する（60）」 was unreachable.

Gate: `verify_dungeon_interaction.gd` (label · confirm-not-silent · A1 · faced-gate · minimap truth).

## ⏭️ RESUME HERE — remaining #39g slices (infra now in place)

- **(a, #39e-1) Centred message SURFACE replacing the top-right hint panel** — the biggest remaining
  piece: route important beats (locked-way discovery, key/shortcut opening, room/boss reveal) to a
  centred Wiz modal; keep ambient flavor in the bottom one-liner. The modal infra already exists
  (`dungeon.gd _show_confirm` — generalise it into a message/confirm surface).
- **(b, #39c) 3D barrier on a locked/gated edge** — minimap now shows it; the 3D view still renders a
  gated way as open corridor. Draw a shutter/barrier mesh (DungeonRenderer).
- **(c) Full-map doors/gates** — mirror the minimap door/lock drawing in floor_map.gd.
- **(d, #39e-3) Event variety** — per-type presentation, now that events are visible.
- **(e) Flat phone art** — pasted flat on the wall (Codex/art handoff).
- **(open) 「天井が壊れている？」** — the 濡れた改札回廊 ceiling; needs a 3D render investigation (bug or
  intended). Not yet triaged.

## Shipped this session (main)

- **Focus**: verify_focus_trap.gd (exhaustive controller focus TRAP+COVERAGE via find_valid_focus_neighbor)
  + the town _menu_host leak fix + shop buy-mode chaining (`3293373`/`cfe32a8`). In gate:migration.
- **Town readability**: 攻撃 label (was 威力; raw stat → 攻撃力), boxed quest notice, ranked party rail
  (`089048a`); party token shows 攻撃 as ONE number, not a range (`4228238`).
- **Base v2 (#37)**: three deep facilities gated by materials cost — 兵装工廠 (forge discount) / 管制室
  (fewer ambushes) / 動力炉 (permanent +attack%, chosen over max-HP% which desyncs the combat HP bar)
  (`1fb4b96`/`6e55940`).
- **Gather (#38)**: EO-style repeatable gather nodes — items not materials, greed buys rarity + ambush risk
  (`e0969d0`/`4164fbd`); exhausted-node line (`db56fc6`).
- **play:late**: mid/end review start — grown Lv9 party + tier-4 guns +3 + 400 materials + descent flags
  (`e8ae9a0`/`8fd5059`).
- **Terminal-line bug fixes this playtest**: blank dungeon on fixture descent (`172b710`), English event
  leak (`c1845f5`), HP-farm-by-pacing → roaming events now flavour-only (`d228ca4`).

## Other open (Tasks.md) — lower priority
- **#37 slice2 done** as attack% (動力炉). #36-d fonts (shared token, careful). #34 next: extend the focus
  verifier to guild/combat/creation.

## Ops
Commit at sensible units without asking; push/merge before big changes ok. Verify pushes with
`git ls-remote origin main`. Co-Authored-By trailer. Godot-native: new features Godot-only, facility/
event/gather all gated so parity traces (default/verdant) no-op; content authored once (TS schema → export).
One-shot review: `npm run play:late` (mid/end) · `play:base` · `play:combat`.

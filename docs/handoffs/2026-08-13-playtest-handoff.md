# Handoff — 2026-08-13/14 terminal-line playtest

All committed + pushed to `main` (HEAD `4cac2df`; verify `git ls-remote origin main`).
Pre-push gate green throughout; verify_parity green. Tree clean. Read `Tasks.md` for the queue.

## ⏭️ RESUME HERE (next session): #39g — dungeon-interaction UX pass, DESIGN-FIRST

The user is (rightly) frustrated that reactive one-off patches aren't raising UX quality. The
terminal-line dungeon interaction/presentation layer is under-designed (surfaced now that play:late
lets a grown party actually explore tl1f, which b1f-focused testing skipped). **Do NOT keep patching
one symptom at a time.** Agreed plan:

1. **Write the "dungeon interaction model" as one design doc first** — what the party can interact with,
   how the target is chosen when several share a cell/direction (door vs emergency phone vs stair vs
   object), how return/descend is confirmed, and how outcomes are presented. Put it in `docs/design/`.
2. **User reviews the design before implementing** (lock direction first).
3. **Then implement with real-playtest verification** — like verify_focus_trap catches focus bugs, add
   checks that actually fail on the UX defects.

Concrete defects to resolve in that pass (all in Tasks #39c/#39e/#39g):
- **Interaction targeting** — investigating a door triggers the emergency-phone interaction instead.
- **Confirm before return/descend** — the emergency phone returns to town with NO confirmation (misclick).
  "結果が先に分かる" presentation also needs review.
- **Return label** — the phone says "階段で町へ戻る" but it is not a stair; label per point type.
- **Event presentation (#39e)** — important beats should be a CENTRED Wizardry-style message, not stuck
  in the top-right panel; and DIEGETIC (no omniscient "signal" info the characters don't perceive).
- **Minimap/3D doors (#39c)** — doors / locked edges aren't drawn, so a corridor looks open but is
  "固く閉ざされている". Draw doors + locked edges on the minimap and in 3D.
- **Flat phone art** — pasted flat on the wall (Codex/art; handoff to the art agent).

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

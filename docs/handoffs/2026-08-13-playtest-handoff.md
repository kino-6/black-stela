# Handoff — 2026-08-13 terminal-line playtest batch

All below is **committed + pushed to `main`** (HEAD `4164fbd`; verify with
`git ls-remote origin main`). Pre-push gate (typecheck + unit) green on every push;
verify_parity green throughout. Read `Tasks.md` for the live queue; this is the "why".

## Shipped this session (main)

Earlier batch #28–#33 (mow-down default, base building v1, quest discoverability,
premise[reverted], boss signpost, random dungeon events) — see
`docs/archive/Tasks.completed-2026-08.md`. Then, from the playtest feedback:

- **#34/#35 focus** (`3293373`) — `verify_focus_trap.gd`: an EXHAUSTIVE controller
  verifier that walks each town service with the player's real arrow-key resolution
  (`find_valid_focus_neighbor` = explicit+geometry), asserting focus can't leak out
  of the open panel (TRAP) and every control is reachable (COVERAGE). Fixed the leak
  (town.gd hid `_menu_host` while a service is open).
- **#36-b shop focus** (`cfe32a8`) — wired the 買う-mode row chain + 買う button
  (new `UI.chain_column`/`link_lr` in ui_kit). verify_focus_trap now fully green +
  in gate:migration.
- **#36 a/b/c readability** (`089048a`) — 威力→**攻撃** (raw stat → 攻撃力 to avoid
  collision), quest notice **boxed**, party rail **前衛/後衛 grouped** with headings.
- **#30 premise reverted** (`0babdef`) — the always-on square proclamation was
  unwanted; removed. (Capability idea parked in Backlog.)
- **#37 base v2 slice 1** (`1fb4b96`) — deep facilities gated by materials cost alone
  (aspirational depth): **兵装工廠** (reinforce/forge discount) + **管制室** (fewer
  wandering ambushes). Effects in loot.gd + encounters.gd, facility-gated no-ops.
- **#38 gather points** (`e0969d0` slice 1, `4164fbd` slice 2) — EO-style repeatable
  gather nodes. Search a `gatherTable` room → an ITEM per pull (never materials),
  ambush chance rises per pull (pull×20%, 管制室 quiets it), node exhausts at
  `gatherMaxPulls`. **Greed buys rarity**: `roll_treasure_item(luck)` rolls as if
  `luck=pulls` floors deeper, so rare enchanted gear sits behind the risky pulls.
  Godot-only + gatherTable-gated (parity-safe). tl1f 保守端末 is the first node.

## Open queue (Tasks.md) — all optional or deferred

- **#37 slice 2 — 動力炉 (permanent maxHP%) — DEFERRED, do in a focused turn.**
  The hard one: `character_stats.effective()` can't preload Facilities (circular →
  pass the pct as an ARG, not state), and the pct must thread through ~10 combat/HUD/
  display call sites or the shown maxHP diverges between HUD and party menu. Plan:
  add `facility_max_hp_pct` arg to effective(), compute via `Facilities.active_effects`
  at each site (combat_round / dungeon_hud.party_token / economy.recover / party_panel /
  facilities.apply_return_heal / dungeon_events / camp_techniques), + a HUD==combat
  consistency gate. Parity-safe (pct 0 when no facility). Content 動力炉 not authored yet.
- **#36-d fonts** — the shared `dungeon_hud.party_token` stat font (12px) is small but
  reused by combat/crawl; ui_kit `_sz` note warns blanket scaling breaks fixed layouts.
  Density-aware local bump, not a global scale.
- **#38 slice 3 / #37 slice 3** — polish: gather log copy, exhausted-node display, deep-
  facility lock/aspiration display, real-screen PNG confirms.

## One-shot review
`npm run play:base` (base + deep facilities via materials) · `npm run play:combat`
(combat feel). Gather: play terminal-line, search tl1f **保守端末** repeatedly.
Focus verifier: `godot --headless --path godot/ --script res://tests/verify_focus_trap.gd`.

## Ops notes
Commit at sensible units without asking; push/merge before big changes ok (user
2026-08-13). Verify pushes with `git ls-remote origin main`. Co-Authored-By trailer.
Godot-native: new features Godot-only, gated so parity traces (default/verdant) no-op;
content authored once (TS schema parses → export → Godot reads).

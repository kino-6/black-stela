# Codex Independent Godot Core-Loop Verification — 2026-07-25

**Scope:** independent visual/input review of `fc2f367` plus the uncommitted
`#3` and `#17` changes. This review did not modify gameplay code.

**Why this exists:** `gate:play` was run first, but it is headless and currently
asserts only the entry-plan/continuation decisions for #11 and #12. It cannot
prove native keyboard handling, modal closure, or visible town ledger output.

## Method

- Ran the native Godot executable, not the React/Vite application.
- Used the existing six-person `b1f-exploration` fixture only to avoid making
  six disposable recruits. From a visible Godot scene onward, M, Esc, A/D/W,
  Tab, and Enter were sent as native OS keyboard events; no in-game state was
  mutated after setup.
- Evidence is stored beside this review in
  `docs/evidence/codex-core-loop-2026-07-25/`.

This is diagnostic evidence, not a replacement for a normal-title-to-guild
self-play route. In particular, it does not yet prove that a *newly picked-up*
item appears in the return ledger.

## Results

| Finding | Result | Evidence |
| --- | --- | --- |
| #11 — victory result `探索へ戻る` resumes the dungeon, not town | Pass | `01-victory-result.png` → `02-victory-continue-dungeon.png` |
| #12 — town return then re-descent retains explored cells | Pass | `03-redescend-map-kept.png` — the entrance is current while two known cells remain on the minimap |
| #13 — M opens the full map and Esc closes it | Pass | `04-map-open.png` → `05-map-esc-closed.png` |
| #17 — held movement/turning repeats | Pass for A/left turn | `06-held-left-repeat.png`: a 0.52 s hold advances south → north, i.e. two turns, where a tap turns once |
| #3 — initial healing draught is not reported as expedition loot | Pass for carried-in item | `07-return-no-loot.png` displays `持ち帰った物はない。` after descend → immediate return |

### Remaining verification limits

- #17's common repeat path is shared by Up, Down/S, Left/A, Right/D, Q, and E,
  but this fixture's nearby walls and encounter prevent a meaningful multi-cell
  hold test for Up/Down/S/Q/E. Add a corridor fixture that asserts each mapped
  action repeats and stops on combat/chest/modal.
- #3 still needs a native route that picks up one new item after descent and
  asserts that it, and only it, appears in the return ledger.

## Reproduced defect: return logs a GDScript exception (IMP-044)

The return succeeds visually and reaches the town ledger, but the native Godot
output logs this error once per return:

```text
SCRIPT ERROR: Invalid call. Nonexistent function 'get' in base 'Nil'.
at: _current_cell (res://scripts/dungeon.gd:992)
```

### Reproduction

1. Start `godot --path godot/ res://scenes/result.tscn` with the standard
   `b1f-exploration` fixture.
2. Press Enter on `探索へ戻る`; the game resumes the dungeon as intended.
3. Walk to the return stair, focus `階段で町へ戻る`, and press Enter.
4. Observe the town arrival screen and the error above in Godot output.

### Cause to preserve in the fix

The return command makes `state.position` null. The outgoing `Dungeon._apply()`
then calls `_update_view(true)`, whose `_current_cell()` assumes `position` is a
Dictionary and calls `.get("cellId")` on null. The scene transition still
happens, which is why a screenshot-only route misses it. The return path must
skip the outgoing dungeon view rebuild (or guard a null position) before it
changes to town.

## Gate debt: the current `gate:play` does not match its stated scope (IMP-045)

`npm run gate:play` passed on this revision, but
`godot/tests/verify_played_loop.gd` currently checks only:

- `DungeonEntry.plan()` for a fresh entry, victory continuation, and re-descent
  map preservation (#11/#12); and
- `DungeonEntry.continue_scene()` routing by phase.

It does **not** instantiate and drive the native scene/input paths for #3, #13,
or #17, despite `docs/gates/played-build-gate.md` listing those as G1 locks.

### Required regression locks

- Return from the actual dungeon scene without a Godot script error.
- M opens full map; `ui_cancel`/Esc closes it.
- A held forward action advances more than one open cell; all six mapped actions
  have a repeat assertion; repeat stops for a combat, chest, or modal.
- The carried-in healing draught is absent from the return loot ledger, while a
  newly acquired item is present.

## Verification commands

```sh
npm run gate:play
godot --path godot/ res://scenes/dungeon.tscn
godot --path godot/ res://scenes/result.tscn
```

`gate:play` is useful for its current pure-state locks but remains insufficient
for these native-input and scene-lifecycle claims.

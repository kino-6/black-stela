# Godot Migration — S5 Go/No-Go Gate

Status: **Evaluated — recommendation GO (Godot 4.7.1 / GDScript)**. Date: 2026-07-19.
Scope: the migration-execution-plan's S5, i.e. the strategic plan's **Phase 2 Go/No-Go Gate**
(`godot-migration-plan.md`). This records the gate result against the frozen criteria, with the
evidence produced by the S1–S4 slice, and the decisions that gate Phase 3.

## What was built (the thing under evaluation)

A complete controller-first vertical-slice loop in `godot/`, driven by the ported rules on one shared
state:

```
Title → Town(hub) → Dungeon(first-person 3D + automap) → Combat(6-party 3+3) → Result → Town
```

- **Rules are ported and parity-proven, not re-authored.** `verify_parity` replays four golden traces
  (b1f-turns / b1f-wall / b1f-exploration / b1f-combat-victory) through the GDScript rules and matches
  the TypeScript oracle's events + canonical state hash **4/4**. TS stays the oracle.
- **The loop connects at the rules level.** `verify_flow` (new) walks the party forward into the
  authored ash-slime room (ported `move_forward` room-entry), fires the encounter, resolves an all-out
  round through the ported `CombatRound`, and reaches victory + rewards on ONE shared state — PASS.
- **Same scene code runs two worlds.** `capture_world -- default` and `-- verdant` render Title/Town/
  Dungeon/Combat from each world's data + assets with identical scripts.

## Gate criteria (Phase 2)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Controller-only traversal (confirm/cancel/directional focus/actor+target cycling), no pointer dependency | **PASS** | Every screen is focus-driven (first control `grab_focus`'d); the dungeon consumes arrows in `_input` so they own movement, not focus nav (IMP-026); combat targets on-stage; no code path requires a mouse. |
| 2 | At the **1920×1080** target (the single supported resolution), no overlap / nothing leaves the viewport | **PASS** | `window/stretch/mode=canvas_items` + `aspect=keep` scales the 1920 design uniformly to any 16:9 window, so smaller sizes cannot introduce overlap. **Godot is authored and tested at 1920×1080 only** — do NOT render/verify the slice at 1280×720. |
| 3 | Town reads as a preparation location; dungeon commands are contextual; combat keeps enemy + 3+3 context visible | **PASS** | Town = diegetic hub (4 NPC service destinations + descent, live party/purse); dungeon dock = current-cell Search/Listen/Return with arrows owning movement; combat = full-frame enemy stage over a persistent 前衛/後衛 3+3 band. |
| 4 | Victory → result → resume/return is one continuous presentation, not app-like page swaps | **PASS** | One `Run` autoload persists the party across `change_scene_to_file`; `capture_flow` shows the literal dungeon→combat handoff; combat victory stashes rewards → result reads them → returns to town. |
| 5 | Default and Verdant use the same scene code with different data AND assets | **PASS** | `capture_world` renders both worlds through identical scripts; world title/tagline, grid, first-person geometry, enemy, and per-world asset roots (`assets/worlds/<id>/`) all come from data. |
| 6 | The slice is materially easier to adjust than the React surfaces | **PASS (qualitative)** | The IMP-024 composition problem React fought for multiple slices (enemy stage vs. HUD overlap, 720p fit) is solved once, structurally, by Godot's anchors + keep-aspect. The whole loop is ~7 small scripts built procedurally from data; layout changes are local and don't fight a reflow/CSS-source-order model. |

**All six criteria pass.** Per the plan, that is the condition to **select Godot** and proceed to a
real rules port (Phase 3) — which S3/S4 already began and proved on the slice route.

## Recommendation

**GO — adopt Godot 4.7.1 with GDScript as the player-facing runtime; keep TypeScript as the rules
oracle + content/simulation toolchain through the transition.** The make-or-break risk (cross-runtime
rules drift) is retired for the slice by byte-for-byte state-hash parity; the recurring cost that
motivated the migration (controller-first presentation composition) is demonstrably lower in Godot.

This is a recommendation; the items below are the user's product decisions before Phase 3 commits.

## Decisions required before Phase 3 (from the plan)

1. **Does Godot pass the gate?** → Yes (this document). Babylon.js was the plan's control experiment;
   given Godot cleared every criterion and the rules port is already parity-proven, building the
   Babylon comparator is now optional overhead rather than a decision input. *Recommend: skip it.*
2. **Is browser a supported target post-migration?** → GDScript keeps Web export open (the reason C#
   was excluded). *User's call.* If desktop-only is ever chosen deliberately, C# re-opens.
3. **Production rules language?** → GDScript (matches the installed standard editor + the S3 port that
   already passes parity). Re-evaluate C# only if desktop-only is approved.
4. **Visual reference screen + defects that must disappear?** → The slice already removes the IMP-024
   overlap and the web-toolbar dungeon; the reference is this slice, not the React surfaces.
5. **Who owns the selected runtime while TS tooling continues?** → *User's call* (two-agent split
   applies: rules/gates/data vs. art/asset contracts).

## Honest remainder (Phase 3+, NOT claimed by this gate)

The slice deliberately stays inside proven-ported territory. Before incremental production migration:

- **Full combat parity**: enemy turn / multi-round / spells / items / defend / retreat. The ported
  `CombatRound` covers the front-line one-round victory path only (it `push_error`s the enemy turn
  rather than guess). This is the largest Phase-3 port.
- **Dungeon depth**: treasure / traps / room-events / cell-effects (spinner/teleport) and the
  **wandering-encounter RNG** (verdant is wandering-only, so its dungeon walk currently reaches no
  fight — its combat is demoed by injecting the floor's first enemy).
- **Full world coverage**: the slice touches b1f / g1f entry; the remaining floors, town services
  (guild/market/records/infirmary are diegetic shells here, not the real services), saves, quests,
  appraisal/forge, and narration are the Phase-4 incremental lanes.
- **Copy externalization**: town/dungeon chrome copy is partly hardcoded; production must layer
  `world.md` `copy:` per AGENTS.md.

## How to reproduce the evidence

```sh
# rules parity + loop chain (headless, authoritative)
godot --headless --path godot/ --script res://tests/verify_parity.gd   # 9/9
godot --headless --path godot/ --script res://tests/verify_flow.gd     # dungeon→combat→victory
# presentation (screenshots to godot/tests/_*.png — always the native 1920×1080, never --resolution)
godot --path godot/ --script res://tests/capture_world.gd -- default
godot --path godot/ --script res://tests/capture_world.gd -- verdant
```

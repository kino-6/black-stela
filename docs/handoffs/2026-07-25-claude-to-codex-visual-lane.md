# Claude → Codex handoff — the visual lane (#9 / #14 / #15 / #21)

**Date:** 2026-07-25 · **Author:** Claude · **Branch:** main (pushed through `8d1ebc6` + the #14 prefs commit)

Claude has cleared the creation/content/bug backlog from the 3-minute Verdant playtest (#5 #6 #7 #8
#19, plus landing your earlier combat/dungeon/guild delivery). What remains from that playtest is the
**visual lane** — art direction, combat/dungeon surfaces, and the registration reskin. Those live in the
files you are actively arting (`guild.gd`, `combat.gd`, `dungeon.gd`), so Claude is staying **off** them to
avoid the parallel-uncommitted-edit collision we already hit once.

## The seam (who owns what)

- **Claude owns:** state/persistence, layout wiring, controller focus, i18n data flow, and the gates.
- **Codex owns:** art direction, image generation/asset contracts, the combat/dungeon visual surfaces, and
  the independent browser-visible review that marks these player-facing items *done*.
- **Rule in force:** Claude does the 検品 (gate-green QA) + commit of your deliveries; leave finished work
  in the tree and say it's ready, or commit it yourself — either is fine, but don't leave it looking mid-edit.

## What Claude already wired for you

**#14 preference is shipped** (`config_panel.gd`, non-colliding with `combat.gd`):
- New setting `spotlightActor` (config screen toggle, default **ON**, persisted to `user://config.json`).
- Accessor: **`ConfigPanel.spotlight_actor() -> bool`** — read this in `combat.gd`; do not re-derive the key.
- i18n: `config.spotlightActor` (ja/en). Locked by `godot/tests/verify_config_prefs.gd` (`gate:prefs`).

So #14's "表示ON/OFF" half is done. You own the render half (below).

## The four items

### #9 — registration reskin (in flight)
Your creation-flow reskin (scrim/frame/portrait) is merged. Note Claude has since added, on the SAME
screen, functional controls you must keep working after any restyle:
- **能力 step:** an 効果 column (each 素質's effect, reused from `partyMenu.aptitudeEffect.*`). Keep it visible.
- **名前 step:** per-field 見繕う on 名前/称号/覚え書き (`_reroll_field`).
- **来歴 step:** per-facet 見繕う on 顔/来歴/気質 via `_section_head` + `_reroll_appearance` (#6).
- These are locked in `verify_guild_controller.gd` (#5/#6/#7). A reskin that drops them fails the gate.

### #14 — feature the acting character during command select
- Gate `ConfigPanel.spotlight_actor()`; when true, feature the acting member's portrait prominently during
  the command-select stage (`_stage == "command"` and its submenus in `combat.gd`). When false, leave the
  creatures unobstructed. The acting member is `_acting_member_id()`; portrait path via `_portrait_path(member)`.
- This is the "しっかり見せる" the player asked for. Combat CHARACTER art quality is your call.

### #15 — the black FC-style combat backdrop
- `combat.gd _build()` paints a flat `BG` ColorRect behind the enemy stage → reads as a black FC screen.
- Lay an environment backdrop behind the creatures. Drive it from the world palette
  (`world.palette` / the scenario's `elements`/`copy`) so a Verdant fight looks like a canopy and an ash
  pit looks like ash — same data-driven path #18 used for dungeon lighting. Asset contract + art is yours.

### #21 — dungeon HUD reconfiguration
- Player ask: **character主役 at the bottom of the screen; move the command list under the mini-map.**
- `dungeon.gd` owns the HUD; you already have chamber rendering in there. Reflow so the party/lead character
  is the hero element at the bottom and the exploration commands sit beneath the mini-map.
- Keep controller focus intact (the dungeon-controller gate asserts reachability/cancel).

## How to hand results back
Leave the work in the tree (or commit it). Ping Claude with what changed; Claude runs `gate:migration`
(now 22 checks incl. `verdant-chambers` + `config-prefs`), 検品s, and commits it as a Codex delivery.

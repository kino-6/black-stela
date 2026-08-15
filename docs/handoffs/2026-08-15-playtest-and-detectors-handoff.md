# Handoff — 2026-08-14/15: #39g dungeon-interaction pass + play:late batch #40 + detector suite

All committed + pushed to `main` (HEAD `8e6f652`; verify `git ls-remote origin main`). Tree clean.
`gate:migration` green as of the last full run; unit 914 green. Read `Tasks.md` "2026-08-14 play:late
集中 playtest バッチ #40〜" for the live queue.

## Part 1 — #39g dungeon-interaction UX pass: COMPLETE (Claude side)

Design doc `docs/design/dungeon-interaction-model.md` (forks user-locked). Shipped + gated:
- Slice 1 (`3ca9786`) confirm-before-return + generic 帰還 label + A1 facing-aware 決定
- Slice 2 (`493ee2e`) minimap door/lock truth + faced-gate inspect
- Slice 3 (`b3a4d8d`) centred Wizardry message surface (replaces the top-right clue line)
- (`023fcf0`) 3D sealed-shutter barrier · (`ea5a099`) full-map lock bar · (`c2a3cd9`) discovery-vs-ambient
- (`47275a1`) raised-chamber ceiling void fixed (clerestory bulkhead)
- (`c7f6cb1`) pre-existing facility/quest D-pad focus-trap fixed
Gates: `verify_dungeon_interaction.gd`, `verify_chamber_ceiling.gd`. Only remaining #39g piece is the
flat phone ART (Codex). Diegetic clues were later corrected again in Part 2 (they still named "ホーム階段").

## Part 2 — play:late intensive playtest batch #40 (images #29–#43)

The user ran `play:late` and fired ~15 issues. **Fixed + pushed:**
- **#40a CRITICAL progression** (`a389c50`) — 保守階段 couldn't descend: `_blocking_stair_gate` treated the
  room's UNRELATED north shutter as sealing the EAST descent. Now matches the stairs' own direction
  (`_stairs_edge_dir`). Also **diegetic clues** — dropped "ホーム階段/非常電話側" (things the party can't see).
- **#40c** (`a1478fb`) — `UI.scroller` now `follow_focus = true`; the D-pad scrolls every service list into
  view (fixes「Focus時スクロールされない」on 鑑定所/基地整備/quest board — all UI.scroller panels).
- **#40d** (`f042c3f`) — status sheet showed 攻撃 twice (stat + damage range, both labelled 攻撃); dropped the
  range, keeping one 攻撃.
- **#40j English leak + DETECTOR** (`2442acd`) — see Part 3.

## Part 3 — the strategic pivot: DETECTORS (user chose "A")

User: 「遊べば分かる不具合しかない。本当に検出できないの？」 — right: the gates checked STRUCTURE
(node exists / focus reachable), not the PLAYED experience (visible / scrolls / localized / progressable).
The "played-build gate" gap. User chose **(A) build detectors** over (B) fix individual bugs. Built:

1. **`verify_content_localization.gd`** (`2442acd`, in gate:migration) — scans shipped worlds' room/gate
   strings for a ja-locale gap. **Found 15 English leaks** (not just the seen one); all 15 translated.
   English room text can't ship again. (default = English parity world, shortcut clues never render: skipped.)
2. **`verify_landmark_visibility.gd`** (`c3ee703`, `gate:landmark-vis`, NON-headless) — boots the real FP
   view at every stair/return cell, faces the landmark, asserts its node projects on-screen/in-front.
   **KEY FINDING: all 54 landmarks PASS — stairs ARE visible WHEN FACED.** So「階段がない」(#29/#41/#43)
   is NOT misplacement — it's (a) the party arrives NOT facing them + (b) the flat art card reads as nothing.

## ⏭️ RESUME HERE — open queue (Tasks.md #40f–k)

Recommended next: **#40f** (now well-scoped by detector #2).
- **#40f [top, 4× recurring] real 3D stairs/ladders + arrival facing** — user「登り下り階段はもう3Dにして。
  リテイクしても治らない」. Two parts: (a) place the landmark / set arrival facing so the party SEES the way
  up/down on arrival; (b) replace the flat billboard (`dungeon_renderer._add_ladder_shaft_art` /
  `_add_stairs`) with real 3D geometry (ladder = rails+rungs; stairs already have `_add_descending_steps`).
  `gate:landmark-vis` now guards placement; consider a pixel-level "art actually visible" detector too.
- **#40g** infirmary (施療院) doesn't cure status ailments (恐怖 persists) — `recovery_panel`/`recover_party`
  only heal HP+injury.
- **#40h** 鑑定所 "合わせる相手" selector does nothing — selecting a char doesn't update item targets.
- **#40i** service panels needlessly narrow/small (fixed scroller heights; wasted screen).
- **#40k** flat phone art (Codex).
- **More detectors** (Tasks "検出戦略"): pixel-visibility · focus-into-view · progression-reachability ·
  duplicate-labels.

## Ops
Commit at sensible units without asking; push/merge at discretion (verify with `git ls-remote origin main`).
`godot/data` + `.import` are generated/gitignored — run `npm run export:packs` / `export:i18n` /
`import:assets` after content/i18n/asset edits. Render real screens WITHOUT `--headless` and READ the PNG.
Co-Authored-By trailer on commits.

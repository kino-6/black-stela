---
name: combat-ui-drpg
description: Layout and presentation know-how for first-person DRPG combat screens (Etrian Odyssey / Wizardry / world-tree style). Use when designing or reviewing Black Stela's combat UI — window economy, enemy impact, damage-number feedback, compact party strips.
---

# DRPG Combat UI (world-tree / Wiz-like)

How classic and modern first-person dungeon-RPGs present a fight, distilled so
Black Stela's combat screen reads with impact on a tight layout — even though
Etrian Odyssey shipped this on a DS's narrow pixels.

## The core rule: THREE zones, not eight

A DRPG fight is legible because it commits to three stacked zones and refuses to
add more windows:

1. **Enemy stage (dominant, top/center).** The enemies ARE the screen. Large,
   detailed sprites, centered, arranged in a row/formation. Everything else is
   subordinate. This is where impact and animation live.
2. **Party strip (thin, bottom).** One compact horizontal row of members — name +
   HP + resource bar each. Front/back shown by grouping/divider, not big cards.
3. **Command box (small, contextual).** A per-actor menu (Attack / Skill / Item /
   Defend / Escape) in a corner. Appears for the acting member, disappears otherwise.

If you find yourself adding a fourth persistent window (a separate enemy LIST, a
separate ORDERS list, a separate LOG panel, a separate FORMATION panel), fold it
back into one of the three zones instead.

## Enemy impact

- Enemies are **big and central**, not a thumbnail in a viewport corner. Detailed
  enemy art is the whole point of the first-person frame — lean into it.
- Multiple enemies read as a **formation/row of sprites**, each with its own HP
  cue, not as a text list off to the side.
- The struck enemy is where feedback happens: **flash, shake, knockback, and a
  floating damage number ON the enemy** (数字感). Numbers belong on the target,
  not only in a log.
- Target selection highlights the enemy sprite itself (cursor/reticle), not a row
  in a separate list.

## Feedback & log economy

- Prefer **floating numbers on targets** + a **single-line ticker** over a tall
  scrolling log window. The player reads the fight from the stage, not a text box.
- Keep at most one or two lines of running text; the full history is a menu, not
  always on screen.
- Play resolves **beat-by-beat** so a round has weight, but the pacing lives on the
  stage (numbers, bars draining), not in a wall of text.

## Party strip

- Six members become **six compact tokens** in a row, front group then back group.
- Each token: name, HP bar, resource (MP/気力) bar, status pips. No portraits/stat
  dumps during combat — that belongs in a profile screen.
- The active/next actor is highlighted in the strip so command order is obvious.

## Controls

- One command box at a time, cursor-first, fully keyboard/controller navigable.
- Round-level actions (auto, repeat, retreat) are **small icon buttons in a
  corner**, not a full-width toolbar competing with the command box.
- Queued orders show as **inline pips/marks on the party strip** (member → chosen
  action), not a separate orders window.

## Anti-patterns (what Black Stela had)

- Eight persistent panels: 3D viewport, round header, log window, orders window,
  enemy-group window, party-formation window (6 big cards), meta toolbar, command
  menu. → collapse to Enemy stage / Party strip / Command box.
- Enemy tiny in the center of the dungeon viewport → no impact.
- Damage only in a text log that trickles in after the state already snapped.
- Big party cards duplicating a formation panel and a roster panel.

## Verify like a player

Screenshot the combat screen at a real resolution and count the windows. If it's
more than three zones, it's not there yet. Drive a fight in the browser (not just
unit tests) and confirm numbers land on enemies and the party strip stays compact.

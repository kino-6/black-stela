# Plan: Command-Menu Combat UI (コマンドRPG化)

Grounded in [drpg-design-pillars.md](drpg-design-pillars.md) (researched). This lane
serves **Pillar 7 (combat = a war of decisions)**, **Pillar 9 (combat must FEEL
weighty — presentation, pacing, speed control)**, and **Pillar 10 (purity)**, and
undoes the matching betrayals the audit found: *flat button toolbar / attack-mash*,
*instant feedback-less rounds*, *lonely 1-enemy fights*, *a back row that just can't
act*. (Pillars 3 sticky-death and 6 FOEs are the next big design questions *after*
this lane — flagged, not in scope here.)

The playtest verdict: despite the docks, keyboard support, and per-actor queueing,
combat still reads as **"ボタンぽちぽち"** — a flat toolbar of buttons — not a
**command-menu RPG**. This lane rebuilds the combat command surface into a nested,
cursor-first command menu, and folds the seven playtest items (#64–#69) into it.

## Human expectation

Combat feels like a classic party DRPG: each adventurer, front row first, is handed
a **command menu** (たたかう / じゅもん / どうぐ / ぼうぎょ). You move a cursor with
↑↓, confirm with Enter, cancel/back with Esc. Choosing たたかう or じゅもん opens a
**target submenu** (which enemy group). When every adventurer has an order, the round
resolves and results play in the message window. Mouse works, but keyboard/controller
is the primary, complete path.

## Red flags (what "not done" looks like)

- A flat horizontal button toolbar remains the primary combat input.
- The command area reflows/stretches as context buttons appear/disappear.
- Command entry starts on a back-row caster instead of the front row.
- Back-row members simply "can't attack" with no reach-weapon path.
- Only one enemy is ever on screen; no target choice.
- Auto and Repeat are the same button, and auto stops itself on every hit.

## Target flow (ASCII)

```
┌─ 戦闘 ─ ラウンド1 ───────────────────────────────┐
│ 敵群:   ▸ 鉤鼠 ×3      灰泥 ×2                    │  ← target row (multi-group, #66)
├───────────────┬───────────────────────────────────┤
│ 前衛           │  Rook のコマンド                  │  ← current actor, front-first (#64)
│  ▸ Rook        │   ▸ たたかう                      │
│    Vale        │     じゅもん                      │
│    Bran        │     どうぐ                        │
│ 後衛           │     ぼうぎょ                      │
│    Mira …      │                                   │
├───────────────┴───────────────────────────────────┤
│ [message window — prompts & results, no reflow]    │  ← #68 fixed area
├────────────────────────────────────────────────────┤
│ ↑↓ 選択  Enter 決定  Esc 戻る    [オート] [リピート]│  ← #67 distinct, at the edge
└────────────────────────────────────────────────────┘
```

- **たたかう** → target submenu (↑↓ over enemy groups) → queued → next actor.
- **じゅもん** → spell list → target → queued. **どうぐ** → item → target.
- **ぼうぎょ** → queued immediately.
- **Esc** on a submenu backs to the command menu; **Esc** on the command menu backs
  to the previous actor (undo). After the last actor, the round resolves.
- Back-row **たたかう** is offered only with a reach weapon (#65); otherwise it is a
  disabled row with a one-line reason (no vanishing button — #68).

## Acceptance Gate

- **G1** Per-actor input is a vertical **command menu** (command → target/spell
  submenu), not a flat button toolbar.
- **G2** A full six-member round is commandable by **keyboard alone** (↑↓ Enter Esc),
  front-to-back, Esc backing to the previous actor. (e2e)
- **G3** The command/message area does **not reflow** as context changes (#68). (e2e:
  a stable bounding box across states.)
- **G4** Back-row たたかう requires a reach weapon (#65); otherwise shown disabled
  with a reason. (unit + e2e)
- **G5** The target submenu lists **all** enemy groups; multi-group encounters exist
  (#66). (unit + e2e)
- **G6** オート and リピート are **distinct**; discretionary auto-stops are **off by
  default**, Config-gated (#67). (unit + e2e)
- Japanese copy passes the line-layout gate; command positions are stable.

## Slices (one per commit, suite green + browser evidence each)

1. **#65 Reach weapons** — weapon `reach` property + canAttack honors it + 1–2 reach
   weapons in the catalog + back-row starters equipped. (Foundational: decides whether
   たたかう is offered.)
2. **#66 Multi-enemy encounters** — encounter tables field multiple groups × counts;
   display + targeting already support groups; verify tempo/rewards.
3. **Command-menu core** — replace the flat combat dock with the nested command menu
   (command → target/spell), cursor/keyboard-first, wired to `declare_round`. Absorbs
   #68 (fixed panel) and the G1/G2/G3 Gate.
4. **#69 Combat presentation / 数字感 (Pillar 9)** — play the round beat-by-beat in an
   on-screen log (hit/miss → damage NUMBER → HP change → status), animate HP drain,
   proportional feedback (crits bigger). Speed control is load-bearing: tap-to-advance,
   **hold confirm to fast-forward**, and a message-speed setting (slow/normal/fast/
   instant). This is what turns "instant, weightless" into felt tension without slowing
   grind.
5. **#67 Auto/Repeat** — オート (continuous auto-battle, fast-forwards animation) +
   リピート (repeat last round's orders) as distinct edge affordances; discretionary
   auto-stops Config-gated (default off), keeping terminal stops.

## Status

- [x] #64 Front-row-first command order (shipped).
- [ ] Slices 1–4 above.

Non-goal for this lane: changing combat *rules* (damage, growth). This is the input
surface + encounter shape, not the math (that is balance tuning, already Gated).

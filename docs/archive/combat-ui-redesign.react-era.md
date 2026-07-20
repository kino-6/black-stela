# Combat UI redesign — world-tree three-zone layout

Proposal to fix the 2026-07 playtest complaints: "Enemyの見せ方に迫力がない",
"Windowがいっぱいある", informed by `.claude/skills/combat-ui-drpg`. Present this
before implementing.

## Problem (current screen)

Counting persistent windows in the current combat screen: **eight**.

1. 3D dungeon viewport (enemy is a small sprite in the far center — no impact)
2. ラウンド header ("ラウンド 1 / Rook → 灰泥")
3. 戦闘ログ window (tall, mostly empty)
4. 戦闘指示 orders window (list of queued orders)
5. 敵群 window (right rail — a text list of enemy groups)
6. 隊列 window (right rail — six large party cards with bars)
7. オート/リピート/退却/強制勝利/完全回復 meta toolbar (full width)
8. command / target menu (bottom)

The enemy — the thing a DRPG fight is *about* — is the smallest element on screen.

## Target: three zones

```
┌───────────────────────────────────────────────┐
│  ENEMY STAGE                                    │
│   dungeon backdrop, enemies LARGE + centered,   │
│   HP cue + floating damage numbers ON them,     │
│   target reticle on the selected enemy          │
│                                                 │
│              [ 灰泥 ]   [ 灯守 ]                 │  ← big sprites, a formation row
│               HP▓▓░      HP▓▓▓                   │
├───────────────────────────────────────────────┤
│  PARTY STRIP (one thin row, front | back)       │
│  Rook  Vale  Bran │ Mira  Sei  Lio              │
│  HP▓▓  HP▓░  HP▓▓ │ HP▓▓  HP▓▓  HP▓▓             │  ← compact tokens, active one lit
│  ⚔     ⚔     …    │  …     …     …               │  ← queued-order pips
├───────────────────────────────────────────────┤
│  COMMAND BOX (contextual)      [A][R][⮐] corner │
│  Rook のコマンド: 攻撃 / 特技 / どうぐ / 防御    │
│  └ ticker: 「Valeの攻撃！ 灰泥に5のダメージ」     │  ← single-line log, not a panel
└───────────────────────────────────────────────┘
```

## Mapping to current components

| Current | Change |
| --- | --- |
| 敵群 right-rail list (`enemy-side`) | **Delete.** Enemies live on the stage as large sprites with HP cues + numbers; target selection highlights the sprite. |
| 隊列 six big cards (`formation-side`) | **Collapse** into one thin `party-strip` of six compact tokens (name, HP bar, MP/気力 bar, status pips), front group then back group, active actor lit. Keep the gauges. |
| 戦闘ログ tall window (`CombatLog`) | **Shrink** to a one/two-line ticker under the command box (playback still drives it beat-by-beat). Full history stays in Records. |
| 戦闘指示 orders window | **Fold** into the party strip as per-member order pips; drop the standalone panel. |
| ラウンド header | Keep as a slim caption on the stage (round # + selected target). |
| meta toolbar (オート/リピート/退却 + debug) | **Shrink** to corner icon buttons; debug aids collapse behind the existing デバッグ menu. |
| command / target menu | Keep (cursor-first, WASD), restyle as the compact command box; **target selection moves to the enemy stage** (reticle on the sprite) rather than a text submenu where possible. |
| confirm step (#72) | Keep; render inside the command box, not a separate panel. |

Net: **8 windows → 3 zones.** The enemy becomes the largest thing on screen, and
the freed space is where hit FX / animation (next task) will read with impact.

## Where combat animation then lives (next task, not this one)

Once the enemy is large and central, the CSS/SVG hit FX (slash/impact burst, hurt
flash, defeat dissolve, floating number) have room to actually land — see `content/worlds/default/ART.md` P9.
The three-zone layout is the prerequisite; animation is the follow-up.

## Rollout (incremental, each browser-verified)

1. **Party strip**: replace the six formation cards + 隊列 rail with the compact
   strip; keep HP/MP gauges + order pips. (biggest clutter win)
2. **Enemy stage**: move enemy presentation to a large centered stage with HP cues;
   target reticle on the sprite; delete the 敵群 list.
3. **Log ticker + meta corner**: shrink the log to a ticker; move round actions to
   corner icons; fold orders into strip pips.
4. Re-run the combat e2e + screenshot-count check (≤ 3 zones).

Locking: extend `combat-regression.spec.ts` with a "combat screen has one party
strip, no separate enemy-list / formation / orders windows" structural assertion,
and screenshot review at a real resolution.
```

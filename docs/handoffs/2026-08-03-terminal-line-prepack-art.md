# 終端隔離線 — 零番線: pre-canonical art receipt

Status: **未登録プレパック**。`content/worlds/cordon/` には `world.md` だけでなくMarkdown自体を置かない。
現在のworld registryはフォルダ内のMarkdownをpackとして収集するため、台帳はhandoffへ隔離する。Claudeが
受入済みcanonical dataを届けた後に `content/worlds/terminal-line/ART.md` へ昇格する。

## Tone

公共のために設計された地下交通・避難設備が、検疫と配給の機能だけを残している。青灰のタイル、濡れた
黒鉄、鈍い真鍮、局所的な暖色の保守灯を使う。ネオン都市、軍事基地、派手な魔法円、強い全画面フラッシュは使わない。
敵は環境に溶かさず、戦闘レーンで足元と役割が読める中間調を残す。

## A0 shared structure — generated

| basename | format | use |
| --- | --- | --- |
| `dungeon/stone-wall-block1..3.jpg`, `stone-floor-block1..3.jpg` | 1024² JPG | 通勤圏／保守圏／隔離局の深度帯 |
| `dungeon/wood-door.jpg` | 1024² JPG | 通常の通過edge用防火扉 |
| `dungeon/sealed-door.jpg` | 1024² JPG | F2封鎖区画の大型隔離扉。通常扉として使わない |
| `dungeon/stair-down.png`, `stair-up.png`, `return-marker.png` | 768² RGBA | 現在edge／現在cellに置く貨物リフト・避難梯子・退避設備 |
| `dungeon/treasure-chest-closed.png`, `treasure-chest-open.png` | 768² RGBA | 非常物資ケースの閉／開状態 |
| `dungeon/treasure-reward-still.png` | 1600×900 PNG | 取得物を中央で見せる報酬結果 |
| `dungeon/supply-locker.png`, `maintenance-terminal.png` | 768² RGBA | 現在セルで調べる補給ロッカー／保守端末。床印やHUDだけの代用にしない |
| `ui/town-hub.jpg`, `dungeon-entrance.png`, `combat-vignette.jpg` | 1600×900 opaque | 乗換広場／探索入口／戦闘レーン背景 |

## F1/F2 enemy contract — generated pre-acceptance

The IDs below are W0's proposed IDs. Their final enemy data, encounter membership, and numerical
values remain Claude-owned. Every pair is 768² PNG RGBA; its hurt file has been normalized to the
same alpha bounding box as the base so the combat renderer cannot make the target jump.

| scenario id | own basename | proposed role | proposed presentation | status |
| --- | --- | --- | --- | --- |
| `enemy.tl1f.drain-rat` | `enemy-tl1f-drain-rat` | attrition | small / ground, low quadruped | base + hurt generated |
| `enemy.tl1f.baton-unit` | `enemy-tl1f-baton-unit` | blocker | medium / ground, four-legged machine | base + hurt generated |
| `enemy.tl1f.breath-collector` | `enemy-tl1f-breath-collector` | status | medium / ground, wheeled medical machine | base + hurt generated |
| `enemy.tl1f.unmanned-stationmaster` | `enemy-tl1f-unmanned-stationmaster` | miniboss | large / ground, ticket-gate authority machine | base + hurt generated |
| `enemy.tl2f.cable-hound` | `enemy-tl2f-cable-hound` | ambusher | medium / ground, cable-built quadruped | base + hurt generated |
| `enemy.tl2f.rain-reclaimer` | `enemy-tl2f-rain-reclaimer` | ranged | medium / ground, raincoat scavenger | base + hurt generated |

## F1/F2 item and equipment contract — generated pre-acceptance

| proposed id | own basename | asset |
| --- | --- | --- |
| `item.tl-universal-round` | `icons/item-tl-universal-round.png` | 256² clean-alpha icon generated |
| `item.tl-field-dressing` | `icons/item-tl-field-dressing.png` | 256² clean-alpha icon generated |
| `item.tl-terminal-fuse` | `icons/item-tl-terminal-fuse.png` | 256² clean-alpha icon generated |
| `item.tl-transit-key-fragment` | `icons/item-tl-transit-key-fragment.png` | 256² clean-alpha icon generated |
| `equip.tl-service-pistol` | `icons/equip-tl-service-pistol.png` | 256² clean-alpha icon generated |
| `equip.tl-crowbar` | `icons/equip-tl-crowbar.png` | 256² clean-alpha icon generated |
| `equip.tl-rain-jacket` | `icons/equip-tl-rain-jacket.png` | 256² clean-alpha icon generated |

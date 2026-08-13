---
id: world.terminal-line
title: Terminal Line — Platform Zero
tagline: A sealed transit network still broadcasts one midnight service from below the rain.
locales:
  ja:
    title: 終端隔離線 — 零番線
    tagline: 封鎖された地下交通網から、夜ごと一度だけ零番線の無線が届く。
elements:
  - id: current
    label: Current
    color: "#8eaabd"
    locales: { ja: { label: 電流 } }
  - id: rust
    label: Rust
    color: "#9a6545"
    locales: { ja: { label: 錆 } }
  - id: signal
    label: Signal
    color: "#b8a45e"
    locales: { ja: { label: 信号 } }
  # Incendiary — the combustion side of the line (muzzle flash, thermite, flares). Declared because the shared
  # roster's base mage grants `firebolt` (a fire technique): a world that fields the base classes must own the
  # element they cast, or that grant is uncastable here (techniqueLines invariant).
  - id: fire
    label: Incendiary
    color: "#c46a3a"
    locales: { ja: { label: 焼夷 } }
balance:
  threatScalar: 1.35
  hpScalar: 1.15
  counterplayBoost: 1.1
  wanderingEncounterPct: 12
  wanderingCooldownSteps: 6
assetPack: terminal-line
# Extra selectable figures offered at creation, beyond the twelve shared background faces. Each names a
# full-body standing figure at assets/bodies/<key>.png (no matching square face — the picker/token
# top-crop the standing art). Twenty Terminal Line platform figures.
portraits:
  - chara-13
  - chara-14
  - chara-15
  - chara-16
  - chara-17
  - chara-18
  - chara-19
  - chara-20
  - chara-21
  - chara-22
  - chara-23
  - chara-24
  - chara-25
  - chara-26
  - chara-27
  - chara-28
  - chara-29
  - chara-30
  - chara-31
  - chara-32
copy:
  en:
    town.premise: "The line was sealed with people still below. Every midnight the zero-line service still calls the platforms — and the network answers. Ride the report down, reach Platform Zero, and find who is still pulling the lever."
    town.departureHeading: "Before the last platform closes"
    town.departureCopy: "Check the radio, count your supplies, and go before the midnight service passes."
    town.firstDescend: "The shutter is up. Rainwater runs down into the old station."
    town.firstNeedParty: "Nobody goes beneath the shutter alone."
  ja:
    town.premise: "封鎖のとき、まだ人が下に残っていた。零番線は今も夜ごと定刻にホームを呼び、路線はそれに応える。その報せを追って零番線まで降り、いまも制御盤を握る“誰か”を見つけ出せ。"
    town.departureHeading: "終電の扉が閉じる前に"
    town.departureCopy: "無線を確かめ、持ち出すものを数えろ。零番線が通り過ぎる前に。"
    town.firstDescend: "防火扉が上がった。雨水が古い駅へ流れ落ちている。"
    town.firstNeedParty: "シャッターの下へ、ひとりで入る者はいない。"
# Base facilities — the salvage-`materials` sink. Each level's `cost` is paid in materials (dismantled loot).
# A facility at level N applies the effects declared at levels 1..N (booleans stay on, numbers take the
# strongest). Costs 8/16/32 are calibrated against per-run materials income (common 1 / rare 2 / epic 4).
facilities:
  - id: facility.tl-infirmary
    name: Infirmary
    kind: infirmary
    description: A curtained triage bay off the concourse — beds, saline, and a working autoclave.
    locales:
      ja:
        name: 医務室
        description: 改札脇の仕切られた処置室。寝台と点滴、まだ動く滅菌器。
    levels:
      - cost: 8
        restOnReturn: true
        locales: { en: { effect: "The party's wounds are dressed free on every return to town." }, ja: { effect: "帰還のたび、隊の負傷が無料で手当てされる（HP全快）。" } }
      - cost: 16
        restMp: true
        locales: { en: { effect: "Also restores spent focus (MP) on return." }, ja: { effect: "帰還時、消耗した集中(MP)も回復する。" } }
      - cost: 32
        clearInjury: true
        locales: { en: { effect: "Also mends lasting injuries on return — a full free recovery." }, ja: { effect: "帰還時、残った負傷も治す——無料の完全回復。" } }
  - id: facility.tl-supply
    name: Supply Cache
    kind: supply
    description: A reclaimed left-luggage office, restocked off the freight depots.
    locales:
      ja:
        name: 補給所
        description: 遺失物室を接収し、貨物基地から補充した物資棚。
    levels:
      - cost: 8
        shopDiscountPct: 5
        locales: { en: { effect: "5% off everything the market sells." }, ja: { effect: "店の売値がすべて5%引き。" } }
      - cost: 16
        shopDiscountPct: 10
        locales: { en: { effect: "10% off market prices." }, ja: { effect: "店の売値 10%引き。" } }
      - cost: 32
        shopDiscountPct: 15
        locales: { en: { effect: "15% off market prices." }, ja: { effect: "店の売値 15%引き。" } }
  - id: facility.tl-signals
    name: Signals Room
    kind: signals
    description: A patched-in wiretap on the old dispatch grid; it hears what the platforms hide.
    locales:
      ja:
        name: 通信室
        description: 旧指令網に割り込ませた盗聴設備。ホームの隠しごとを拾う。
    levels:
      - cost: 8
        explorationBonus: 3
        locales: { en: { effect: "+3 to search, disarm, and unlock attempts." }, ja: { effect: "探索・解除・解錠の判定 +3。" } }
      - cost: 16
        explorationBonus: 5
        locales: { en: { effect: "+5 to search, disarm, and unlock attempts." }, ja: { effect: "探索・解除・解錠の判定 +5。" } }
      - cost: 32
        explorationBonus: 8
        locales: { en: { effect: "+8 to search, disarm, and unlock attempts." }, ja: { effect: "探索・解除・解錠の判定 +8。" } }
palette:
  fog: "#111719"
  ambient: "#a5a89a"
  torch: "#c7a96b"
  front: "#d8d4bd"
  wall: "#c2c5bd"
  floor: "#9ca39b"
  ceiling: "#737a72"
  chamberFloor: "#69737a"
  chamberWall: "#aeb2ac"
  chamberAccent: "#6d7b79"
  ambientEnergy: 0.72
  fogDensity: 0.025
  torchRange: 10
startDungeon: dungeon.tl1f
startRoom: room.tl1f.entrance
# T30/U5: two town portals. The main line is the black-stela descent; the freight depot is an optional
# side dungeon (3 floors) a mid-game party drops into to grind salvage. The first entrance stays the
# canonical startRoom so saves and the default descent are unchanged.
entrances:
  - id: main
    startRoom: room.tl1f.entrance
    label: Descend to Platform Zero
    locales: { ja: { label: 零番線へ降りる } }
  - id: depot
    startRoom: room.tl-depot1.gate
    label: Enter the freight depot
    locales: { ja: { label: 貨物基地へ入る } }
aiPolicy:
  allowed: [environmental_flavor, radio-fragments]
  forbidden: [move_pc, mutate_state, invent_rewards, reveal_hidden_routes]
---

# 終端隔離線 — 零番線

地上から切り離された避難交通網〈封鎖線〉。拠点の乗換広場には、毎夜一度だけ、地中を走る零番線の運行案内が届く。
F1は保安通路と浸水した迂回路を選び、F2はホームと保守連絡路を結び直す最初の縦切りである。

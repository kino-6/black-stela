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
copy:
  en:
    town.departureHeading: "Before the last platform closes"
    town.departureCopy: "Check the radio, count your supplies, and go before the midnight service passes."
    town.firstDescend: "The shutter is up. Rainwater runs down into the old station."
    town.firstNeedParty: "Nobody goes beneath the shutter alone."
  ja:
    town.departureHeading: "終電の扉が閉じる前に"
    town.departureCopy: "無線を確かめ、持ち出すものを数えろ。零番線が通り過ぎる前に。"
    town.firstDescend: "防火扉が上がった。雨水が古い駅へ流れ落ちている。"
    town.firstNeedParty: "シャッターの下へ、ひとりで入る者はいない。"
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
aiPolicy:
  allowed: [environmental_flavor, radio-fragments]
  forbidden: [move_pc, mutate_state, invent_rewards, reveal_hidden_routes]
---

# 終端隔離線 — 零番線

地上から切り離された避難交通網〈封鎖線〉。拠点の乗換広場には、毎夜一度だけ、地中を走る零番線の運行案内が届く。
F1は保安通路と浸水した迂回路を選び、F2はホームと保守連絡路を結び直す最初の縦切りである。

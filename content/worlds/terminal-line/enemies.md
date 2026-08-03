---
enemies:
  - id: enemy.tl1f.drain-rat
    name: Drain Rat
    locales: { ja: { name: 排水ネズミ } }
    hp: 6
    attack: 2
    armor: 0
    accuracy: 76
    damageMin: 2
    damageMax: 5
    speed: 8
    morale: 5
    xp: 2
    gold: 3
    weaknesses: { current: 1.25 }
    role: attrition
    dangerTier: 1
    level: 1
    size: small
    elevation: ground
    tags: [beast, wet]
  - id: enemy.tl1f.baton-unit
    name: Baton Unit
    locales: { ja: { name: 保安棒ユニット } }
    hp: 13
    attack: 3
    armor: 2
    accuracy: 72
    damageMin: 2
    damageMax: 5
    speed: 4
    morale: 9
    xp: 5
    gold: 6
    weaknesses: { rust: 1.4, physical: 0.8 }
    role: blocker
    dangerTier: 1
    level: 1
    size: medium
    elevation: ground
    tags: [machine, security]
  - id: enemy.tl1f.breath-collector
    name: Breath Collector
    locales: { ja: { name: 呼気採取機 } }
    hp: 10
    attack: 2
    armor: 1
    accuracy: 70
    damageMin: 1
    damageMax: 4
    speed: 5
    morale: 7
    xp: 4
    gold: 5
    inflicts: { status: fear, chance: 28 }
    weaknesses: { current: 1.35 }
    role: status
    dangerTier: 1
    level: 1
    size: medium
    elevation: ground
    tags: [machine, medical]
  - id: enemy.tl1f.unmanned-stationmaster
    name: Unmanned Stationmaster
    locales: { ja: { name: 駅務長〈無人〉 } }
    hp: 28
    attack: 5
    armor: 3
    accuracy: 74
    damageMin: 3
    damageMax: 7
    speed: 3
    morale: 12
    xp: 16
    gold: 18
    abilities:
      - name: Barrier Chime
        locales: { ja: { name: 閉鎖チャイム } }
        chance: 35
        target: front
        effect: { kind: damage, min: 4, max: 7, element: signal }
    weaknesses: { rust: 1.5, current: 0.8 }
    role: miniboss
    dangerTier: 1
    level: 2
    size: large
    elevation: ground
    tags: [machine, security, guardian]
  - id: enemy.tl2f.cable-hound
    name: Cable Hound
    locales: { ja: { name: 配線犬 } }
    hp: 14
    attack: 4
    armor: 1
    accuracy: 80
    damageMin: 3
    damageMax: 6
    speed: 10
    morale: 8
    xp: 6
    gold: 7
    weaknesses: { current: 1.35 }
    role: ambusher
    dangerTier: 2
    level: 2
    size: medium
    elevation: ground
    tags: [beast, cable]
  - id: enemy.tl2f.rain-reclaimer
    name: Rain Reclaimer
    locales: { ja: { name: 雨具の回収屋 } }
    hp: 16
    attack: 4
    armor: 1
    accuracy: 78
    damageMin: 3
    damageMax: 7
    speed: 6
    morale: 9
    xp: 7
    gold: 10
    abilities:
      - name: Scattershot
        locales: { ja: { name: 散弾の威嚇 } }
        chance: 30
        target: back
        effect: { kind: damage, min: 2, max: 6, element: physical }
    weaknesses: { signal: 1.25 }
    role: caster
    dangerTier: 2
    level: 2
    size: medium
    elevation: ground
    tags: [human, scavenger, ranged]
  # ---- F3: relay maintenance ----
  - id: enemy.tl3f.relay-tick
    name: Relay Tick
    locales: { ja: { name: 中継ダニ } }
    hp: 18
    attack: 5
    armor: 1
    accuracy: 82
    damageMin: 3
    damageMax: 7
    speed: 13
    morale: 8
    xp: 9
    gold: 11
    inflicts: { status: fear, chance: 24 }
    weaknesses: { current: 1.35 }
    role: ambusher
    dangerTier: 2
    level: 3
    size: small
    elevation: ground
    tags: [machine, cable, ambusher]
  - id: enemy.tl3f.platform-auditor
    name: Platform Auditor
    locales: { ja: { name: ホーム監査機 } }
    hp: 27
    attack: 6
    armor: 3
    accuracy: 78
    damageMin: 4
    damageMax: 8
    speed: 7
    morale: 12
    xp: 13
    gold: 15
    weaknesses: { rust: 1.45, current: 0.85 }
    role: blocker
    dangerTier: 2
    level: 3
    size: medium
    elevation: ground
    tags: [machine, security, blocker]
  - id: enemy.tl3f.transfer-warden
    name: Transfer Warden
    locales: { ja: { name: 乗換監督機 } }
    hp: 52
    attack: 9
    armor: 5
    accuracy: 80
    damageMin: 6
    damageMax: 12
    speed: 5
    morale: 12
    xp: 31
    gold: 30
    abilities:
      - name: Barrier Recall
        locales: { ja: { name: 遮断柵の回収 } }
        chance: 35
        target: front
        effect: { kind: damage, min: 7, max: 12, element: signal }
    weaknesses: { rust: 1.55, current: 0.8 }
    role: miniboss
    dangerTier: 3
    level: 3
    size: large
    elevation: ground
    tags: [machine, guardian, relay]
  # ---- F4-F6: rainworks, depot, and records ----
  - id: enemy.tl4f.silt-lamprey
    name: Silt Lamprey
    locales: { ja: { name: 鉱泥ヤツメ } }
    hp: 24
    attack: 7
    armor: 2
    accuracy: 84
    damageMin: 4
    damageMax: 9
    speed: 14
    morale: 10
    xp: 12
    gold: 13
    inflicts: { status: poison, chance: 28 }
    weaknesses: { current: 1.4 }
    role: attrition
    dangerTier: 3
    level: 4
    size: small
    elevation: ground
    tags: [beast, wet, status]
  - id: enemy.tl4f.pump-sentinel
    name: Pump Sentinel
    locales: { ja: { name: ポンプ監視機 } }
    hp: 38
    attack: 8
    armor: 5
    accuracy: 76
    damageMin: 5
    damageMax: 10
    speed: 6
    morale: 10
    xp: 18
    gold: 19
    weaknesses: { rust: 1.5, current: 0.85 }
    role: blocker
    dangerTier: 3
    level: 4
    size: medium
    elevation: ground
    tags: [machine, wet, blocker]
  - id: enemy.tl5f.ration-porter
    name: Ration Porter
    locales: { ja: { name: 配給搬送機 } }
    hp: 48
    attack: 10
    armor: 5
    accuracy: 77
    damageMin: 6
    damageMax: 12
    speed: 5
    morale: 11
    xp: 23
    gold: 24
    weaknesses: { rust: 1.4, signal: 1.2 }
    role: blocker
    dangerTier: 3
    level: 5
    size: large
    elevation: ground
    tags: [machine, depot, blocker]
  - id: enemy.tl5f.cold-store-widow
    name: Cold Store Widow
    locales: { ja: { name: 冷蔵庫の未亡人 } }
    hp: 35
    attack: 10
    armor: 3
    accuracy: 84
    damageMin: 5
    damageMax: 12
    speed: 11
    morale: 10
    xp: 21
    gold: 27
    abilities:
      - name: Hooked Notice
        locales: { ja: { name: 鉤付き通達 } }
        chance: 32
        target: back
        effect: { kind: damage, min: 5, max: 10, element: physical }
    weaknesses: { signal: 1.3 }
    role: caster
    dangerTier: 3
    level: 5
    size: medium
    elevation: ground
    tags: [human, scavenger, ranged]
  - id: enemy.tl6f.quarantine-orderly
    name: Quarantine Orderly
    locales: { ja: { name: 隔離病棟係 } }
    hp: 46
    attack: 11
    armor: 4
    accuracy: 80
    damageMin: 6
    damageMax: 13
    speed: 8
    morale: 11
    xp: 26
    gold: 31
    inflicts: { status: sleep, chance: 24 }
    weaknesses: { current: 1.3 }
    role: status
    dangerTier: 4
    level: 6
    size: medium
    elevation: ground
    tags: [machine, medical, status]
  - id: enemy.tl6f.archive-pallbearer
    name: Archive Pallbearer
    locales: { ja: { name: 記録運搬棺 } }
    hp: 78
    attack: 14
    armor: 7
    accuracy: 77
    damageMin: 9
    damageMax: 16
    speed: 4
    morale: 12
    xp: 49
    gold: 48
    abilities:
      - name: Case File Collapse
        locales: { ja: { name: 症例簿崩し } }
        chance: 38
        target: back
        effect: { kind: damage, min: 8, max: 15, element: signal }
    weaknesses: { rust: 1.6, current: 0.75 }
    role: miniboss
    dangerTier: 4
    level: 6
    size: large
    elevation: ground
    tags: [machine, guardian, archive]
  # ---- F7-F10: bureau, lift, and terminus ----
  - id: enemy.tl7f.clearance-bailiff
    name: Clearance Bailiff
    locales: { ja: { name: 許可執行官 } }
    hp: 66
    attack: 15
    armor: 8
    accuracy: 81
    damageMin: 9
    damageMax: 17
    speed: 7
    morale: 12
    xp: 42
    gold: 45
    inflicts: { status: fear, chance: 25 }
    weaknesses: { signal: 1.3, physical: 0.85 }
    role: blocker
    dangerTier: 4
    level: 7
    size: large
    elevation: ground
    tags: [human, security, blocker]
  - id: enemy.tl8f.signal-marshal
    name: Signal Marshal
    locales: { ja: { name: 信号統制官 } }
    hp: 58
    attack: 16
    armor: 6
    accuracy: 84
    damageMin: 9
    damageMax: 18
    speed: 10
    morale: 12
    xp: 47
    gold: 50
    abilities:
      - name: Red Aspect
        locales: { ja: { name: 赤信号相 } }
        chance: 38
        target: back
        effect: { kind: damage, min: 8, max: 16, element: signal }
    weaknesses: { current: 1.25 }
    role: caster
    dangerTier: 5
    level: 8
    size: medium
    elevation: ground
    tags: [machine, signal, ranged]
  - id: enemy.tl9f.lift-custodian
    name: Lift Custodian
    locales: { ja: { name: 昇降機管理機 } }
    hp: 104
    attack: 19
    armor: 11
    accuracy: 79
    damageMin: 12
    damageMax: 22
    speed: 4
    morale: 12
    xp: 75
    gold: 70
    abilities:
      - name: Counterweight Drop
        locales: { ja: { name: 釣合い錘の落下 } }
        chance: 36
        target: front
        effect: { kind: damage, min: 13, max: 23, element: physical }
    weaknesses: { rust: 1.45, current: 0.8 }
    role: miniboss
    dangerTier: 5
    level: 9
    size: huge
    elevation: ground
    tags: [machine, guardian, lift]
  - id: enemy.tl10f.zero-line-stationmaster
    name: Zero-Line Stationmaster
    locales: { ja: { name: 零番線駅務長 } }
    hp: 166
    attack: 23
    armor: 13
    accuracy: 83
    damageMin: 15
    damageMax: 28
    speed: 7
    morale: 12
    xp: 150
    gold: 140
    abilities:
      - name: Collection Chime
        locales: { ja: { name: 回収チャイム } }
        chance: 40
        target: back
        effect: { kind: damage, min: 13, max: 25, element: signal }
      - name: Final Departure
        locales: { ja: { name: 最終発車 } }
        chance: 28
        target: front
        effect: { kind: status, status: fear }
    weaknesses: { rust: 1.7, current: 0.7 }
    role: boss
    dangerTier: 6
    level: 10
    size: huge
    elevation: ground
    isBoss: true
    tags: [machine, boss, truefinale, terminus]
---

# 終端隔離線の敵カタログ

F1/F2は改札機・四足・医療機を、F3以降は中継保守・雨水／補給／記録・統制／昇降／終端をそれぞれ固有の
シルエットで分ける。守護者は通常遭遇表に混ぜず、玄室が参照する専用表に置く。

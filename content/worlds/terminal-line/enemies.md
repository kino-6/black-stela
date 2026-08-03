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
---

# F1/F2の敵カタログ

人型は一体だけに留め、四足・医療機・改札機が同じ戦闘レーンで形と高さから見分けられるようにする。

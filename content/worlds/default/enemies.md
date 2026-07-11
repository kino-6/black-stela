---
enemies:
  - id: enemy.b1f.ash-slime
    name: Ash Slime
    locales:
      ja:
        name: 灰泥
    hp: 4
    attack: 1
    armor: 0
    accuracy: 70
    damageMin: 1
    damageMax: 2
    speed: 4
    morale: 7
    xp: 1
    gold: 2
    role: attrition
    dangerTier: 1
    tags: [tutorial, slime]
  - id: enemy.b1f.dust-crawler
    name: Dust Crawler
    locales:
      ja:
        name: 塵這い
    hp: 6
    attack: 3
    armor: 0
    accuracy: 68
    damageMin: 2
    damageMax: 5
    speed: 5
    morale: 6
    xp: 2
    gold: 3
    role: attrition
    dangerTier: 1
    weaknesses:
      fire: 1.5
    tags: [beast]
  - id: enemy.b2f.hook-rat
    name: Hook Rat
    locales:
      ja:
        name: 鉤鼠
    hp: 5
    attack: 3
    armor: 0
    accuracy: 75
    damageMin: 3
    damageMax: 5
    speed: 8
    morale: 6
    xp: 2
    gold: 3
    role: ambusher
    dangerTier: 2
    tags: [beast]
  # Squad pair: the warden shields the caller from melee. Mashing Attack barely
  # dents the warden (physical 0.5); fire cuts it, or a spell reaches the caller.
  - id: enemy.b2f.ash-warden
    name: Ash Warden
    locales:
      ja:
        name: 灰の番衛
    hp: 16
    attack: 3
    armor: 3
    accuracy: 70
    damageMin: 2
    damageMax: 4
    speed: 3
    morale: 10
    xp: 4
    gold: 5
    role: blocker
    weaknesses:
      physical: 0.5
      fire: 1.5
    dangerTier: 2
    tags: [construct]
    elevation: ground
  - id: enemy.b2f.ash-caller
    name: Ash Caller
    locales:
      ja:
        name: 灰の呼び手
    hp: 5
    attack: 2
    armor: 0
    accuracy: 65
    damageMin: 2
    damageMax: 3
    speed: 6
    morale: 6
    xp: 5
    gold: 6
    role: caster
    weaknesses:
      physical: 1.5
    dangerTier: 2
    tags: [caster]
    elevation: air
    abilities:
      - name: Cinder Lash
        chance: 80
        effect:
          kind: damage
          min: 3
          max: 5
          element: fire
  - id: enemy.b3f.bitter-mote
    name: Bitter Mote
    locales:
      ja:
        name: 苦い塵
    hp: 6
    attack: 3
    armor: 0
    accuracy: 70
    damageMin: 3
    damageMax: 5
    speed: 6
    morale: 8
    xp: 3
    gold: 4
    role: status
    inflicts:
      status: poison
      chance: 45
    weaknesses:
      fire: 1.5
    dangerTier: 3
    tags: [status]
    elevation: air
  - id: enemy.b4f.lantern-ward
    name: Lantern Ward
    locales:
      ja:
        name: 灯守
    hp: 13
    attack: 5
    armor: 2
    accuracy: 70
    damageMin: 4
    damageMax: 7
    speed: 3
    morale: 10
    xp: 4
    gold: 6
    role: blocker
    dangerTier: 3
    tags: [construct]
    elevation: mid
    abilities:
      - name: Lantern Flare
        chance: 40
        effect:
          kind: damage
          min: 3
          max: 6
          element: fire
      - name: Blinding Glare
        chance: 30
        effect:
          kind: status
          status: fear
  - id: enemy.b5f.cinder-keeper
    name: Cinder Keeper
    locales:
      ja:
        name: 灰燼の番人
    hp: 22
    attack: 5
    armor: 2
    accuracy: 82
    damageMin: 4
    damageMax: 8
    speed: 5
    morale: 11
    xp: 7
    gold: 12
    role: miniboss
    dangerTier: 4
    isBoss: true
    tags: [midpoint, boss]
    weaknesses:
      fire: 0.5
  - id: enemy.b3f.cistern-warden
    name: Cistern Warden
    locales:
      ja:
        name: 貯水の番人
    hp: 17
    attack: 5
    armor: 1
    accuracy: 82
    damageMin: 4
    damageMax: 7
    speed: 6
    morale: 10
    xp: 5
    gold: 9
    role: miniboss
    dangerTier: 2
    isBoss: true
    tags: [block-cap, boss]
  - id: enemy.b6f.oath-warden
    name: Oath Warden
    locales:
      ja:
        name: 誓いの番人
    hp: 26
    attack: 6
    armor: 2
    accuracy: 84
    damageMin: 5
    damageMax: 8
    speed: 6
    morale: 11
    xp: 9
    gold: 15
    role: miniboss
    dangerTier: 4
    isBoss: true
    tags: [block-cap, boss]
  - id: enemy.b6f.oath-cutter
    name: Oath Cutter
    locales:
      ja:
        name: 誓い断ち
    hp: 11
    attack: 4
    armor: 1
    accuracy: 80
    damageMin: 3
    damageMax: 6
    speed: 9
    morale: 8
    xp: 5
    gold: 8
    role: ambusher
    dangerTier: 4
    tags: [blade]
  - id: enemy.b7f.vault-husk
    name: Vault Husk
    locales:
      ja:
        name: 納骨殻
    hp: 13
    attack: 5
    armor: 3
    accuracy: 74
    damageMin: 4
    damageMax: 6
    speed: 3
    morale: 10
    xp: 6
    gold: 10
    role: blocker
    dangerTier: 5
    tags: [optional]
  - id: enemy.b8f.ash-votary
    name: Ash Votary
    locales:
      ja:
        name: 灰の奉者
    hp: 28
    attack: 6
    armor: 3
    accuracy: 84
    damageMin: 5
    damageMax: 8
    speed: 6
    morale: 12
    xp: 13
    gold: 20
    role: boss
    dangerTier: 5
    isBoss: true
    tags: [finale, boss]
---

# Enemies

Enemy families are original to Black Stela and grouped by tactical role.

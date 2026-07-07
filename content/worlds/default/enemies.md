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
    xp: 3
    gold: 2
    role: attrition
    dangerTier: 1
    tags: [tutorial, slime]
  - id: enemy.b2f.hook-rat
    name: Hook Rat
    locales:
      ja:
        name: 鉤鼠
    hp: 5
    attack: 2
    armor: 0
    accuracy: 75
    damageMin: 1
    damageMax: 3
    speed: 8
    morale: 6
    xp: 5
    gold: 3
    role: ambusher
    dangerTier: 2
    tags: [beast]
  - id: enemy.b3f.bitter-mote
    name: Bitter Mote
    locales:
      ja:
        name: 苦い塵
    hp: 6
    attack: 2
    armor: 0
    accuracy: 70
    damageMin: 1
    damageMax: 2
    speed: 6
    morale: 8
    xp: 7
    gold: 4
    role: status
    inflicts:
      status: poison
      chance: 45
    weaknesses:
      fire: 1.5
    dangerTier: 3
    tags: [status]
  - id: enemy.b4f.lantern-ward
    name: Lantern Ward
    locales:
      ja:
        name: 灯守
    hp: 8
    attack: 3
    armor: 2
    accuracy: 70
    damageMin: 2
    damageMax: 4
    speed: 3
    morale: 10
    xp: 9
    gold: 6
    role: blocker
    dangerTier: 3
    tags: [construct]
  - id: enemy.b5f.cinder-keeper
    name: Cinder Keeper
    locales:
      ja:
        name: 灰燼の番人
    hp: 14
    attack: 4
    armor: 2
    accuracy: 80
    damageMin: 3
    damageMax: 5
    speed: 5
    morale: 11
    xp: 18
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
    hp: 11
    attack: 3
    armor: 1
    accuracy: 78
    damageMin: 2
    damageMax: 5
    speed: 6
    morale: 10
    xp: 12
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
    hp: 18
    attack: 5
    armor: 2
    accuracy: 82
    damageMin: 3
    damageMax: 6
    speed: 6
    morale: 11
    xp: 22
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
    hp: 10
    attack: 4
    armor: 1
    accuracy: 80
    damageMin: 2
    damageMax: 5
    speed: 9
    morale: 8
    xp: 12
    gold: 8
    role: ambusher
    dangerTier: 4
    tags: [blade]
  - id: enemy.b7f.vault-husk
    name: Vault Husk
    locales:
      ja:
        name: 納骨殻
    hp: 12
    attack: 4
    armor: 3
    accuracy: 70
    damageMin: 3
    damageMax: 5
    speed: 3
    morale: 10
    xp: 14
    gold: 10
    role: blocker
    dangerTier: 5
    tags: [optional]
  - id: enemy.b8f.ash-votary
    name: Ash Votary
    locales:
      ja:
        name: 灰の奉者
    hp: 22
    attack: 5
    armor: 3
    accuracy: 82
    damageMin: 4
    damageMax: 6
    speed: 6
    morale: 12
    xp: 32
    gold: 20
    role: boss
    dangerTier: 5
    isBoss: true
    tags: [finale, boss]
---

# Enemies

Enemy families are original to Black Stela and grouped by tactical role.

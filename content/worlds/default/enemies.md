---
enemies:
  - id: enemy.b1f.ash-slime
    weaknesses: { fire: 1.5 }
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
    size: small
    dangerTier: 1
    tags: [tutorial, slime]
  - id: enemy.b1f.dust-crawler
    weaknesses: { fire: 1.5 }
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
    size: small
    dangerTier: 1
    tags: [beast]
  - id: enemy.b2f.hook-rat
    weaknesses: { fire: 1.25 }
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
    size: small
    dangerTier: 2
    tags: [beast]
  # Squad pair: the warden shields the caller from melee. Mashing Attack barely
  # dents the warden (physical 0.5); fire cuts it, or a spell reaches the caller.
  - id: enemy.b2f.ash-warden
    weaknesses: { physical: 0.5, salt: 1.5 }
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
    size: large
    dangerTier: 2
    tags: [construct]
    elevation: ground
  - id: enemy.b2f.ash-caller
    weaknesses: { fire: 0.5, salt: 1.75 }
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
    size: medium
    dangerTier: 2
    tags: [caster]
    elevation: air
    abilities:
      - name: Cinder Lash
        chance: 55
        effect:
          kind: damage
          min: 3
          max: 5
          element: fire
      # §9.4e: the caller SILENCES. A caster whose only trick was damage gave the party's own casters
      # nothing to fear and left `silence` unused by the entire world.
      - name: Ash-Choke
        chance: 25
        effect:
          kind: status
          status: silence
  - id: enemy.b3f.bitter-mote
    weaknesses: { fire: 0.5, salt: 2.0 }
    name: Bitter Mote
    locales:
      ja:
        name: 苦い塵
    hp: 6
    attack: 3
    armor: 0
    accuracy: 70
    damageMin: 3
    damageMax: 7
    speed: 6
    morale: 8
    xp: 3
    gold: 4
    role: status
    size: small
    inflicts:
      status: poison
      chance: 45
    dangerTier: 3
    tags: [status]
    elevation: air
  - id: enemy.b4f.lantern-ward
    weaknesses: { fire: 0.5, salt: 1.5 }
    name: Lantern Ward
    locales:
      ja:
        name: 灯守
    hp: 13
    attack: 8
    armor: 2
    accuracy: 70
    damageMin: 4
    damageMax: 13
    speed: 3
    morale: 10
    xp: 4
    gold: 6
    role: blocker
    size: large
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
      # §9.4e: `sleep` was inflicted by NOTHING in the game, so every ward and cure that names it was
      # dead content. A slow, droning lantern is where it belongs.
      - name: Dimming Drone
        chance: 25
        effect:
          kind: status
          status: sleep
  - id: enemy.b5f.cinder-keeper
    weaknesses: { fire: 0.5, salt: 1.75 }
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
    size: large
    dangerTier: 4
    isBoss: true
    tags: [midpoint, boss]
  - id: enemy.b3f.cistern-warden
    weaknesses: { fire: 0.5, salt: 2.0 }
    name: Cistern Warden
    locales:
      ja:
        name: 貯水の番人
    hp: 17
    attack: 6
    armor: 1
    accuracy: 82
    damageMin: 4
    damageMax: 9
    speed: 6
    morale: 10
    xp: 5
    gold: 9
    role: miniboss
    size: large
    dangerTier: 2
    isBoss: true
    tags: [block-cap, boss]
  - id: enemy.b6f.oath-warden
    weaknesses: { salt: 1.5, star: 1.5 }
    name: Oath Warden
    locales:
      ja:
        name: 誓いの番人
    hp: 26
    attack: 8
    armor: 2
    accuracy: 84
    damageMin: 5
    damageMax: 10
    speed: 6
    morale: 11
    xp: 9
    gold: 15
    role: miniboss
    size: large
    dangerTier: 4
    isBoss: true
    tags: [block-cap, boss]
  # §9.4e: a late ambusher that opens with FEAR — the ward line has to be worth a slot deep in the run,
  # where a party can afford both a Chanter and the gear to back one.
  - id: enemy.b6f.oath-cutter
    weaknesses: { fire: 1.25, salt: 1.25 }
    name: Oath Cutter
    locales:
      ja:
        name: 誓い断ち
    hp: 11
    attack: 5
    armor: 1
    accuracy: 80
    damageMin: 3
    damageMax: 8
    speed: 9
    morale: 8
    xp: 5
    gold: 8
    role: ambusher
    size: medium
    # §9.4e: a late ambusher that opens with FEAR. The world presented poison and silence in quantity —
    # both answered by CURES — and almost no fear or sleep, which are what WARDS answer, so the Chanter's
    # whole line had nothing to stop. The threat mix is what was wrong, not the ward.
    inflicts:
      status: fear
      chance: 35
    dangerTier: 4
    tags: [blade]
  - id: enemy.b7f.vault-husk
    weaknesses: { fire: 1.75 }
    name: Vault Husk
    locales:
      ja:
        name: 納骨殻
    hp: 13
    attack: 3
    armor: 3
    accuracy: 74
    damageMin: 4
    damageMax: 4
    speed: 3
    morale: 10
    xp: 6
    gold: 10
    role: blocker
    size: large
    dangerTier: 5
    tags: [optional]
  - id: enemy.b8f.ash-votary
    weaknesses: { star: 2.0, fire: 0.4, salt: 0.4 }
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
    size: huge
    dangerTier: 5
    isBoss: true
    tags: [finale, boss]
  - id: enemy.rare.ashsilver-glimmer
    name: Ashsilver Glimmer
    locales:
      ja:
        name: 灰銀の残光
    hp: 8
    attack: 3
    armor: 12
    accuracy: 60
    damageMin: 1
    damageMax: 3
    speed: 12
    morale: 2
    xp: 60
    gold: 30
    weaknesses: { star: 2.5, physical: 0.1, fire: 0.1, salt: 0.1 }
    role: attrition
    size: small
    dangerTier: 2
    prizedXp: true
    tags: [rare, prized]
---

# Enemies

Enemy families are original to Black Stela and grouped by tactical role.

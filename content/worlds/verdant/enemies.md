---
# Verdant roster — 6 trash + 2 squad + 6 miniboss/boss, mirroring default's roles.
# Stats scale by act (rough; balanced against descentSim in V4). Green/spore/sap flavour.
enemies:
  # ---- Act I trash (G1-G3) ----
  - id: enemy.verdant.g1.moss-mite
    name: Moss Mite
    locales: { ja: { name: 苔だに } }
    hp: 5
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
    tags: [tutorial, spore]
  - id: enemy.verdant.g1.spore-gnat
    name: Spore Gnat
    locales: { ja: { name: 胞子蚋 } }
    hp: 4
    attack: 2
    armor: 0
    accuracy: 72
    damageMin: 1
    damageMax: 3
    speed: 6
    morale: 6
    xp: 1
    gold: 2
    role: attrition
    weaknesses: { fire: 1.5 }
    tags: [swarm, insect]
  - id: enemy.verdant.g2.thorn-crawler
    name: Thorn Crawler
    locales: { ja: { name: 棘這い } }
    hp: 8
    attack: 3
    armor: 1
    accuracy: 68
    damageMin: 2
    damageMax: 4
    speed: 5
    morale: 6
    xp: 2
    gold: 3
    role: attrition
    tags: [beast, thorn]
  # ---- Act I squad (G2 front-blocker + back-caster) ----
  - id: enemy.verdant.g2.bramble-shield
    name: Bramble Shield
    locales: { ja: { name: 茨の盾 } }
    hp: 16
    attack: 3
    armor: 3
    accuracy: 66
    damageMin: 2
    damageMax: 4
    speed: 3
    morale: 8
    xp: 3
    gold: 4
    role: blocker
    dangerTier: 2
    tags: [blocker, thorn, front]
  - id: enemy.verdant.g2.spore-caster
    name: Spore Caster
    locales: { ja: { name: 胞子詠み } }
    hp: 10
    attack: 4
    armor: 0
    accuracy: 74
    damageMin: 3
    damageMax: 6
    speed: 5
    morale: 6
    xp: 3
    gold: 4
    role: caster
    dangerTier: 2
    weaknesses: { fire: 1.5 }
    tags: [caster, spore, status]
  # ---- Act II trash (G4-G6) ----
  - id: enemy.verdant.g4.pollen-drifter
    name: Pollen Drifter
    locales: { ja: { name: 花粉漂い } }
    hp: 14
    attack: 5
    armor: 1
    accuracy: 72
    damageMin: 3
    damageMax: 6
    speed: 6
    morale: 6
    xp: 3
    gold: 5
    role: attrition
    tags: [spore, status]
  - id: enemy.verdant.g6.thorn-cutter
    name: Thorn Cutter
    locales: { ja: { name: 棘断ち } }
    hp: 16
    attack: 7
    armor: 1
    accuracy: 74
    damageMin: 4
    damageMax: 8
    speed: 7
    morale: 7
    xp: 4
    gold: 6
    role: ambusher
    dangerTier: 3
    tags: [ambusher, thorn]
  # ---- Act III trash (G7-G8) ----
  - id: enemy.verdant.g7.husk-spawn
    name: Husk Spawn
    locales: { ja: { name: 殻の仔 } }
    hp: 20
    attack: 8
    armor: 2
    accuracy: 70
    damageMin: 5
    damageMax: 9
    speed: 5
    morale: 7
    xp: 5
    gold: 8
    role: attrition
    dangerTier: 3
    tags: [husk, heartwood]
  # ---- Mini-bosses / boss (keep chokes) ----
  - id: enemy.verdant.g3.bloom-warden
    name: Bloom Warden
    locales: { ja: { name: 花守り } }
    hp: 22
    attack: 5
    armor: 1
    accuracy: 72
    damageMin: 3
    damageMax: 7
    speed: 5
    morale: 9
    xp: 6
    gold: 10
    role: miniboss
    dangerTier: 3
    weaknesses: { fire: 1.5 }
    tags: [miniboss, spore, status]
  - id: enemy.verdant.g4.bark-ward
    name: Bark Ward
    locales: { ja: { name: 樹皮衛 } }
    hp: 28
    attack: 6
    armor: 5
    accuracy: 68
    damageMin: 3
    damageMax: 6
    speed: 3
    morale: 9
    xp: 7
    gold: 12
    role: miniboss
    dangerTier: 3
    tags: [miniboss, blocker, bark]
  - id: enemy.verdant.g5.sap-keeper
    name: Sap Keeper
    locales: { ja: { name: 樹液守り } }
    hp: 32
    attack: 7
    armor: 2
    accuracy: 72
    damageMin: 4
    damageMax: 8
    speed: 5
    morale: 10
    xp: 9
    gold: 16
    role: miniboss
    dangerTier: 4
    tags: [miniboss, sap, toll]
  - id: enemy.verdant.g6.strangler-warden
    name: Strangler Warden
    locales: { ja: { name: 絞め殺しの番人 } }
    hp: 36
    attack: 8
    armor: 3
    accuracy: 72
    damageMin: 5
    damageMax: 9
    speed: 5
    morale: 10
    xp: 10
    gold: 18
    role: miniboss
    dangerTier: 4
    tags: [miniboss, thorn]
  - id: enemy.verdant.g7.heartwood-husk
    name: Heartwood Husk
    locales: { ja: { name: 樹心の殻守 } }
    hp: 42
    attack: 9
    armor: 6
    accuracy: 70
    damageMin: 5
    damageMax: 10
    speed: 4
    morale: 11
    xp: 12
    gold: 20
    role: miniboss
    dangerTier: 4
    tags: [miniboss, blocker, heartwood]
  - id: enemy.verdant.g8.rootheart
    name: Rootheart
    locales: { ja: { name: 樹心の主 } }
    hp: 70
    attack: 11
    armor: 4
    accuracy: 74
    damageMin: 6
    damageMax: 12
    speed: 6
    morale: 12
    xp: 30
    gold: 50
    role: boss
    isBoss: true
    dangerTier: 5
    weaknesses: { fire: 1.5 }
    tags: [boss, heartwood, finale]
---

# Verdant enemies

The green descent's roster. Trash by act (mite/gnat → crawler/drifter/cutter →
husk), the G2 bramble-shield + spore-caster squad, and six keep chokes ending at
the Rootheart. Stats are first-pass; V4 tunes them against descentSim.

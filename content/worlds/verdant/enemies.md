---
# Verdant roster — 6 trash + 2 squad + 6 miniboss/boss, mirroring default's roles.
# Stats scale by act (rough; balanced against descentSim in V4). Green/spore/sap flavour.
enemies:
  # ---- Act I trash (G1-G3) ----
  - id: enemy.verdant.g1.moss-mite
    name: Moss Mite
    locales: { ja: { name: 苔虫 } }
    hp: 5
    attack: 2
    armor: 0
    accuracy: 70
    damageMin: 1
    damageMax: 4
    speed: 4
    morale: 7
    xp: 1
    gold: 2
    role: attrition
    size: small
    dangerTier: 1
    tags: [tutorial, spore]
  - id: enemy.verdant.g1.spore-gnat
    name: Spore Gnat
    locales: { ja: { name: 胞子蝿 } }
    hp: 4
    attack: 3
    armor: 0
    accuracy: 72
    damageMin: 1
    damageMax: 3
    speed: 6
    morale: 6
    xp: 1
    gold: 2
    role: attrition
    size: small
    weaknesses: { fire: 1.5 }
    tags: [swarm, insect]
  - id: enemy.verdant.g2.thorn-crawler
    name: Thorn Crawler
    locales: { ja: { name: 棘虫 } }
    hp: 8
    attack: 3
    armor: 1
    accuracy: 68
    damageMin: 2
    damageMax: 5
    speed: 5
    morale: 6
    xp: 2
    gold: 3
    role: attrition
    size: small
    tags: [beast, thorn]
  # ---- Act I squad (G2 front-blocker + back-caster) ----
  - id: enemy.verdant.g2.bramble-shield
    name: Bramble Shield
    locales: { ja: { name: 茨の盾 } }
    hp: 16
    attack: 2
    armor: 3
    accuracy: 66
    damageMin: 2
    damageMax: 3
    speed: 3
    morale: 8
    xp: 3
    gold: 4
    role: blocker
    size: large
    dangerTier: 2
    tags: [blocker, thorn, front]
  - id: enemy.verdant.g2.spore-caster
    name: Spore Caster
    locales: { ja: { name: 胞子撒き } }
    hp: 10
    attack: 4
    armor: 0
    accuracy: 74
    damageMin: 3
    damageMax: 5
    speed: 5
    morale: 6
    xp: 3
    gold: 4
    role: caster
    size: medium
    dangerTier: 2
    weaknesses: { fire: 1.5 }
    tags: [caster, spore, status]
  # ---- Act II trash (G4-G6) ----
  - id: enemy.verdant.g4.pollen-drifter
    name: Pollen Drifter
    locales: { ja: { name: 花粉の靄 } }
    hp: 14
    attack: 3
    armor: 1
    accuracy: 72
    damageMin: 3
    damageMax: 5
    speed: 6
    morale: 6
    xp: 3
    gold: 5
    role: attrition
    size: medium
    tags: [spore, status]
  - id: enemy.verdant.g6.thorn-cutter
    name: Thorn Cutter
    locales: { ja: { name: 茨斬り } }
    hp: 16
    attack: 4
    armor: 1
    accuracy: 74
    damageMin: 4
    damageMax: 5
    speed: 7
    morale: 7
    xp: 4
    gold: 6
    role: ambusher
    size: medium
    dangerTier: 3
    tags: [ambusher, thorn]
  # ---- Act III trash (G7-G8) ----
  - id: enemy.verdant.g7.husk-spawn
    name: Husk Spawn
    locales: { ja: { name: 殻の子 } }
    hp: 20
    attack: 4
    armor: 2
    accuracy: 70
    damageMin: 5
    damageMax: 5
    speed: 5
    morale: 7
    xp: 5
    gold: 8
    role: attrition
    size: small
    dangerTier: 3
    tags: [husk, heartwood]
  # ---- Mini-bosses / boss (keep chokes) ----
  - id: enemy.verdant.g3.bloom-warden
    name: Bloom Warden
    locales: { ja: { name: 花の番人 } }
    hp: 18
    attack: 4
    armor: 1
    accuracy: 72
    damageMin: 3
    damageMax: 6
    speed: 5
    morale: 9
    xp: 6
    gold: 10
    role: miniboss
    size: large
    dangerTier: 3
    weaknesses: { fire: 1.5 }
    tags: [miniboss, spore, status]
  - id: enemy.verdant.g4.bark-ward
    name: Bark Ward
    locales: { ja: { name: 樹皮の守り手 } }
    hp: 24
    attack: 4
    armor: 4
    accuracy: 68
    damageMin: 3
    damageMax: 5
    speed: 3
    morale: 9
    xp: 7
    gold: 12
    role: miniboss
    size: large
    dangerTier: 3
    tags: [miniboss, blocker, bark]
  - id: enemy.verdant.g5.sap-keeper
    name: Sap Keeper
    locales: { ja: { name: 樹液の番人 } }
    hp: 28
    attack: 5
    armor: 2
    accuracy: 72
    damageMin: 4
    damageMax: 7
    speed: 5
    morale: 10
    xp: 9
    gold: 16
    role: miniboss
    size: large
    dangerTier: 4
    tags: [miniboss, sap, toll]
  - id: enemy.verdant.g6.strangler-warden
    name: Strangler Warden
    locales: { ja: { name: 絞め殺しの番人 } }
    hp: 24
    attack: 7
    armor: 3
    accuracy: 72
    damageMin: 5
    damageMax: 8
    speed: 5
    morale: 10
    xp: 10
    gold: 18
    role: miniboss
    size: large
    dangerTier: 4
    tags: [miniboss, thorn]
  - id: enemy.verdant.g7.heartwood-husk
    name: Heartwood Husk
    locales: { ja: { name: 朽木の殻 } }
    hp: 30
    attack: 5
    armor: 4
    accuracy: 70
    damageMin: 5
    damageMax: 7
    speed: 4
    morale: 11
    xp: 12
    gold: 20
    role: miniboss
    size: large
    dangerTier: 4
    tags: [miniboss, blocker, heartwood]
  - id: enemy.verdant.g8.rootheart
    name: Rootheart
    locales: { ja: { name: 大樹の心臓 } }
    hp: 50
    attack: 7
    armor: 3
    accuracy: 74
    damageMin: 8
    damageMax: 9
    speed: 6
    morale: 12
    xp: 30
    gold: 50
    role: boss
    size: huge
    isBoss: true
    dangerTier: 5
    weaknesses: { fire: 1.5 }
    tags: [boss, heartwood, finale]
---

# Verdant enemies

The green descent's roster. Trash by act (mite/gnat → crawler/drifter/cutter →
husk), the G2 bramble-shield + spore-caster squad, and six keep chokes ending at
the Rootheart. Stats are first-pass; V4 tunes them against descentSim.

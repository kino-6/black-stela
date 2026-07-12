---
# Verdant encounter tables. `pack` = chamber/corridor trash per floor (first-contact:
# each type fought once/run); `keep` = the single miniboss/boss choke (G3-G8).
encounterTables:
  - id: encounters.verdant.g1.pack
    floorId: dungeon.verdant.g1f
    groupsMax: 2
    entries:
      - { enemyId: enemy.verdant.g1.moss-mite, weight: 10, minCount: 4, maxCount: 5 }
      - { enemyId: enemy.verdant.g1.spore-gnat, weight: 7, minCount: 1, maxCount: 2 }
  - id: encounters.verdant.g2.pack
    floorId: dungeon.verdant.g2f
    groupsMax: 2
    entries:
      - { enemyId: enemy.verdant.g1.spore-gnat, weight: 8, minCount: 2, maxCount: 3 }
      - { enemyId: enemy.verdant.g2.thorn-crawler, weight: 10, minCount: 1, maxCount: 2 }
  - id: encounters.verdant.g3.pack
    floorId: dungeon.verdant.g3f
    entries:
      - { enemyId: enemy.verdant.g2.thorn-crawler, weight: 10, minCount: 3, maxCount: 4 }
  - id: encounters.verdant.g4.pack
    floorId: dungeon.verdant.g4f
    groupsMax: 2
    entries:
      - { enemyId: enemy.verdant.g4.pollen-drifter, weight: 10, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.verdant.g2.thorn-crawler, weight: 5, minCount: 1, maxCount: 1 }
  - id: encounters.verdant.g5.pack
    floorId: dungeon.verdant.g5f
    entries:
      - { enemyId: enemy.verdant.g4.pollen-drifter, weight: 10, minCount: 1, maxCount: 2 }
  - id: encounters.verdant.g6.pack
    floorId: dungeon.verdant.g6f
    entries:
      - { enemyId: enemy.verdant.g6.thorn-cutter, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.verdant.g7.pack
    floorId: dungeon.verdant.g7f
    entries:
      - { enemyId: enemy.verdant.g7.husk-spawn, weight: 10, minCount: 1, maxCount: 2 }
  - id: encounters.verdant.g8.pack
    floorId: dungeon.verdant.g8f
    entries:
      - { enemyId: enemy.verdant.g7.husk-spawn, weight: 10, minCount: 1, maxCount: 2 }
  # ---- keep chokes (single miniboss/boss) ----
  - id: encounters.verdant.g3.keep
    floorId: dungeon.verdant.g3f
    entries:
      - { enemyId: enemy.verdant.g3.bloom-warden, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.verdant.g4.keep
    floorId: dungeon.verdant.g4f
    entries:
      - { enemyId: enemy.verdant.g4.bark-ward, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.verdant.g5.keep
    floorId: dungeon.verdant.g5f
    entries:
      - { enemyId: enemy.verdant.g5.sap-keeper, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.verdant.g6.keep
    floorId: dungeon.verdant.g6f
    entries:
      - { enemyId: enemy.verdant.g6.strangler-warden, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.verdant.g7.keep
    floorId: dungeon.verdant.g7f
    entries:
      - { enemyId: enemy.verdant.g7.heartwood-husk, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.verdant.g8.keep
    floorId: dungeon.verdant.g8f
    entries:
      - { enemyId: enemy.verdant.g8.rootheart, weight: 10, minCount: 1, maxCount: 1 }
---

# Verdant encounters

Per-floor trash packs (first-contact) and the six keep chokes. The G2 keep is a
squad (encounterSquad on the room), not a table. Counts/weights are first-pass;
V4 tunes against descentSim.

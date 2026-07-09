---
encounterTables:
  # Corridor/hall fights: smaller packs. Chambers (玄室) below run larger.
  - id: encounters.b1f.halls
    floorId: dungeon.b1f
    entries:
      - enemyId: enemy.b1f.ash-slime
        weight: 10
        minCount: 2
        maxCount: 3
  - id: encounters.b1f.chambers
    floorId: dungeon.b1f
    entries:
      - enemyId: enemy.b1f.ash-slime
        weight: 6
        minCount: 3
        maxCount: 4
      - enemyId: enemy.b1f.dust-crawler
        weight: 4
        minCount: 3
        maxCount: 4
  - id: encounters.b2f.branches
    floorId: dungeon.b2f
    entries:
      - enemyId: enemy.b1f.ash-slime
        weight: 6
        minCount: 3
        maxCount: 3
      - enemyId: enemy.b2f.hook-rat
        weight: 4
        minCount: 3
        maxCount: 3
  - id: encounters.b3f.cistern
    floorId: dungeon.b3f
    entries:
      - enemyId: enemy.b2f.hook-rat
        weight: 5
        minCount: 3
        maxCount: 3
      - enemyId: enemy.b3f.bitter-mote
        weight: 5
        minCount: 3
        maxCount: 3
  - id: encounters.b4f.dark
    floorId: dungeon.b4f
    entries:
      - enemyId: enemy.b4f.lantern-ward
        weight: 8
        minCount: 3
        maxCount: 3
  - id: encounters.b5f.gate
    floorId: dungeon.b5f
    entries:
      - enemyId: enemy.b4f.lantern-ward
        weight: 6
        minCount: 3
        maxCount: 3
      - enemyId: enemy.b5f.cinder-keeper
        weight: 1
        minCount: 1
        maxCount: 1
  - id: encounters.b6f.oaths
    floorId: dungeon.b6f
    entries:
      - enemyId: enemy.b6f.oath-cutter
        weight: 7
        minCount: 3
        maxCount: 3
      - enemyId: enemy.b4f.lantern-ward
        weight: 3
        minCount: 3
        maxCount: 3
  - id: encounters.b7f.vaults
    floorId: dungeon.b7f
    entries:
      - enemyId: enemy.b7f.vault-husk
        weight: 7
        minCount: 3
        maxCount: 3
      - enemyId: enemy.b6f.oath-cutter
        weight: 3
        minCount: 3
        maxCount: 3
  - id: encounters.b8f.gate
    floorId: dungeon.b8f
    entries:
      - enemyId: enemy.b7f.vault-husk
        weight: 4
        minCount: 3
        maxCount: 3
      - enemyId: enemy.b8f.ash-votary
        weight: 1
        minCount: 1
        maxCount: 1
---

# Encounter Tables

Encounter tables describe authored pressure by floor. Trash groups run three deep
so a full party has to actually fight; solitary bosses (Cinder Keeper, Ash Votary)
stay single.

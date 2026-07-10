---
encounterTables:
  # Corridor/hall fights: smaller packs. Chambers (玄室) below run larger.
  - id: encounters.b1f.halls
    floorId: dungeon.b1f
    # Corridors can field two kinds at once (slime pack + a crawler or two) so a
    # fight reads as a real group, not a lone monster. Both types already appear on
    # B1F, so the first-contact / balance model is unchanged.
    groupsMax: 2
    entries:
      - enemyId: enemy.b1f.ash-slime
        weight: 10
        minCount: 2
        maxCount: 3
      - enemyId: enemy.b1f.dust-crawler
        weight: 7
        minCount: 1
        maxCount: 2
  # Chambers roll ONLY a fresh type (the ash-slime is already down from B1F 002), so
  # a table can never "roll a defeated type and skip" — the玄室 fight is guaranteed.
  - id: encounters.b1f.chambers
    floorId: dungeon.b1f
    entries:
      - enemyId: enemy.b1f.dust-crawler
        weight: 10
        minCount: 3
        maxCount: 4
  # B2F's on-path table drops the already-beaten ash-slime so the landing always fights.
  - id: encounters.b2f.branches
    floorId: dungeon.b2f
    entries:
      - enemyId: enemy.b2f.hook-rat
        weight: 10
        minCount: 3
        maxCount: 3
  # Chamber table rolls only the fresh B3F type so the玄室 fight is guaranteed.
  - id: encounters.b3f.cistern
    floorId: dungeon.b3f
    entries:
      - enemyId: enemy.b3f.bitter-mote
        weight: 10
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

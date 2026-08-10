---
encounterTables:
  - id: encounters.tl1f.outer-gate
    floorId: dungeon.tl1f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl1f.drain-rat, weight: 10, minCount: 4, maxCount: 7 }
      - { enemyId: enemy.tl1f.baton-unit, weight: 6, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl1f.breath-collector, weight: 4, minCount: 1, maxCount: 1 }
  - id: encounters.tl1f.stationmaster
    floorId: dungeon.tl1f
    entries:
      - { enemyId: enemy.tl1f.unmanned-stationmaster, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.tl2f.platform
    floorId: dungeon.tl2f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl2f.cable-hound, weight: 10, minCount: 2, maxCount: 5 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl1f.breath-collector, weight: 4, minCount: 1, maxCount: 1 }
  - id: encounters.tl3f.relay
    floorId: dungeon.tl3f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl3f.relay-tick, weight: 10, minCount: 3, maxCount: 6 }
      - { enemyId: enemy.tl3f.platform-auditor, weight: 8, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 4, minCount: 1, maxCount: 1 }
  - id: encounters.tl3f.transfer-warden
    floorId: dungeon.tl3f
    entries:
      - { enemyId: enemy.tl3f.transfer-warden, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.tl4f.rainworks
    floorId: dungeon.tl4f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl4f.silt-lamprey, weight: 10, minCount: 3, maxCount: 6 }
      - { enemyId: enemy.tl4f.pump-sentinel, weight: 8, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl3f.platform-auditor, weight: 4, minCount: 1, maxCount: 1 }
  - id: encounters.tl5f.depot
    floorId: dungeon.tl5f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl5f.ration-porter, weight: 9, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl5f.cold-store-widow, weight: 8, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl4f.silt-lamprey, weight: 5, minCount: 3, maxCount: 6 }
  - id: encounters.tl6f.records
    floorId: dungeon.tl6f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl6f.quarantine-orderly, weight: 9, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl5f.cold-store-widow, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl4f.pump-sentinel, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl6f.records-vault
    floorId: dungeon.tl6f
    entries:
      - { enemyId: enemy.tl6f.archive-pallbearer, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.tl7f.bureau
    floorId: dungeon.tl7f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl7f.clearance-bailiff, weight: 9, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl6f.quarantine-orderly, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl8f.signal-marshal, weight: 4, minCount: 1, maxCount: 1 }
  - id: encounters.tl7f.boardroom
    floorId: dungeon.tl7f
    entries:
      - { enemyId: enemy.tl7f.clearance-bailiff, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.tl8f.control
    floorId: dungeon.tl8f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl8f.signal-marshal, weight: 9, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl7f.clearance-bailiff, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl6f.quarantine-orderly, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl8f.dispatch-guard
    floorId: dungeon.tl8f
    entries:
      - { enemyId: enemy.tl8f.signal-marshal, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.tl9f.liftworks
    floorId: dungeon.tl9f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl8f.signal-marshal, weight: 8, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl7f.clearance-bailiff, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl6f.quarantine-orderly, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl9f.operator-guard
    floorId: dungeon.tl9f
    entries:
      - { enemyId: enemy.tl9f.lift-custodian, weight: 10, minCount: 1, maxCount: 1 }
  - id: encounters.tl10f.terminus
    floorId: dungeon.tl10f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl8f.signal-marshal, weight: 8, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl7f.clearance-bailiff, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl6f.quarantine-orderly, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl10f.core
    floorId: dungeon.tl10f
    entries:
      - { enemyId: enemy.tl10f.zero-line-stationmaster, weight: 10, minCount: 1, maxCount: 1 }

  # ── depot side dungeon (T30/U5): farmable mid-game packs, reusing existing mid-tier enemies ──
  - id: encounters.tl-depot1.receiving
    floorId: dungeon.tl-depot1
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl1f.drain-rat, weight: 8, minCount: 4, maxCount: 7 }
      - { enemyId: enemy.tl5f.ration-porter, weight: 8, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl4f.silt-lamprey, weight: 5, minCount: 3, maxCount: 6 }
  - id: encounters.tl-depot1.foreman
    floorId: dungeon.tl-depot1
    entries:
      - { enemyId: enemy.tl5f.ration-porter, weight: 10, minCount: 2, maxCount: 4 }
  - id: encounters.tl-depot2.sorting
    floorId: dungeon.tl-depot2
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl5f.cold-store-widow, weight: 8, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl4f.pump-sentinel, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl5f.ration-porter, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl-depot2.office
    floorId: dungeon.tl-depot2
    entries:
      - { enemyId: enemy.tl5f.ration-porter, weight: 8, minCount: 2, maxCount: 3 }
      - { enemyId: enemy.tl5f.cold-store-widow, weight: 6, minCount: 1, maxCount: 2 }
  - id: encounters.tl-depot3.strongroom
    floorId: dungeon.tl-depot3
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl7f.clearance-bailiff, weight: 8, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl6f.quarantine-orderly, weight: 6, minCount: 1, maxCount: 2 }
  - id: encounters.tl-depot3.vault
    floorId: dungeon.tl-depot3
    entries:
      - { enemyId: enemy.tl6f.archive-pallbearer, weight: 10, minCount: 1, maxCount: 1 }
      - { enemyId: enemy.tl7f.clearance-bailiff, weight: 6, minCount: 1, maxCount: 2 }
---

# 終端隔離線の遭遇

F1/F2は第一幕の低層表、F3–F10は固有敵を持つ深度帯である。各到着セルには遭遇表を置かない。玄室は
ランダム表を流用せず、守護者専用表を参照する。

---
encounterTables:
  - id: encounters.tl1f.outer-gate
    floorId: dungeon.tl1f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl1f.drain-rat, weight: 10, minCount: 2, maxCount: 4 }
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
      - { enemyId: enemy.tl2f.cable-hound, weight: 10, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl1f.breath-collector, weight: 4, minCount: 1, maxCount: 1 }
  - id: encounters.tl3f.relay
    floorId: dungeon.tl3f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl2f.cable-hound, weight: 8, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl1f.baton-unit, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl4f.rainworks
    floorId: dungeon.tl4f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl2f.cable-hound, weight: 8, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl1f.breath-collector, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl5f.depot
    floorId: dungeon.tl5f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 8, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl1f.baton-unit, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl2f.cable-hound, weight: 5, minCount: 2, maxCount: 3 }
  - id: encounters.tl6f.records
    floorId: dungeon.tl6f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl1f.breath-collector, weight: 8, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 7, minCount: 1, maxCount: 2 }
      - { enemyId: enemy.tl1f.baton-unit, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl7f.bureau
    floorId: dungeon.tl7f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl1f.baton-unit, weight: 8, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 7, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl1f.breath-collector, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl8f.control
    floorId: dungeon.tl8f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl2f.cable-hound, weight: 7, minCount: 2, maxCount: 3 }
      - { enemyId: enemy.tl1f.baton-unit, weight: 7, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 6, minCount: 1, maxCount: 3 }
  - id: encounters.tl9f.liftworks
    floorId: dungeon.tl9f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl1f.baton-unit, weight: 8, minCount: 2, maxCount: 3 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 7, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl2f.cable-hound, weight: 5, minCount: 2, maxCount: 4 }
  - id: encounters.tl10f.terminus
    floorId: dungeon.tl10f
    groupsMax: 2
    entries:
      - { enemyId: enemy.tl1f.baton-unit, weight: 8, minCount: 2, maxCount: 3 }
      - { enemyId: enemy.tl2f.rain-reclaimer, weight: 7, minCount: 1, maxCount: 3 }
      - { enemyId: enemy.tl1f.breath-collector, weight: 5, minCount: 1, maxCount: 2 }
  - id: encounters.tl10f.core
    floorId: dungeon.tl10f
    entries:
      - { enemyId: enemy.tl1f.unmanned-stationmaster, weight: 10, minCount: 1, maxCount: 1 }
---

# 終端隔離線の遭遇

F1/F2は第一幕の低層表、F3–F10は深度データの骨格である。各到着セルには遭遇表を置かない。深層固有敵は
W4のアセット同時投入でこの暫定表から置き換えるため、ここで既存敵の名だけを変更して完了とはしない。

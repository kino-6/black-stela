---
id: dungeon.b6f
name: B6F - Narrow Oaths
level: 6
role: deep_route
dangerTier: 4
recommendedPartyLevel: 3
tags:
  - role-check
  - traps
  - block-2
  - block-cap
authorNotes: Stronger traps and role checks without hard-locking party builds.
startRoom: room.b6f.001
grid:
  cells:
    - id: cell.b6f.001
      roomId: room.b6f.001
      x: 0
      y: 0
      edges:
        west:
          kind: stairs
          targetRoomId: room.b5f.003
          targetFloorId: dungeon.b5f
        east:
          kind: open
          targetRoomId: room.b6f.002
          targetCellId: cell.b6f.002
    - id: cell.b6f.002
      roomId: room.b6f.002
      x: 1
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.b6f.001
          targetCellId: cell.b6f.001
        south:
          kind: open
          targetRoomId: room.b6f.003
          targetCellId: cell.b6f.003
    - id: cell.b6f.003
      roomId: room.b6f.003
      x: 1
      y: 1
      edges:
        north:
          kind: open
          targetRoomId: room.b6f.002
          targetCellId: cell.b6f.002
        east:
          kind: stairs
          targetRoomId: room.b7f.001
          targetFloorId: dungeon.b7f
rooms:
  - id: room.b6f.001
    name: Vow Passage
    description: Names are scratched into the wall, each crossed out by a different hand.
    locales:
      ja:
        name: 誓いの通路
        description: 壁に刻まれた名は、それぞれ別の手で線を引かれている。
    exits:
      west: room.b5f.003
      east: room.b6f.002
    encounterTable: encounters.b6f.oaths
  - id: room.b6f.002
    name: Needle Choir
    description: Thin metal reeds hum when boots touch the wrong slab.
    locales:
      ja:
        name: 針の合唱
        description: 誤った石板を踏むと、細い金属の葦が鳴る。
    exits:
      west: room.b6f.001
      south: room.b6f.003
    trap:
      id: trap.b6f.needle-choir
      name: Needle Choir
      damage: 5
      detectDc: 13
      warning: The safe slabs are silent under dropped grit.
    encounter:
      id: enemy.b6f.oath-warden
      name: Oath Warden
      hp: 18
      attack: 5
      role: miniboss
      dangerTier: 4
      isBoss: true
      tags:
        - block-cap
    treasureTable: treasure.b6f.oaths
  - id: room.b6f.003
    name: Salted Arch
    description: Salt crusts the arch ahead, dry as old vows. A shallow alcove keeps the last sure way back before the deep route.
    locales:
      ja:
        name: 塩の迫持
        description: 先の迫持には、古い誓いのように乾いた塩がこびりつく。浅い窪みが、深部へ入る前の確かな帰り道を残している。
    exits:
      north: room.b6f.002
      east: room.b7f.001
    restPoint: true
---

# B6F - Narrow Oaths

The dungeon starts asking whether the party came prepared.

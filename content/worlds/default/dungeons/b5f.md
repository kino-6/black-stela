---
id: dungeon.b5f
name: B5F - Toll of Cinders
level: 5
role: midpoint_gate
dangerTier: 4
recommendedPartyLevel: 3
tags:
  - miniboss
  - shortcut
authorNotes: Midpoint gate, miniboss, and economy pressure.
startRoom: room.b5f.001
grid:
  cells:
    - id: cell.b5f.001
      roomId: room.b5f.001
      x: 0
      y: 0
      edges:
        west:
          kind: stairs
          targetRoomId: room.b4f.003
          targetFloorId: dungeon.b4f
        east:
          kind: open
          targetRoomId: room.b5f.002
          targetCellId: cell.b5f.002
    - id: cell.b5f.002
      roomId: room.b5f.002
      x: 1
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.b5f.001
          targetCellId: cell.b5f.001
        east:
          kind: open
          targetRoomId: room.b5f.003
          targetCellId: cell.b5f.003
    - id: cell.b5f.003
      roomId: room.b5f.003
      x: 2
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.b5f.002
          targetCellId: cell.b5f.002
        north:
          kind: shortcut
          targetRoomId: room.b2f.001
          targetFloorId: dungeon.b2f
        east:
          kind: stairs
          targetRoomId: room.b6f.001
          targetFloorId: dungeon.b6f
rooms:
  - id: room.b5f.001
    name: Cinder Toll Hall
    description: A stone bowl sits on a pedestal, full of gray finger bones.
    locales:
      ja:
        name: 灰税の広間
        description: 台座の石鉢には、灰色の指骨が満ちている。
    exits:
      west: room.b4f.003
      east: room.b5f.002
    encounterTable: encounters.b5f.gate
  - id: room.b5f.002
    name: The Keeper's Niche
    description: A narrow statue blocks half the passage and watches the other half.
    locales:
      ja:
        name: 番人の龕
        description: 細い像が通路の半分を塞ぎ、残り半分を見張っている。
    exits:
      west: room.b5f.001
      east: room.b5f.003
    encounter:
      id: enemy.b5f.cinder-keeper
      name: Cinder Keeper
      hp: 14
      attack: 4
      role: miniboss
      dangerTier: 4
      isBoss: true
      tags:
        - midpoint
    treasureTable: treasure.b5f.keeper
  - id: room.b5f.003
    name: Lifted Bar
    description: A heavy bar can be lifted to make a shorter return route.
    locales:
      ja:
        name: 上がる横木
        description: 重い横木を上げれば、帰り道は短くなる。
    exits:
      west: room.b5f.002
      north: room.b2f.001
      east: room.b6f.001
    gates:
      - id: gate.b5f.mid-shortcut
        direction: north
        kind: shortcut
        grantsFlag: flag.b5f.mid-shortcut
        clue: The bar opens toward the upper dust.
        locales:
          ja:
            clue: 横木は上層の塵へ向かって開く。
---

# B5F - Toll of Cinders

Mid-scenario commitment. The party earns a shortcut and a deeper problem.

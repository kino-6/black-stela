---
id: dungeon.b4f
name: B4F - Turned Lanterns
level: 4
role: navigation_twist
dangerTier: 3
recommendedPartyLevel: 2
tags:
  - one-way
  - dark-zone
  - block-2
authorNotes: Navigation twist floor with readable one-way and dark-zone clues.
startRoom: room.b4f.001
grid:
  cells:
    - id: cell.b4f.001
      roomId: room.b4f.001
      x: 0
      y: 0
      edges:
        west:
          kind: stairs
          targetRoomId: room.b3f.003
          targetFloorId: dungeon.b3f
        east:
          kind: open
          targetRoomId: room.b4f.002
          targetCellId: cell.b4f.002
        south:
          kind: open
          targetRoomId: room.b4f.003
          targetCellId: cell.b4f.003
    - id: cell.b4f.002
      roomId: room.b4f.002
      x: 1
      y: 0
      edges:
        south:
          kind: one_way
          targetRoomId: room.b4f.003
          targetCellId: cell.b4f.003
    - id: cell.b4f.003
      roomId: room.b4f.003
      x: 0
      y: 1
      edges:
        north:
          kind: open
          targetRoomId: room.b4f.001
          targetCellId: cell.b4f.001
        east:
          kind: stairs
          targetRoomId: room.b5f.001
          targetFloorId: dungeon.b5f
rooms:
  - id: room.b4f.001
    name: Lanterns Facing Inward
    description: All lantern hooks point toward the center of the room, and the floor underfoot turns without a sound.
    locales:
      ja:
        name: 内向きの灯具
        description: 灯具の鉤はすべて部屋の中央へ向き、足元の床が音もなく回る。
    exits:
      west: room.b3f.003
      east: room.b4f.002
      south: room.b4f.003
    spinner: true
    encounterTable: encounters.b4f.dark
  - id: room.b4f.002
    name: One-Way Walk
    description: The floor slopes too gently to notice until the party turns back.
    locales:
      ja:
        name: 一方坂
        description: 振り返るまで気づかないほど、床はかすかに傾いている。
    exits:
      south: room.b4f.003
    gates:
      - id: gate.b4f.one-way
        direction: south
        kind: one_way
        clue: Scratches all point the same way.
        locales:
          ja:
            clue: 引っかき傷はすべて同じ向きを指している。
  - id: room.b4f.003
    name: Unlit Square
    description: Light fails in the middle of the room, leaving edges visible and center absent.
    locales:
      ja:
        name: 灯らない方形
        description: 部屋の中央だけ光が落ち、縁だけが見えて中心が欠けている。
    exits:
      north: room.b4f.001
      east: room.b5f.001
    gates:
      - id: gate.b4f.dark-square
        kind: dark_zone
        clue: Count steps, not shadows.
        locales:
          ja:
            clue: 影ではなく歩数を数えよ。
    treasureTable: treasure.b4f.dark
---

# B4F - Turned Lanterns

The first floor where navigation is a puzzle, but the clues stay fair.

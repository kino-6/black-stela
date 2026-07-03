---
id: dungeon.b1f
name: B1F - Silent Approach
level: 1
role: onboarding
dangerTier: 1
recommendedPartyLevel: 1
tags:
  - onboarding
  - mapping
authorNotes: Teaches movement, map reading, first trap, combat, and safe retreat.
startRoom: room.b1f.001
grid:
  cells:
    - id: cell.b1f.001
      roomId: room.b1f.001
      x: 0
      y: 0
      edges:
        east:
          kind: door
          targetRoomId: room.b1f.002
          targetCellId: cell.b1f.002
    - id: cell.b1f.002
      roomId: room.b1f.002
      x: 1
      y: 0
      edges:
        west:
          kind: door
          targetRoomId: room.b1f.001
          targetCellId: cell.b1f.001
        east:
          kind: open
          targetRoomId: room.b1f.003
          targetCellId: cell.b1f.003
    - id: cell.b1f.003
      roomId: room.b1f.003
      x: 2
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.b1f.002
          targetCellId: cell.b1f.002
        east:
          kind: stairs
          targetRoomId: room.b2f.001
          targetFloorId: dungeon.b2f
rooms:
  - id: room.b1f.001
    name: Silent Stone Chamber
    description: Cold fitted blocks press close. A narrow east door leaks dry air.
    locales:
      ja:
        name: 静まり返った石室
        description: 冷たい切石が近く迫る。東の細い扉から乾いた空気が漏れる。
    exits:
      east: room.b1f.002
    doors:
      - east
    treasureTable: treasure.b1f.safe
  - id: room.b1f.002
    name: Hall of Old Dust
    description: Dust lies in bands across the floor, broken by fresh marks.
    locales:
      ja:
        name: 古い塵の広間
        description: 床には古い塵が帯のように積もり、新しい跡だけがそれを乱している。
    exits:
      west: room.b1f.001
      east: room.b1f.003
    trap:
      id: trap.b1f.needle
      name: A hidden needle plate
      damage: 2
      detectDc: 10
    encounter:
      id: enemy.b1f.ash-slime
      name: Ash Slime
      hp: 4
      attack: 1
      role: attrition
      dangerTier: 1
      tags:
        - tutorial
    encounterTable: encounters.b1f.halls
  - id: room.b1f.003
    name: Black Marker
    description: A narrow marker of black stone leans beside a stair curling upward.
    locales:
      ja:
        name: 黒い標石
        description: 上へ巻く階段のそばに、細い黒石の標が傾いている。
        event: 標石は手に温かい。しかし記録に残るのは、隊列が確かめたことだけだ。
    exits:
      west: room.b1f.002
      east: room.b2f.001
    stairsToTown: true
    gates:
      - id: gate.b1f.first-descent
        direction: east
        kind: shortcut
        grantsFlag: flag.b1f.marker-read
        clue: The lower stair accepts only a party that knows how to return.
        locales:
          ja:
            clue: 下り階段は、帰還を知る隊列だけを受け入れる。
    event: The marker is warm to the touch, but the log records only what the party confirms.
---

# B1F - Silent Approach

A compact first loop floor: entry chamber, trap and combat hall, and a return
stair beside a black marker.

---
id: dungeon.b1f
name: B1F - Silent Approach
startRoom: room.b1f.001
rooms:
  - id: room.b1f.001
    name: Silent Stone Chamber
    description: Cold fitted blocks surround the party. A narrow door waits to the east.
    locales:
      ja:
        name: 静まり返った石室
        description: 冷たい切石が隊列を囲む。東には細い扉が待っている。
    exits:
      east: room.b1f.002
    doors:
      - east
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
    stairsToTown: true
    event: The marker is warm to the touch, but the log records only what the party confirms.
---

# B1F - Silent Approach

A compact first loop floor: entry chamber, trap and combat hall, and a return
stair beside a black marker.

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
          kind: open
          targetRoomId: room.b1f.004
          targetCellId: cell.b1f.004
        south:
          kind: door
          targetRoomId: room.b1f.007
          targetCellId: cell.b1f.007
    - id: cell.b1f.004
      roomId: room.b1f.004
      x: 3
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.b1f.003
          targetCellId: cell.b1f.003
        east:
          kind: open
          targetRoomId: room.b1f.005
          targetCellId: cell.b1f.005
        south:
          kind: door
          targetRoomId: room.b1f.008
          targetCellId: cell.b1f.008
    - id: cell.b1f.005
      roomId: room.b1f.005
      x: 4
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.b1f.004
          targetCellId: cell.b1f.004
        east:
          kind: door
          targetRoomId: room.b1f.006
          targetCellId: cell.b1f.006
    - id: cell.b1f.006
      roomId: room.b1f.006
      x: 5
      y: 0
      edges:
        west:
          kind: door
          targetRoomId: room.b1f.005
          targetCellId: cell.b1f.005
        east:
          kind: stairs
          targetRoomId: room.b2f.001
          targetFloorId: dungeon.b2f
    - id: cell.b1f.007
      roomId: room.b1f.007
      x: 2
      y: 1
      edges:
        north:
          kind: door
          targetRoomId: room.b1f.003
          targetCellId: cell.b1f.003
        east:
          kind: open
          targetRoomId: room.b1f.008
          targetCellId: cell.b1f.008
    - id: cell.b1f.008
      roomId: room.b1f.008
      x: 3
      y: 1
      edges:
        west:
          kind: open
          targetRoomId: room.b1f.007
          targetCellId: cell.b1f.007
        north:
          kind: door
          targetRoomId: room.b1f.004
          targetCellId: cell.b1f.004
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
    name: Smoke-Bent Passage
    description: Smoke stains lean along the ceiling. One side door falls away into a lower run of stones.
    locales:
      ja:
        name: 煙に曲がる通路
        description: 天井の煤が斜めに流れている。脇の扉の先では石床が少し低くなる。
    exits:
      west: room.b1f.002
      east: room.b1f.004
      south: room.b1f.007
    doors:
      - south
  - id: room.b1f.004
    name: Fork of Black Mortar
    description: Black mortar cuts the wall joints. The passage continues east, with a tight door to the south.
    locales:
      ja:
        name: 黒目地の分岐
        description: 壁の目地だけが黒い。東へ続く通路の脇に、狭い南扉がある。
    exits:
      west: room.b1f.003
      east: room.b1f.005
      south: room.b1f.008
    doors:
      - south
  - id: room.b1f.005
    name: Low Arch of Soot
    description: The ceiling drops low enough to scrape spear hafts. A reinforced door bars the way.
    locales:
      ja:
        name: 煤けた低いアーチ
        description: 槍の柄が擦れるほど天井が低い。正面に補強された扉がある。
    exits:
      west: room.b1f.004
      east: room.b1f.006
    doors:
      - east
  - id: room.b1f.006
    name: Black Marker
    description: A narrow marker of black stone leans beside a stair curling upward.
    locales:
      ja:
        name: 黒い標石
        description: 上へ巻く階段のそばに、細い黒石の標が傾いている。
        event: 標石は手に温かい。しかし記録に残るのは、隊列が確かめたことだけだ。
    exits:
      west: room.b1f.005
      east: room.b2f.001
    doors:
      - west
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
  - id: room.b1f.007
    name: Cinder Side Passage
    description: Fine grit slides under every step. The side path turns back toward the main run.
    locales:
      ja:
        name: 灰溜まりの脇道
        description: 踏むたびに細かな灰が滑る。脇道は本筋へ戻る形で折れている。
    exits:
      north: room.b1f.003
      east: room.b1f.008
    doors:
      - north
  - id: room.b1f.008
    name: Chalk Scrape Niche
    description: Chalk marks crowd the stone at shoulder height. A narrow north door returns to the fork.
    locales:
      ja:
        name: 白線の残る小間
        description: 肩の高さに白い擦り跡が重なっている。北の狭い扉は分岐へ戻る。
    exits:
      west: room.b1f.007
      north: room.b1f.004
    doors:
      - north
---

# B1F - Silent Approach

A first loop floor with a visible branch, a return marker, and a stair that
requires an explicit descent command.

---
id: dungeon.b3f
name: B3F - Cistern Teeth
level: 3
role: attrition
dangerTier: 3
recommendedPartyLevel: 2
tags:
  - resources
  - status
  - block-1
  - block-cap
authorNotes: Adds resource pressure and the first status-oriented enemy family.
startRoom: room.b3f.001
grid:
  cells:
    - id: cell.b3f.001
      roomId: room.b3f.001
      x: 0
      y: 0
      edges:
        west:
          kind: stairs
          targetRoomId: room.b2f.003
          targetFloorId: dungeon.b2f
        east:
          kind: open
          targetRoomId: room.b3f.002
          targetCellId: cell.b3f.002
    - id: cell.b3f.002
      roomId: room.b3f.002
      x: 1
      y: 0
      edges:
        west:
          kind: open
          targetRoomId: room.b3f.001
          targetCellId: cell.b3f.001
        south:
          kind: open
          targetRoomId: room.b3f.003
          targetCellId: cell.b3f.003
    - id: cell.b3f.003
      roomId: room.b3f.003
      x: 1
      y: 1
      edges:
        north:
          kind: open
          targetRoomId: room.b3f.002
          targetCellId: cell.b3f.002
        east:
          kind: stairs
          targetRoomId: room.b4f.001
          targetFloorId: dungeon.b4f
rooms:
  - id: room.b3f.001
    name: Dry Cistern Mouth
    description: A round cistern lies dry, its rim cut like blunt teeth, with dried marsh-herbs still lodged in the cracks.
    locales:
      ja:
        name: 乾いた貯水口
        description: 丸い貯水槽は乾き、縁は鈍い歯のように削られ、干からびた沢薬草が割れ目に残っている。
    exits:
      west: room.b2f.003
      east: room.b3f.002
    gatherItem: item.healing-draught
    encounterTable: encounters.b3f.cistern
  - id: room.b3f.002
    name: Bitter Water Mark
    description: Green stains mark where water once reached the party's waist.
    locales:
      ja:
        name: 苦水の跡
        description: 緑の染みが、かつて水が腰まで届いたことを示している。
    exits:
      west: room.b3f.001
      south: room.b3f.003
    trap:
      id: trap.b3f.bitter-needle
      name: Bitter Needle
      damage: 4
      detectDc: 12
      warning: The stain is broken by a line of pinholes.
    encounter:
      id: enemy.b3f.cistern-warden
      name: Cistern Warden
      hp: 11
      attack: 3
      role: miniboss
      dangerTier: 2
      isBoss: true
      tags:
        - block-cap
    treasureTable: treasure.b3f.watermark
  - id: room.b3f.003
    name: Chain Descent
    description: A chain ladder descends through a square well of silent air. A worn rope-ring by the well still holds the way back to town.
    locales:
      ja:
        name: 鎖の降り口
        description: 鎖梯子が、音のない四角い井戸を下っている。井戸端の擦り切れた綱の環が、まだ帰り道を保っている。
    exits:
      north: room.b3f.002
      east: room.b4f.001
    restPoint: true
    event: The chain is cold enough to numb fingers through leather.
---

# B3F - Cistern Teeth

Resource pressure begins to matter. Optional treasure sits beside warning signs.

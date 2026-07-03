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
authorNotes: Adds resource pressure and the first status-oriented enemy family.
startRoom: room.b3f.001
rooms:
  - id: room.b3f.001
    name: Dry Cistern Mouth
    description: A round cistern lies dry, its rim cut like blunt teeth.
    locales:
      ja:
        name: 乾いた貯水口
        description: 丸い貯水槽は乾き、縁は鈍い歯のように削られている。
    exits:
      west: room.b2f.003
      east: room.b3f.002
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
    treasureTable: treasure.b3f.watermark
  - id: room.b3f.003
    name: Chain Descent
    description: A chain ladder descends through a square well of silent air.
    locales:
      ja:
        name: 鎖の降り口
        description: 鎖梯子が、音のない四角い井戸を下っている。
    exits:
      north: room.b3f.002
      east: room.b4f.001
    event: The chain is cold enough to numb fingers through leather.
---

# B3F - Cistern Teeth

Resource pressure begins to matter. Optional treasure sits beside warning signs.

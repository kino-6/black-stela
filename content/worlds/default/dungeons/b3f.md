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
authorNotes: >-
  Dense cistern floor on the full 20x20 frame. A looping north gallery holds the
  drowned winch, the drop-shaft landing, a dead-end reliquary, and a bitter-mote
  warren; a second gallery to the south adds another warren and a niche. The only
  way down is the one-wide warden choke — the Cistern Warden and its bitter needle
  guard the descent. Winding the winch opens the drop-shaft shortcut back to the
  entry. Stairs climb west to B2F; the chain descent falls east to B4F and holds a
  town-return rest ring.
startRoom: room.b3f.001
map: |
  ####################
  ####################
  ##W...............##
  ##.......A........T#
  #E...#...#...#....##
  ##...........B....##
  ##..............H.##
  ###.#######.########
  ###.#######.########
  ###.#######M########
  ##.......##.########
  ##.......##D########
  ##...S...###########
  ##.......###########
  ##.G.....###########
  ##.......###########
  ####################
  ####################
  ####################
  ####################
symbols:
  E: room.b3f.001
  W: room.b3f.winch
  H: room.b3f.hub
  T: room.b3f.cache
  A: room.b3f.004
  B: room.b3f.005
  M: room.b3f.002
  D: room.b3f.003
  S: room.b3f.006
  G: room.b3f.007
corridor:
  name: Cistern Gallery
  description: A low gallery of fitted stone, the floor scored by old water-lines and drifting ash.
  locales:
    ja:
      name: 貯水回廊
      description: 切石の低い回廊。床には古い水位線と流れ込んだ灰の筋が残る。
edges:
  - from: room.b3f.001
    direction: west
    kind: stairs
    to: room.b2f.003
    targetFloorId: dungeon.b2f
  - from: room.b3f.003
    direction: east
    kind: stairs
    to: room.b4f.001
    targetFloorId: dungeon.b4f
  - from: room.b3f.hub
    direction: south
    kind: shortcut
    to: room.b3f.001
rooms:
  - id: room.b3f.001
    name: Dry Cistern Mouth
    description: A round cistern lies dry, its rim cut like blunt teeth, with dried marsh-herbs still lodged in the cracks. Stairs climb west toward B2F.
    locales:
      ja:
        name: 乾いた貯水口
        description: 丸い貯水槽は乾き、縁は鈍い歯のように削られ、干からびた沢薬草が割れ目に残っている。西の階段はB2Fへ上る。
    gatherItem: item.healing-draught
    encounterTable: encounters.b3f.cistern
  - id: room.b3f.cache
    name: Silt Reliquary
    description: A dead-end nook where the receding water left a caked shelf of silt, and something wrapped in oiled cloth.
    locales:
      ja:
        name: 泥の小祠
        description: 水が引いたあとの行き止まりの窪み。固まった泥の棚に、油布に包まれた何かが残されている。
    treasureTable: treasure.b3f.side
  - id: room.b3f.004
    name: Silt Warren
    description: The middle of the north gallery, where bitter-motes drift over a silt bank and the herbs grow rank.
    locales:
      ja:
        name: 泥の巣
        description: 北回廊の中ほど。泥の土手の上を苦水の綿毛が漂い、薬草が濃く茂っている。
    encounter:
      id: enemy.b3f.bitter-mote
      name: Bitter Mote
      hp: 6
      attack: 3
      role: status
      dangerTier: 3
      tags:
        - status
    treasureTable: treasure.b3f.side
  - id: room.b3f.005
    name: Waterline Cache
    description: A silt-caked shelf along the gallery wall where an oilcloth bundle was set above the old waterline.
    locales:
      ja:
        name: 水位の隠し
        description: 回廊の壁沿いの泥に固まった棚。古い水位線の上に、油布の包みが置かれている。
    treasureTable: treasure.b3f.side
  - id: room.b3f.002
    name: Bitter Water Mark
    description: Green stains mark where water once reached the party's waist. The only way down lies through here.
    locales:
      ja:
        name: 苦水の跡
        description: 緑の染みが、かつて水が腰まで届いたことを示している。下りへの道はここを抜けるほかない。
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
  - id: room.b3f.winch
    name: Drowned Winch
    description: A great iron winch leans over a capped drop-shaft. Wound tight, it would haul a cage straight up to the cistern mouth.
    locales:
      ja:
        name: 沈んだ巻き上げ機
        description: 蓋をされた竪坑の上に、大きな鉄の巻き上げ機が傾いている。巻き上げれば、籠は貯水口まで一気に上がるだろう。
    gates:
      - id: gate.b3f.winch
        kind: shortcut
        grantsFlag: flag.b3f.winch
        clue: The winch is wound; the drop-shaft to the entry now bears a cage.
        locales:
          ja:
            clue: 巻き上げ機を締めた。入口へ通じる竪坑に、いまは籠が掛かっている。
  - id: room.b3f.hub
    name: Drop-Shaft Landing
    description: A railed landing over the capped shaft. If the winch were wound, a cage here would ride straight back to the entry.
    locales:
      ja:
        name: 竪坑の踊り場
        description: 蓋をした竪坑の上の、手すり付きの踊り場。巻き上げ機さえ締まっていれば、ここの籠で入口まで戻れる。
    gates:
      - id: gate.b3f.shortcut
        direction: south
        kind: shortcut
        requiredFlag: flag.b3f.winch
        clue: Without the winch wound, the shaft cage will not hold.
        locales:
          ja:
            clue: 巻き上げ機が締まっていなければ、竪坑の籠は保たない。
  - id: room.b3f.006
    name: Sunken Warren
    description: The lower gallery, half-choked with dried silt where more of the bitter drift has gathered.
    locales:
      ja:
        name: 沈んだ巣
        description: 下の回廊。乾いた泥に半ば塞がれ、苦水の綿毛がさらに寄り集まっている。
    encounter:
      id: enemy.b3f.bitter-mote
      name: Bitter Mote
      hp: 6
      attack: 3
      role: status
      dangerTier: 3
      tags:
        - status
    treasureTable: treasure.b3f.side
  - id: room.b3f.007
    name: Silt Niche
    description: A dead-end pocket off the lower gallery, a bundle left drying on a silt shelf.
    locales:
      ja:
        name: 泥の小間
        description: 下の回廊から外れた行き止まりの窪み。泥の棚の上に包みが干されている。
    treasureTable: treasure.b3f.side
  - id: room.b3f.003
    name: Chain Descent
    description: A chain ladder descends through a square well of silent air. A worn rope-ring by the well still holds the way back to town.
    locales:
      ja:
        name: 鎖の降り口
        description: 鎖梯子が、音のない四角い井戸を下っている。井戸端の擦り切れた綱の環が、まだ帰り道を保っている。
    restPoint: true
    event: The chain is cold enough to numb fingers through leather.
---

# B3F - Cistern Teeth

A dense cistern floor. A looping north gallery hides the drowned winch, the
drop-shaft landing, a dead-end reliquary, and a bitter-mote warren; a second
gallery to the south adds another warren and a niche. The only way down is the
one-wide warden choke, where the Cistern Warden and its bitter needle guard the
descent. A wound winch opens the drop-shaft shortcut straight back to the entry.

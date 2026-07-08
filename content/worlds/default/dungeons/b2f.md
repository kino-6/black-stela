---
id: dungeon.b2f
name: B2F - Split Dust
level: 2
role: attrition
dangerTier: 2
recommendedPartyLevel: 1
tags:
  - branching
  - shortcut
  - block-1
authorNotes: >-
  Branch floor on the full 20x20 frame. A short forced trunk crosses the damaged
  Hooked Corridor first, then opens onto two broad hook-rat warrens — a north hall
  and a south hall — laced together by four vertical spines so the party can pick
  and remember routes. Each hall holds a warren fight and a cache; side niches
  hide more. The soot-locked shortcut rides back to the landing once its latch is
  found. The entrance stair climbs west to the B1F marker; the descent stair falls
  east to B3F.
startRoom: room.b2f.001
map: |
  ####################
  ####################
  #EC..............M##
  ####.###.###.###.###
  ##...............###
  #D...............###
  ##....A.....B....###
  ##...............###
  ##...............###
  ####.###.###.###.###
  ####.###.###.###.###
  ####.###.###.###.###
  ##...............###
  #G...............###
  ##....S.....K....###
  ##...............###
  ##...............###
  ####################
  ####################
  ####################
symbols:
  E: room.b2f.001
  C: room.b2f.002
  M: room.b2f.003
  A: room.b2f.004
  B: room.b2f.005
  S: room.b2f.006
  K: room.b2f.007
  D: room.b2f.008
  G: room.b2f.009
corridor:
  name: Hooked Gallery
  description: A run of fitted stone where iron hooks jut from the mortar gaps, most too old and rust-locked to move.
  locales:
    ja:
      name: 鉤の回廊
      description: 目地から鉄の鉤が突き出す切石の通路。ほとんどは古く錆びついて動かない。
edges:
  - from: room.b2f.001
    direction: west
    kind: stairs
    to: room.b1f.012
    targetFloorId: dungeon.b1f
  - from: room.b2f.003
    direction: east
    kind: stairs
    to: room.b3f.001
    targetFloorId: dungeon.b3f
  - from: room.b2f.003
    direction: north
    kind: shortcut
    to: room.b2f.001
rooms:
  - id: room.b2f.001
    name: Landing of Split Dust
    description: Two dust trails divide around a sunken guide stone. Stairs climb west toward the B1F marker; the hooked way runs on to the east.
    locales:
      ja:
        name: 分かれ塵の踊り場
        description: 沈んだ導石を挟み、二本の塵の道が分かれている。西の階段はB1Fの標石へ上り、鉤の道は東へ続く。
    encounterTable: encounters.b2f.branches
  - id: room.b2f.002
    name: Hooked Corridor
    damageTile: 2
    description: Iron hooks line the mortar gaps, and one near the floor has been kept bright with use. Most are too old to move.
    locales:
      ja:
        name: 鉤の通廊
        description: 目地に鉄の鉤が並ぶ。床近くの一本だけが使い込まれて光っている。ほとんどは古すぎて動かない。
    trap:
      id: trap.b2f.hook-line
      name: Hook Line
      damage: 3
      detectDc: 11
      warning: A hook near the floor has no dust on it.
    treasureTable: treasure.b2f.risk
  - id: room.b2f.003
    name: Soot-Locked Door
    description: A smoke-black door leans beside the shaft that falls to B3F. From this side the latch can be found and the way back to the landing thrown open.
    locales:
      ja:
        name: 煤鍵の扉
        description: B3Fへ落ちる竪坑のそばに、煙で黒ずんだ扉が傾いている。こちら側から掛け金を見つければ、踊り場への帰り道が開く。
    gates:
      - id: gate.b2f.soot-shortcut
        direction: north
        kind: shortcut
        grantsFlag: flag.b2f.soot-shortcut
        clue: The latch is hidden behind a square of cleaner stone.
        locales:
          ja:
            clue: きれいすぎる石板の裏に掛け金が隠れている。
      - id: gate.b2f.descent
        direction: east
        kind: lock
        requiredFlag: flag.b2f.descent
        clue: The shaft's fall-gate is barred; the crank that lifts it sits back in the hook warrens.
        locales:
          ja:
            clue: 竪坑の落とし戸は閂で塞がれている。それを上げる巻き手は、鉤の巣の奥にある。
  - id: room.b2f.004
    name: North Hook Warren
    description: The heart of the north hall, where hook-rats nest in the drift and drag their spoil into a corner.
    locales:
      ja:
        name: 北の鉤の巣
        description: 北の広間の中心。鉤鼠が吹き溜まりに巣を作り、獲物を隅へ引きずり込んでいる。
    encounter:
      id: enemy.b2f.hook-rat
      name: Hook Rat
      hp: 5
      attack: 2
      role: ambusher
      dangerTier: 2
      tags:
        - beast
    treasureTable: treasure.b2f.risk
  - id: room.b2f.005
    name: North Spoil Cache
    description: A cleft in the north hall wall where the rats piled a stitched satchel out of the wet.
    locales:
      ja:
        name: 北の獲物置き
        description: 北の広間の壁の裂け目。鼠が濡れを避けて縫い綴じの鞄を積み上げている。
    treasureTable: treasure.b2f.cache
  - id: room.b2f.006
    name: South Hook Warren
    description: The south hall's nest, its floor scored by dragged iron and the tracks of something quick. A bar-crank for the shaft's fall-gate is chained beyond the rats.
    locales:
      ja:
        name: 南の鉤の巣
        description: 南の広間の巣。床は引きずられた鉄と、素早い何かの足跡で削られている。竪坑の落とし戸の巻き手が、鼠の奥に鎖で留められている。
    gates:
      - id: gate.b2f.descent-crank
        kind: shortcut
        grantsFlag: flag.b2f.descent
        clue: The bar-crank turns; the shaft's fall-gate lifts open below.
        locales:
          ja:
            clue: 巻き手が回る。下で竪坑の落とし戸が持ち上がる。
    encounter:
      id: enemy.b2f.hook-rat
      name: Hook Rat
      hp: 5
      attack: 2
      role: ambusher
      dangerTier: 2
      tags:
        - beast
    treasureTable: treasure.b2f.risk
  - id: room.b2f.007
    name: South Spoil Cache
    description: A low shelf in the south hall where a pouch was wedged behind a curtain of dead hooks.
    locales:
      ja:
        name: 南の獲物置き
        description: 南の広間の低い棚。死んだ鉤の帳の裏に小袋が挟み込まれている。
    treasureTable: treasure.b2f.cache
  - id: room.b2f.008
    name: West Dust Niche
    description: A dead-end niche off the north hall, a satchel forgotten in the dust.
    locales:
      ja:
        name: 西の塵の小間
        description: 北の広間から外れた行き止まりの小間。塵の中に鞄が忘れ置かれている。
    treasureTable: treasure.b1f.nook
  - id: room.b2f.009
    name: West Soot Niche
    description: A dead-end pocket off the south hall, soot banked deep over a stitched bundle.
    locales:
      ja:
        name: 西の煤の小間
        description: 南の広間から外れた行き止まりの窪み。煤が深く積もり、縫い綴じの包みを覆っている。
    treasureTable: treasure.b1f.nook
---

# B2F - Split Dust

A branch floor on the full 20x20 frame. A short forced trunk crosses the damaged
Hooked Corridor, then opens onto two broad hook-rat warrens — a north hall and a
south hall — laced together by vertical spines so the party learns to pick and
remember routes. Each hall holds a warren fight and a cache; side niches hide
more. The soot-locked door throws a shortcut back to the landing once its latch
is found. Stairs climb west to the B1F marker and fall east to B3F.

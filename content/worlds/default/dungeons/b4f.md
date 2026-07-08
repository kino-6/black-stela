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
authorNotes: >-
  Navigation-twist floor on the full 20x20 frame. The spinner entry turns the
  party's facing, and the obvious eastward step is the One-Way Walk, which slopes
  them straight back. The real way lies south, through two dark lantern halls of
  lantern-wards, laced by spines — one of them a one-way descent. The unlit square
  at the east holds the ashen key and drops to B5F. Clues stay fair.
startRoom: room.b4f.001
map: |
  ####################
  ##ET################
  ##.#################
  ##....#...#...#...##
  ##................##
  #D......A.....B...##
  ##................##
  ##................##
  ####.####.####.##.##
  ####.####.####.##.M#
  ##................##
  ##................##
  #G....S.....K.....V#
  ##................##
  ##................##
  ####################
  ####################
  ####################
  ####################
  ####################
symbols:
  E: room.b4f.001
  T: room.b4f.002
  M: room.b4f.003
  A: room.b4f.004
  B: room.b4f.005
  D: room.b4f.006
  S: room.b4f.007
  K: room.b4f.008
  G: room.b4f.009
  V: room.b4f.010
corridor:
  name: Lantern Gallery
  description: A gallery where the lantern hooks all lean the same way, and the floor gives back no echo.
  locales:
    ja:
      name: 灯具の回廊
      description: 灯具の鉤がみな同じ向きに傾く回廊。床は足音を返さない。
edges:
  - from: room.b4f.001
    direction: west
    kind: stairs
    to: room.b3f.003
    targetFloorId: dungeon.b3f
  - from: room.b4f.003
    direction: east
    kind: stairs
    to: room.b5f.001
    targetFloorId: dungeon.b5f
  - from: room.b4f.004
    direction: south
    kind: one_way
    to: room.b4f.007
  - from: room.b4f.c17_12
    direction: east
    kind: secret
    to: room.b4f.010
rooms:
  - id: room.b4f.001
    name: Lanterns Facing Inward
    description: All lantern hooks point toward the center of the room, and the floor underfoot turns without a sound. Stairs climb west to B3F.
    locales:
      ja:
        name: 内向きの灯具
        description: 灯具の鉤はすべて部屋の中央へ向き、足元の床が音もなく回る。西の階段はB3Fへ上る。
    spinner: true
    encounterTable: encounters.b4f.dark
  - id: room.b4f.002
    name: One-Way Walk
    description: The floor slopes too gently to notice until the party turns back and finds the lanterns again.
    locales:
      ja:
        name: 一方坂
        description: 振り返るまで気づかないほど床はかすかに傾き、気づけば内向きの灯具の間に戻っている。
    teleportTo: room.b4f.001
    gates:
      - id: gate.b4f.one-way
        direction: south
        kind: one_way
        clue: Scratches all point the same way.
        locales:
          ja:
            clue: 引っかき傷はすべて同じ向きを指している。
  - id: room.b4f.004
    name: Inner Lantern Hall
    description: The north hall, where the wards drift between hooks that all point inward, hoarding what light there is.
    locales:
      ja:
        name: 内灯の広間
        description: 北の広間。守り火が、みな内を向く鉤の間を漂い、わずかな光を抱え込んでいる。
    encounter:
      id: enemy.b4f.lantern-ward
      name: Lantern Ward
      hp: 8
      attack: 3
      role: blocker
      dangerTier: 3
      tags:
        - dark-zone
    treasureTable: treasure.b4f.side
  - id: room.b4f.005
    name: Hooked Cache
    description: A shelf in the north hall where an oilcloth bundle hangs from a lantern hook.
    locales:
      ja:
        name: 鉤の隠し
        description: 北の広間の棚。灯具の鉤から油布の包みが下がっている。
    treasureTable: treasure.b4f.side
  - id: room.b4f.006
    name: Dimmed Niche
    description: A dead-end niche off the north hall, its lantern long cold over a forgotten satchel.
    locales:
      ja:
        name: 翳りの小間
        description: 北の広間から外れた行き止まりの小間。灯具はとうに冷え、鞄が忘れ置かれている。
    treasureTable: treasure.b1f.nook
  - id: room.b4f.007
    name: Lower Lantern Hall
    description: The south hall, reached down the one-way slope, where more wards gather in the failing light. A winch for the descent chain hangs past them.
    locales:
      ja:
        name: 下灯の広間
        description: 一方坂を下った先の南の広間。衰える光の中に、さらに守り火が集まっている。降りの鎖の巻き上げが、その奥に垂れている。
    gates:
      - id: gate.b4f.descent-crank
        kind: shortcut
        grantsFlag: flag.b4f.descent
        clue: The winch pays out; far off, the chain to B5F comes free.
        locales:
          ja:
            clue: 巻き上げが繰り出される。遠くで、B5Fへの鎖が外れる。
    encounter:
      id: enemy.b4f.lantern-ward
      name: Lantern Ward
      hp: 8
      attack: 3
      role: blocker
      dangerTier: 3
      tags:
        - dark-zone
    treasureTable: treasure.b4f.side
  - id: room.b4f.008
    name: Slope Cache
    description: A low shelf in the south hall where a pouch was wedged beneath the tilted floor.
    locales:
      ja:
        name: 坂の隠し
        description: 南の広間の低い棚。傾いた床の下に小袋が押し込まれている。
    treasureTable: treasure.b4f.side
  - id: room.b4f.009
    name: Unlit Niche
    description: A dead-end pocket off the south hall where the dark swallows all but the near wall.
    locales:
      ja:
        name: 灯無しの小間
        description: 南の広間から外れた行き止まりの窪み。闇が手前の壁を除いてすべてを呑む。
    treasureTable: treasure.b1f.nook
  - id: room.b4f.003
    name: Unlit Square
    description: Light fails in the middle of the room, leaving edges visible and center absent. The chain to B5F falls from the far dark.
    locales:
      ja:
        name: 灯らない方形
        description: 部屋の中央だけ光が落ち、縁だけが見えて中心が欠けている。B5Fへの鎖が、奥の闇から落ちている。
    gates:
      - id: gate.b4f.dark-square
        kind: dark_zone
        clue: Count steps, not shadows.
        locales:
          ja:
            clue: 影ではなく歩数を数えよ。
      - id: gate.b4f.descent
        direction: east
        kind: lock
        requiredFlag: flag.b4f.descent
        clue: The chain's release is seized fast; the winch that frees it hangs in the lower lantern hall.
        locales:
          ja:
            clue: 鎖の外し金は固く噛んでいる。それを解く巻き上げは、下灯の広間に垂れている。
    treasureTable: treasure.b4f.dark
  - id: room.b4f.010
    name: Unlit Cache
    description: A slot of dead air hides behind the lower hall's east wall, its seam lost in the failing light — a cloth-bound cache rests within, richer than the open niches.
    locales:
      ja:
        name: 灯なき隠し宝処
        description: 下の広間の東壁の裏に、淀んだ空気の隙間が隠れている。継ぎ目は衰える光に紛れ、布に包まれた蓄えが中に置かれ、開けた小間よりも実り多い。
    treasureTable: treasure.b4f.secret
---

# B4F - Turned Lanterns

A navigation-twist floor on the full 20x20 frame. The spinner entry turns the
party's facing, and the obvious eastward step is the One-Way Walk that slopes
them straight back to the lanterns. The real route lies south, through two dark
halls of lantern-wards laced by spines — one a one-way descent — to the unlit
square that hides the ashen key and drops to B5F. The clues stay fair.

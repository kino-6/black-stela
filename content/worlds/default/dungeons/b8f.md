---
id: dungeon.b8f
name: B8F - Gate of Ash
level: 8
role: finale
dangerTier: 5
recommendedPartyLevel: 4
tags:
  - finale
  - boss
  - block-3
  - block-cap
authorNotes: >-
  Finale floor on the full 20x20 frame. Two ash-gate halls converge on the
  approach, thick with votary-kin and the last caches before the end. The buried
  Black Stela Root is the one-wide choke — the Ash Votary must fall before the
  party can pass. Beyond it the Return Scar antechamber holds a final cache and
  the town stair that carries the first proof home.
startRoom: room.b8f.001
map: |
  ####################
  ####################
  ####################
  ##.........#########
  #P.......B.#########
  ##....A....T########
  ##.........#########
  ##.........#########
  ###.##.##.##########
  #E.........MD#######
  ###.##.##.##.#######
  ##.........#....####
  ##.........#..V.####
  ##....S....#....####
  #G.......K.#########
  ##.........#########
  ####################
  ####################
  ####################
  ####################
symbols:
  E: room.b8f.001
  M: room.b8f.002
  D: room.b8f.003
  A: room.b8f.004
  B: room.b8f.005
  P: room.b8f.006
  S: room.b8f.007
  K: room.b8f.008
  G: room.b8f.009
  V: room.b8f.010
  T: room.b8f.011
corridor:
  name: Gate Approach
  description: A gallery that tastes of a candle just after it dies, ash hanging in the still air.
  locales:
    ja:
      name: 門への前庭
      description: 蝋燭が消えた直後の味がする回廊。動かぬ空気に灰が漂う。
edges:
  - from: room.b8f.001
    direction: west
    kind: stairs
    to: room.b7f.001
    targetFloorId: dungeon.b7f
  - from: room.b8f.c10_5
    direction: east
    kind: secret
    to: room.b8f.011
rooms:
  - id: room.b8f.001
    name: Ash Gate Approach
    description: The air tastes like a candle just after it dies. Stairs climb west to B7F; two gate halls converge ahead.
    locales:
      ja:
        name: 灰門の前庭
        description: 空気は、蝋燭が消えた直後の味がする。西の階段はB7Fへ上り、二つの門の広間が先で交わる。
    encounterTable: encounters.b8f.gate
  - id: room.b8f.004
    name: North Gate Hall
    description: The upper gate hall, where votary-kin drift through the hanging ash toward the buried root.
    locales:
      ja:
        name: 北の門の広間
        description: 上の門の広間。祭祀の眷属が、漂う灰の中を埋もれた根へと流れてゆく。
    encounterTable: encounters.b8f.gate
    treasureTable: treasure.b8f.side
  - id: room.b8f.005
    name: North Gate Cache
    description: A niche in the north hall where a bundle was left against the coming end.
    locales:
      ja:
        name: 北の門の隠し
        description: 北の広間の窪み。来たる終わりに備え、包みが残されている。
    treasureTable: treasure.b8f.side
  - id: room.b8f.006
    name: Candle-Cold Niche
    description: A dead-end niche off the north hall, its air colder than the rest, a satchel forgotten in it.
    locales:
      ja:
        name: 蝋の冷えた小間
        description: 北の広間から外れた行き止まりの小間。他より冷えた空気に、鞄が忘れ置かれている。
    treasureTable: treasure.b1f.nook
  - id: room.b8f.002
    name: Black Stela Root
    description: The buried root of the stela rises from stone like a blade without an edge. Nothing passes deeper until its votary falls.
    locales:
      ja:
        name: 黒碑の根
        description: 埋もれた黒碑の根が、刃のない刃物のように石から立つ。その祭祀が斃れるまで、奥へは誰も通れない。
    encounter:
      id: enemy.b8f.ash-votary
      name: Ash Votary
      hp: 22
      attack: 5
      role: boss
      dangerTier: 5
      isBoss: true
      tags:
        - finale
    treasureTable: treasure.b8f.final
  - id: room.b8f.003
    name: Return Scar
    description: A scar in the wall opens toward the town stair only after the ash quiets. A last alcove stands open beside it.
    locales:
      ja:
        name: 帰還の傷跡
        description: 壁の傷跡は、灰が静まった後でだけ街への階段へ開く。その脇に、最後の窪みが残っている。
    stairsToTown: true
    event: The ash gate grows quiet. The party can carry the first proof home.
  - id: room.b8f.010
    name: Scar Antechamber
    description: The alcove past the root, its shelf holding what the last party to reach the gate left behind.
    locales:
      ja:
        name: 傷跡の前室
        description: 根の先の窪み。棚には、門へ辿り着いた最後の隊列が残したものが置かれている。
    treasureTable: treasure.b8f.side
  - id: room.b8f.007
    name: South Gate Hall
    description: The lower gate hall, where the ash lies deepest and the kin gather thickest.
    locales:
      ja:
        name: 南の門の広間
        description: 下の門の広間。灰が最も深く積もり、眷属が最も濃く集う。
    encounterTable: encounters.b8f.gate
    treasureTable: treasure.b8f.side
  - id: room.b8f.008
    name: South Gate Cache
    description: A low shelf in the south hall where a pouch was pressed into the cold ash.
    locales:
      ja:
        name: 南の門の隠し
        description: 南の広間の低い棚。冷えた灰に小袋が押し込まれている。
    treasureTable: treasure.b8f.side
  - id: room.b8f.009
    name: Gate-Ash Niche
    description: A dead-end pocket off the south hall, a bundle half-sunk in gray ash.
    locales:
      ja:
        name: 門灰の小間
        description: 南の広間から外れた行き止まりの窪み。灰色の灰に包みが半ば沈んでいる。
    treasureTable: treasure.b1f.nook
  - id: room.b8f.011
    name: Gate Cache
    description: A slot of dead air hides behind the north gate hall's east wall, its seam grey with settled ash — a cloth-bound cache rests within, richer than the open niches.
    locales:
      ja:
        name: 門の隠し宝処
        description: 北の門の広間の東壁の裏に、淀んだ空気の隙間が隠れている。継ぎ目は積もった灰で灰色に霞み、布に包まれた蓄えが中に置かれ、開けた小間よりも実り多い。
    treasureTable: treasure.b8f.secret
---

# B8F - Gate of Ash

The finale on the full 20x20 frame. Two ash-gate halls converge on the approach,
thick with votary-kin and the last caches before the end. The buried Black Stela
Root is the one-wide choke — the Ash Votary must fall before the party can pass.
Beyond it the Return Scar antechamber holds a final cache and the town stair that
carries the first proof home.

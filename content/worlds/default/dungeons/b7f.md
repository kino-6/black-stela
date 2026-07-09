---
id: dungeon.b7f
name: B7F - Side Ash Vaults
level: 7
role: optional
dangerTier: 5
recommendedPartyLevel: 4
tags:
  - optional
  - rare-reward
  - block-3
authorNotes: >-
  Optional high-risk side floor on the full 20x20 frame. The fork is the through-
  route — stairs climb west to the B6F rest and fall east to the finale — while a
  broad hall of vault-husks opens north with warrens, caches, and niches for the
  party that lingers. South of the fork lies the sealed ash vault: its east slab
  is locked to the ashen key, and its hollow south wall hides a cache behind a
  false face. Prepared parties get a reason to return.
startRoom: room.b7f.001
map: |
  ###################
  #F#.......#.......#
  #.#.#.#.#####.###.#
  #...#.#........B#.#
  #.###.#####.#.###.#
  #.........#.......#
  #.###.#.#.#.#.###.#
  #.....#.#.#X#.VR#.#
  #.#####....##.###.#
  #....G#..A..#...#P#
  #.######...####.###
  #.............#...#
  #######.#.#####.###
  #........S........#
  #.#.#####.###.###.#
  #.#.........#..K#.#
  #.#####.#####.###.#
  #.....#.....#...#H#
  ###################
  ####################
symbols:
  F: room.b7f.001
  V: room.b7f.002
  R: room.b7f.003
  X: room.b7f.004
  A: room.b7f.005
  B: room.b7f.006
  S: room.b7f.007
  K: room.b7f.008
  G: room.b7f.009
  P: room.b7f.010
  H: room.b7f.011
corridor:
  name: Quiet Vault Gallery
  description: A low gallery of sealed niches, the ash undisturbed but for the party's own tracks.
  locales:
    ja:
      name: 静かな納骨の回廊
      description: 封じられた龕が並ぶ低い回廊。灰は、隊列自身の足跡のほかに乱れがない。
edges:
  - from: room.b7f.001
    direction: west
    kind: stairs
    to: room.b6f.003
    targetFloorId: dungeon.b6f
  - from: room.b7f.001
    direction: east
    kind: stairs
    to: room.b8f.001
    targetFloorId: dungeon.b8f
  - from: room.b7f.002
    direction: east
    kind: locked
    to: room.b7f.003
  - from: room.b7f.c11_6
    direction: south
    kind: secret
    to: room.b7f.004
  - from: room.b7f.c17_16
    direction: south
    kind: secret
    to: room.b7f.011
rooms:
  - id: room.b7f.001
    name: Fork of Quiet Vaults
    description: A lower passage climbs west to the salted arch and falls east toward the finale; the vault gallery winds off south, and a sealed ash vault sits somewhere in its aisles.
    locales:
      ja:
        name: 静かな納骨庫の分岐
        description: 低い通路は西の塩の迫持へ上り、東は終幕へ落ちる。納骨の回廊は南へ折れ、その通路のどこかに封灰の納骨庫が控えている。
    gates:
      - id: gate.b7f.descent
        direction: east
        kind: lock
        requiredFlag: flag.b7f.descent
        clue: The fall east to the finale is pinned shut; the release is set deep in the vault gallery south.
        locales:
          ja:
            clue: 終幕へ東に落ちる道は栓で封じられている。その外しは、南の納骨回廊の奥にある。
  - id: room.b7f.005
    name: Vault Gallery Hall
    description: The heart of the quiet gallery, where a vault-husk drags itself between the sealed niches — and a release-pin for the eastern fall is bolted to the wall beyond it.
    locales:
      ja:
        name: 納骨回廊の広間
        description: 静かな回廊の中心。封じられた龕の間を納骨の殻が身を引きずって渡り、その奥の壁に、東の落とし戸の外し栓が留められている。
    gates:
      - id: gate.b7f.descent-release
        kind: shortcut
        grantsFlag: flag.b7f.descent
        clue: The release-pin gives; far east, the fall to the finale opens.
        locales:
          ja:
            clue: 外し栓が外れる。東の彼方で、終幕への落とし戸が開く。
    encounterTable: encounters.b7f.vaults
    treasureTable: treasure.b7f.side
  - id: room.b7f.006
    name: Niche Cache
    description: A sealed niche in the gallery cracked open just enough to hold a bundle.
    locales:
      ja:
        name: 龕の隠し
        description: 回廊の封じ龕が、包みを収めるだけ僅かに割れている。
    treasureTable: treasure.b7f.side
  - id: room.b7f.007
    name: Lower Gallery Hall
    description: The gallery's south aisle, where the ash lies deep and another husk stirs it.
    locales:
      ja:
        name: 下回廊の広間
        description: 回廊の南の通路。灰が深く積もり、別の殻がそれをかき乱している。
    encounterTable: encounters.b7f.vaults
    treasureTable: treasure.b7f.side
  - id: room.b7f.008
    name: Sealed Niche Cache
    description: A low niche in the south aisle where a satchel was pressed into the cold ash.
    locales:
      ja:
        name: 封じ龕の隠し
        description: 南の通路の低い龕。冷えた灰に鞄が押し込まれている。
    treasureTable: treasure.b7f.side
  - id: room.b7f.009
    name: West Vault Niche
    description: A dead-end niche off the gallery's west edge, a bundle left in a cracked slab.
    locales:
      ja:
        name: 西の龕の小間
        description: 回廊の西端から外れた行き止まりの小間。割れた石板に包みが残されている。
    treasureTable: treasure.b1f.nook
  - id: room.b7f.010
    name: East Vault Niche
    description: A dead-end pocket off the gallery's east edge, ash banked over a stitched satchel.
    locales:
      ja:
        name: 東の龕の小間
        description: 回廊の東端から外れた行き止まりの窪み。灰が縫い綴じの鞄を覆っている。
    treasureTable: treasure.b1f.nook
  - id: room.b7f.002
    name: Sealed Ash Vault
    description: A keyhole of black glass watches from the sealed slab beyond, where the reliquary is pinned shut against everything but cooled ash.
    locales:
      ja:
        name: 封灰の納骨庫
        description: この先の封じ石から、黒硝子の鍵穴がこちらを見ている。聖遺物室は、冷えた灰のほかすべてを拒んで封じられている。
    gates:
      - id: gate.b7f.ash-vault
        direction: east
        kind: lock
        requiredKeyId: item.ashen-key
        clue: The keyhole is not metal; it wants cooled ash.
        locales:
          ja:
            clue: 鍵穴は金属ではない。冷えた灰を求めている。
  - id: room.b7f.003
    name: Optional Reliquary
    description: Something valuable rests here because something dangerous chose not to leave.
    locales:
      ja:
        name: 任意の聖遺物室
        description: 危険なものが去らなかったから、価値あるものもここに残った。
    treasureTable: treasure.b7f.rare
  - id: room.b7f.004
    name: Hidden Cache
    description: Behind the false wall, a dry alcove hides what someone meant to reclaim.
    locales:
      ja:
        name: 隠し物置
        description: 偽りの壁の奥、乾いた窪みに、誰かが取り戻すはずだった物が隠されている。
    treasureTable: treasure.b7f.cache
  - id: room.b7f.011
    name: Sealed Cache
    description: A slot of dead air hides behind an ash-packed seam off the south aisle — a cloth-bound cache rests within, richer than the open niches.
    locales:
      ja:
        name: 封じ龕の隠し宝処
        description: 南の通路の脇、冷えた灰で詰めた継ぎ目の裏に淀んだ空気の隙間が隠れている。布に包まれた蓄えが中に置かれ、開けた小間よりも実り多い。
    treasureTable: treasure.b7f.secret
---

# B7F - Side Ash Vaults

An optional high-risk side floor on the full 20x20 frame. The fork is the
through-route — west to the B6F rest, east to the finale — while a broad hall of
vault-husks opens north with warrens, caches, and niches. South of the fork the
sealed ash vault keeps its ashen-key lock and the false south wall that hides a
cache. Optional danger gives prepared parties a reason to return.

---
id: dungeon.b6f
name: B6F - Narrow Oaths
level: 6
role: deep_route
dangerTier: 4
recommendedPartyLevel: 3
tags:
  - role-check
  - traps
  - block-2
  - block-cap
authorNotes: >-
  Deep-route floor on the full 20x20 frame. A broad vow hall of oath-cutters
  opens off the entry, with a warren, a cache, and two niches. The only way down
  is the vertical Needle Choir choke, where the trap sings and the Oath Warden
  holds the line. Below it the Salted Arch keeps the last sure town-return before
  the deep route, beside a small vault. Traps and role checks bite, but no build
  is hard-locked out.
startRoom: room.b6f.001
map: |
  ####################
  ####################
  ##E...............##
  ##............B...##
  #G....#.A..#...#..##
  ##................##
  ##...............P##
  #########.##########
  #########.##########
  #########M##########
  #########.##########
  ######.......#######
  ######.......#######
  ######D....K.V######
  ######.......#######
  ######.......#######
  ####################
  ####################
  ####################
  ####################
symbols:
  E: room.b6f.001
  A: room.b6f.004
  B: room.b6f.005
  P: room.b6f.006
  M: room.b6f.002
  D: room.b6f.003
  K: room.b6f.007
  G: room.b6f.008
  V: room.b6f.009
corridor:
  name: Oath Gallery
  description: A gallery whose walls are scratched over with names, each crossed out by a different hand.
  locales:
    ja:
      name: 誓いの回廊
      description: 壁一面に名が刻まれ、それぞれ別の手で線を引かれた回廊。
edges:
  - from: room.b6f.001
    direction: west
    kind: stairs
    to: room.b5f.003
    targetFloorId: dungeon.b5f
  - from: room.b6f.003
    direction: east
    kind: stairs
    to: room.b7f.001
    targetFloorId: dungeon.b7f
  - from: room.b6f.c12_13
    direction: east
    kind: secret
    to: room.b6f.009
rooms:
  - id: room.b6f.001
    name: Vow Passage
    description: Names are scratched into the wall, each crossed out by a different hand. Stairs climb west to B5F; the vow hall opens ahead.
    locales:
      ja:
        name: 誓いの通路
        description: 壁に刻まれた名は、それぞれ別の手で線を引かれている。西の階段はB5Fへ上り、誓いの広間が先に開く。
    encounterTable: encounters.b6f.oaths
  - id: room.b6f.004
    name: Broken Vow Hall
    description: The vow hall proper, where oath-cutters work the aisles between the scratched-out names.
    locales:
      ja:
        name: 破誓の広間
        description: 誓いの広間そのもの。線を引かれた名の間の通路を、誓約破りが行き来している。
    encounterTable: encounters.b6f.oaths
    treasureTable: treasure.b6f.side
  - id: room.b6f.005
    name: Oathkeeper's Cache
    description: A shelf in the vow hall where a ring was left wrapped in a scrap of oath-cloth.
    locales:
      ja:
        name: 誓約者の隠し
        description: 誓いの広間の棚。指輪が誓いの布切れに包まれて残されている。
    treasureTable: treasure.b6f.side
  - id: room.b6f.006
    name: Scratched Niche
    description: A dead-end niche off the vow hall, its wall crowded with crossed-out names and a hidden satchel.
    locales:
      ja:
        name: 刻みの小間
        description: 誓いの広間から外れた行き止まりの小間。壁は線を引かれた名で埋まり、鞄が隠されている。
    treasureTable: treasure.b1f.nook
  - id: room.b6f.008
    name: Erased Niche
    description: A dead-end pocket off the west of the vow hall, one name scraped clean above a stitched bundle.
    locales:
      ja:
        name: 消えた名の小間
        description: 誓いの広間の西にある行き止まりの窪み。縫い綴じの包みの上で、名がひとつ削り消されている。
    treasureTable: treasure.b1f.nook
  - id: room.b6f.002
    name: Needle Choir
    description: Thin metal reeds hum when boots touch the wrong slab. The only way down runs through their song.
    locales:
      ja:
        name: 針の合唱
        description: 誤った石板を踏むと、細い金属の葦が鳴る。下りへの道は、その歌の中を抜けるほかない。
    trap:
      id: trap.b6f.needle-choir
      name: Needle Choir
      damage: 5
      detectDc: 13
      warning: The safe slabs are silent under dropped grit.
    encounter:
      id: enemy.b6f.oath-warden
      name: Oath Warden
      hp: 18
      attack: 5
      role: miniboss
      dangerTier: 4
      isBoss: true
      tags:
        - block-cap
    treasureTable: treasure.b6f.oaths
  - id: room.b6f.003
    name: Salted Arch
    description: Salt crusts the arch ahead, dry as old vows. A shallow alcove keeps the last sure way back before the deep route.
    locales:
      ja:
        name: 塩の迫持
        description: 先の迫持には、古い誓いのように乾いた塩がこびりつく。浅い窪みが、深部へ入る前の確かな帰り道を残している。
    restPoint: true
  - id: room.b6f.007
    name: Salt Vault
    description: A salt-crusted vault beside the arch, its shelf holding what earlier oath-breakers never came back for.
    locales:
      ja:
        name: 塩の宝庫
        description: 迫持の脇の塩にまみれた宝庫。棚には、先の誓約破りが取りに戻らなかったものが残っている。
    treasureTable: treasure.b6f.side
  - id: room.b6f.009
    name: Vault Cache
    description: A slot of dead air hides behind the lower chamber's east wall, its seam sealed with old salt — a cloth-bound cache rests within, richer than the open niches.
    locales:
      ja:
        name: 誓いの隠し宝処
        description: 下の広間の東壁の裏に、淀んだ空気の隙間が隠れている。継ぎ目は古い塩で固められ、布に包まれた蓄えが中に置かれ、開けた小間よりも実り多い。
    treasureTable: treasure.b6f.secret
---

# B6F - Narrow Oaths

A deep-route floor on the full 20x20 frame. A broad vow hall of oath-cutters
opens off the entry, with a warren, a cache, and two scratched niches. The only
way down is the vertical Needle Choir choke, where the trap sings and the Oath
Warden holds the line. Below it the Salted Arch keeps the last sure town-return
before the deep route, beside a small salt vault.

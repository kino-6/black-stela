---
id: dungeon.tl9f
name: F9 - Surface Liftworks
locales: { ja: { name: F9・地上昇降機区 } }
level: 9
role: attrition
dangerTier: 9
recommendedPartyLevel: 9
recommendedPartySize: 6
recommendedClearLevel: 10
tags: [branching, liftworks, block-3]
authorNotes: >-
  Seed 20260813. The abandoned surface lift offers a visible but damaged promise of release. Its counterweight
  bypass is a loop and its caches pull exploration outward; the terminus stair remains a discovered open route.
startRoom: room.tl9f.lift-landing
map: |
  ###################
  #E.a..#.........#.#
  #.#.#.###.###.#.#.#
  #.#.#.......#.#...#
  ###.#.###.###.###.#
  #....H..#....T....#
  #.#.#.#.###.#.###.#
  #.#...#.#...#.....#
  #.#.####....#####.#
  #.#.#....M......#.#
  #.###.#.....###.###
  #...#.#.#.....#...#
  #.###.###.#.#####.#
  #...#....B....#K..#
  #.#.#####.#.#######
  #.#.....#....Q....#
  #.#.###.###.#####.#
  #.#...#L#C...R#D..#
  ###################
symbols:
  E: room.tl9f.lift-landing
  a: room.tl9f.counterweight-bypass
  H: room.tl9f.lift-machine-hall
  T: room.tl9f.surface-terminal
  M: room.tl9f.counterweight-bay
  B: room.tl9f.operator-booth
  K: room.tl9f.tool-locker
  Q: room.tl9f.bypass-control
  L: room.tl9f.maintenance-cache
  C: room.tl9f.cable-drum
  R: room.tl9f.return-marker
  D: room.tl9f.down-stair
corridor:
  name: Lift Machinery Passage
  description: Counterweights creak above deep shaft mouths sealed by a century of damp.
  locales: { ja: { name: 昇降機械路, description: 湿り気に封じられた深い昇降路の口の上で、釣合い錘が軋む。 } }
edges:
  - { from: room.tl9f.lift-landing, direction: west, kind: stairs, to: room.tl8f.down-stair, targetFloorId: dungeon.tl8f }
  - { from: room.tl9f.down-stair, direction: north, kind: stairs, to: room.tl10f.terminus-landing, targetFloorId: dungeon.tl10f }
rooms:
  - { id: room.tl9f.lift-landing, name: Liftworks Landing, description: The control stair arrives beside a shaft marked for surface evacuation., locales: { ja: { name: 昇降機区の踊り場, description: 管制区の階段は、地上退避用と記された昇降路の脇に着く。 } } }
  - id: room.tl9f.counterweight-bypass
    name: Counterweight Bypass
    description: A narrow maintenance bridge's clearance plate remains beside the lift hall.
    locales: { ja: { name: 釣合い錘の迂回路, description: 狭い保守橋の通行札が、昇降機広間の脇に残る。 } }
    gates: [{ id: gate.tl9f.counterweight, kind: shortcut, grantsFlag: flag.tl9f.counterweight-open, clue: A counterweight brake logs a maintenance clearance. }]
  - { id: room.tl9f.lift-machine-hall, name: Lift Machine Hall, description: Surface lift gears turn once, then stop at the sound of the broadcast., locales: { ja: { name: 昇降機の広間, description: 地上昇降機の歯車は放送に合わせて一度だけ回り、止まる。 } }, encounterTable: encounters.tl9f.liftworks }
  - id: room.tl9f.surface-terminal
    name: Surface Terminal
    description: The lift was kept from the surface so that recovered people could not leave.
    locales: { ja: { name: 地上端末, description: 回収された人々を出さないため、昇降機は地上側から止められていた。, event: 封鎖線が災害に耐えるためではなく、帰還を阻むために造られた最終の証拠を見つける。 } }
    event: The party finds the final proof that the sealed line was built to prevent return, not to endure a disaster.
  - { id: room.tl9f.counterweight-bay, name: Counterweight Bay, description: Open counterweights create several routes through the machinery., locales: { ja: { name: 釣合い錘の区画, description: 露出した釣合い錘が、機械の間に複数の経路を作る。 } }, encounterTable: encounters.tl9f.liftworks }
  - { id: room.tl9f.operator-booth, name: Operator Booth, description: The final operator notes point down to Platform Zero's actual terminus., locales: { ja: { name: 運転員ブース, description: 最後の運転員メモは、零番線の本当の終点がさらに下だと示す。 } }, encounterTable: encounters.tl9f.operator-guard, chamberGuardian: true }
  - { id: room.tl9f.tool-locker, name: Lift Tool Locker, description: A dry locker at the end of a service spur contains a reinforcement kit., locales: { ja: { name: 昇降機工具ロッカー, description: 保守枝道の奥の乾いたロッカーに、補強用具がある。 } }, treasureTable: treasure.tl9f.lift-cache }
  - { id: room.tl9f.bypass-control, name: Brake Control, description: A brake cabinet stabilises the counterweight shortcut., locales: { ja: { name: 制動制御盤, description: 制動盤は、釣合い錘の抜け道を安定させる。 } } }
  - { id: room.tl9f.maintenance-cache, name: Maintenance Cache, description: A steel tin of spare parts waits at a dead end., locales: { ja: { name: 保守部品箱, description: 行き止まりに、予備部品の鋼缶が残る。 } }, treasureTable: treasure.tl9f.lift-cache }
  - { id: room.tl9f.cable-drum, name: Cable Drum, description: A cable drum hides a sealed cache below its rusted rim., locales: { ja: { name: ケーブルドラム, description: 錆びた縁の下に、ケーブルドラムが封じた保管箱を隠す。 } }, chest: { treasureTable: treasure.tl9f.lift-cache, trap: { kind: gas, difficulty: 26, damage: 10, status: fear } } }
  - { id: room.tl9f.return-marker, name: Lift Emergency Winch, description: A staffed winch return is an authored escape point, not a free menu command., locales: { ja: { name: 昇降機の非常巻上げ機, description: 非常巻上げ機は、メニューではなく意図して置かれた帰還地点だ。 } }, stairsToTown: true, returnStyle: marker }
  - { id: room.tl9f.down-stair, name: Terminus Stair, description: A lit steel stair descends beside the disabled lift toward the actual terminus., locales: { ja: { name: 終端への階段, description: 停止した昇降機の脇を、灯の残る鋼階段が本当の終端へ下る。 } } }
---

# F9・地上昇降機区

地上へ出るための設備は、戻らせないために止められていた。真の終端は昇降機の下にある。

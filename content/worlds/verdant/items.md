---
# Verdant economy. The shared base catalog auto-merges the starter gear + healing-
# draught; this layers verdant-flavoured consumables, a few gear pieces, and a shop
# (unlock-by-descent), so the grove town is a real resupply point.
items:
  - id: item.verdant.sap-draught
    name: Sap Draught
    kind: healing
    tier: 1
    price: 30
    sellValue: 10
    healAmount: 14
    locales:
      ja:
        name: 樹液の水薬
        description: 甘い樹液を煮詰めた回復薬。傷を塞ぐ。
  - id: item.verdant.pollen-salve
    name: Pollen Salve
    kind: healing
    tier: 1
    price: 22
    sellValue: 7
    healAmount: 10
    locales:
      ja:
        name: 花粉の軟膏
        description: 痺れと眠りを払う淡い軟膏。少し傷も癒す。
  - id: item.verdant.homing-spore
    name: Homing Spore
    kind: escape
    tier: 2
    price: 90
    sellValue: 30
    locales:
      ja:
        name: 帰りの胞子
        description: 割ると胞子が渦を巻き、地上へと運び返す。
  - id: item.verdant.greater-sap
    name: Greater Sap Draught
    kind: healing
    tier: 2
    price: 75
    sellValue: 24
    healAmount: 26
    locales:
      ja:
        name: 濃い樹液の水薬
        description: 樹心近くの濃い樹液。深い傷も戻す。
  - id: item.verdant.heartseed
    name: Heartseed
    kind: treasure
    tier: 5
    sellValue: 240
    locales:
      ja:
        name: 大樹の種
        description: 樹心の芯から採れた、脈打つ種。
  # ---- Growth items (verdant flavour; XP grants bypass the falloff) ----
  - id: item.verdant.heartsap-tonic
    name: Heartsap Tonic
    kind: growth
    tier: 3
    sellValue: 60
    grants: { maxHp: 6 }
    locales:
      ja:
        name: 樹心の強壮液
        description: 樹心近くの濃い樹液を練った強壮液。飲めば身が一回り太くなる。
  - id: item.verdant.rootgrowth-seed
    name: Rootgrowth Seed
    kind: growth
    tier: 4
    sellValue: 90
    grants: { xp: 60 }
    locales:
      ja:
        name: 芽吹きの種
        description: 噛めば脈打つ緑が身の内で芽吹く。潜った日々が糧になる。
  # ---- §9.4c: Verdant had NO cure and NO focus item at all, so a party here could be poisoned or
  # silenced with no answer whatsoever, and an exhausted caster had no way back. Plus the five item
  # answers to a missing class (class-system.md §8), in this world's own voice. ----
  - id: item.verdant.leachwort
    name: Leachwort
    kind: cure
    tier: 1
    price: 20
    sellValue: 7
    curesStatuses: [poison]
    locales:
      ja:
        name: 吸毒草
        description: 噛み潰せば毒を吸い出す苦い草。沼の縁ならどこにでも生える。
  - id: item.verdant.stillbloom
    name: Stillbloom
    kind: cure
    tier: 2
    price: 35
    sellValue: 12
    curesStatuses: [fear, sleep]
    locales:
      ja:
        name: 凪ぎ花
        description: 香を嗅げば胸の波が凪ぐ白い花。夢と怯えの両方を解く。
  - id: item.verdant.mossdew
    name: Mossdew
    kind: focus
    tier: 2
    price: 45
    sellValue: 15
    restoreMp: 8
    locales:
      ja:
        name: 苔露
        description: 夜の苔から集めた露。舐めれば涸れた気が戻る。
  - id: item.verdant.vine-hooks
    name: Vine Hooks
    kind: utility
    tier: 2
    price: 55
    sellValue: 18
    explorationAid: { actions: [unlock, investigate], bonus: 6 }
    locales:
      ja:
        name: 蔓の鉤
        description: 硬く撚った蔓の鉤束。木の錠にも根の絡みにも噛む。
  - id: item.verdant.bark-wedge
    name: Bark Wedge
    kind: utility
    tier: 2
    price: 45
    sellValue: 15
    explorationAid: { actions: [disarm], bonus: 6 }
    locales:
      ja:
        name: 樹皮の楔
        description: 撓る樹皮を重ねた楔。跳ねる仕掛けの下へ差し込む。
  - id: item.verdant.spore-lens
    name: Spore Lens
    kind: utility
    tier: 3
    price: 70
    sellValue: 23
    explorationAid: { actions: [detectSecret, investigate], bonus: 5 }
    locales:
      ja:
        name: 胞子見の膜
        description: 胞子の流れで空洞を読む薄膜。壁の向こうの風が見える。
  - id: item.verdant.warding-knot
    name: Warding Knot
    kind: ward
    tier: 3
    price: 80
    sellValue: 26
    useTechnique: ward-hymn
    locales:
      ja:
        name: 守りの結び
        description: 解けば一度だけ隊列を覆う蔓の結び。詠唱者の代わりに立つ。
  - id: item.verdant.ember-pod
    name: Ember Pod
    kind: throwable
    tier: 2
    price: 40
    sellValue: 13
    useTechnique: firebolt
    locales:
      ja:
        name: 燠の莢
        description: 投げれば爆ぜて火を撒く乾いた莢。濡れた森で火を持つ数少ない手。
  - id: item.verdant.bark-scroll
    name: Bark Scroll
    kind: scroll
    tier: 4
    price: 150
    sellValue: 50
    useTechnique: flame-wave
    locales:
      ja:
        name: 樹皮の巻物
        description: 一度だけ読み解ける焼き付けの樹皮。読めば灰になる。
equipment:
  - id: equip.verdant.thorn-lash
    name: Thorn Lash
    description: A whip of living bramble; it reaches the second rank.
    slot: weapon
    tier: 2
    attackBonus: 3
    accuracyBonus: 1
    price: 80
    sellValue: 26
    tags: [reach, thorn]
    locales:
      ja:
        name: 茨の鞭
        description: 生きた茨の鞭。後列からも届く。
  - id: equip.verdant.bark-plate
    name: Bark Plate
    description: Overlapping bark scutes, grown to fit; heavy but sure.
    slot: body
    tier: 2
    armorBonus: 4
    price: 95
    sellValue: 30
    tags: [armor, bark]
    locales:
      ja:
        name: 樹皮の鎧
        description: 育てて合わせた樹皮の鱗。重いが確か。
  - id: equip.verdant.living-charm
    name: Living Charm
    description: A knot of green wood that quickens the blood.
    slot: accessory
    tier: 2
    hpBonus: 6
    price: 70
    sellValue: 22
    tags: [charm, life]
    locales:
      ja:
        name: 生木の護符
        description: 血を巡らせる緑の木の結び目。
  # ---- Elemental counterplay (翠碑: fire / wood / metal) ----
  # The fire the ash-folk carry down is the WRONG tool here — wet green wood shrugs it off. Metal
  # (金剋木) is what cuts the living forest. Bring the iron edge, and a lower-level party that would
  # be walled by a fire loadout gets through. The bramble whip stays wood — for the dry spore-things.
  - id: equip.verdant.iron-edge
    name: Iron Edge
    description: A plain forged blade among all this green; cold metal the wet wood cannot ignore.
    slot: weapon
    tier: 2
    attackBonus: 4
    element: metal
    price: 150
    sellValue: 50
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [blade, metal]
    locales:
      ja:
        name: 鉄の刃
        description: 緑一色のなかの、素朴な鍛えの刃。濡れた木が無視できぬ冷たい金。
  - id: equip.verdant.reaver-axe
    name: Reaver Axe
    description: A heavy bitting axe; metal enough to fell the heartwood itself.
    slot: weapon
    tier: 3
    attackBonus: 6
    element: metal
    sellValue: 120
    allowedClasses: [vanguard, sellsword, bulwark]
    tags: [axe, metal, keyed]
    locales:
      ja:
        name: 断ち斧
        description: 重く食い込む斧。樹心そのものを伐り倒すに足る金。
  # Defensive counterplay: the grove's deep keepers hit back with WOOD (sap geysers, coiling vines,
  # the Rootheart's grove-wrath) and spore SLEEP. This ward halves that wood and steadies the sleep/
  # poison — the "prepare for the deep floors" accessory. It competes with the living-charm's +HP for
  # the one accessory slot, so bringing it is a loadout choice, not a free pick.
  - id: equip.verdant.heartwood-ward
    name: Heartwood Ward
    description: A carved knot of dead heartwood, proof against the grove's sap-surges and spores.
    slot: accessory
    tier: 3
    # A meaningful cut, not a wall — the deep grove still bites a prepared party (see the verdant
    # balance Gate: even prepared dips below 60% at the finale). Preparation eases it; it doesn't
    # trivialise it. Stacks multiplicatively with any body-slot resist a build also commits to.
    elementResist: { wood: 0.7 }
    resistBonus: { sleep: 35, poison: 25 }
    price: 140
    sellValue: 46
    tags: [charm, ward, wood]
    locales:
      ja:
        name: 樹心の護符
        description: 朽ちた樹心を彫った結び目。森の樹液の奔流と胞子を退ける。
shops:
  - id: shop.verdant.grove
    name: Grovekeeper's Stall
    service: general_store
    locales:
      ja:
        name: 木立守りの露店
    stock:
      - { itemId: item.healing-draught, price: 25, availability: always }
      - { itemId: item.verdant.sap-draught, price: 30, availability: always }
      - { itemId: item.verdant.pollen-salve, price: 22, availability: always }
      - { itemId: item.verdant.homing-spore, price: 90, availability: always }
      - { itemId: equip.verdant.thorn-lash, price: 80, availability: always }
      - { itemId: equip.verdant.living-charm, price: 70, availability: always }
      # §9.4c — the cure/focus this world simply did not have, plus the item answers to a missing class.
      - { itemId: item.verdant.leachwort, price: 20, availability: always }
      - { itemId: item.verdant.stillbloom, price: 35, availability: always }
      - { itemId: item.verdant.mossdew, price: 45, availability: always }
      - { itemId: item.verdant.vine-hooks, price: 55, availability: always }
      - { itemId: item.verdant.bark-wedge, price: 45, availability: always }
      - { itemId: item.verdant.ember-pod, price: 40, availability: always }
      - { itemId: item.verdant.spore-lens, price: 70, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: item.verdant.warding-knot, price: 80, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: item.verdant.bark-scroll, price: 150, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: item.verdant.greater-sap, price: 75, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: equip.verdant.bark-plate, price: 95, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: equip.verdant.iron-edge, price: 150, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: equip.verdant.heartwood-ward, price: 140, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: item.verdant.heartsap-tonic, price: 180, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
---

# Verdant items

Grove-town resupply: sap draughts (heal), pollen salve (cure + heal), homing spore
(escape to town), and a small gear line. Deeper stock unlocks as the descent opens.

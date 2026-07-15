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
    healAmount: 9
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
    healAmount: 5
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
    healAmount: 16
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
      - { itemId: item.verdant.greater-sap, price: 75, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: equip.verdant.bark-plate, price: 95, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
      - { itemId: equip.verdant.iron-edge, price: 150, availability: unlocked, unlockFlag: flag.verdant.g3f.shortcut }
---

# Verdant items

Grove-town resupply: sap draughts (heal), pollen salve (cure + heal), homing spore
(escape to town), and a small gear line. Deeper stock unlocks as the descent opens.

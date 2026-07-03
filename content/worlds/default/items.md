---
items:
  - id: item.healing-draught
    name: Healing Draught
    kind: healing
    tier: 1
    price: 25
    sellValue: 8
    healAmount: 6
    locales:
      ja:
        name: 治癒の水薬
        description: 傷を浅く戻す苦い水薬。
  - id: item.lantern-oil
    name: Lantern Oil
    kind: utility
    tier: 1
    price: 10
    sellValue: 3
    locales:
      ja:
        name: 灯油
        description: 暗所を越えるための予備油。
  - id: item.ashen-key
    name: Ashen Key
    kind: key
    tier: 3
    sellValue: 0
    locales:
      ja:
        name: 灰の鍵
        description: 冷えた灰を固めた黒い鍵。
  - id: item.stela-shard
    name: Stela Shard
    kind: treasure
    tier: 5
    sellValue: 240
    locales:
      ja:
        name: 黒碑片
        description: 黒碑の根から剥がれた小片。
equipment:
  - id: equip.iron-knife
    name: Iron Knife
    slot: weapon
    tier: 1
    attackBonus: 1
    price: 40
    sellValue: 12
    locales:
      ja:
        name: 鉄の小刀
        description: 扱いやすい短い刃。
  - id: equip.ash-mail
    name: Ash Mail
    slot: armor
    tier: 3
    defenseBonus: 2
    price: 180
    sellValue: 54
    locales:
      ja:
        name: 灰鎖帷子
        description: 灰を噛ませた軽い鎖帷子。
shops:
  - id: shop.stela-general
    name: Stela Gate General Store
    service: general_store
    stock:
      - itemId: item.healing-draught
        price: 25
        availability: always
      - itemId: item.lantern-oil
        price: 10
        availability: always
      - itemId: equip.iron-knife
        price: 40
        availability: always
      - itemId: equip.ash-mail
        price: 180
        availability: unlocked
        unlockFlag: flag.b5f.mid-shortcut
    locales:
      ja:
        name: 黒碑門の雑貨店
        description: 帰ってきた者にだけ品数が増える店。
---

# Items and Shops

Scenario-authored catalog data for the first scenario pass.

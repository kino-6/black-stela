---
items:
  - id: item.tl-universal-round
    name: Service Round
    kind: utility
    tier: 1
    price: 12
    sellValue: 4
    locales:
      ja:
        name: 汎用弾
        description: 封鎖線の保安規格に合わせた短い実包。銃器ルール導入後の共有弾薬。
  - id: item.tl-field-dressing
    name: Field Dressing
    kind: healing
    tier: 1
    price: 24
    sellValue: 8
    healAmount: 12
    locales:
      ja:
        name: 応急包帯
        description: 濡れない袋に収められた止血布。戦闘外でも、負傷者一人の傷を手当てできる。
  - id: item.tl-terminal-fuse
    name: Terminal Fuse
    kind: key
    tier: 1
    price: 18
    sellValue: 5
    locales:
      ja:
        name: 端末ヒューズ
        description: 保守端末と補給ロッカーの非常回路をつなぐ、陶製の予備ヒューズ。
  - id: item.tl-transit-key-fragment
    name: Transit Key Fragment
    kind: key
    tier: 1
    sellValue: 0
    locales:
      ja:
        name: 運行鍵片
        description: 零番線の運行鍵から折り取られた半片。売却も廃棄もできない。
equipment:
  - id: equip.tl-service-pistol
    name: Service Pistol
    description: A compact station-security sidearm. Its worn sights still line up in a narrow corridor.
    slot: weapon
    tier: 1
    attackBonus: 1
    accuracyBonus: 3
    allowedClasses: [vanguard, sellsword, duelist, seeker, scout, cutpurse]
    tags: [firearm, terminal-line]
    price: 62
    sellValue: 20
    locales:
      ja:
        name: 保安拳銃
        description: 駅の保安員が携えた小型拳銃。狭い通路で照準を合わせやすい旧式の作りだ。
  - id: equip.tl-crowbar
    name: Maintenance Crowbar
    description: A steel maintenance bar, balanced for prying doors and close, quiet strikes.
    slot: weapon
    tier: 1
    attackBonus: 2
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [maintenance, terminal-line]
    price: 38
    sellValue: 12
    locales:
      ja:
        name: 保守用バール
        description: 扉をこじ開けるための鋼棒。静かに近づいた時は、近接武器としても頼りになる。
  - id: equip.tl-rain-jacket
    name: Rain Jacket
    description: A dark waterproof work jacket with sealed cuffs and a hood that keeps the chill off.
    slot: body
    tier: 1
    defenseBonus: 1
    resistBonus: { fear: 8 }
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse, mender, chanter, occultist, arcanist, wayfinder]
    tags: [rainproof, terminal-line]
    price: 44
    sellValue: 14
    locales:
      ja:
        name: 防水作業着
        description: 袖口まで水を通しにくい作業着。冷たい飛沫と、暗所の不安を少し遠ざける。
shops:
  - id: shop.tl-interchange-market
    name: Interchange Supply Stall
    service: general_store
    stock:
      - { itemId: item.tl-field-dressing, price: 24 }
      - { itemId: item.tl-terminal-fuse, price: 18 }
      - { itemId: item.tl-universal-round, price: 12 }
    locales:
      ja:
        name: 乗換広場・補給台
        description: 退避民が持ち寄った補給品を、整備台の脇で交換している。
  - id: shop.tl-workshop
    name: Shutter Workshop
    service: armory
    stock:
      - { itemId: equip.tl-crowbar, price: 38 }
      - { itemId: equip.tl-service-pistol, price: 62 }
      - { itemId: equip.tl-rain-jacket, price: 44 }
    locales:
      ja:
        name: シャッター工房
        description: 閉じた改札の横で、回収品の手入れと交換を行う整備台。
---

# 乗換広場の持ち出し品

第一幕では、弾薬は世界固有の在庫として存在する。共有弾・警戒度の消費ルールはW3aで接続する。

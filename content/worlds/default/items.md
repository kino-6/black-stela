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
  - id: item.return-charm
    name: Warding Return Charm
    kind: escape
    tier: 2
    price: 90
    sellValue: 30
    locales:
      ja:
        name: 帰還の割符
        description: 砕けば道を焼き、隊列を街へ引き戻す高価な割符。深部の逃げ道。
equipment:
  - id: equip.rusted-dirk
    name: Rusted Dirk
    description: A short blade with a wrapped tang; cheap, light, and honest.
    slot: weapon
    tier: 1
    attackBonus: 1
    accuracyBonus: 2
    price: 22
    sellValue: 7
    locales:
      ja:
        name: 錆びた短剣
        description: 柄を巻き直した短い刃。安く、軽く、裏切らない。
  - id: equip.militia-sabre
    name: Militia Sabre
    description: A gate guard's curved blade; enough reach for the front line.
    slot: weapon
    tier: 1
    attackBonus: 2
    price: 45
    sellValue: 14
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [front_line, blade]
    locales:
      ja:
        name: 民兵の湾刀
        description: 門衛が使う反り刃。前列で届く長さがある。
  - id: equip.ashwood-staff
    name: Ashwood Staff
    description: A soot-dark staff balanced for ward signs and back-row strikes.
    slot: weapon
    tier: 1
    attackBonus: 1
    accuracyBonus: 2
    price: 32
    sellValue: 10
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [back_row, focus]
    locales:
      ja:
        name: 灰木の杖
        description: 札を切る手に重さを合わせた黒ずんだ杖。
  - id: equip.short-bow
    name: Short Bow
    description: A stub recurve that looses over the front line — a back-row striker's reach.
    slot: weapon
    tier: 1
    attackBonus: 2
    accuracyBonus: 1
    price: 48
    sellValue: 15
    allowedClasses: [seeker, scout, cutpurse, wayfinder, chanter]
    tags: [reach, ranged]
    locales:
      ja:
        name: 短弓
        description: 前列越しに射かける短い返し弓。後衛から届く間合いを持つ。
  - id: equip.long-spear
    name: Long Spear
    description: A long haft that strikes from the second rank, past the shoulders ahead.
    slot: weapon
    tier: 1
    attackBonus: 2
    price: 44
    sellValue: 14
    allowedClasses: [vanguard, sellsword, bulwark, seeker, wayfinder]
    tags: [reach, polearm]
    locales:
      ja:
        name: 長柄槍
        description: 前の肩越しに、二列目から突き出せる長い柄。
  - id: equip.split-buckler
    name: Split Buckler
    description: A small cracked shield; it catches knives but slows the hand.
    slot: offhand
    tier: 1
    defenseBonus: 1
    speedBonus: -1
    price: 24
    sellValue: 8
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [shield, front_line]
    locales:
      ja:
        name: 割れ留めの小盾
        description: 亀裂を留めた小盾。刃は受けるが手元は鈍る。
  - id: equip.candle-ward
    name: Candle Ward
    description: A palm charm packed with tallow ash; not a shield, but it steadies the chant.
    slot: offhand
    tier: 1
    defenseBonus: 1
    accuracyBonus: 1
    price: 26
    sellValue: 8
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [focus, ward]
    locales:
      ja:
        name: 蝋灰の護符
        description: 蝋灰を詰めた掌の護符。盾ではないが詠唱を乱さない。
  - id: equip.padded-jack
    name: Padded Jack
    description: Quilted cloth with hard seams; the first armor that matters.
    slot: body
    tier: 1
    defenseBonus: 1
    price: 34
    sellValue: 11
    locales:
      ja:
        name: 綿入れの胴衣
        description: 縫い目を固めた厚布。最初に頼れる防具。
  - id: equip.ring-mail
    name: Ring Mail
    description: Small rings sewn over leather; heavy enough to make retreat late.
    slot: body
    tier: 2
    defenseBonus: 2
    speedBonus: -1
    price: 78
    sellValue: 25
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [front_line, mail]
    locales:
      ja:
        name: 輪留め革鎧
        description: 革に小輪を縫い込んだ鎧。守るが退き足は遅れる。
  - id: equip.iron-cap
    name: Iron Cap
    description: A dented cap with a leather liner; ugly, but the skull stays whole.
    slot: head
    tier: 1
    defenseBonus: 1
    price: 18
    sellValue: 6
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [helm]
    locales:
      ja:
        name: 凹み鉄帽
        description: 革裏を貼った凹み帽。見栄えより頭蓋を守る。
  - id: equip.grip-gloves
    name: Grip Gloves
    description: Waxed finger wraps for blades, tools, and spell chalk.
    slot: hands
    tier: 1
    accuracyBonus: 4
    price: 20
    sellValue: 7
    tags: [accuracy, tools]
    locales:
      ja:
        name: 滑り止め手袋
        description: 指先に蝋を噛ませた手袋。刃物、工具、呪印に効く。
  - id: equip.chalk-cord
    name: Chalk Cord
    description: A wrist cord dusted with map chalk; fast hands find safer lines.
    slot: accessory
    tier: 1
    accuracyBonus: 1
    speedBonus: 1
    price: 24
    sellValue: 8
    allowedClasses: [seeker, scout, cutpurse, occultist, arcanist, wayfinder]
    tags: [mapping, speed]
    locales:
      ja:
        name: 白墨紐
        description: 地図用の白墨を染ませた手首紐。速い手は安全な線を引く。
  - id: equip.black-thread-ring
    name: Black Thread Ring
    description: A dull ring wound with black thread; a small promise against panic.
    slot: accessory
    tier: 1
    defenseBonus: 1
    price: 30
    sellValue: 10
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [ward, back_row]
    locales:
      ja:
        name: 黒糸の指輪
        description: 黒い糸を巻いた鈍い指輪。恐慌を遠ざける小さな約束。
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
      - itemId: item.return-charm
        price: 90
        availability: always
      - itemId: equip.rusted-dirk
        price: 22
        availability: always
      - itemId: equip.militia-sabre
        price: 45
        availability: always
      - itemId: equip.ashwood-staff
        price: 32
        availability: always
      - itemId: equip.short-bow
        price: 48
        availability: always
      - itemId: equip.long-spear
        price: 44
        availability: always
      - itemId: equip.split-buckler
        price: 24
        availability: always
      - itemId: equip.candle-ward
        price: 26
        availability: always
      - itemId: equip.padded-jack
        price: 34
        availability: always
      - itemId: equip.ring-mail
        price: 78
        availability: always
      - itemId: equip.iron-cap
        price: 18
        availability: always
      - itemId: equip.grip-gloves
        price: 20
        availability: always
      - itemId: equip.chalk-cord
        price: 24
        availability: always
      - itemId: equip.black-thread-ring
        price: 30
        availability: always
    locales:
      ja:
        name: 黒碑門の雑貨店
        description: 帰ってきた者にだけ品数が増える店。
---

# Items and Shops

Scenario-authored catalog data for the first scenario pass.

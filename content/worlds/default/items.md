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
  - id: item.greater-draught
    name: Greater Draught
    kind: healing
    tier: 2
    price: 70
    sellValue: 23
    healAmount: 14
    locales:
      ja:
        name: 上等な水薬
        description: より深い傷まで戻す濃い水薬。
  - id: item.antidote
    name: Antidote
    kind: cure
    tier: 1
    price: 20
    sellValue: 6
    curesStatuses: [poison]
    locales:
      ja:
        name: 解毒薬
        description: 血に回った毒を抜く苦い薬。
  - id: item.clarity-draught
    name: Clarity Draught
    kind: cure
    tier: 2
    price: 30
    sellValue: 10
    curesStatuses: [silence]
    locales:
      ja:
        name: 明澄の水薬
        description: 舌と喉を解き、封じられた声を取り戻す。
  - id: item.calm-draught
    name: Calm Draught
    kind: cure
    tier: 2
    price: 35
    sellValue: 11
    curesStatuses: [fear, sleep]
    locales:
      ja:
        name: 鎮めの水薬
        description: 怯えと眠気を払い、隊列を正気に戻す。
  - id: item.spirit-tonic
    name: Spirit Tonic
    kind: focus
    tier: 2
    price: 45
    sellValue: 15
    restoreMp: 8
    locales:
      ja:
        name: 気付けの霊薬
        description: 涸れた気力を汲み戻す澄んだ霊薬。
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
    tags: [back_row, focus, reach]
    locales:
      ja:
        name: 灰木の杖
        description: 札を切る手に重さを合わせた黒ずんだ杖。二列目からでも打てる長さがある。
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
  # ---- Tier 2 weapons (deep-store upgrades of each row/class line) ----
  - id: equip.steel-sabre
    name: Steel Sabre
    description: A tempered blade with a proper guard; the front line's next step up.
    slot: weapon
    tier: 2
    attackBonus: 3
    price: 120
    sellValue: 40
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [front_line, blade]
    locales:
      ja:
        name: 鋼の湾刀
        description: きちんと鍔の付いた鍛えの刃。前列の一段上。
  - id: equip.war-spear
    name: War Spear
    description: A heavier haft that still strikes from the second rank.
    slot: weapon
    tier: 2
    attackBonus: 3
    price: 130
    sellValue: 43
    allowedClasses: [vanguard, sellsword, bulwark, seeker, wayfinder]
    tags: [reach, polearm]
    locales:
      ja:
        name: 戦槍
        description: 重い柄。二列目からでもなお届く。
  - id: equip.hunting-bow
    name: Hunting Bow
    description: A full-draw bow that reaches the back of a pack.
    slot: weapon
    tier: 2
    attackBonus: 3
    accuracyBonus: 2
    price: 140
    sellValue: 46
    allowedClasses: [seeker, scout, cutpurse, wayfinder, chanter]
    tags: [reach, ranged]
    locales:
      ja:
        name: 狩弓
        description: 満を引く弓。群れの後ろまで届く。
  - id: equip.rune-staff
    name: Rune Staff
    description: A staff cut with focusing marks; steadier ward-signs from the back.
    slot: weapon
    tier: 2
    attackBonus: 2
    accuracyBonus: 3
    mpBonus: 2
    price: 135
    sellValue: 45
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [back_row, focus, reach]
    locales:
      ja:
        name: 呪印の杖
        description: 集印を刻んだ杖。後列からの札がぶれない。
  # ---- Tier 2 armour ----
  - id: equip.scale-mail
    name: Scale Mail
    description: Overlapping scale for the front rank; heavier, harder to cut.
    slot: body
    tier: 2
    defenseBonus: 3
    price: 150
    sellValue: 50
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker]
    tags: [front_line, heavy]
    locales:
      ja:
        name: 鱗鎧
        description: 前列のための重ね鱗。重いが斬られにくい。
  - id: equip.war-helm
    name: War Helm
    description: A closed helm that turns a glancing blow.
    slot: head
    tier: 2
    defenseBonus: 2
    price: 90
    sellValue: 30
    tags: [heavy]
    locales:
      ja:
        name: 戦兜
        description: 掠め手を逸らす閉じ兜。
  - id: equip.steel-gauntlets
    name: Steel Gauntlets
    description: Plated gloves that guard the grip and add to a blow.
    slot: hands
    tier: 2
    defenseBonus: 1
    attackBonus: 1
    price: 95
    sellValue: 31
    tags: [heavy]
    locales:
      ja:
        name: 鋼の手甲
        description: 握りを守り、一打を足す板金の手袋。
  - id: equip.tower-shield
    name: Tower Shield
    description: A broad shield for the front line; heavy cover at a cost of speed.
    slot: offhand
    tier: 2
    defenseBonus: 3
    speedBonus: -1
    price: 130
    sellValue: 43
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [front_line, heavy]
    locales:
      ja:
        name: 大盾
        description: 前列のための広い盾。速さと引き換えの重い守り。
  # ---- Effect accessories (HP / MP / resistance builds) ----
  - id: equip.vitality-charm
    name: Vitality Charm
    description: A knot of dried root that steadies the breath; more life to spend.
    slot: accessory
    tier: 2
    hpBonus: 6
    price: 130
    sellValue: 43
    tags: [charm]
    locales:
      ja:
        name: 活力の護符
        description: 干した根を結んだ護符。息を落ち着かせ、費やせる命を増やす。
  - id: equip.focus-band
    name: Focus Band
    description: A woven band that quiets the mind; a little deeper well of will.
    slot: accessory
    tier: 2
    mpBonus: 4
    price: 125
    sellValue: 41
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [charm, focus]
    locales:
      ja:
        name: 集中の鉢巻
        description: 心を静める織り鉢巻。気力の井戸が少し深くなる。
  - id: equip.antivenom-ring
    name: Antivenom Ring
    description: A ring set with a bitter stone that dulls poison in the blood.
    slot: accessory
    tier: 2
    resistBonus:
      poison: 45
    price: 110
    sellValue: 36
    tags: [charm]
    locales:
      ja:
        name: 解毒の指輪
        description: 苦い石を嵌めた指輪。血の毒を鈍らせる。
  - id: equip.dreamward-amulet
    name: Dreamward Amulet
    description: A pale amulet that keeps sleep and dread at arm's length.
    slot: accessory
    tier: 2
    resistBonus:
      sleep: 45
      fear: 25
    price: 120
    sellValue: 40
    tags: [charm, ward]
    locales:
      ja:
        name: 夢除けの護符
        description: 眠りと怯えを遠ざける青白い護符。
  - id: equip.swift-anklet
    name: Swift Anklet
    description: A light anklet that quickens the step in a fight.
    slot: accessory
    tier: 2
    speedBonus: 2
    price: 100
    sellValue: 33
    tags: [charm]
    locales:
      ja:
        name: 疾風の足環
        description: 戦いの足を速める軽い足環。
  # ---- Tier 3 capstones (found/bought deep) ----
  - id: equip.knight-plate
    name: Knight's Plate
    description: Full plate for the front rank — the deep floors' anvil.
    slot: body
    tier: 3
    defenseBonus: 5
    speedBonus: -1
    price: 320
    sellValue: 106
    allowedClasses: [vanguard, sellsword, bulwark]
    tags: [front_line, heavy]
    locales:
      ja:
        name: 騎士の全身鎧
        description: 前列のための全身板金。深層の鉄床。
  - id: equip.warlord-blade
    name: Warlord's Blade
    description: A long, balanced blade that bites deep for a strong front line.
    slot: weapon
    tier: 3
    attackBonus: 5
    price: 340
    sellValue: 113
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [front_line, blade]
    locales:
      ja:
        name: 覇者の剣
        description: 長く均衡の取れた刃。強い前列に深く食い込む。
  # ---- Elemental counterplay (黒碑: fire / salt / star) ----
  # Fire dries the ash-husks; salt kills the damp rot of the cisterns; star is the only thing the
  # votary answers to — found deep, never sold. Match the weapon to the enemy's weakness and a
  # lower-level prepared party gets through. Resist gear turns the fire-throwers' threat aside.
  - id: equip.ember-brand
    name: Ember Brand
    description: A blade quenched in cinder-oil; its edge carries a low, dry flame.
    slot: weapon
    tier: 2
    attackBonus: 3
    element: fire
    price: 120
    sellValue: 40
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout]
    tags: [blade, fire]
    locales:
      ja:
        name: 熾火の刃
        description: 燠の油に焼き入れた刃。乾いた低い炎を宿す。
  - id: equip.salt-etched-blade
    name: Salt-Etched Blade
    description: A blade pitted with grey salt; it bites what is damp, rotten, or unclean.
    slot: weapon
    tier: 2
    attackBonus: 4
    element: salt
    price: 165
    sellValue: 55
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [blade, salt]
    locales:
      ja:
        name: 塩喰みの刃
        description: 灰塩に蝕まれた刃。湿ったもの、腐ったもの、穢れたものを喰らう。
  - id: equip.starlit-needle
    name: Starlit Needle
    description: A pale sliver of the sky the pit shut out. It alone reaches the stela's root.
    slot: weapon
    tier: 3
    attackBonus: 5
    element: star
    sellValue: 160
    tags: [blade, star, keyed]
    locales:
      ja:
        name: 星明かりの針
        description: 坑が閉め出した空の、淡いひとかけら。碑の根に届くのはこれだけだ。
  - id: equip.cinder-warded-jack
    name: Cinder-Warded Jack
    description: A padded coat treated against flame; the ash-callers' fire slides off it.
    slot: body
    tier: 2
    defenseBonus: 2
    elementResist: { fire: 0.5 }
    price: 140
    sellValue: 46
    tags: [armor, fire-ward]
    locales:
      ja:
        name: 燠避けの胴着
        description: 炎に強く仕立てた綿入れ。灰呼びの火を受け流す。
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
      - itemId: item.antidote
        price: 20
        availability: always
      - itemId: item.greater-draught
        price: 70
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: item.clarity-draught
        price: 30
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: item.calm-draught
        price: 35
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: item.spirit-tonic
        price: 45
        availability: unlocked
        unlockFlag: flag.b2f.descent
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
      # Tier 2 line: the store widens once the party has proven it can descend.
      - itemId: equip.steel-sabre
        price: 120
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.war-spear
        price: 130
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.hunting-bow
        price: 140
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.rune-staff
        price: 135
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.scale-mail
        price: 150
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.war-helm
        price: 90
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.steel-gauntlets
        price: 95
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.tower-shield
        price: 130
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.vitality-charm
        price: 130
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.focus-band
        price: 125
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.antivenom-ring
        price: 110
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.dreamward-amulet
        price: 120
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.swift-anklet
        price: 100
        availability: unlocked
        unlockFlag: flag.b2f.descent
      # Tier 3 capstones: only once the finale run is open.
      - itemId: equip.knight-plate
        price: 320
        availability: unlocked
        unlockFlag: flag.b7f.descent
      - itemId: equip.warlord-blade
        price: 340
        availability: unlocked
        unlockFlag: flag.b7f.descent
      # Counterplay: buyable once the descent opens. The star weapon is NOT here — it is found.
      - itemId: equip.ember-brand
        price: 120
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.salt-etched-blade
        price: 165
        availability: unlocked
        unlockFlag: flag.b2f.descent
      - itemId: equip.cinder-warded-jack
        price: 140
        availability: unlocked
        unlockFlag: flag.b2f.descent
    locales:
      ja:
        name: 黒碑門の雑貨店
        description: 帰ってきた者にだけ品数が増える店。
---

# Items and Shops

Scenario-authored catalog data for the first scenario pass.

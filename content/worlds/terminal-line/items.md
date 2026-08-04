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
  # Exploration tools — every world must answer a lock, a trap and a hidden passage without a specialist class
  # (§9.4c / itemAlternatives invariant). The line's maintenance kit is that answer here.
  - id: item.tl-maintenance-multitool
    name: Maintenance Multitool
    kind: utility
    tier: 2
    price: 60
    sellValue: 20
    explorationAid: { actions: [unlock, disarm], bonus: 6 }
    locales:
      ja:
        name: 保守多用途具
        description: 保安員が携える多用途工具。非常錠をこじ開け、仕掛けの信管を抜く。
  - id: item.tl-signal-scope
    name: Signal Scope
    kind: utility
    tier: 2
    price: 70
    sellValue: 23
    explorationAid: { actions: [detectSecret, investigate], bonus: 5 }
    locales:
      ja:
        name: 信号鏡
        description: 壁越しの微弱信号を拾う手鏡。隠し配線や封じた区画の気配を読む。
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
  # §9.4c — a world must not be a dead end: a poisoned party needs a cure, an exhausted caster a way back, and
  # the ward/throwable/scroll one-shots that stand in for a missing class (the WEAKER, paid route). Authored in
  # the line's own voice; the offensive one-shots are incendiary (the world's `fire` element).
  - id: item.tl-neutralizer-stick
    name: Neutralizer Stick
    kind: cure
    tier: 1
    price: 20
    sellValue: 7
    curesStatuses: [poison, sleep]
    locales:
      ja:
        name: 中和スティック
        description: 毒と麻痺を打ち消す注射式の中和剤。折れば一度きり効く。
  - id: item.tl-signal-salts
    name: Signal Salts
    kind: focus
    tier: 2
    price: 45
    sellValue: 15
    restoreMp: 8
    locales:
      ja:
        name: 気付けの塩
        description: 嗅げば頭が冴える保安支給の塩。涸れた気力を呼び戻す。
  - id: item.tl-riot-ward
    name: Riot Ward Deploy
    kind: ward
    tier: 3
    price: 80
    sellValue: 26
    useTechnique: ward-hymn
    locales:
      ja:
        name: 防護展開具
        description: 展張式の遮蔽膜。一度だけ隊列を覆い、詠唱者の代わりに前へ立つ。
  - id: item.tl-thermite-charge
    name: Thermite Charge
    kind: throwable
    tier: 2
    price: 40
    sellValue: 13
    useTechnique: firebolt
    locales:
      ja:
        name: 焼夷手榴弾
        description: 投げれば白熱して爆ぜる焼夷弾。錆びた装甲も金具も焼き貫く。
  - id: item.tl-fire-order
    name: Incendiary Order
    kind: scroll
    tier: 4
    price: 150
    sellValue: 50
    useTechnique: flame-wave
    locales:
      ja:
        name: 焼夷指令書
        description: 一度だけ発令できる焼夷斉射の指令書。読み上げれば灰になる。
  - id: item.tl-rainwater-flask
    name: Rainwater Flask
    kind: healing
    tier: 2
    price: 42
    sellValue: 14
    healAmount: 22
    locales:
      ja:
        name: 浄水フラスコ
        description: 雨水処理槽の上澄みを濾した小瓶。戦闘外で一人の傷をしっかり洗い流す。
  - id: item.tl-trauma-seal
    name: Trauma Seal
    kind: healing
    tier: 4
    price: 88
    sellValue: 29
    healAmount: 36
    locales:
      ja:
        name: 外傷封止材
        description: 圧着すると深い傷を一時的に閉じる救護材。次の曲がり角まで歩くための備えになる。
  - id: item.tl-chime-muffler
    name: Chime Muffler
    kind: cure
    tier: 3
    price: 36
    sellValue: 12
    curesStatuses: [fear, silence]
    locales:
      ja:
        name: チャイム遮断栓
        description: 耳と喉を覆う小さな遮断栓。閉鎖チャイムの恐怖と声の詰まりを一度だけ遠ざける。
  - id: item.tl-dispatch-stimulant
    name: Dispatch Stimulant
    kind: focus
    tier: 4
    price: 82
    sellValue: 27
    restoreMp: 14
    locales:
      ja:
        name: 指令用覚醒剤
        description: 夜勤の管制員が使った強い覚醒アンプル。涸れた気力を大きく戻すが、一本きりだ。
  - id: item.tl-breach-wedge
    name: Breach Wedge
    kind: utility
    tier: 3
    price: 76
    sellValue: 25
    explorationAid: { actions: [unlock], bonus: 8 }
    locales:
      ja:
        name: 破扉ウェッジ
        description: 固い非常錠へ打ち込む段付き楔。専門の手際には及ばないが、閉じた扉へ確かな力を貸す。
  - id: item.tl-tripwire-shim
    name: Tripwire Shim
    kind: utility
    tier: 3
    price: 68
    sellValue: 22
    explorationAid: { actions: [disarm], bonus: 8 }
    locales:
      ja:
        name: 仕掛け止め板
        description: 細い信管の下へ滑らせる薄鋼板。罠師ほど正確ではないが、起爆を一度ためらわせる。
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
  - id: equip.tl-platform-38-rifle
    name: Type 38 Infantry Rifle
    description: A long wooden bolt-action rifle left in a sealed station armoury. Its fixed magazine and narrow sights still reward a patient, deliberate hand.
    slot: weapon
    tier: 1
    attackBonus: 3
    accuracyBonus: 3
    speedBonus: -1
    allowedClasses: [vanguard, sellsword, duelist, seeker, scout, wayfinder]
    tags: [firearm, rifle, bolt-action, terminal-line]
    price: 82
    sellValue: 27
    locales:
      ja:
        name: 三八式歩兵銃
        description: 封鎖された駅武器庫に残された、長い木製銃床のボルトアクション小銃。固定弾倉と細い照星は、急がない射手の手に応える。
  - id: equip.tl-drain-5-smg
    name: Drain-5 SMG
    description: A compact receiver and straight magazine issued to drain crews for the first close alarm.
    slot: weapon
    tier: 1
    attackBonus: 1
    accuracyBonus: 1
    speedBonus: 2
    allowedClasses: [duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, smg, terminal-line]
    price: 74
    sellValue: 24
    locales:
      ja:
        name: 排水5型短機関銃
        description: 排水班が最初の警報に備えて持った、直線弾倉の小型短機関銃。狭い場所で素早く構えるための旧式だ。
  - id: equip.tl-maintenance-10-shotgun
    name: Maintenance-10 Shotgun
    description: A short double-barrel work shotgun, scarred by locker doors and emergency hinges.
    slot: weapon
    tier: 1
    attackBonus: 3
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [firearm, shotgun, terminal-line]
    price: 94
    sellValue: 31
    locales:
      ja:
        name: 保守10型散弾銃
        description: ロッカー扉と非常蝶番に傷を残した、短い二連式の作業散弾銃。最初の一歩を前衛へ渡す。
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
  # F2–F3: public-station gear. It broadens weapon and protection choices before rainworks, rather than
  # handing one linear attack increase to every party member.
  - id: equip.tl-relay-carbine
    name: Relay Carbine
    description: A compact rail-security carbine with a folded stock and a clear service sight.
    slot: weapon
    tier: 2
    attackBonus: 3
    accuracyBonus: 4
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, ranged, terminal-line]
    price: 128
    sellValue: 42
    locales: { ja: { name: 中継保安カービン, description: 折り畳み銃床と整備照門を持つ、乗換保安用の短銃身銃。 } }
  - id: equip.tl-concourse-6-pistol
    name: Concourse-6 Pistol
    description: A six-shot interchange pistol with a squared slide and broad, rain-safe controls.
    slot: weapon
    tier: 2
    attackBonus: 2
    accuracyBonus: 3
    allowedClasses: [vanguard, sellsword, duelist, seeker, scout, cutpurse]
    tags: [firearm, pistol, terminal-line]
    price: 116
    sellValue: 38
    locales: { ja: { name: 広場6型拳銃, description: 角張った遊底と濡れた手でも扱える大きな操作部を持つ、乗換広場の六発拳銃。 } }
  - id: equip.tl-ticket-7-smg
    name: Ticket-7 SMG
    description: A stamped-metal short gun with a side-folding wire stock and a doubled inspection sight.
    slot: weapon
    tier: 2
    attackBonus: 3
    accuracyBonus: 2
    speedBonus: 2
    allowedClasses: [duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, smg, terminal-line]
    price: 148
    sellValue: 49
    locales: { ja: { name: 切符7型短機関銃, description: 横折れの線材銃床と二重の点検照門を持つ、打ち抜き鋼板の短機関銃。 } }
  - id: equip.tl-pump-8-shotgun
    name: Pump-8 Shotgun
    description: A rain-sealed pump shotgun with a grooved wooden fore-end and a tube magazine under the barrel.
    slot: weapon
    tier: 2
    attackBonus: 4
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [firearm, shotgun, terminal-line]
    price: 166
    sellValue: 55
    locales: { ja: { name: 排水8型散弾銃, description: 溝入りの木製先台と銃身下の管状弾倉を備える、防雨仕様のポンプ散弾銃。 } }
  - id: equip.tl-ironrain-74-rifle
    name: Ironrain-74 Rifle
    description: A stamped-steel service rifle with a dark wood handguard and a curved magazine; old, simple, and made to endure a wet platform.
    slot: weapon
    tier: 3
    attackBonus: 4
    accuracyBonus: 2
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, rifle, terminal-line]
    price: 142
    sellValue: 47
    locales: { ja: { name: 鉄雨74式自動小銃, description: 打ち抜き鋼板と黒い木製ハンドガード、曲線弾倉を持つ旧式自動小銃。濡れたホームでも動くよう作られている。 } }
  - id: equip.tl-platform-buckler
    name: Platform Buckler
    description: A steel crowd-control buckler, light enough to keep a weapon hand free.
    slot: offhand
    tier: 2
    defenseBonus: 2
    speedBonus: 1
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [shield, light, terminal-line]
    price: 86
    sellValue: 28
    locales: { ja: { name: ホーム小盾, description: 武器を持つ手を空けたまま使える、鋼の群衆整理用小盾。 } }
  - id: equip.tl-insulated-hood
    name: Insulated Hood
    description: A lined work hood that keeps signal noise and wet cold away from the ears.
    slot: head
    tier: 2
    defenseBonus: 1
    resistBonus: { fear: 20, silence: 20 }
    tags: [head, insulated, terminal-line]
    price: 74
    sellValue: 24
    locales: { ja: { name: 絶縁フード, description: 信号雑音と濡れた冷気を、耳元から遠ざける裏地付きの作業頭巾。 } }
  - id: equip.tl-callbox-knife
    name: Callbox Knife
    description: A short utility knife once kept inside emergency call boxes; quiet, quick, and no substitute for a real blade.
    slot: weapon
    tier: 2
    attackBonus: 1
    speedBonus: 2
    allowedClasses: [duelist, seeker, scout, cutpurse, wayfinder]
    tags: [melee, quiet, terminal-line]
    price: 78
    sellValue: 26
    locales: { ja: { name: 非常電話ナイフ, description: 非常電話箱に収められた短い工具刃。威力より、静かな手早さを選ぶ者の武器。 } }
  - id: equip.tl-ticket-cutter
    name: Ticket Cutter Cuff
    description: A reinforced cuff with a concealed ticket-cutting blade and a sure grip on narrow controls.
    slot: hands
    tier: 2
    accuracyBonus: 2
    speedBonus: 1
    allowedClasses: [duelist, seeker, scout, cutpurse, wayfinder]
    tags: [hands, precision, terminal-line]
    price: 92
    sellValue: 30
    locales: { ja: { name: 改札切符手甲, description: 切符鋏を隠した補強手甲。狭い操作盤でも確かな手元を残す。 } }
  # F4–F6: rainworks, depot, and records. Two weapon lines compete with masks, a practical body layer,
  # and tools that let both ranks spend the same equipment slots differently.
  - id: equip.tl-sluice-shotgun
    name: Sluice Shotgun
    description: A heavy maintenance shotgun kept for clearing jammed floodgates at close range.
    slot: weapon
    tier: 3
    attackBonus: 5
    accuracyBonus: 1
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [firearm, close, terminal-line]
    price: 210
    sellValue: 70
    locales: { ja: { name: 水門散弾銃, description: 詰まった水門を近距離で開けるため、保守班が備えた重い散弾銃。 } }
  - id: equip.tl-turnstile-9-smg
    name: Turnstile-9 SMG
    description: A compact folded-stock submachine gun recovered from an evacuation checkpoint; it favours a quick, close response over a long sightline.
    slot: weapon
    tier: 3
    attackBonus: 4
    accuracyBonus: 2
    speedBonus: 2
    allowedClasses: [duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, smg, terminal-line]
    price: 194
    sellValue: 64
    locales: { ja: { name: 改札9型短機関銃, description: 避難改札から回収された折り畳み銃床の短機関銃。長い照準より、至近の素早い応答を選ぶ。 } }
  - id: equip.tl-relay-11-pistol
    name: Relay-11 Pistol
    description: A heavy eleven-shot service pistol rebuilt around a relay-safe frame and a luminous maintenance sight.
    slot: weapon
    tier: 3
    attackBonus: 3
    accuracyBonus: 4
    speedBonus: 1
    allowedClasses: [vanguard, sellsword, duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, pistol, relay, terminal-line]
    price: 204
    sellValue: 68
    locales: { ja: { name: 中継11型拳銃, description: 中継器に耐える機関部と保守用の淡い照門を組み込んだ、重い十一発拳銃。 } }
  - id: equip.tl-floodgate-12-shotgun
    name: Floodgate-12 Shotgun
    description: A short, pump-action breach shotgun with a broad wooden fore-end and a brutal steel receiver.
    slot: weapon
    tier: 4
    attackBonus: 6
    accuracyBonus: 1
    speedBonus: -1
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [firearm, shotgun, terminal-line]
    price: 236
    sellValue: 78
    locales: { ja: { name: 水門12型散弾銃, description: 太い木製先台と鈍い鋼製機関部を持つ、破扉用の短い散弾銃。狭所で前へ出る者のための一挺。 } }
  - id: equip.tl-archive-staff
    name: Archive Staff
    description: A telescoping archive probe whose copper rings keep a careful hand steady.
    slot: weapon
    tier: 3
    attackBonus: 2
    accuracyBonus: 2
    mpBonus: 4
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [focus, reach, terminal-line]
    price: 185
    sellValue: 61
    locales: { ja: { name: 記録庫の探針杖, description: 銅輪を刻んだ伸縮探針。慎重な手元と気力を支える。 } }
  - id: equip.tl-filter-mask
    name: Filter Mask
    description: A replaceable-charcoal respirator for drain fumes and archive dust.
    slot: head
    tier: 3
    defenseBonus: 1
    resistBonus: { poison: 45, silence: 15 }
    tags: [head, filter, terminal-line]
    price: 118
    sellValue: 39
    locales: { ja: { name: ろ過面, description: 排水の臭気と記録庫の粉塵を防ぐ、交換炭入りの防毒面。 } }
  - id: equip.tl-sluice-coat
    name: Sluice Coat
    description: A waxed trench coat with a weighted hem for walking flooded inspection paths.
    slot: body
    tier: 3
    defenseBonus: 3
    hpBonus: 4
    elementResist: { current: 0.85 }
    tags: [armor, rainworks, terminal-line]
    price: 198
    sellValue: 66
    locales: { ja: { name: 水門防水コート, description: 浸水した点検路を歩くため、裾へ重りを入れた蝋引きの防水コート。 } }
  - id: equip.tl-relay-gloves
    name: Relay Gloves
    description: Rubberised gloves with plated palms for live cabinets and hard grips.
    slot: hands
    tier: 3
    attackBonus: 1
    accuracyBonus: 2
    elementResist: { current: 0.9 }
    tags: [hands, insulated, terminal-line]
    price: 102
    sellValue: 34
    locales: { ja: { name: 中継盤手袋, description: 通電盤と強い握りに耐える、掌を補強したゴム手袋。 } }
  - id: equip.tl-records-charm
    name: Records Charm
    description: A numbered discharge token; proof that a person was once meant to leave.
    slot: accessory
    tier: 3
    mpBonus: 3
    resistBonus: { fear: 30 }
    tags: [charm, records, terminal-line]
    price: 146
    sellValue: 48
    locales: { ja: { name: 退院番号札, description: かつて誰かが外へ出るはずだったことを示す、番号入りの退院札。 } }
  - id: equip.tl-sump-talisman
    name: Sump Talisman
    description: A lead-lined drain token that turns foul water away from the throat and keeps a carrier steady.
    slot: accessory
    tier: 3
    hpBonus: 3
    resistBonus: { poison: 35 }
    tags: [charm, rainworks, terminal-line]
    price: 132
    sellValue: 44
    locales: { ja: { name: 沈砂池の護符, description: 鉛板で裏打ちされた排水札。濁った水の毒気を遠ざけ、持ち主の息を保つ。 } }
  - id: equip.tl-porter-frame
    name: Porter Frame
    description: A padded cargo frame that braces the bearer against a sudden load at the cost of free movement.
    slot: offhand
    tier: 3
    defenseBonus: 3
    hpBonus: 4
    speedBonus: -1
    allowedClasses: [vanguard, sellsword, bulwark, seeker, scout]
    tags: [shield, depot, terminal-line]
    price: 174
    sellValue: 58
    locales: { ja: { name: 荷役フレーム, description: 不意の積荷を受け止める背負い枠。身軽さを少し失う代わりに、前へ出る者を守る。 } }
  # F7–F8: bureau and control gear. It trades raw protection, casting depth, and resistance to the deep
  # signal threats rather than making every slot a mandatory firearm upgrade.
  - id: equip.tl-bureau-sidearm
    name: Bureau Sidearm
    description: A balanced administrative sidearm with an unusually clean trigger assembly.
    slot: weapon
    tier: 4
    attackBonus: 5
    accuracyBonus: 5
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, ranged, bureau, terminal-line]
    price: 310
    sellValue: 103
    locales: { ja: { name: 中央局制式拳銃, description: 不自然なほど整備の行き届いた、中央局の制式短銃。 } }
  - id: equip.tl-bureau-17-smg
    name: Bureau-17 SMG
    description: A disciplined compact gun from bureau escorts, with a flat receiver, protected sights, and a rigid folding stock.
    slot: weapon
    tier: 4
    attackBonus: 5
    accuracyBonus: 4
    speedBonus: 2
    allowedClasses: [duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, smg, bureau, terminal-line]
    price: 324
    sellValue: 108
    locales: { ja: { name: 中央局17型短機関銃, description: 平たい機関部、覆い照門、硬い折り畳み銃床を備えた、中央局随行員の短機関銃。 } }
  - id: equip.tl-quarantine-62-dmr
    name: Quarantine-62 Rifle
    description: A long, heavy marksman's rifle from the sealed wards, with a hooded sight and a wire-wrapped stock.
    slot: weapon
    tier: 4
    attackBonus: 6
    accuracyBonus: 7
    speedBonus: -1
    allowedClasses: [vanguard, sellsword, duelist, seeker, scout, wayfinder]
    tags: [firearm, marksman, terminal-line]
    price: 338
    sellValue: 112
    locales: { ja: { name: 隔離62式指定射撃銃, description: 封鎖病棟の射手が残した長い銃身と覆い照門を持つ射撃銃。取り回しを失う代わりに、遠い一点を確かに捉える。 } }
  - id: equip.tl-control-rod
    name: Control Rod
    description: A signal-control rod whose ceramic core holds a measured charge.
    slot: weapon
    tier: 4
    attackBonus: 3
    accuracyBonus: 3
    mpBonus: 5
    element: signal
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [focus, signal, terminal-line]
    price: 295
    sellValue: 98
    locales: { ja: { name: 信号制御杖, description: 陶製の芯に、制御された電荷を溜める信号管制用の杖。 } }
  - id: equip.tl-clearance-vest
    name: Clearance Vest
    description: Layered bureau body armour issued to escorts who entered sealed wards.
    slot: body
    tier: 4
    defenseBonus: 4
    resistBonus: { fear: 20, silence: 25 }
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse]
    tags: [armor, bureau, terminal-line]
    price: 275
    sellValue: 91
    locales: { ja: { name: 隔離局ベスト, description: 封鎖区画へ入る随行員に支給された、重ね布の防護ベスト。 } }
  - id: equip.tl-signal-ward
    name: Signal Ward
    description: A folding insulated panel that catches the first bite of an overload.
    slot: offhand
    tier: 4
    defenseBonus: 2
    elementResist: { signal: 0.72 }
    resistBonus: { fear: 20, silence: 25 }
    allowedClasses: [vanguard, sellsword, bulwark, duelist, mender, chanter, occultist, arcanist, wayfinder]
    tags: [shield, ward, signal, terminal-line]
    price: 260
    sellValue: 86
    locales: { ja: { name: 信号避けパネル, description: 過負荷の最初の一撃を受ける、折り畳み式の絶縁パネル。 } }
  - id: equip.tl-switchboard-gloves
    name: Switchboard Gloves
    description: Fine-contact gloves that make a single deliberate motion more certain.
    slot: hands
    tier: 4
    accuracyBonus: 3
    mpBonus: 2
    tags: [hands, control, terminal-line]
    price: 172
    sellValue: 57
    locales: { ja: { name: 分電盤手袋, description: 一つの確かな操作のため、細かな接点を残した管制用手袋。 } }
  - id: equip.tl-dispatch-ring
    name: Dispatch Ring
    description: A brass dispatcher ring marked with routes that no longer appear on any map.
    slot: accessory
    tier: 4
    speedBonus: 2
    mpBonus: 2
    tags: [charm, control, terminal-line]
    price: 205
    sellValue: 68
    locales: { ja: { name: 指令員の指輪, description: どの地図からも消えた経路を刻んだ、真鍮の指令員指輪。 } }
  - id: equip.tl-triage-lens
    name: Triage Lens
    description: A clipped inspection lens that isolates one clear detail from a crowded, noisy ward.
    slot: head
    tier: 4
    defenseBonus: 1
    accuracyBonus: 3
    resistBonus: { silence: 25 }
    tags: [head, medical, terminal-line]
    price: 224
    sellValue: 74
    locales: { ja: { name: トリアージ単眼鏡, description: 騒がしい病棟から一つの確かな徴候を拾う検査単眼鏡。目と声を静かに保つ。 } }
  # F9–F10: the final recovery and command equipment. These are named endgame rewards with real slot
  # choices, not six copies of a larger attack number.
  - id: equip.tl-evacuation-carbine
    name: Evacuation Carbine
    description: A long-barrel evacuation guard carbine built to keep a route open under pressure.
    slot: weapon
    tier: 5
    attackBonus: 7
    accuracyBonus: 5
    element: current
    allowedClasses: [vanguard, sellsword, bulwark, duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, ranged, current, terminal-line]
    sellValue: 175
    locales: { ja: { name: 退避誘導カービン, description: 退避路を守るため、長い銃身を持たされた誘導員用カービン。 } }
  - id: equip.tl-platform-88-lmg
    name: Platform-88 LMG
    description: A belt-fed support gun with a ribbed barrel shroud and a sandbag-worn carry handle, issued to hold a terminal approach.
    slot: weapon
    tier: 5
    attackBonus: 8
    accuracyBonus: 2
    speedBonus: -2
    allowedClasses: [vanguard, sellsword, bulwark]
    tags: [firearm, support-gun, terminal-line]
    price: 430
    sellValue: 143
    locales: { ja: { name: ホーム88式軽機関銃, description: 放熱覆いと擦れた運搬把手を備える支援機関銃。終端へ続く入口を守るために支給された。 } }
  - id: equip.tl-zero-line-heavy-pistol
    name: Zero Line Heavy Pistol
    description: A thick-framed final-escort sidearm, its squared weight and deep sights made for the last platform.
    slot: weapon
    tier: 5
    attackBonus: 7
    accuracyBonus: 5
    speedBonus: -1
    allowedClasses: [vanguard, sellsword, duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, pistol, terminus, terminal-line]
    price: 406
    sellValue: 135
    locales: { ja: { name: 零番線重拳銃, description: 厚い機関部と深い照門を持つ、最終随行員用の重拳銃。終着ホームで最後まで構え続ける。 } }
  - id: equip.tl-zero-line-21-smg
    name: Zero Line-21 SMG
    description: A final-issue compact gun with a vented shroud, telescoping stock, and a curved reserve magazine.
    slot: weapon
    tier: 5
    attackBonus: 6
    accuracyBonus: 5
    speedBonus: 3
    allowedClasses: [duelist, seeker, scout, cutpurse, wayfinder]
    tags: [firearm, smg, terminus, terminal-line]
    price: 418
    sellValue: 139
    locales: { ja: { name: 零番線21型短機関銃, description: 放熱覆い、伸縮銃床、曲線予備弾倉を備える、零番線の最終支給短機関銃。 } }
  - id: equip.tl-terminus-14-shotgun
    name: Terminus-14 Shotgun
    description: A heavy final-platform shotgun with a ribbed heat guard and a reinforced breach collar.
    slot: weapon
    tier: 5
    attackBonus: 8
    accuracyBonus: 1
    speedBonus: -2
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [firearm, shotgun, terminus, terminal-line]
    price: 446
    sellValue: 148
    locales: { ja: { name: 終端14型散弾銃, description: 放熱覆いと補強薬室を備えた、最終ホーム用の重散弾銃。通路を退かない者に渡される。 } }
  - id: equip.tl-terminus-breaker
    name: Terminus Breaker
    description: A heavy rail breaker whose rusted edge tears open seized machinery.
    slot: weapon
    tier: 5
    attackBonus: 8
    element: rust
    allowedClasses: [vanguard, sellsword, bulwark, duelist]
    tags: [melee, rust, terminal-line]
    sellValue: 182
    locales: { ja: { name: 終端解体槌, description: 固着した機械を裂くための、錆びた重いレール解体槌。 } }
  - id: equip.tl-lift-harness
    name: Lift Harness
    description: A climbing harness with a broad back plate for surviving a failed winch.
    slot: body
    tier: 5
    defenseBonus: 5
    hpBonus: 8
    speedBonus: 1
    tags: [armor, liftworks, terminal-line]
    sellValue: 148
    locales: { ja: { name: 昇降機ハーネス, description: 巻上げ機が外れても耐えるよう、背に広い板を入れた登攀具。 } }
  - id: equip.tl-zero-line-helm
    name: Zero Line Helm
    description: A closed railway helm with a throat mic that refuses the closing chime.
    slot: head
    tier: 5
    defenseBonus: 3
    resistBonus: { fear: 35, silence: 40 }
    tags: [head, terminus, terminal-line]
    sellValue: 116
    locales: { ja: { name: 零番線ヘルム, description: 閉鎖チャイムを拒む喉元マイク付きの、閉じた鉄道用ヘルム。 } }
  - id: equip.tl-return-winch-brace
    name: Return Winch Brace
    description: A leather-and-steel wrist brace used to hold a manual return cable.
    slot: hands
    tier: 5
    attackBonus: 2
    defenseBonus: 2
    tags: [hands, liftworks, terminal-line]
    sellValue: 108
    locales: { ja: { name: 帰還巻上げ手甲, description: 手動の帰還ケーブルを保持する、革と鋼の手首固定具。 } }
  - id: equip.tl-route-seal
    name: Route Seal Locket
    description: A sealed route locket whose nested plates keep a last departure order close and the bearer moving.
    slot: accessory
    tier: 5
    hpBonus: 5
    speedBonus: 1
    resistBonus: { ward: 20, fear: 15 }
    tags: [charm, liftworks, terminal-line]
    sellValue: 156
    locales: { ja: { name: 運行封印のロケット, description: 最終退避命令を重ね板へ封じたロケット。足を止めず、恐怖を少しだけ遠ざける。 } }
  - id: equip.tl-platform-zero-plate
    name: Platform Zero Plate
    description: A final escort plate fitted with insulated joints and a heavy collar.
    slot: body
    tier: 6
    defenseBonus: 6
    speedBonus: -1
    elementResist: { signal: 0.75, current: 0.85 }
    allowedClasses: [vanguard, sellsword, bulwark]
    tags: [armor, heavy, terminus, terminal-line]
    sellValue: 220
    locales: { ja: { name: 零番線の装甲服, description: 絶縁関節と重い襟を備えた、最終随行員用の装甲服。 } }
  - id: equip.tl-zero-line-conductor
    name: Zero Line Conductor
    description: A dispatch baton that turns a holder's ordinary strike into a measured signal pulse.
    slot: weapon
    tier: 6
    attackBonus: 6
    accuracyBonus: 4
    mpBonus: 4
    element: signal
    allowedClasses: [mender, chanter, occultist, arcanist, wayfinder]
    tags: [focus, signal, terminus, terminal-line]
    sellValue: 228
    locales: { ja: { name: 零番線の指令杖, description: 持ち手の一撃を、整えられた信号の脈動へ変える指令棒。 } }
  - id: equip.tl-end-marker-signet
    name: End Marker Signet
    description: The original Platform Zero route plate, worn as a final choice rather than a key.
    slot: accessory
    tier: 6
    hpBonus: 6
    mpBonus: 4
    resistBonus: { fear: 30, silence: 30, ward: 20 }
    elementResist: { signal: 0.8 }
    tags: [charm, terminus, terminal-line]
    sellValue: 235
    locales: { ja: { name: 終端標の印章, description: 最初の零番線運行板。鍵ではなく、終幕で身につける選択となる。 } }
shops:
  - id: shop.tl-interchange-market
    name: Interchange Supply Stall
    service: general_store
    stock:
      - { itemId: item.tl-field-dressing, price: 24 }
      - { itemId: item.tl-neutralizer-stick, price: 20 }
      - { itemId: item.tl-rainwater-flask, price: 42, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: item.tl-chime-muffler, price: 36, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: item.tl-signal-salts, price: 45, availability: unlocked, unlockFlag: flag.tl5f.loading-open }
      - { itemId: item.tl-trauma-seal, price: 88, availability: unlocked, unlockFlag: flag.tl6f.lift-online }
      - { itemId: item.tl-dispatch-stimulant, price: 82, availability: unlocked, unlockFlag: flag.tl7f.archive-open }
      - { itemId: item.tl-breach-wedge, price: 76, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: item.tl-tripwire-shim, price: 68, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: item.tl-riot-ward, price: 80, availability: unlocked, unlockFlag: flag.tl6f.lift-online }
      - { itemId: item.tl-thermite-charge, price: 40, availability: unlocked, unlockFlag: flag.tl5f.loading-open }
      - { itemId: item.tl-fire-order, price: 150, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
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
      - { itemId: equip.tl-platform-38-rifle, price: 82 }
      - { itemId: equip.tl-drain-5-smg, price: 74 }
      - { itemId: equip.tl-maintenance-10-shotgun, price: 94 }
      - { itemId: equip.tl-rain-jacket, price: 44 }
      - { itemId: equip.tl-relay-carbine, price: 128, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-concourse-6-pistol, price: 116, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-ticket-7-smg, price: 148, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-pump-8-shotgun, price: 166, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-ironrain-74-rifle, price: 142, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-platform-buckler, price: 86, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-insulated-hood, price: 74, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-callbox-knife, price: 78, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-ticket-cutter, price: 92, availability: unlocked, unlockFlag: flag.tl3f.bypass-open }
      - { itemId: equip.tl-sluice-shotgun, price: 210, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: equip.tl-turnstile-9-smg, price: 194, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: equip.tl-relay-11-pistol, price: 204, availability: unlocked, unlockFlag: flag.tl5f.loading-open }
      - { itemId: equip.tl-floodgate-12-shotgun, price: 236, availability: unlocked, unlockFlag: flag.tl5f.loading-open }
      - { itemId: equip.tl-archive-staff, price: 185, availability: unlocked, unlockFlag: flag.tl5f.loading-open }
      - { itemId: equip.tl-filter-mask, price: 118, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: equip.tl-sluice-coat, price: 198, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: equip.tl-relay-gloves, price: 102, availability: unlocked, unlockFlag: flag.tl5f.loading-open }
      - { itemId: equip.tl-records-charm, price: 146, availability: unlocked, unlockFlag: flag.tl6f.lift-online }
      - { itemId: equip.tl-sump-talisman, price: 132, availability: unlocked, unlockFlag: flag.tl4f.sluice-open }
      - { itemId: equip.tl-porter-frame, price: 174, availability: unlocked, unlockFlag: flag.tl5f.loading-open }
      - { itemId: equip.tl-bureau-sidearm, price: 310, availability: unlocked, unlockFlag: flag.tl7f.archive-open }
      - { itemId: equip.tl-bureau-17-smg, price: 324, availability: unlocked, unlockFlag: flag.tl7f.archive-open }
      - { itemId: equip.tl-quarantine-62-dmr, price: 338, availability: unlocked, unlockFlag: flag.tl7f.archive-open }
      - { itemId: equip.tl-control-rod, price: 295, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-clearance-vest, price: 275, availability: unlocked, unlockFlag: flag.tl7f.archive-open }
      - { itemId: equip.tl-signal-ward, price: 260, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-switchboard-gloves, price: 172, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-dispatch-ring, price: 205, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-triage-lens, price: 224, availability: unlocked, unlockFlag: flag.tl7f.archive-open }
      - { itemId: equip.tl-platform-88-lmg, price: 430, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-evacuation-carbine, price: 390, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-zero-line-heavy-pistol, price: 406, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-zero-line-21-smg, price: 418, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
      - { itemId: equip.tl-terminus-14-shotgun, price: 446, availability: unlocked, unlockFlag: flag.tl8f.switch-open }
    locales:
      ja:
        name: シャッター工房
        description: 閉じた改札の横で、回収品の手入れと交換を行う整備台。
---

# 乗換広場の持ち出し品

第一幕では、弾薬は世界固有の在庫として存在する。共有弾・警戒度の消費ルールはW3aで接続する。

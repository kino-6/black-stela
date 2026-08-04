---
techniques:
  - id: pistol-draw
    kind: skill
    target: enemyGroup
    cost:
      mp: 2
    effects:
      - kind: damage
        min: 4
        max: 7
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Quick Shot
      ja:
        name: 即応射撃
  - id: pistol-aimed
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 5
        max: 9
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Aimed Shot
      ja:
        name: 狙点射撃
  - id: pistol-suppress
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: debuff
        stat: accuracy
        amount: 8
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Suppressive Sight
      ja:
        name: 制圧照準
  - id: pistol-pin
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 5
        max: 8
        element: physical
      - kind: debuff
        stat: speed
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Pinning Shot
      ja:
        name: 足止め射
  - id: pistol-relay
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: damage
        min: 7
        max: 11
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Relay Shot
      ja:
        name: 中継射撃
  - id: pistol-mark
    kind: skill
    target: party
    cost:
      mp: 3
    effects:
      - kind: buff
        stat: accuracy
        amount: 4
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Mark Share
      ja:
        name: 標的共有
  - id: pistol-bureau
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: damage
        min: 8
        max: 12
        element: physical
      - kind: debuff
        stat: evasion
        amount: 8
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Bureau Shot
      ja:
        name: 制式射撃
  - id: pistol-seal
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: status
        status: fear
    duration:
      kind: combat
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Seal Warning
      ja:
        name: 封鎖警告
  - id: pistol-terminal
    kind: skill
    target: enemyGroup
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 10
        max: 15
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Terminal Sight
      ja:
        name: 終端照準
  - id: pistol-lastword
    kind: skill
    target: enemyGroup
    cost:
      mp: 6
    effects:
      - kind: damage
        min: 12
        max: 18
        element: physical
      - kind: debuff
        stat: accuracy
        amount: 10
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - pistol
      - terminal-line
    locales:
      en:
        name: Last Word
      ja:
        name: 最終一射
  - id: rifle-rest
    kind: skill
    target: self
    cost:
      mp: 2
    effects:
      - kind: buff
        stat: accuracy
        amount: 6
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Rested Aim
      ja:
        name: 据銃
  - id: rifle-sight
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 6
        max: 10
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Sighted Shot
      ja:
        name: 照準射
  - id: rifle-brace
    kind: skill
    target: self
    cost:
      mp: 3
    effects:
      - kind: buff
        stat: damage
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Stock Brace
      ja:
        name: 銃床固定
  - id: rifle-hamper
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 6
        max: 9
        element: physical
      - kind: debuff
        stat: speed
        amount: 3
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Hampering Shot
      ja:
        name: 脚止め射
  - id: rifle-cutline
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: damage
        min: 8
        max: 13
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Cut Line
      ja:
        name: 線路断ち
  - id: rifle-scan
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: debuff
        stat: evasion
        amount: 12
    duration:
      kind: rounds
      rounds: 3
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Observation Shot
      ja:
        name: 観測射
  - id: rifle-quarantine
    kind: skill
    target: enemyGroup
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 10
        max: 16
        element: physical
      - kind: debuff
        stat: armor
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Quarantine Shot
      ja:
        name: 隔離射
  - id: rifle-coldshot
    kind: skill
    target: enemyGroup
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 11
        max: 17
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Cold Shot
      ja:
        name: 冷徹射
  - id: rifle-evac
    kind: skill
    target: party
    cost:
      mp: 5
    effects:
      - kind: buff
        stat: accuracy
        amount: 6
      - kind: buff
        stat: speed
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Evacuation Cover
      ja:
        name: 退避援護
  - id: rifle-longwatch
    kind: skill
    target: enemyGroup
    cost:
      mp: 6
    effects:
      - kind: damage
        min: 14
        max: 21
        element: physical
      - kind: debuff
        stat: evasion
        amount: 12
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - rifle
      - terminal-line
    locales:
      en:
        name: Long Watch
      ja:
        name: 長距離監視
  - id: smg-sweep
    kind: skill
    target: allEnemies
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 3
        max: 6
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Corridor Sweep
      ja:
        name: 通路掃射
  - id: smg-push
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 5
        max: 8
        element: physical
      - kind: debuff
        stat: armor
        amount: 1
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Pressing Shot
      ja:
        name: 押し込み射
  - id: smg-turnstile
    kind: skill
    target: allEnemies
    cost:
      mp: 4
    effects:
      - kind: damage
        min: 4
        max: 8
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Turnstile Sweep
      ja:
        name: 改札掃射
  - id: smg-scatter
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: debuff
        stat: accuracy
        amount: 10
      - kind: debuff
        stat: speed
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Scatter Denial
      ja:
        name: 散開阻止
  - id: smg-rainline
    kind: skill
    target: allEnemies
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 6
        max: 10
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Rainline Sweep
      ja:
        name: 雨路掃射
  - id: smg-crossfire
    kind: skill
    target: enemyGroup
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 8
        max: 12
        element: physical
      - kind: debuff
        stat: armor
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Crossfire
      ja:
        name: 交差制圧
  - id: smg-bureau
    kind: skill
    target: allEnemies
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 7
        max: 11
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Bureau Sweep
      ja:
        name: 制式掃射
  - id: smg-lockdown
    kind: skill
    target: enemyGroup
    cost:
      mp: 5
    effects:
      - kind: status
        status: fear
      - kind: debuff
        stat: speed
        amount: 3
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Lockdown
      ja:
        name: 封鎖射
  - id: smg-zero
    kind: skill
    target: allEnemies
    cost:
      mp: 6
    effects:
      - kind: damage
        min: 8
        max: 13
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Zero Sweep
      ja:
        name: 零番掃射
  - id: smg-breakthrough
    kind: skill
    target: enemyGroup
    cost:
      mp: 6
    effects:
      - kind: damage
        min: 11
        max: 17
        element: physical
      - kind: debuff
        stat: armor
        amount: 3
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - smg
      - terminal-line
    locales:
      en:
        name: Breakthrough
      ja:
        name: 突破制圧
  - id: shotgun-breach
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 6
        max: 10
        element: physical
      - kind: debuff
        stat: armor
        amount: 1
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Breach Shot
      ja:
        name: 破扉射
  - id: shotgun-close
    kind: skill
    target: enemyGroup
    cost:
      mp: 3
    effects:
      - kind: damage
        min: 8
        max: 13
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Close Shot
      ja:
        name: 至近射
  - id: shotgun-pump
    kind: skill
    target: self
    cost:
      mp: 3
    effects:
      - kind: buff
        stat: armor
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Pump Stance
      ja:
        name: ポンプ構え
  - id: shotgun-stagger
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: damage
        min: 8
        max: 12
        element: physical
      - kind: debuff
        stat: speed
        amount: 3
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Stagger Shot
      ja:
        name: よろめかせ
  - id: shotgun-sluice
    kind: skill
    target: enemyGroup
    cost:
      mp: 4
    effects:
      - kind: damage
        min: 10
        max: 15
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Sluice Breaker
      ja:
        name: 水門破り
  - id: shotgun-brace
    kind: skill
    target: self
    cost:
      mp: 4
    effects:
      - kind: ward
        statusResist:
          fear: 40
      - kind: buff
        stat: armor
        amount: 2
    duration:
      kind: rounds
      rounds: 3
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Recoil Brace
      ja:
        name: 反動固定
  - id: shotgun-floodgate
    kind: skill
    target: enemyGroup
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 11
        max: 17
        element: physical
      - kind: debuff
        stat: armor
        amount: 3
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Floodgate Shot
      ja:
        name: 防潮射
  - id: shotgun-gate
    kind: skill
    target: enemyGroup
    cost:
      mp: 5
    effects:
      - kind: damage
        min: 11
        max: 16
        element: physical
      - kind: status
        status: fear
    duration:
      kind: combat
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Gate Shot
      ja:
        name: 門前射
  - id: shotgun-terminus
    kind: skill
    target: enemyGroup
    cost:
      mp: 6
    effects:
      - kind: damage
        min: 13
        max: 20
        element: physical
    duration:
      kind: instant
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Terminus Breaker
      ja:
        name: 終端破り
  - id: shotgun-final
    kind: skill
    target: allEnemies
    cost:
      mp: 7
    effects:
      - kind: damage
        min: 9
        max: 15
        element: physical
      - kind: debuff
        stat: armor
        amount: 2
    duration:
      kind: rounds
      rounds: 2
    tags:
      - firearm
      - shotgun
      - terminal-line
    locales:
      en:
        name: Final Spread
      ja:
        name: 最終散布
  - id: quick-draw
    kind: passive
    target: self
    cost: {}
    effects: []
    duration:
      kind: instant
    tags:
      - firearm
      - pistol
      - passive
    locales:
      en:
        name: Quick Draw
      ja:
        name: 抜き撃ちの型
    passiveBonus:
      speed: 2
  - id: sidearm-discipline
    kind: passive
    target: self
    cost: {}
    effects: []
    duration:
      kind: instant
    tags:
      - firearm
      - pistol
      - passive
    locales:
      en:
        name: Sidearm Discipline
      ja:
        name: 拳銃規律
    passiveBonus:
      accuracy: 2
  - id: steady-sight
    kind: passive
    target: self
    cost: {}
    effects: []
    duration:
      kind: instant
    tags:
      - firearm
      - rifle
      - passive
    locales:
      en:
        name: Steady Sight
      ja:
        name: 安定照準
    passiveBonus:
      accuracy: 4
  - id: close-control
    kind: passive
    target: self
    cost: {}
    effects: []
    duration:
      kind: instant
    tags:
      - firearm
      - smg
      - passive
    locales:
      en:
        name: Close Control
      ja:
        name: 近接制御
    passiveBonus:
      speed: 2
      accuracy: 1
  - id: breach-brace
    kind: passive
    target: self
    cost: {}
    effects: []
    duration:
      kind: instant
    tags:
      - firearm
      - shotgun
      - passive
    locales:
      en:
        name: Breach Brace
      ja:
        name: 破扉姿勢
    passiveBonus:
      armor: 2
  - id: last-platform-stance
    kind: passive
    target: self
    cost: {}
    effects: []
    duration:
      kind: instant
    tags:
      - firearm
      - terminal-line
      - passive
    locales:
      en:
        name: Last Platform Stance
      ja:
        name: 最終ホームの構え
    passiveBonus:
      attack: 1
      resistance:
        fear: 15

  # ————————————————————————————————————————————————————————————————————————————
  # Class-line techniques (class-techniques.md). A 1:1 re-skin of the base class
  # lines (src/domain/classCapabilities.ts): identical level bands, kind, target,
  # cost, and effect amounts — only id / name / theme change, so the elemental
  # power curve (and every balance gate) is preserved. Element is kept at the base
  # value: enemies here are weak to `current`, so re-elementing damage would inflate
  # power. NO firearm tag — a class never natively learns a firearm (gear-only).
  # ————————————————————————————————————————————————————————————————————————————

  # ——— 保安隊員 (warrior): riot suppression, physical pressure ———
  - id: tl-riot-strike
    kind: skill
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: damage
        min: 6
        max: 12
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Riot Strike }
      ja: { name: 制圧打 }
  - id: tl-armor-breach
    kind: skill
    target: enemyGroup
    cost: { mp: 4 }
    effects:
      - kind: damage
        min: 4
        max: 8
        element: physical
      - kind: debuff
        stat: armor
        amount: 2
        duration: { kind: rounds, rounds: 2 }
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial, debuff]
    locales:
      en: { name: Armor Breach }
      ja: { name: 装甲砕き }
  - id: tl-rally-call
    kind: skill
    target: self
    cost: { mp: 3 }
    effects:
      - kind: buff
        stat: damage
        amount: 3
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, buff]
    locales:
      en: { name: Rally Call }
      ja: { name: 号令 }
  - id: tl-sweeping-charge
    kind: skill
    target: allEnemies
    cost: { mp: 5 }
    effects:
      - kind: damage
        min: 3
        max: 6
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Sweeping Charge }
      ja: { name: 掃討打 }
  - id: tl-adrenaline-shot
    kind: skill
    target: self
    cost: { mp: 4 }
    effects:
      - kind: heal
        amount: 10
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial, recovery]
    locales:
      en: { name: Adrenaline Shot }
      ja: { name: 応急補給 }
  - id: tl-takedown
    kind: skill
    target: enemyGroup
    cost: { mp: 6 }
    effects:
      - kind: damage
        min: 12
        max: 20
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Takedown }
      ja: { name: 制圧終息 }

  # ——— 制圧隊 (knight): barricade, cover, formation defence ———
  - id: tl-shield-bash
    kind: skill
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: damage
        min: 4
        max: 8
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Shield Bash }
      ja: { name: 盾撃 }
  - id: tl-barricade
    kind: skill
    target: self
    cost: { mp: 3 }
    effects:
      - kind: buff
        stat: armor
        amount: 4
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, buff]
    locales:
      en: { name: Barricade }
      ja: { name: 防壁 }
  - id: tl-bodyguard
    kind: skill
    target: self
    cost: { mp: 4 }
    effects:
      - kind: cover
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, cover]
    locales:
      en: { name: Bodyguard }
      ja: { name: 庇護 }
  - id: tl-provoke
    kind: skill
    target: enemyGroup
    cost: { mp: 4 }
    effects:
      - kind: debuff
        stat: accuracy
        amount: 12
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, debuff]
    locales:
      en: { name: Provoke }
      ja: { name: 挑発 }
  - id: tl-hold-the-line
    kind: skill
    target: party
    cost: { mp: 5 }
    effects:
      - kind: buff
        stat: armor
        amount: 2
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, buff]
    locales:
      en: { name: Hold the Line }
      ja: { name: 死守 }
  - id: tl-unyielding
    kind: skill
    target: self
    cost: { mp: 5 }
    effects:
      - kind: heal
        amount: 12
      - kind: ward
        statusResist: { fear: 30 }
    duration: { kind: combat }
    tags: [class-line, terminal-line, martial, recovery]
    locales:
      en: { name: Unyielding }
      ja: { name: 不屈 }

  # ——— 特務員 (swordmaster): precision, footwork, single-target finish ———
  - id: tl-precise-strike
    kind: skill
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: damage
        min: 7
        max: 10
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Precise Strike }
      ja: { name: 精密打 }
  - id: tl-evasive-footwork
    kind: skill
    target: self
    cost: { mp: 3 }
    effects:
      - kind: buff
        stat: evasion
        amount: 12
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, buff]
    locales:
      en: { name: Evasive Footwork }
      ja: { name: 回避機動 }
  - id: tl-counter-read
    kind: skill
    target: self
    cost: { mp: 4 }
    effects:
      - kind: buff
        stat: accuracy
        amount: 10
      - kind: buff
        stat: damage
        amount: 2
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, buff]
    locales:
      en: { name: Counter-Read }
      ja: { name: 見切り }
  - id: tl-arc-cut
    kind: skill
    target: enemyGroup
    cost: { mp: 4 }
    effects:
      - kind: damage
        min: 6
        max: 11
        element: physical
      - kind: debuff
        stat: accuracy
        amount: 8
        duration: { kind: rounds, rounds: 2 }
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial, debuff]
    locales:
      en: { name: Arc Cut }
      ja: { name: 弧撃 }
  - id: tl-cold-focus
    kind: skill
    target: self
    cost: { mp: 4 }
    effects:
      - kind: ward
        statusResist: { fear: 30, sleep: 30 }
    duration: { kind: combat }
    tags: [class-line, terminal-line, martial, ward]
    locales:
      en: { name: Cold Focus }
      ja: { name: 静心 }
  - id: tl-lethal-strike
    kind: skill
    target: enemyGroup
    cost: { mp: 5 }
    effects:
      - kind: damage
        min: 14
        max: 22
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Lethal Strike }
      ja: { name: 必殺 }

  # ——— 潜行員 (thief): skirmish damage, disabling, exploration identity ———
  - id: tl-ambush-strike
    kind: skill
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: damage
        min: 6
        max: 12
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Ambush Strike }
      ja: { name: 奇襲打 }
  - id: tl-hobble
    kind: skill
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: damage
        min: 4
        max: 7
        element: physical
      - kind: debuff
        stat: speed
        amount: 3
        duration: { kind: rounds, rounds: 3 }
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial, debuff]
    locales:
      en: { name: Hobble }
      ja: { name: 足留め }
  - id: tl-smoke-screen
    kind: skill
    target: party
    cost: { mp: 4 }
    effects:
      - kind: buff
        stat: evasion
        amount: 8
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, buff]
    locales:
      en: { name: Smoke Screen }
      ja: { name: 発煙 }
  - id: tl-blindside
    kind: skill
    target: self
    cost: { mp: 4 }
    effects:
      - kind: buff
        stat: evasion
        amount: 15
      - kind: buff
        stat: speed
        amount: 3
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, buff]
    locales:
      en: { name: Blindside }
      ja: { name: 影抜け }
  - id: tl-flashbang
    kind: skill
    target: enemyGroup
    cost: { mp: 4 }
    effects:
      - kind: debuff
        stat: accuracy
        amount: 12
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, martial, debuff]
    locales:
      en: { name: Flashbang }
      ja: { name: 閃光 }
  - id: tl-assassinate
    kind: skill
    target: enemyGroup
    cost: { mp: 5 }
    effects:
      - kind: damage
        min: 10
        max: 18
        element: physical
    duration: { kind: instant }
    tags: [class-line, terminal-line, martial]
    locales:
      en: { name: Assassinate }
      ja: { name: 背後強襲 }

  # ——— 衛生兵 (priest): triage, cures, decontamination ———
  - id: tl-first-aid
    kind: spell
    target: ally
    cost: { mp: 3 }
    effects:
      - kind: heal
        amount: 8
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, recovery]
    locales:
      en: { name: First Aid }
      ja: { name: 応急手当 }
  - id: tl-antitoxin
    kind: spell
    target: ally
    cost: { mp: 4 }
    effects:
      - kind: cure
        statuses: [poison, silence]
    duration: { kind: instant }
    tags: [class-line, terminal-line, recovery, cure]
    locales:
      en: { name: Antitoxin }
      ja: { name: 中和剤 }
  - id: tl-field-surgery
    kind: spell
    target: ally
    cost: { mp: 6 }
    effects:
      - kind: heal
        amount: 18
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, recovery]
    locales:
      en: { name: Field Surgery }
      ja: { name: 外科処置 }
  - id: tl-inoculation
    kind: spell
    target: party
    cost: { mp: 6 }
    effects:
      - kind: ward
        statusResist: { poison: 25, fear: 20, sleep: 20 }
    duration: { kind: combat }
    tags: [class-line, terminal-line, ward]
    locales:
      en: { name: Inoculation }
      ja: { name: 予防投与 }
  - id: tl-decontamination
    kind: spell
    target: party
    cost: { mp: 8 }
    effects:
      - kind: cure
        statuses: [poison, silence, fear, sleep]
    duration: { kind: instant }
    tags: [class-line, terminal-line, recovery, cure]
    locales:
      en: { name: Decontamination }
      ja: { name: 除染 }
  - id: tl-field-hospital
    kind: spell
    target: party
    cost: { mp: 10 }
    effects:
      - kind: heal
        amount: 12
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, recovery]
    locales:
      en: { name: Field Hospital }
      ja: { name: 野戦治療 }

  # ——— 通信員 (chanter): encrypted wards, tactical buffs, jamming ———
  - id: tl-stimulant
    kind: spell
    target: ally
    cost: { mp: 3 }
    effects:
      - kind: heal
        amount: 5
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, recovery]
    locales:
      en: { name: Stimulant }
      ja: { name: 気付け }
  - id: tl-encrypted-channel
    kind: spell
    target: party
    cost: { mp: 6 }
    effects:
      - kind: ward
        statusResist: { fear: 35, sleep: 35 }
    duration: { kind: combat }
    tags: [class-line, terminal-line, ward]
    locales:
      en: { name: Encrypted Channel }
      ja: { name: 秘匿通信 }
  - id: tl-lull-signal
    kind: spell
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: status
        status: sleep
    duration: { kind: combat }
    tags: [class-line, terminal-line, control]
    locales:
      en: { name: Lull Signal }
      ja: { name: 鎮静信号 }
  - id: tl-combat-net
    kind: spell
    target: party
    cost: { mp: 5 }
    effects:
      - kind: buff
        stat: damage
        amount: 2
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, buff]
    locales:
      en: { name: Combat Net }
      ja: { name: 戦術通信 }
  - id: tl-thermal-shielding
    kind: spell
    target: party
    cost: { mp: 6 }
    effects:
      - kind: ward
        elementResist: { fire: 0.6 }
    duration: { kind: combat }
    tags: [class-line, terminal-line, ward]
    locales:
      en: { name: Thermal Shielding }
      ja: { name: 耐熱指示 }
  - id: tl-clear-comms
    kind: spell
    target: party
    cost: { mp: 7 }
    effects:
      - kind: buff
        stat: accuracy
        amount: 8
      - kind: buff
        stat: speed
        amount: 2
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, buff]
    locales:
      en: { name: Clear Comms }
      ja: { name: 明瞭指揮 }

  # ——— 爆破技師 (mage): incendiary / demolition charges (fire kept) ———
  - id: tl-incendiary-round
    kind: spell
    target: enemyGroup
    cost: { mp: 4 }
    effects:
      - kind: damage
        min: 4
        max: 9
        element: fire
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, elemental]
    locales:
      en: { name: Incendiary Round }
      ja: { name: 焼夷弾 }
  - id: tl-slug-round
    kind: spell
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: damage
        min: 5
        max: 9
        element: physical
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, elemental]
    locales:
      en: { name: Slug Round }
      ja: { name: 徹甲弾 }
  - id: tl-thermite-spread
    kind: spell
    target: allEnemies
    cost: { mp: 8 }
    effects:
      - kind: damage
        min: 4
        max: 8
        element: fire
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, elemental]
    locales:
      en: { name: Thermite Spread }
      ja: { name: 焼夷散布 }
  - id: tl-concussion-charge
    kind: spell
    target: enemyGroup
    cost: { mp: 5 }
    effects:
      - kind: debuff
        stat: damage
        amount: 3
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, debuff]
    locales:
      en: { name: Concussion Charge }
      ja: { name: 制圧爆風 }
  - id: tl-thermobaric-charge
    kind: spell
    target: enemyGroup
    cost: { mp: 9 }
    effects:
      - kind: damage
        min: 12
        max: 20
        element: fire
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, elemental]
    locales:
      en: { name: Thermobaric Charge }
      ja: { name: 熱圧爆薬 }
  - id: tl-firestorm
    kind: spell
    target: allEnemies
    cost: { mp: 12 }
    effects:
      - kind: damage
        min: 9
        max: 15
        element: fire
        scalesWithSpellPower: true
    duration: { kind: instant }
    tags: [class-line, terminal-line, elemental]
    locales:
      en: { name: Firestorm }
      ja: { name: 火炎放射 }

  # ——— 攪乱員 (occultist): electronic / psychological control, power drain ———
  - id: tl-terror-broadcast
    kind: spell
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: status
        status: fear
    duration: { kind: combat }
    tags: [class-line, terminal-line, control]
    locales:
      en: { name: Terror Broadcast }
      ja: { name: 威圧放送 }
  - id: tl-power-tap
    kind: spell
    target: enemyGroup
    cost: { mp: 4 }
    effects:
      - kind: damage
        min: 4
        max: 7
        element: physical
        scalesWithSpellPower: true
      - kind: heal
        amount: 4
    duration: { kind: instant }
    tags: [class-line, terminal-line, control, recovery]
    locales:
      en: { name: Power Tap }
      ja: { name: 電力吸収 }
  - id: tl-jamming
    kind: spell
    target: enemyGroup
    cost: { mp: 3 }
    effects:
      - kind: status
        status: sleep
    duration: { kind: combat }
    tags: [class-line, terminal-line, control]
    locales:
      en: { name: Jamming }
      ja: { name: 電波妨害 }
  - id: tl-corrosion
    kind: spell
    target: enemyGroup
    cost: { mp: 4 }
    effects:
      - kind: debuff
        stat: armor
        amount: 3
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, control, debuff]
    locales:
      en: { name: Corrosion }
      ja: { name: 装甲腐食 }
  - id: tl-signal-cut
    kind: spell
    target: enemyGroup
    cost: { mp: 5 }
    effects:
      - kind: status
        status: silence
    duration: { kind: combat }
    tags: [class-line, terminal-line, control]
    locales:
      en: { name: Signal Cut }
      ja: { name: 通信遮断 }
  - id: tl-power-drain
    kind: spell
    target: enemyGroup
    cost: { mp: 6 }
    effects:
      - kind: debuff
        stat: damage
        amount: 4
    duration: { kind: rounds, rounds: 3 }
    tags: [class-line, terminal-line, control, debuff]
    locales:
      en: { name: Power Drain }
      ja: { name: 出力低下 }
---

# Terminal Line — firearm techniques

The pistol / rifle / SMG / shotgun maneuvers (40 active + 6 gear passives) granted by equipped weapons
(see items.md). Authored as DATA: the engine defines no firearm technique — this world does. Externalised
from src/domain/techniques.ts in the technique-catalog externalisation slice.

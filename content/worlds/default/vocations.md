---
# IMP-021A — authored ADVANCED vocations for 黒碑. The 12 basic classes are built-in; these are the
# destinations a build earns by MASTERING basics. Prerequisites are visible before committing, and
# the loader rejects unknown prereqs / unlock cycles. Stat modifiers layer on the aptitude base.
vocations:
  - id: vocation.ash-reaver
    tier: advanced
    name: Ash Reaver
    signature: A front-line breaker who turns mastered aggression into a single crushing swing.
    requires:
      mastered: [vanguard, sellsword]
      minLevel: 6
    statModifiers: { attack: 3, maxHp: 8, speed: -1 }
    allowedSlots: [weapon, offhand, body, head, hands, accessory]
    grantsTechniques: [power-strike]
    locales:
      ja:
        name: 灰の刃
        signature: 極めた攻めを一撃に込める、前線の破砕者。
  - id: vocation.salt-warden
    tier: advanced
    name: Salt Warden
    signature: A bulwark who learned to mend — holds the line and keeps the wounded standing.
    requires:
      mastered: [bulwark, mender]
      minLevel: 6
    statModifiers: { armor: 3, maxHp: 12, maxMp: 4 }
    allowedSlots: [offhand, body, head, hands, accessory]
    grantsTechniques: [heal]
    locales:
      ja:
        name: 塩の守り手
        signature: 癒しを覚えた盾守。戦線を保ち、倒れかけた者を立たせ続ける。
  - id: vocation.star-votary
    tier: advanced
    name: Star Votary
    signature: An occultist who read the late star-script — its fire answers only to the devoted.
    requires:
      mastered: [occultist, arcanist]
      minLevel: 8
    statModifiers: { maxMp: 8, attack: -1 }
    allowedSlots: [weapon, head, hands, accessory]
    grantsTechniques: [firebolt]
    locales:
      ja:
        name: 星の信徒
        signature: 地下に遅く現れる星の文字を読み、その火を術へ変える。
  - id: vocation.needle-dancer
    tier: advanced
    name: Needle Dancer
    signature: A knife-hand who turns a stolen opening into a precise, vanishing strike.
    requires:
      mastered: [duelist, cutpurse]
      minLevel: 6
    statModifiers: { attack: 2, accuracy: 5, speed: 2, maxHp: -2 }
    allowedSlots: [weapon, body, hands, accessory]
    grantsTechniques: [power-strike]
    locales:
      ja:
        name: 針舞い
        signature: 奪った一瞬へ刃を通し、反撃の前に間合いを外す。
  - id: vocation.dust-ranger
    tier: advanced
    name: Dust Ranger
    signature: A route-reader who marks danger, keeps distance, and strikes before the trail closes.
    requires:
      mastered: [seeker, scout]
      minLevel: 6
    statModifiers: { maxHp: 4, accuracy: 6, speed: 2 }
    allowedSlots: [weapon, body, head, hands, accessory]
    grantsTechniques: [power-strike]
    locales:
      ja:
        name: 塵路師
        signature: 痕跡から危険の先を読み、道が閉じる前に射抜く。
  - id: vocation.candle-pilgrim
    tier: advanced
    name: Candle Pilgrim
    signature: A ward-bearer who remembers the road home and keeps a small light alive through panic.
    requires:
      mastered: [chanter, wayfinder]
      minLevel: 8
    statModifiers: { maxHp: 4, maxMp: 6, armor: 2, speed: 1 }
    allowedSlots: [weapon, offhand, body, head, accessory]
    grantsTechniques: [heal, sleep]
    locales:
      ja:
        name: 灯巡り
        signature: 帰り道を失わず、恐慌の中でも小さな灯を絶やさない。
---

# Vocations — Gate of Ash

Advanced vocations earned by mastering the basic classes. The basics themselves stay built-in; only
these authored destinations, their prerequisites, and their granted techniques are data.

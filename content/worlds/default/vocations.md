---
# §7A (class-system.md §7A) — the ADOPTED advanced vocations for 黒碑. The twelve basic classes are
# built-in; these are the destinations a build earns by MASTERING a pair of them. Prerequisites are
# visible before committing, and the loader rejects unknown prereqs / unlock cycles.
#
# grantsTechniques names each vocation's ONE EXCLUSIVE signature technique (§7B). It is never a parent
# technique — reaching an advanced vocation means mastering both parents, so the adopter already learned
# both lines (§6, the learned set is a union), and a re-granted parent technique would add nothing. Each
# grant is a distinct COMBINATION of §9.4 primitives no basic class teaches, so the vocation opens a play
# pattern, not a bigger stat line (§7). Each `signature` states the mechanism the technique implements.
vocations:
  - id: vocation.ash-reaver
    tier: advanced
    name: Ash Reaver
    signature: A war master who banks a stance, then spends it on a single chained, crushing blow.
    requires:
      mastered: [warrior, swordmaster]
      minLevel: 6
    statModifiers: { attack: 3, maxHp: 8, speed: -1 }
    allowedSlots: [weapon, offhand, body, head, hands, accessory]
    # §7B EXCLUSIVE signature — a banked STANCE (damage + accuracy) no basic class teaches.
    grantsTechniques: [ash-stance]
    locales:
      ja:
        name: 灰の刃
        signature: 構えを溜め、極めた攻めを一撃に連ねて叩き込む前線の破砕者。
  - id: vocation.salt-warden
    tier: advanced
    name: Salt Warden
    signature: A paladin who intercepts the blow meant for an ally, then mends the one they shielded.
    requires:
      mastered: [knight, priest]
      minLevel: 6
    statModifiers: { armor: 3, maxHp: 12, maxMp: 4 }
    allowedSlots: [offhand, body, head, hands, accessory]
    # §7B EXCLUSIVE signature — COVER + a shielded restore in one prayer (sheltering-prayer).
    grantsTechniques: [sheltering-prayer]
    locales:
      ja:
        name: 塩の守り手
        signature: 味方への一撃を庇い立てで受け、守った者をそのまま癒す聖なる盾。
  - id: vocation.star-votary
    tier: advanced
    name: Star Votary
    signature: A hexer who binds a pack, then detonates the affliction for a burst of star-fire.
    requires:
      mastered: [occultist, mage]
      minLevel: 8
    statModifiers: { maxMp: 8, attack: -1 }
    allowedSlots: [weapon, head, hands, accessory]
    # §7B: the EXCLUSIVE signature — a detonate no basic class teaches (star-nova reads the target's
    # status and spends it). Bind with the Occultist's control, then burn.
    grantsTechniques: [star-nova]
    locales:
      ja:
        name: 星の信徒
        signature: 群れを縛り、効いた状態を引き金に星の火を爆ぜさせる術者。
  - id: vocation.needle-dancer
    tier: advanced
    name: Needle Dancer
    signature: A ninja who turns a dodged blow into a guaranteed opening, then a vanishing strike.
    requires:
      mastered: [swordmaster, thief]
      minLevel: 6
    statModifiers: { attack: 2, accuracy: 5, speed: 2, maxHp: -2 }
    allowedSlots: [weapon, body, hands, accessory]
    # §7B EXCLUSIVE signature — an EVASION→OPENING stance (evasion + accuracy) no basic class teaches.
    grantsTechniques: [needle-flurry]
    locales:
      ja:
        name: 針舞い
        signature: かわした一撃を確実な隙へ変え、反撃の前に間合いを外す影。
  - id: vocation.dust-ranger
    tier: advanced
    name: Dust Ranger
    signature: A ranged raider whose strike grows the longer a foe has kept its distance.
    requires:
      mastered: [thief, mage]
      minLevel: 6
    statModifiers: { maxHp: 4, accuracy: 6, speed: 2 }
    allowedSlots: [weapon, body, head, hands, accessory]
    # §7B EXCLUSIVE signature — a RANGED BURST across the pack (dust-volley); a Thief has no group hit.
    grantsTechniques: [dust-volley]
    locales:
      ja:
        name: 塵路師
        signature: 間合いを刻み、離れた敵ほど深く射抜く痕跡読み。
  - id: vocation.candle-pilgrim
    tier: advanced
    name: Candle Pilgrim
    signature: A trickster whose ward also buys a withdrawal — keep the light, keep the way home.
    requires:
      mastered: [chanter, thief]
      minLevel: 8
    statModifiers: { maxHp: 4, maxMp: 6, armor: 2, speed: 1 }
    allowedSlots: [weapon, offhand, body, head, accessory]
    # §7B EXCLUSIVE signature — a party WARD that also buys a withdrawal (candle-ward): resist + evasion.
    grantsTechniques: [candle-ward]
    locales:
      ja:
        name: 灯巡り
        signature: 守りの詠唱に退き際を織り込み、灯も帰り道も絶やさない巡礼者。
---

# Vocations — Gate of Ash

Advanced vocations earned by mastering a pair of basic classes. The basics themselves stay built-in;
only these authored destinations and their prerequisites are data.

7A adopted the roster and fixed its prerequisites; 7B authored each vocation's one exclusive signature
technique (class-system.md §7A/§7B). Every destination now grants a technique no basic class teaches —
a distinct combination of §9.4 primitives, never a re-granted parent technique.

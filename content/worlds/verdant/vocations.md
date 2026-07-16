---
# IMP-021B — authored advanced vocations for 翠碑. Each destination combines two
# of the shared basic vocations, but the work and imagery belong to the drowned
# grove rather than the ash town.
vocations:
  - id: vocation.verdant.briar-reaver
    tier: advanced
    name: Briar Reaver
    signature: A front-line hewer who reads the bend of living thorns before cutting through.
    requires:
      mastered: [vanguard, sellsword]
      minLevel: 6
    statModifiers: { maxHp: 7, attack: 3, speed: 1 }
    allowedSlots: [weapon, offhand, body, head, hands, accessory]
    grantsTechniques: [power-strike]
    locales:
      ja:
        name: 茨砕き
        signature: 生きた茨のしなりを読み、絡みつく前に前線ごと断つ。
  - id: vocation.verdant.bark-keeper
    tier: advanced
    name: Bark Keeper
    signature: A patient guard who layers bark and wards until the company can breathe again.
    requires:
      mastered: [bulwark, chanter]
      minLevel: 6
    statModifiers: { maxHp: 10, maxMp: 3, armor: 4, speed: -1 }
    allowedSlots: [offhand, body, head, hands, accessory]
    grantsTechniques: [heal]
    locales:
      ja:
        name: 樹皮守
        signature: 樹皮と札を幾重にも重ね、一党が息を整える時間を作る。
  - id: vocation.verdant.dewblade
    tier: advanced
    name: Dewblade
    signature: A light-footed cutter whose blade appears only when the wet leaves part.
    requires:
      mastered: [duelist, cutpurse]
      minLevel: 6
    statModifiers: { attack: 2, accuracy: 5, speed: 3, maxHp: -2 }
    allowedSlots: [weapon, body, hands, accessory]
    grantsTechniques: [power-strike]
    locales:
      ja:
        name: 露刃
        signature: 濡れ葉が開く一瞬だけ姿を見せ、浅く速く急所を裂く。
  - id: vocation.verdant.canopy-reader
    tier: advanced
    name: Canopy Reader
    signature: A path-reader who follows dripping echoes and finds the one dry step ahead.
    requires:
      mastered: [seeker, scout]
      minLevel: 6
    statModifiers: { maxHp: 3, accuracy: 6, speed: 2 }
    allowedSlots: [weapon, body, head, hands, accessory]
    grantsTechniques: [sleep]
    locales:
      ja:
        name: 梢読み
        signature: 滴る音の重なりから、次に踏める乾いた場所を探り当てる。
  - id: vocation.verdant.sap-binder
    tier: advanced
    name: Sap Binder
    signature: A healer who seals wounds with living sap, then burns the growth that will not stop.
    requires:
      mastered: [mender, arcanist]
      minLevel: 8
    statModifiers: { maxHp: 4, maxMp: 8, attack: 1 }
    allowedSlots: [weapon, offhand, body, head, accessory]
    grantsTechniques: [heal, firebolt]
    locales:
      ja:
        name: 樹液結び
        signature: 生きた樹液で傷を塞ぎ、止まらぬ芽吹きだけを火で焼く。
  - id: vocation.verdant.spore-seer
    tier: advanced
    name: Spore Seer
    signature: A watcher who reads drifting spores as signs and turns their drowsing haze back on the grove.
    requires:
      mastered: [occultist, wayfinder]
      minLevel: 8
    statModifiers: { maxMp: 7, accuracy: 3, speed: 2 }
    allowedSlots: [weapon, body, head, hands, accessory]
    grantsTechniques: [sleep, firebolt]
    locales:
      ja:
        name: 胞子見
        signature: 漂う胞子を兆しとして読み、眠りの靄を樹海へ返す。
---

# Vocations — Verdant

Six advanced destinations shaped by the drowned grove. Together they give every
shared basic vocation at least one authored route into later play.

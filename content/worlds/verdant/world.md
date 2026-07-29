---
id: world.verdant
title: Verdant - the Sunken Heartwood
tagline: A drowned wood that closed over the world. Everything here is alive, wet, and quietly suffocating.
locales:
  ja:
    title: 翠碑 — 沈む樹心
    tagline: 世界を覆って閉じた樹海。ここにあるものは皆、生きて、濡れて、静かに息を塞ぐ。
# 翠碑の三要素 — 五行の相剋を一辺だけ裏返す。火剋金・金剋木・そして「木剋火」ではなく——
# 濡れた生木は燃えない、木は火を拒む。だから灰の民が持って降りる火は、樹海では最悪の手。金を持て。
elements:
  - id: fire
    label: Fire
    color: "#e07a3a"
    locales: { ja: { label: 火 } }
  - id: wood
    label: Wood
    color: "#6fae54"
    locales: { ja: { label: 木 } }
  - id: metal
    label: Metal
    color: "#c9cdd4"
    locales: { ja: { label: 金 } }
# Difficulty (tuned via descentSim.preparationValue). Verdant's counterplay is offense-led — bring
# metal — so its preparation swing is a touch shallower than 黒碑's; more elemental THREATS to
# resist (defensive counterplay) would lift it further. Re-tune these two, not every enemy.
balance:
  threatScalar: 2.2
  # Trash foes survive a round or two instead of being one-rounded, so attrition actually lands and the
  # mid-game stops reading "ヌルい". Measured (`npm run sim:balance`, mid column, startLv1): the shallows
  # stay gentle (g1/g2 ~95-100%), the mid bites into its bands (g3=73%, g4/g5=50%), and the root-deep
  # floors (g6-g8) turn the screws so hard a mid party without heals near-wipes — which is the point: the
  # deep act DEMANDS provisioning (provisioned trough g6=34% g7=46% g8=20%), and levelsSaved holds at 11.
  # Excludes minibosses/boss (they'd just become HP-sponges). See docs/design/difficulty-design.md.
  hpScalar: 1.8
  counterplayBoost: 3.0
  # Resource-economy / scarcity (docs/design/difficulty-design.md). EO-leaning EARLY→MID (a rationed
  # kit, so attrition and "one more room vs turn back" actually bite), easing toward Act III (escaping
  # the squeeze IS the felt growth). Per-act arrays index by act (0=green shallows, 1=mid, 2=root deep),
  # last value held for deeper floors. The sim carries `provisionKit` and auto-uses it; sim:balance reads
  # the burn/floor, where it runs dry, and whether dive income covers a re-provision.
  economy:
    carryCap:    [24, 32, 48]        # total consumables carried — tight grove-shallows, loosening deep
    stackCap:    9
    priceScalar: [1.0, 0.95, 0.85]   # shop prices ease as the town grows with your descent (authored; not yet wired to live gold)
    incomeScalar: [0.8, 1.0, 1.25]   # dive income climbs — late floors pay out, early ones don't flood (authored; not yet wired)
    # The affordable kit a prepared party sets out with. Two heals (down from three): with the longer
    # hpScalar fights the party burns exactly this — cure at g3, heal at g5, heal at g8 — so the kit RATIONS
    # to the finale and runs dry in the final act (the retreat trigger). Three left one heal unspent and the
    # scarcity never bit. Measured against sim:balance RESOURCE-ECONOMY + tests/difficultyGate.
    provisionKit: { heals: 2, cures: 1 }
assetPack: verdant
# The grove settlement does not talk like the ash town. Any key omitted here falls through to
# the shared dictionary, so this file only says what Verdant says differently.
copy:
  en:
    town.departureHeading: "Before the canopy closes"
    town.departureCopy: "No one has gone under yet. Fill the roster, pack what will keep, and go while the light holds."
    town.firstDescend: "The rootmat is open. Nothing is between the company and the green dark."
    town.firstNeedParty: "Find hands at the stall first. Nobody goes under alone."
    town.statusHeading: "Back under the light"
    town.statusCopy: "Count what came back up, and what it cost."
  ja:
    town.departureHeading: "梢が閉じる前に"
    town.departureCopy: "まだ誰も潜っていない。名簿を埋め、保つものだけを負い、光のあるうちに行け。"
    town.firstDescend: "根の床は開いている。一党と緑の闇の間には、もう何もない。"
    town.firstNeedParty: "まず露店で人手を探せ。ひとりで潜る者はいない。"
    town.statusHeading: "光の下へ戻って"
    town.statusCopy: "上がってきたものと、その代償を数える。"
# Scene colour — the drowned canopy. Wall/floor TINT the block texture, so even while
# Material colors now live in Verdant's own wall/floor textures. Keep the surface
# multipliers near-neutral; filtered green light comes from the scene lights.
palette:
  fog: "#0a170e"
  ambient: "#9cba8c"
  torch: "#c2e89f"
  front: "#e4f7c9"
  wall: "#c2c7b5"
  floor: "#a49c85"
  # IMP-055 readability: lift the ceiling off pure black so the overhead plane gives a depth/corner cue in
  # the first-person frame — a dim mossy sage, clearly darker than the walls but no longer a black void.
  ceiling: "#4a5140"
  # 玄室は「緑の置物」ではなく、番人と報酬のために根が磨いた儀式の床。濡れた石灰岩の
  # 基壇と暗い根の建築を、琥珀の埋め込み環だけで拾わせる。緑の環境光に染まっても用途が
  # 読めるよう、通常床より低彩度・暖色寄りに分離する。
  chamberFloor: "#777765"
  chamberWall: "#827761"
  chamberAccent: "#b67b42"
  ambientEnergy: 0.85
  fogDensity: 0.06
  torchRange: 10.0
startDungeon: dungeon.verdant.g1f
startRoom: room.verdant.g1f.001
aiPolicy:
  allowed:
    - environment_flavor
    - npc_reaction
    - replay_log
  forbidden:
    - speak_for_pc
    - move_pc
    - create_exit
    - change_rules
dungeons: []
---

# Verdant - Sunken Arboretum

A second scenario used to prove scenario switching end-to-end. It ships only its
own dungeon and title; the standard party's starter gear comes from the shared
base catalog, and art falls back to the default pack until a verdant pack is
supplied. See docs/design/scenario-switching.md.

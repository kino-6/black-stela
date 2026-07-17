---
id: world.default
title: Black Stela - Gate of Ash
tagline: A dead, ash-choked dungeon beneath the town. Eight floors down, the black stela has a root.
locales:
  ja:
    title: 黒碑 — 灰の門
    tagline: 町の下に、灰に埋もれた坑がある。八層の底で、黒い碑が根を張っている。
# 黒碑の三要素 — 循環ではなく「領分」。火は乾いたものを、塩は腐と不浄を、星は地下が閉め出した
# 外の光を焼く。星は買えない・序盤には無い、碑の根に届く終盤の鍵。物理はどの世界にもある。
elements:
  - id: fire
    label: Fire
    color: "#e07a3a"
    locales: { ja: { label: 火 } }
  - id: salt
    label: Salt
    color: "#dfe4ea"
    locales: { ja: { label: 塩 } }
  - id: star
    label: Star
    color: "#9ec7ff"
    locales: { ja: { label: 星 } }
# Difficulty (tuned via descentSim.preparationValue): a naive party — no counterplay, no grinding —
# genuinely wipes; a prepared one clears well below the curve. threatScalar raises the danger,
# counterplayBoost makes the right tools scale with it. Re-tune these two numbers, not every enemy.
# NB (2026-07-18): basic enemy attacks now SPREAD across the front row instead of hammering the
# front-left member. That distributes damage (a MULTI-member party survives ~1 level lower), so the
# prep swing here settles near 5 — do NOT crank threat to force it back to 10: higher threat gives
# the SPREAD no benefit to a small/solo party and over-punishes early play. The invariants hold
# (naive wipes, prepared clears near entry, deep floors bite); the gate asserts those, not a number.
balance:
  threatScalar: 2.4
  counterplayBoost: 2.0
startDungeon: dungeon.b1f
startRoom: room.b1f.001
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

# Black Stela - Gate of Ash

The first authored scenario beneath the black stela at Stela Gate Town. The
Ashen Descent is planned as an eight-floor compact DRPG scenario about mapping,
attrition, controlled retreat, and the price of bringing evidence back alive.

YAML is scenario truth. Markdown is human-facing authoring context.

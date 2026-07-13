---
id: world.verdant
title: Verdant - the Sunken Heartwood
tagline: A drowned wood that closed over the world. Everything here is alive, wet, and quietly suffocating.
locales:
  ja:
    title: 翠碑 — 沈む樹心
    tagline: 世界を覆って閉じた樹海。ここにあるものは皆、生きて、濡れて、静かに息を塞ぐ。
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

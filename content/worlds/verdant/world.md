---
id: world.verdant
title: Verdant - the Sunken Heartwood
tagline: A drowned wood that closed over the world. Everything here is alive, wet, and quietly suffocating.
locales:
  ja:
    title: 翠碑 — 沈む樹心
    tagline: 世界を覆って閉じた樹海。ここにあるものは皆、生きて、濡れて、静かに息を塞ぐ。
assetPack: verdant
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

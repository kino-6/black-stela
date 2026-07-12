---
id: world.verdant
title: Verdant - Sunken Arboretum
assetPack: verdant
# Scene colour — the drowned canopy. Wall/floor TINT the block texture, so even while
# verdant still falls back to the default pack's stone it reads as moss-slick root
# walls under filtered green light, not an ash ruin.
palette:
  fog: "#0a170e"
  ambient: "#9cba8c"
  torch: "#c2e89f"
  front: "#e4f7c9"
  wall: "#5b8055"
  floor: "#31432a"
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

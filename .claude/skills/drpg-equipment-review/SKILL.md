---
name: drpg-equipment-review
description: Review, design, implement, or verify Black Stela's DRPG equipment rules and controller-first equipment UI. Use for equipment menus, gear comparison, slot/instance ownership, class compatibility, equipment changes in town or dungeon, appraisal/reinforcement, loadout recommendations, and related player-facing regression tests.
---

# DRPG Equipment Review

## Product rule

Treat equipment as a preparation decision, not a list of buttons. Preserve the TypeScript rules oracle;
Godot submits commands and renders the same canonical result. Do not invent permanent effects in a scene.

Read [references/equipment-research.md](references/equipment-research.md) before changing the player
surface. Also read `docs/design/class-system.md`, the controller-first skill, and the relevant gate docs.

## Required workflow

1. Inspect the complete path: catalog → inventory instance → equip command → effective stats → UI.
2. Write the intended decision in one sentence. Examples: “Replace this shield with that shield for this
   adventurer” or “Move this unique sword from Bran to Sei.”
3. Define the rule in TypeScript first. Preserve an inventory instance's id, plus, affix, ownership, and
   slot; use an explicit command and event when state changes.
4. Add a golden trace for a rule change and make the Godot port match it byte-for-byte.
5. Build a controller flow with this stable order:
   `member → equipped slot → carried candidate → comparison/action`.
   Confirm selects or equips; Cancel goes back exactly one stage; focus never jumps to a tab or the first
   menu control after selecting a member or item.
6. Render all candidates for the selected slot. Show unusable candidates disabled with a player-facing
   reason; never silently hide them. Distinguish already worn, free, and transferred-from-another-member
   instances.
7. Render a comparison before the irreversible/stateful action: current item, candidate item, and all
   affected effective values. Use signed deltas and name the meaningful non-stat effects (element,
   resistance, affix, skill/requirement). Do not collapse the comparison to an opaque “attack” number.
8. Offer an optional recommendation only as a reviewable proposal: show every changed slot and require
   one confirmation. It must respect compatibility and never replace player choices silently.
9. Verify with a controlled 1920×1080 Godot capture and controller-script proof. Include empty slot,
   incompatible item, replacement, transfer, plus/affix, and Cancel coverage.

## Non-negotiable checks

- Do not permit a candidate that changes no state to consume a turn or imply success.
- Do not lose a displaced item, duplicate a unique instance, or transfer it without making its prior owner
  visible before confirmation.
- Do not present combat-only equipment changes while a combat round is resolving.
- Keep equipment choice expressive: a lower immediate stat may be valid because of reach, resistance,
  affinity, an affix, or a class interaction. “Best” is a convenience, never the game’s judgement.
- Keep the normal UI Japanese and controller-first; no raw ids, mouse-only tooltip, or debug terminology.

## Initial audit rubric

Mark each item `present`, `partial`, or `missing` before proposing work:

| Decision support | Rule safety | Controller UX |
| --- | --- | --- |
| Slot + worn item visible | Exact instance preserved | Stable member/slot/candidate route |
| Candidate + current comparison | Compatibility is authoritative | Confirm equips, Cancel backs one stage |
| All affected stat/effect deltas | Replacement/transfer is explicit | Focus retained after refresh |
| Ineligible reason visible | No-op is refused | 1920×1080 capture + traversal test |

Implement the highest-risk missing rule before visual polish. Prefer a thin, complete vertical slice over
adding a broad item taxonomy without comparison or verification.

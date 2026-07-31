---
name: drpg-item-use-review
description: Review, design, implement, or verify Black Stela's controller-first carried-item flow. Use for inventory menus, consumable targeting, effect previews, exploration tools, escape items, growth items, discard safety, and item-use regression tests.
---

# DRPG Item Use Review

## Product rule

Treat an item as a deliberate expedition decision, never an immediate side effect of inspection. Read
[references/item-use-research.md](references/item-use-research.md) before changing the player surface.
Keep TypeScript as the canonical rules oracle; Godot renders and dispatches the same result.

## Required workflow

1. Trace the full path: catalogue → carried instance → eligibility → target/scope → state mutation → event.
2. Write the player decision in one sentence, for example: “Spend a 治癒の水薬 on Mira to restore 11 HP.”
3. Keep inventory selection safe. Split the controller path into
   `item → target (or scope) → preview → confirm`; Cancel retreats exactly one stage.
4. Before confirmation, show item count after use, the target, every changed HP/MP/status/stat value, and
   whether exploration time is consumed. A no-benefit target is visible but disabled with a Japanese reason.
5. Rules must reject a no-benefit out-of-combat use without consuming an item or advancing a turn. Do not
   silently hand an item to a different member. Combat timing may intentionally differ, but must use its
   own explicit targeting flow.
6. Distinguish types by actual behaviour: recovery/cure/focus target a member; growth previews permanent
   changes; escape clearly names its destination and restrictions; exploration aids name the chest/search
   actions that consume them; combat technique items belong to combat, not the camp menu.
7. Keep inspection, use, equip, and discard as separate actions. Destructive discard requires a second
   confirmation; keys and quest valuables are protected with an explanation.
8. Verify keyboard/controller focus through every stage, plus a controlled 1920×1080 Godot capture. Test
   full HP/MP, wrong status, a valid cure, growth, escape restriction, Cancel, and post-use focus.

## Non-negotiable checks

- No item is spent, no turn advances, and no success feedback appears until Confirm.
- The preview uses the same caps and cure/status rules as the resolver.
- An unavailable target never looks selectable; all candidates remain legible.
- Do not hide an item merely because it has no current target: explain why it cannot help now.
- Normal-play labels are Japanese and use stable controller focus; no raw ids, mouse-only tooltip, or debug
  wording.

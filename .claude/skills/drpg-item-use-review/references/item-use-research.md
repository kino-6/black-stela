# DRPG item-use interaction research

Read this reference when reviewing Black Stela's carried-item flow. These are product references, not
copying targets.

## Evidence

- [Final Fantasy XIV — Navigating the Game Screen](https://na.finalfantasyxiv.com/game_manual/view/)
  describes inventory as a list where equipment, use, discard, and sorting are separate actions. Apply:
  selection is safe and the selected item must retain a persistent detail pane.
- [Final Fantasy XIV — Basic Controls](https://na.finalfantasyxiv.com/game_manual/operation/)
  documents explicit target selection plus stable confirm/cancel controls on keyboard and gamepad. Apply:
  target selection and item use are separate controller stages, and Cancel has one predictable meaning.
- [Elden Ring Nightreign — Starter Manual](https://en.bandainamcoent.eu/elden-ring/news/elden-ring-nightreign-starter-manual-ps5)
  separates equipped-item lists from details about the selected item, and exposes check/use/discard from the
  menu. Apply: the detail explains the selected object before an action commits it.

## Derived design rules

1. Keep the item list, selected-item information, and state-changing actions distinct.
2. Make the target explicit before use; selecting a target must not consume the item.
3. Show the consequence before confirmation: recipient, capped HP/MP change, cured statuses or permanent
   growth, and remaining quantity.
4. Refuse no-benefit uses without cost. Keep an ineligible candidate visible with a reason so the player
   understands the condition.
5. State the scope and cost of exceptional items: escape destination/restriction, exploration tool action,
   combat-only technique item, or permanent growth.
6. Make the complete path controller-first: list → target → confirm; Confirm advances and Cancel returns
   one stage without losing the selected item.

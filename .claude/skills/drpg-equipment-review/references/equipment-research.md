# Equipment interaction research

Read this reference when reviewing the Black Stela equipment system. These are product references, not
copying targets.

## Evidence

- [Final Fantasy XIV — Recommended Gear](https://na.finalfantasyxiv.com/uiguide/equipment/equipment-saikyo/equipment_best.html)
  presents current and recommended gear before confirmation, marks changed pieces, and handles linked
  slots. Apply: a recommendation must be reviewable, not a silent auto-equip.
- [Final Fantasy XIV — game manual](https://na.finalfantasyxiv.com/game_manual/view/)
  separates visible gear slots from inventory and describes inventory actions including equip, use,
  discard, and sorting. Apply: the worn layout and carried list must remain distinct but connected.
- [Elden Ring Nightreign — starter manual](https://en.bandainamcoent.eu/elden-ring/news/elden-ring-nightreign-starter-manual-xbox-series-xs)
  separates equipped items from details for the selected item and exposes equipment, use, and discard
  through controller navigation. Apply: selection should update a persistent detail pane rather than
  immediately mutate state.
- [Elden Ring Nightreign — official starter guide](https://en.bandainamcoent.eu/elden-ring/news/elden-ring-nightreign-the-official-starter-guide)
  explains that equipment effectiveness varies by character/stat compatibility, and supplies a training
  space to test a build. Apply: do not reduce compatibility to a hidden filter or a single score.
- [Elden Ring Nightreign — gameplay guide](https://en.bandainamcoent.eu/elden-ring/news/elden-ring-nightreign-gameplay-guide)
  treats passive effects, rarity, upgrades, and team sharing as meaningful equipment decisions. Apply:
  plus values, affixes, passive effects, and ownership must survive comparison and transfer.

## Derived design rules

1. Show the decision before committing it: worn item, candidate, deltas, and relevant requirements.
2. Separate selection from confirmation. “Inspect” must be safe; “Equip” may change state.
3. Preserve trade-offs. Explain reach, element, resistance, affix, and slot effects beside numeric deltas.
4. Make restrictions legible. An unusable item remains discoverable with a reason.
5. Make shared ownership explicit. A transfer must name the source adventurer and the displaced slot.
6. Keep recommendations optional and inspectable; a DRPG party is not a one-stat optimizer.

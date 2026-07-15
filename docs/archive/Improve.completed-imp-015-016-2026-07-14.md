# IMP-015/016: Combat Placement and Group Condition

Completed and browser-accepted on 2026-07-14.

## IMP-015: Keep Enemies Inside the Combat Lane

### Failure

Combat framing spread the formation across 40-65% of the entire stage in screen
pixels. It then converted those positions into world coordinates without using
the corridor width or each silhouette's physical width. Large and airborne
enemies could therefore appear pasted onto a side wall.

### Change

- Made dungeon geometry and combat framing share the same corridor half-width.
- Added a narrower 2.6-world-unit central combat lane for readable staging.
- Clamped every figure by its measured body width, including a conservative
  first-load fallback before alpha metrics are available.
- Replaced the misleading whole-viewport spread Gate with a browser assertion
  that every silhouette stays inside the combat lane.

## IMP-016: Make Group Condition Monotonic

### Failure

`hpEach` is the HP of the current member in a group. `damageGroup` correctly
resets it to full when that member falls and another remains, but the UI used
that value directly as though it described the whole group. The bar visibly
refilled after a kill.

### Change

- Persist the group's encounter-start count with save-compatible migration.
- Display `(untouched bodies + current body HP) / encounter-start total HP`.
- Keep exact HP numbers hidden; the meter exposes only group condition percent.
- Added a real-browser auto-combat assertion that samples the bar through a
  member death and rejects any increase.

## Evidence

- `docs/evidence/improve-015-016-2026-07-14/01-verdant-combat-lane-1280.png`
- `docs/evidence/improve-015-016-2026-07-14/02-verdant-combat-lane-1920.png`
- `docs/evidence/improve-015-016-2026-07-14/03-group-condition-after-member-falls-1280.png`

Verification:

- `npm run build`
- `npm test`: 68 files, 346 tests passed
- combat, controller, and normal Browser Self-Play: 31 tests passed after the
  recovery Self-Play expectation was brought in line with its concurrent UI change
- `npm run gate:final`: 106 browser tests passed

Past trouble most likely to recur: a screen-width composition target overriding
map geometry, or an individual enemy value being labelled as group state.

# IMP-015/016 Browser Evidence

Captured in Chromium on 2026-07-14.

- `01-verdant-combat-lane-1280.png`: minimum desktop Gate with all enemy bodies
  constrained to the central passage.
- `02-verdant-combat-lane-1920.png`: primary desktop target; large and flying
  enemies remain staged in the passage instead of on the side walls.
- `03-group-condition-after-member-falls-1280.png`: auto-combat stopped after a
  group member fell; the surviving group's condition remains depleted.

The accompanying Playwright test samples every visible condition value across
the member change and fails if the sequence increases.

# IMP-009 to IMP-011 Browser Evidence

Recorded through Playwright's real Chromium runtime, not the headless rules
runner. The suite that creates these files is
`tests/e2e/improve-009-011.spec.ts`, plus the focused combat stage and keyboard
combat Gates.

- `00`: all twelve accepted Verdant portraits at 256px in one contact sheet.
- `01`: Verdant character-creation portrait at the 1280x720 minimum Gate.
- `02`: the Verdant portrait set resolving in the six-person 3+3 dungeon HUD.
- `03`: Verdant mixed combat formation at 1280x720.
- `04`: the same encounter presentation at the 1920x1080 primary target.
- `05`: controller-focused victory result after the final blow.
- `06`: exploration resumed after Continue without a leaked movement command.

Past trouble most likely to recur: repeated AI portrait grammar, tiny enemies in
an oversized corridor, combat-log layout shift, a missing result phase, and the
Continue key leaking into dungeon movement.

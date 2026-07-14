# Archived Browser Improvements - IMP-009 to IMP-011

Accepted on 2026-07-14 after Chromium review at the 1280x720 minimum Gate and
the 1920x1080 primary desktop target. These items close the active backlog that
followed the 2026-07-14 browser playtest.

## Completion Index

| Item | Resolution | Browser proof | Regression proof |
| --- | --- | --- | --- |
| `IMP-009` | Replaced all twelve Verdant portraits with an original Japanese 2D dungeon-RPG ensemble. Locked the non-photorealistic art direction and small-size readability rules in the pack brief. | Character creation and the six-person 3+3 dungeon HUD. | Distinct SHA-256 content and 512x512 dimensions for all twelve assets. |
| `IMP-010` | Added an explicit domain-owned combat conclusion, fixed live message band, stable Auto/Repeat region, controller-focused result, and exact-cell/facing resume. | Final blow -> result -> Continue -> same-cell exploration. | Tactical combat, keyboard combat, combat regression, headless reachability, and Browser Self-Play. |
| `IMP-011` | Added silhouette-aware group framing by size/count/stage, grounded labels, and responsive Three.js rebuilding when the stage changes size. | Verdant mixed pack at 1280x720 and 1920x1080. | Numeric silhouette/formation Gates and a WebGL canvas-size assertion that catches the former black void. |

## Accepted Evidence

- `docs/evidence/improve-009-011-2026-07-14/00-verdant-portrait-contact-sheet.png`
- `docs/evidence/improve-009-011-2026-07-14/01-verdant-character-creation-1280.png`
- `docs/evidence/improve-009-011-2026-07-14/02-verdant-six-person-hud-1280.png`
- `docs/evidence/improve-009-011-2026-07-14/03-verdant-combat-1280.png`
- `docs/evidence/improve-009-011-2026-07-14/04-verdant-combat-1920.png`
- `docs/evidence/improve-009-011-2026-07-14/05-combat-result-1280.png`
- `docs/evidence/improve-009-011-2026-07-14/06-same-cell-resume-1280.png`

The 12-up portrait contact sheet was reviewed at source resolution.
The accepted grammar is clear ink, expressive anime proportions, readable role
silhouettes, cel-like shadow groups, restrained paint texture, and flat graphic
backgrounds. Photorealistic headshots and demographic-checklist art direction
are rejected for this pack.

## Verification

- `npm test`: 67 files, 344 tests passed.
- `npm run build`: passed.
- Focused Chromium Gate: 32 tests passed, including controller route, combat
  regression/staging, Japanese line layout, portrait integration, keyboard
  victory, and browser Self-Play.
- `npm run gate:final`: all 99 Playwright tests passed.

Past trouble most likely to recur: generic generated portrait grammar, enemies
shrinking inside scenery, WebGL drawing buffers failing to follow responsive
layout, combat logs moving commands, missing result ownership, and a Continue
keypress leaking into dungeon movement.

# Completed Tasks: DRPG UX Formation

| ID | Result | Evidence |
|---|---|---|
| BS-136 | Six-member party capacity is the normal limit across guild counters, templates, debug starts, and domain add rules. | `src/domain/characterCreation.ts`, `src/domain/gameState.ts`, `tests/partyTemplates.test.ts` |
| BS-137 | Exploration HUD now shows separate front/back party bands instead of a flat list. | `src/App.tsx`, `src/styles.css`, `tests/e2e/mvp.spec.ts` |
| BS-138 | Combat formation supports six actors with visible row separation and stable command position after messages. | `src/App.tsx`, `src/styles.css`, `tests/e2e/combat.spec.ts` |
| BS-139 | DRPG UX Skill/Gate were added and linked to the Human Requirement Gate. | `docs/skills/drpg-ux-review-skill.md`, `docs/gates/drpg-ux-gate.md`, `tests/drpgUxGate.test.ts` |
| BS-140 | Browser self-review evidence now includes full Playwright E2E and screenshot-review states. | `tests/e2e/screenshot-review.spec.ts`, `test-results/screenshot-review/` |

Verification run:

- `npm test`
- `npm run test:e2e`
- `npm run build`
- `git diff --check`

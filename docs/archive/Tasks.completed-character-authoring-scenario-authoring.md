# Completed Tasks: Character Authorship and Scenario Authoring

Completed range: BS-114..BS-122, BS-124..BS-127.

## Summary

This milestone restored character authorship as a first-class normal-play flow
and added scenario authoring/import/review gates.

## Completed Items

| Task | Result | Evidence |
| --- | --- | --- |
| BS-114 | Audited guild flow against the player-authored adventurer concept and locked acceptance into visible tests. | `tests/e2e/character-creation.spec.ts` |
| BS-115 | Rebuilt normal Guild mode into a focused character studio with custom creation, roster, profile, shortcuts, and coverage. | `src/App.tsx`, `src/styles.css` |
| BS-116 | Made portrait import visible through preview, roster/profile display, autosave persistence, and fallback initials. | `tests/e2e/character-creation.spec.ts`, `tests/e2e/mvp.spec.ts` |
| BS-117 | Added town profile inspection for portrait, title, notes, class, background, trait, row, equipment, stats, deepest floor, victories, and injuries. | `src/App.tsx`, `tests/e2e/character-creation.spec.ts` |
| BS-118 | Added stat/role preview before registration for HP, damage, accuracy, armor, speed, row, aptitudes, and role tags. | `src/App.tsx`, `tests/e2e/character-creation.spec.ts` |
| BS-119 | Added character-authorship browser regression gates across English desktop and Japanese mobile. | `tests/e2e/character-creation.spec.ts`, `tests/e2e/screenshot-review.spec.ts` |
| BS-120 | Kept dungeon/combat compact by hiding guild/profile editing outside town while preserving party identity tokens. | `tests/e2e/mvp.spec.ts`, `tests/e2e/combat.spec.ts` |
| BS-121 | Added debug-only scenario pack file-set import with success/failure feedback. | `src/App.tsx`, `tests/e2e/scenario-validation.spec.ts` |
| BS-122 | Improved scenario validation report grouping by file, severity, field, and player-impact category. | `src/components/ScenarioValidationPanel.tsx`, `tests/e2e/scenario-validation.spec.ts` |
| BS-124 | Expanded scenario summaries with return anchors, next-floor links, locks, loot refs, encounter budgets, localization gaps, and shop refs. | `src/services/scenarioSummary.ts`, `tests/scenarioSummary.test.ts` |
| BS-125 | Added B1F-B8F manual playtest notes for route, return, reward, and risk review. | `docs/playtest/first-scenario-notes.md`, `tests/scenarioAuthoringDocs.test.ts` |
| BS-126 | Added scenario authoring docs for pack shape, YAML truth, import flow, validation, and QA gates. | `docs/scenario/authoring.md`, `README.md` |
| BS-127 | Extended screenshot review coverage for guild studio, validation error, import success, B2F entry, and return stair. | `tests/e2e/screenshot-review.spec.ts` |

## Verification

- `npm test` - 80 passed.
- `npm run build` - passed.
- `npm run test:e2e` - 32 passed.
- `npm run headless:reachability` - reachable.
- `git diff --check` - passed.

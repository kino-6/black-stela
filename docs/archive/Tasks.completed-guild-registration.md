# Completed Tasks: Guild Registration and Player-Facing Gates

Archived after the guild registration milestone. Verification:

- `npm test`
- `npm run build`
- `npm run test:e2e`
- `npm run test:e2e -- tests/e2e/screenshot-review.spec.ts`

## Completed

| ID | Lane | Result | Evidence |
|---|---|---|---|
| BS-064 | Presentation | Dungeon visual legibility has first-person rendering, enemy/combat presence, return stair actions, and screenshot review coverage | `tests/e2e/rendering.spec.ts`, `tests/e2e/screenshot-review.spec.ts` |
| BS-065 | Presentation | Minimap shows current/mapped/unseen/wall states without revealing undiscovered rooms | `tests/e2e/map.spec.ts`, `tests/e2e/i18n.spec.ts` |
| BS-066 | Presentation | Normal play hides AI/provider/debug/headless/save-slot residue; title stays minimal | `tests/e2e/ai-settings.spec.ts`, `tests/e2e/town.spec.ts` |
| BS-071 | Requirement Gate | Screenshot review protocol and generated-state test exist for title, town, dungeon, combat, map, return stair, and mobile Japanese guild | `docs/gates/screenshot-review.md`, `tests/e2e/screenshot-review.spec.ts` |
| BS-085 | Character creation | Character contract includes class, roles, row preference, background, aptitude, traits, title, accent, equipment, and creation history | `src/domain/characterCreation.ts`, `tests/characterCreation.test.ts` |
| BS-086 | Character creation | Save V1 parser migrates missing character identity/memory fields with safe defaults | `src/domain/saveData.ts`, `tests/rosterMemory.test.ts` |
| BS-087 | Character creation | Guild screen replaces the name/notes-only panel with diegetic registration controls | `src/App.tsx`, `tests/e2e/character-creation.spec.ts` |
| BS-088 | Character creation | Quick recruit creates a viable seeded recruit with class, row, equipment, trait, and summary | `createQuickRecruit`, `tests/e2e/character-creation.spec.ts` |
| BS-089 | Character creation | Detailed registration supports name, title, class, background, trait, aptitude, accent, portrait, notes, and review | `tests/e2e/character-creation.spec.ts` |
| BS-090 | Character creation | Starter templates create legal parties for balanced, cautious, treasure, aggressive, and beginner-safe starts | `tests/partyTemplates.test.ts` |
| BS-091 | Character creation | Party coverage reports front line, healing, trap handling, mapping, damage, status safety, and retreat guard | `tests/partyCoverage.test.ts` |
| BS-092 | Character creation | Class, aptitude, traits, and equipment derive HP, armor, accuracy, damage, speed, row fit, and combat-used stats | `tests/characterCreation.test.ts`, `tests/rulesEngine.test.ts` |
| BS-093 | Character creation | Japanese/mobile guild registration is covered and checked for horizontal overflow | `tests/e2e/character-creation.spec.ts` |
| BS-094 | Character creation | Roster memory tracks first expedition, deepest floor, injuries, retreats, and victories | `tests/rosterMemory.test.ts` |
| BS-095 | Character creation | Deterministic seeded quick recruits are reproducible and valid | `tests/characterCreation.test.ts` |
| BS-096 | Character creation | Player-facing creation gate has screenshot review and red-flag criteria | `docs/gates/screenshot-review.md`, `docs/gates/player-facing-red-flags.md` |

## Human Requirement Gate Notes

- Human expectation: character creation should feel like preparing a party, not
  filling an admin form.
- DRPG fit: class, row, coverage, equipment, and party templates affect dungeon
  and combat readiness.
- Red flags avoided: no AI/provider controls, no headless controls, no
  arbitrary return command, no name-only recruit form.
- Browser evidence: Playwright covers quick recruit, detailed registration,
  templates, Japanese mobile layout, and screenshot review states.
- Headless evidence remains reachability-only; browser E2E proves visible
  player interaction.

# Completed Plan: Guild Registration Milestone

This milestone completed the active Lane D slice and the player-facing gates
that surrounded it.

## Delivered

- Guild registration replaces the old name/notes-only recruit panel.
- Quick recruit supports deterministic seeded generation.
- Detailed registration supports name, title, class, background, trait,
  aptitude focus, accent color, portrait, notes, and review.
- Starter party templates cover balanced, cautious, treasure-hunting,
  aggressive, and beginner-safe starts.
- Party coverage feedback explains front line, healing, trap handling, mapping,
  damage, status safety, and retreat guard.
- Character choices derive HP, armor, accuracy, damage range, speed, row fit,
  role tags, and starting equipment used by the rules engine.
- Roster memory tracks first expedition, deepest floor, injuries, retreats,
  victories, and player deed fields.
- Save V1 compatibility migrates old recruits into valid guild recruits.
- Japanese and mobile guild registration are covered by browser tests.
- Screenshot review protocol now has generated desktop/mobile states.

## Verification

- `npm test`
- `npm run build`
- `npm run test:e2e`
- `npm run test:e2e -- tests/e2e/screenshot-review.spec.ts`
- `git diff --check`

## Deferred

- Full economy, shops, equipment swapping, retirement, memorials, and class
  balance beyond the first vertical slice remain future Lane E work.

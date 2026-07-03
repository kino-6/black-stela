# Screenshot Review

Screenshot review is required for player-facing presentation changes. The
review is not a replacement for browser E2E assertions; it checks whether the
screen still reads as a DRPG instead of an admin interface.

## Generated States

`tests/e2e/screenshot-review.spec.ts` writes screenshots to
`test-results/screenshot-review/`:

- `desktop-title.png`
- `desktop-guild.png`
- `desktop-dungeon-start.png`
- `desktop-combat.png`
- `desktop-map-after-move.png`
- `desktop-return-stair.png`
- `desktop-post-return-town.png`
- `mobile-ja-guild.png`

`test-results/` is ignored by git. Regenerate the screenshots during review
with:

```sh
npm run test:e2e -- tests/e2e/screenshot-review.spec.ts
```

## Pass Criteria

- Title has no product explanation, AI/provider copy, or debug controls.
- Guild registration feels like party preparation, not a business form.
- Dungeon, combat, minimap, and return stair states are visible without reading
  historical logs.
- Normal play has no headless, arbitrary save-slot, or provider controls.
- Japanese mobile layout has no horizontal overflow.
- Automation and Repeat controls are interruptible and do not hide risky
  decisions.

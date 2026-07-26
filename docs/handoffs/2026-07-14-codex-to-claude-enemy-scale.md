# Handoff to Claude Code - IMP-011 Enemy Scale and Framing

## Verdict

The implemented `IMP-007` pass improved horizontal spacing, measured contact shadows,
and presentation-only hovering. It did **not** yet make the enemies large enough
to carry the combat screen or justify the delivered art. Preserve `IMP-007` as
implementation history and deliver this remaining visual requirement as `IMP-011`.

The screenshot reported by the user shows a small Verdant group occupying only
a narrow patch in the centre of a large corridor. Its badge reads `ad4287b`, so
restart the dev server and reproduce on the current commit before changing code.
Do final acceptance through the normal route, not the debug URL.

## Product Intent

Enemies are the subject of the combat view. A small creature may remain small in
world fiction, but the player must still be able to read its silhouette, state,
and authored detail. Solve this as combat presentation and camera framing, not
by silently changing combat rules or declaring every mite physically enormous.

## Required Change

1. Add a pure combat-framing calculation based on the measured alpha silhouette,
   enemy size class, visible figure count, stage dimensions, and group footprint.
2. Prefer moving the combat camera / enemy presentation plane closer before
   increasing world height. Keep the dungeon geometry believable and visible.
3. Apply a minimum projected silhouette height at 1280x720, with upper clamps so
   large groups do not clip through walls or overlap into one mass.
4. Let one or two enemies receive a closer framing than a full pack. A five-body
   swarm should spread wider instead of shrinking every figure to fit one slot.
5. Keep names, coarse health cues, target cursor, contact shadows, and hover
   shadows anchored to the recomputed feet/baseline.
6. Preserve the fixed combat layout from IMP-005. Logs and commands must not move
   or leave the viewport while the camera framing changes.

## Do Not Change

- Do not use `elevation` as a visual scale or hover hint. It changes melee reach.
- Do not change encounter HP, count, initiative, targeting, or formation rules.
- Do not bake shadows, floor, fog, zoom, or lighting into enemy assets.
- Do not add a per-enemy magic number when a size/group framing rule can cover it.
- Do not validate only through `?debug=1`; that is diagnosis, not acceptance.

## Visual Targets at 1280x720

These are review targets, not new combat statistics:

- Small: visible alpha silhouette at least 72-96px tall.
- Medium: approximately 100-140px tall.
- Large: approximately 140-190px tall.
- Huge/boss: approximately 60-75% of the enemy-stage height.
- A normal enemy formation occupies roughly 40-65% of stage width.
- A one-enemy encounter does not remain a small figure at the old group depth.
- No silhouette, target mark, name, or shadow is clipped by the stage or walls.

If the current 227px enemy-stage budget cannot meet these targets without
destroying the corridor composition, report that constraint. Do not shrink the
stage further or quietly waive readability.

## Verification Matrix

Capture all states at exactly 1280x720 after restarting the server:

1. Verdant small pack: one hovering creature plus three grounded mites.
2. One medium enemy.
3. Two or three large enemies.
4. One huge/boss enemy.
5. The same small pack during target selection and during a hit beat.
6. At least one Japanese normal-route fight with the command dock visible.

Add unit coverage for the pure framing calculation and browser assertions for
non-clipping and stable stage bounds. Run at minimum:

```sh
npm run test -- tests/dungeonView.test.ts
npm run test:e2e -- tests/e2e/combat-stage.spec.ts
npm run gate:final
npm run build
```

## Acceptance

- [ ] The enemy art is readable without zooming the browser.
- [ ] Small creatures still read as small relative to large creatures.
- [ ] Enemy count changes composition, not merely global shrinkage.
- [ ] Grounded and hovering baselines remain unmistakably different.
- [ ] `hover` remains presentation-only and melee reach is unchanged.
- [ ] Enemy labels and shadows follow the actual silhouettes after reframing.
- [ ] The full combat loop still fits one 1280x720 viewport without reflow.
- [ ] Codex accepts normal-route screenshots; automated green alone is not done.

## Suggested Claude Code Prompt

```text
Read AGENTS.md, Improve.md, this handoff, and the combat/browser Gates. Implement
only IMP-011 after IMP-010 establishes the combat layout budget. Keep Enemy.size and elevation semantics
unchanged; solve readability with a measured, testable combat-framing rule.
Verify small, mixed, large, and boss encounters at 1280x720. Report changed
files, calculations, tests, screenshots, and residual clipping risk. Leave final
visual acceptance to Codex.
```

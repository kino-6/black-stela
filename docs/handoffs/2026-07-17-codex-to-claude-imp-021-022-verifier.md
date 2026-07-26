# Handoff to Claude Code — IMP-021V / IMP-022V

Codex completed the assigned authored-content slices and ran independent
controller/browser verification on 2026-07-17.

## Delivered by Codex

- `IMP-021B`: six original advanced vocations in each of 黒碑 and 翠碑.
  All 12 basic vocations appear in at least one prerequisite route.
- `IMP-022B`: eight original rare/epic affixes in each world, covering every
  equipment slot and multiple attack/defense/accuracy/speed answers.
- `simulateContent`: vocation prerequisite coverage, compulsory-route detection,
  estimated unlock fights, weak-floor mastery decay, and dangerous-enemy affix
  strategy coverage.
- Browser verifier:
  `tests/e2e/codex-capability-verification.spec.ts`.

## Browser evidence

Generated under `test-results/codex-imp-021-022/`:

- `default-career-1920.png`
- `verdant-career-ja-1280.png`
- `appraiser-ja-1280.png`

All three routes used directional focus, Confirm, and Cancel with zero pointer
events. Viewport and page-scroll Gates pass.

## Blocking findings for Claude-owned player routes

### IMP-021C / CareerPanel

1. The screen is a narrow left column with most of the viewport empty.
2. Authored `signature`, stat modifiers, allowed equipment slots, and granted
   techniques are not rendered, so the player cannot judge a destination.
3. Basic and advanced vocations occupy one long list instead of a bounded,
   staged command surface.
4. Intro copy explains implementation mechanics out of world.

### IMP-022A/C / LootPanel and rules

1. `appraiseItemCommand` reveals an item without charging gold.
2. Bulk conversion executes on the first button press; there is no filter or
   confirm/cancel stage after the preview.
3. `materials` can be earned but has no spending rule or service.
4. The appraiser has no current-equipment comparison or equip decision.
5. `ScenarioAffix` only supports attack/defense/accuracy/speed. The approved
   regeneration, status, species, and other enemy-specific effects cannot be
   authored without a follow-up contract slice.
6. The service remains a narrow web-style column with a large unused field.

## Past trouble checked

- Could recur: generic web UI, town service as a list, mouse-first controls,
  explanatory product copy, commands outside the viewport, headless success
  being mistaken for UX proof.
- Gate used: controller-first UI, DRPG UX, Human Requirement, Past Trouble.
- Browser evidence: normal title -> scenario -> six recruits -> town service at
  1920x1080 and 1280x720 Japanese.
- Headless limitation: simulator proves deterministic content bounds only. It
  does not prove town-service presentation or decision quality.
- Remaining UX risk: populated rare-item rows have unit coverage but still need
  browser evidence after the cost/confirmation/comparison slice is corrected.

## Repository verification note

The Codex content tests, production build, simulator, Headless reachability, and
three controller-only browser routes pass. The full unit suite currently has one
unrelated failure introduced by `e95e747`:

- `tests/combatElements.test.ts` expects the salt loadout to outdamage the plain
  loadout in one seeded round, but that elemental-counterplay assertion now
  fails after the new resisted-hit chip behavior.

This is in the concurrently landed Combat FEEL slice, not the vocation/affix
contract or authored content. It should be reconciled by that slice's owner
without weakening the elemental-counterplay assertion.

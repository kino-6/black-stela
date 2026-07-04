# Completed Tasks: Town Return Loop and Japanese DRPG Service UX

Archived: 2026-07-05

## BS-183: Post-Return Town Cockpit

- [x] Returning through the authored marker now lands on a town status cockpit
  instead of the guild-registration context.
- [x] The cockpit shows return record, wounds, carried goods, gold, next
  preparation, and direct recovery/shop/dungeon-entry choices.
- [x] Command focus remains controller-friendly through town tabs and cockpit
  service buttons.
- [x] Browser Self-Play captures `10-post-return-town.png`.

## BS-184: Normal-Route Japanese Localization Pass

- [x] Normal Japanese town service labels use `商店`, `施療院`, `記録`, and
  `迷宮入口`.
- [x] Japanese shop/recovery routes reject `Shop`, `Recovery`, and `gold` leaks.
- [x] Mobile Japanese shop coverage remains readable.
- [x] Browser Self-Play captures `13-ja-shop.png` and `14-ja-recovery.png`.

## BS-185: Shop As Preparation Decision

- [x] Shop entry selects a front-line adventurer by default instead of the last
  registered member.
- [x] Shop shows selected adventurer, current stats, party selector, equipment
  eligibility, stat deltas, price, and remaining gold.
- [x] Equipment board is scoped to the selected adventurer instead of listing
  every party member as an admin table.
- [x] Playwright covers buying, selling, and equipping from the revised shop.

## BS-186: Recovery As Attrition Decision

- [x] Recovery shows each member's HP, member treatment cost, post-treatment HP,
  total cost, and insufficient-gold state.
- [x] Recovery action is disabled when there is no treatment or not enough gold.
- [x] Recovery results stay in a fixed message window without shifting commands.
- [x] Playwright covers paid recovery after a dungeon return.

## BS-187: Browser Self-Play UX Gate Expansion

- [x] `npm run selfplay:browser` fails if return lands in registration context.
- [x] Self-Play asserts town cockpit, shop deltas, recovery plan, and Japanese
  service localization.
- [x] Self-Play report records Japanese shop/recovery screenshots.
- [x] The route still uses visible controls only.

## BS-188: Town Loop Regression and Archive

- [x] Ran `npm run selfplay:browser`.
- [x] Ran `npm run test:e2e`.
- [x] Ran `npm test`.
- [x] Ran `npm run build`.
- [x] Ran `npm run headless:reachability`.
- [x] Ran `git diff --check`.
- [x] Archived BS-183..BS-188 and returned `Tasks.md` to no active milestone.

## Gate Note

Past trouble checked:

- Could recur: returning to guild-registration context, town services as admin
  lists, Japanese English leaks, shop without equipment decisions, recovery as
  HP debug list, command shift after logs, and Headless overclaim.
- Gate used: Past Trouble Regression Gate, Human Requirement Gate,
  Player-Facing Red Flags, DRPG UX Gate, Scenario Prose/Japanese checks,
  Screenshot Review, Browser Self-Play Gate.
- Browser evidence: `npm run selfplay:browser`, `npm run test:e2e`, screenshots
  under `test-results/selfplay/`.
- Headless limitation: `headless:reachability` proves deterministic route
  reachability only; it does not prove town UX, localization, layout, or
  preparation feel.
- Remaining UX risk: the town loop is now readable, but asset and ceremony work
  can still improve the feeling of shopkeepers, healers, and town locations.

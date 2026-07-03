# Human Requirement Gate

Black Stela player-facing work must satisfy a human expectation before it is
called done. Engine reachability, passing types, or a headless clear are not
enough for UI, presentation, pacing, copy, character creation, or DRPG rules.

Before any player-facing work, also use
[`past-trouble-regression-gate.md`](past-trouble-regression-gate.md). The task
must name which previous failure could recur and how the current evidence blocks
it.

## Blocking Gates

Every player-facing task must record:

- Human expectation: the complaint, desire, or player feeling being addressed.
- DRPG fit: why the result belongs in a first-person dungeon RPG.
- Red flags: what would feel cheap, web-app-like, non-diegetic, unfair, or
  invisible.
- Browser evidence: the screen, control, route, or screenshot proving the
  player can see and use it.
- Regression test: the unit or Playwright test that fails if the problem
  returns.
- Japanese impact: whether labels, layout, or scenario text need Japanese
  verification.
- Headless/browser parity: what headless proves, and what it explicitly does
  not prove.

If any blocking gate is missing, the task is not ready to merge.

## Advisory Gates

Use these as review prompts when the change touches mood or play feel:

- Does the screen look like a game first and a tool second?
- Is the player asked to configure something the game should handle silently?
- Would an enemy, door, stair, trap, or map state be visible without reading a
  log?
- Are treasure, gold, recovery costs, and equipment effects visible at the
  moment they matter?
- Are debug, save/load, AI provider, and reachability controls hidden from
  normal play?
- Does return/recovery preserve dungeon attrition instead of becoming a free
  escape or free heal?
- Can the player see and use authored stairs/return seals, descend to the next
  floor, and route back to town without debug knowledge?
- Is the dungeon a continuous grid of cells, walls, doors, stairs, and edge
  rules rather than arbitrary room cards linked by exits?
- Does the UI avoid explaining itself with product copy on the title screen?
- Can the same flow be verified in English and Japanese without text overflow?
- Has Codex reviewed the actual browser UI instead of leaving obvious DRPG UX
  defects for the user to find?
- Which recorded past trouble would this task most likely repeat if reviewed
  carelessly?

## Recent Feedback Mapped To Gates

| Feedback | Gate |
| --- | --- |
| Title copy like local narration or product explanation ruins mood | Player-facing copy and AI-leak gate |
| Save/load and language controls on the top bar feel like a web app | Non-diegetic control gate |
| Adventure log panel and AI suggestions are unclear during play | Web-app residue and hidden AI gate |
| Enemies, doors, stairs, and maze state must be visible | DRPG affordance gate |
| Minimap is expected and must be honest | Map honesty gate |
| Headless clear may be cheating if the browser cannot play it | Play parity gate |
| Character creation needs to be fun, not a plain form | Guild registration and roster identity gate |
| Free return or free recovery denies DRPG attrition | Escape/recovery cost gate |
| Return is disabled but authored stairs/next-floor progression are unclear or broken | Stair/progression gate |
| Dungeon behaves like connected room cards rather than a grid maze | Grid Labyrinth Gate |
| Party formation is a flat list or wrong size for DRPG expectations | DRPG UX Gate |
| Codex says done before checking visible UI quality | DRPG UX Gate |
| Shop, inventory, or equipment screens feel like admin tables | Town service presentation gate |
| Rewards exist only in hidden state or logs | Visible reward/economy gate |

## Implementation Handoff Template

Use this block when adding or taking a player-facing task:

```md
### Task

- Human expectation:
- Non-goals:
- Red flags:
- Browser evidence:
- Automated test:
- Japanese impact:
- Save/schema impact:
- Headless/browser parity:
- Screenshot states:
```

## Pre-Merge Checklist

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] `npm run headless:reachability`
- [ ] `git diff --check`
- [ ] Player-facing copy contains no AI/provider/debug setup leakage.
- [ ] Browser tests cover visible controls for the changed flow.
- [ ] Screenshots or Playwright evidence cover desktop and mobile when layout
  changes.
- [ ] Headless results are described as reachability only.
- [ ] Recovery is paid, blocked when unaffordable, and not bundled into return.
- [ ] Escape/return affordances are contextual, not always available.
- [ ] Every reachable room can route back to an authored town return.
- [ ] Every non-final authored floor has a visible route to the next floor.
- [ ] Dungeon topology passes the Grid Labyrinth Gate: explicit grid cells,
  edge rules, adjacent movement, and current-cell interactables.
- [ ] Browser E2E proves normal controls can enter the next floor and return.
- [ ] DRPG UX Gate passes for party formation, command layout, and browser
  evidence.
- [ ] Shop/equipment UI is reviewed as a town service, not a generic data table.
- [ ] Rewards are visible in browser screenshots or Playwright assertions.

## Screenshot Review Protocol

For presentation work, capture and review these states:

- Title
- Town
- Dungeon start
- Combat
- Reward feedback
- Map/minimap after movement
- Return stair
- Post-return town record
- Town shop/equipment service

Store generated screenshots under Playwright's normal artifact output or a
task-specific `test-results/` directory. The review note must say pass/fail for
legibility, DRPG mood, red flags, and Japanese layout when relevant.

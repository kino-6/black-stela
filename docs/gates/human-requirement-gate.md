# Human Requirement Gate

Black Stela player-facing work must satisfy a human expectation before it is
called done. Engine reachability, passing types, or a headless clear are not
enough for UI, presentation, pacing, copy, character creation, or DRPG rules.

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
- Are debug, save/load, AI provider, and reachability controls hidden from
  normal play?
- Does the UI avoid explaining itself with product copy on the title screen?
- Can the same flow be verified in English and Japanese without text overflow?

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
- [ ] `npm run headless:clear`
- [ ] `git diff --check`
- [ ] Player-facing copy contains no AI/provider/debug setup leakage.
- [ ] Browser tests cover visible controls for the changed flow.
- [ ] Screenshots or Playwright evidence cover desktop and mobile when layout
  changes.
- [ ] Headless results are described as reachability only.

## Screenshot Review Protocol

For presentation work, capture and review these states:

- Title
- Town
- Dungeon start
- Combat
- Map/minimap after movement
- Return stair
- Post-return town record

Store generated screenshots under Playwright's normal artifact output or a
task-specific `test-results/` directory. The review note must say pass/fail for
legibility, DRPG mood, red flags, and Japanese layout when relevant.

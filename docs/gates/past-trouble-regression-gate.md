# Past Trouble Regression Gate

This gate records user-visible failures that Black Stela must not repeat. Use it
before planning, coding, reviewing, or claiming completion for player-facing
work.

## Required Loop

- [ ] Read this file plus `docs/gates/human-requirement-gate.md`.
- [ ] Read the relevant domain gate: DRPG UX, Grid Labyrinth, Scenario Prose, or
  Player-Facing Red Flags.
- [ ] Name which past trouble could recur in the task.
- [ ] Add browser-visible evidence for the exact player state touched.
- [ ] State what headless proves and what it does not prove.
- [ ] If a past trouble recurs, do not merge or mark done.

## Recorded Troubles

| Area | Past failure | Blocking expectation |
| --- | --- | --- |
| Startup | Title/header used product copy, local-narration copy, or developer-facing explanation. | Title/startup must preserve mood and avoid explaining systems. |
| Normal play controls | Language, save/load, AI settings, slot controls, and debug-like affordances were exposed as web UI. | Normal play hides configuration, provider, arbitrary save/load, and debug controls. |
| AI | AI was treated as a user-facing switch or suggestion panel. | Local AI is hidden, on by concept, non-canonical, and never asks the player to configure it in normal play. |
| Headless | `clear` wording and scenario-truth reachability implied the browser game was proven. | Headless is reachability only; browser proof is required for UX and play parity. |
| Character creation | Guild registration became a plain form and lost portrait/profile/stat customization. | Character creation must support player-authored identity, roster fantasy, roles, and visible party coverage. |
| Dungeon topology | The maze behaved like room cards or a graph of named places. | Dungeon is a continuous grid of cells, edge walls/doors, facing, stairs, and current-cell actions. |
| Minimap | Map layout was missing, too large, or revealed/warped topology. | Minimap is compact, nearby, explored-only, and derived from grid coordinates. |
| Stairs/return | Return was free/always available, or stairs/return worked from an implausible distance. | Return/stair actions require the current cell or current edge and preserve attrition. |
| Visual affordances | Enemies, doors, stairs, traps, or route state existed only in logs/text. | Important DRPG affordances must be visible in the first-person view or compact HUD. |
| Assets | Enemies and landmarks were primitive circles/rectangles. | Player-facing assets need authored/generated silhouettes, material texture, and screenshot review. |
| Combat commands | "Round resolve" or missing attack read as debug/unfinished UI. | Combat uses clear command selection, target selection, message advance, and stable command positions. |
| Logs | Messages pushed commands around or duplicated the same idea. | Logs/messages are bounded; command surfaces never shift after results. |
| Repeat/auto | Repeat produced "cannot repeat" or hid risk instead of helping tempo. | Repeat/auto is an explicit mode, cancellable, and stops on danger, branch, or unsafe state. |
| Party formation | Party display was a flat row/list or wrong size. | Six-person party, front/back rows, and row meaning are visible in exploration and combat. |
| Prose | Japanese sounded translated, abstract, or told the player what to feel. | Prose is Japanese-first, concrete, short, sensory/spatial, and never speaks for player characters. |
| Claiming done | Codex declared completion before checking the actual browser UI. | Any player-facing change needs browser screenshot/DOM review and a remaining-risk note. |

## Completion Note Template

```md
Past trouble checked:
- Could recur:
- Gate used:
- Browser evidence:
- Headless limitation:
- Remaining UX risk:
```

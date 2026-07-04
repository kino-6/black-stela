# Completed Tasks: Guild Registration Flow Reconstruction

Completed: BS-149..BS-154.

## Summary

| ID | Outcome | Verification |
| --- | --- | --- |
| BS-149 | Replaced the all-at-once guild form with a staged registration flow. | `tests/e2e/character-creation.spec.ts` |
| BS-150 | Added optional guild-master briefing with skip/start controls. | Desktop guild screenshot review |
| BS-151 | Changed class choice to focused role cards before appearance/profile data. | `tests/e2e/character-creation.spec.ts` |
| BS-152 | Added rerollable bonus point pool with manual point assignment. | `tests/characterCreation.test.ts`, E2E DOM assertions |
| BS-153 | Kept portrait/profile/coverage visible without crowding the main flow. | Mobile Japanese guild E2E |
| BS-154 | Updated Plan/Tasks traceability and archived the lane. | `Plan.md`, `Tasks.md` |

## Gate Note

Past trouble checked:
- Could recur: character creation becomes a business form, shows too much at
  once, or loses portrait/profile/player authorship.
- Gate used: DRPG UX and Past Trouble Regression.
- Browser evidence: staged guild flow covers briefing skip, class selection,
  portrait import, bonus reroll/allocation, naming, and roster registration.
- Headless limitation: headless does not prove the guild UI teaches or paces
  character creation.
- Remaining UX risk: class/appearance art is still mostly textual; future asset
  work should add better class portraits/silhouettes.

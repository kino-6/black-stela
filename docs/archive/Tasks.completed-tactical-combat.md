# Completed Tactical Combat Tasks

Completed in the tactical DRPG combat pass.

| ID | Lane | Completed outcome | Evidence |
|---|---|---|---|
| BS-074 | Tactical combat | Added the combat vertical-slice design spec with Wizardry as structural reference only. | `docs/design/tactical-combat-vertical-slice.md` |
| BS-075 | Tactical combat | Expanded character/enemy/combat data contracts with row, accuracy, armor, damage range, speed, morale, XP, gold, statuses, and save defaults. | `src/domain/types.ts`, `src/domain/saveData.ts`, `src/domain/scenario.ts` |
| BS-076 | Tactical combat | Added formation and target rules; back-row melee is blocked while a front row stands. | `tests/tacticalCombat.test.ts` |
| BS-077 | Tactical combat | Added deterministic declared-round resolution, initiative ordering, hit/miss, damage, and replayable round events. | `src/domain/rulesEngine.ts`, `tests/tacticalCombat.test.ts` |
| BS-078 | Tactical combat | Added enemy group state and deterministic encounter-table resolution for authored encounter pressure. | `src/domain/rulesEngine.ts`, `content/worlds/default/enemies.md` |
| BS-079 | Tactical combat | Added first spell/item tactics through healing item support and Sleep round action. | `src/App.tsx`, `src/domain/rulesEngine.ts` |
| BS-080 | Tactical combat | Added first status loop hooks with sleep and ward statuses plus recovery-safe save schema. | `src/domain/types.ts`, `src/domain/saveData.ts` |
| BS-081 | Tactical combat | Replaced the combat command strip with a visible battle screen for enemy groups, party formation, actor/target selection, and round controls. | `src/App.tsx`, `src/styles.css`, `tests/e2e/combat.spec.ts` |
| BS-082 | Tactical combat | Added XP/gold victory rewards and reward log projection. | `src/domain/rulesEngine.ts`, `src/domain/replayLog.ts` |
| BS-083 | Tactical combat | Added combat balance probes and adjusted scenario probes to report attrition signals instead of treating all starts as mandatory clears. | `scripts/combat-probes.ts`, `scripts/headless-probes.ts` |
| BS-084 | Play parity | Added browser tactical-combat clear proof using visible actor, target, and round controls; normal UI has no single Attack clear button. | `tests/e2e/combat.spec.ts` |

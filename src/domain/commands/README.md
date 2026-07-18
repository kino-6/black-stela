# domain/commands — extracted command handler groups

`rulesEngine.ts` is the command dispatcher: `resolveCommand(state, world, command)`
`switch`es on `command.type` and delegates to a named handler that returns a
`CommandResult` (`{ state, events }`). This directory holds cohesive groups of
those handlers, pulled out of the dispatcher so the engine's core stays readable.

Current modules:

- `economyCommands.ts` — appraise / lock-favorite / reinforce (Forge) /
  bulk-convert / buy / sell / equip
- `vocationCommands.ts` — change vocation / set combat loadout
- `questCommands.ts` — accept / claim quest

Movement, search/listen, roster/guild lifecycle, and the combat group
(`declare_round` et al.) still live in `rulesEngine.ts`; they can be extracted the
same way when the churn is worth it.

## How to extract a group safely

1. Move the handler(s) **verbatim** into a new module here.
2. Import shared plumbing from `../commandResult` (`CommandResult`, `noChange`,
   `withEvents`) and pull any private helpers the group owns along with it.
3. Import domain helpers only from **leaf** modules (`../economy`, `../loot`,
   `../affixes`, `../quests`, `../vocations`, …) — none of them import
   `rulesEngine`, so there is no circular dependency. Never import `rulesEngine`
   from here.
4. In `rulesEngine.ts`, import the handlers and delegate from the dispatcher; then
   trim the now-unused imports.
5. Verify behaviour is unchanged: `npm run build`, `npm run test`, and a clean
   `npm run gate:final` (do not run build/test concurrently with the gate — it
   starves the WebGL/expedition e2e and reports false failures).

The invariant: extraction is a pure move behind the gate. Behaviour must not
change — only where the code lives.

See `docs/architecture.md` §3 for the full picture.

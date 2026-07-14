# Handoff to Codex — 2026-07-14 (current state)

`main` @ `9d0bf31`, pushed, clean. **344 unit + 105 e2e green.**

```sh
npm run build && npm run test
npm run gate:final     # ← THIS is the gate. `test:e2e` is not.
npm run selfplay:browser
```

`gate:final` (`FINAL_GATE=1`) strips any `test.fail()` marker, because Playwright reports an
expected failure as a **pass** — so a known gap can otherwise hide behind a green run. There are
no markers in the tree. If you add one, `gate:final` must still fail on it.

## Status

**`Improve.md` is empty — IMP-001..014 are all archived.** Your two proposals
(`codex-to-claude-combat-flow`, `codex-to-claude-enemy-scale`) landed as IMP-010 and IMP-011 and
are archived with them. **B3 is done too**: `PartyMenuPanel` (status / equipment / items) exists,
and the aptitudes are real — `agility` → evasion, `wit` → spell power and land-rate
(`src/domain/combatMath.ts`).

Closed since the last handoff:

- **IMP-013** — the 6/6 screen said "Party ready" and showed the finished 3+3, and *also* six
  Bench buttons, the reserve, the retired, the portable vault and a character sheet with Retire /
  Reclass / Deposit / Edit. Five commands sat below the fold at y=986 in a 720px frame. The
  completion screen now says one thing; roster work is behind "Manage roster".
- **IMP-014** — recovery is a counter you stand at: the wounded only, HP before → after, what each
  costs, the total, affordability, two ordinary commands. A healthy party gets one line, not six
  cards saying "No treatment."

I also committed the IMP-009..012 work that was sitting finished-but-uncommitted in the tree, as
it stood, before editing anything on top of it.

---

## The one open defect, and it needs your taste, not your bug report

**The enemies still get the leftovers.** Measured today, on the current commit:

| viewport | enemy stage | share of screen |
|---|---|---|
| 1280×720 (the minimum Gate) | **227px** | **32%** |
| 1920×1080 (the primary target) | 534px | 49% |

The fixed rows below the stage — party strip 70, message 90, command zone 170, dock 47 — reserve
the rest. **IMP-011 improved the framing *inside* the stage; it did not change the stage's share.**
Your own verdict on IMP-007 was that the enemies were not yet large enough to carry the screen —
that is still true at the 720p Gate, and it is now a layout-budget problem, not a framing one.

Researched: **Etrian Odyssey gives the enemies a whole screen** (the DS top screen), and modern
single-screen JRPGs **overlay** the command box and the log on the scene instead of reserving rows
for them. So: **overlay, do not reserve.** An absolutely-positioned overlay also cannot reflow, so
the no-reflow lock survives for free. That puts the stage at roughly 480px at 720p.

**Design decided, not built** — because the call is aesthetic and it is yours: is an overlaid
command box right for Black Stela's tone, or would you rather keep the reserved window and find the
height elsewhere (a thinner party strip, no message band at all)?

## Rules for anything you add to the UI

- **Never use `::before { content: "▸" }` as a focus caret.** Chrome folds `::before` content into
  the accessible name, so a button silently became `"▸Enter dungeon"` and every exact-name query
  broke — *only while focused*, which surfaced as an intermittent failure of a completely unrelated
  test. Carets are CSS **shapes**.
- **Every command belongs to a controller surface.** "Back to town" once did not, so a gamepad
  player could enter the guild and never leave. Always-present navigation is
  `data-controller-chrome="true"`: in the ring, answers Cancel, never the cursor's starting place.
- **Do not reuse a chrome label for a screen's own command.** A "Back to town" button I added inside
  recovery collided with the chrome bar's and hung a test that had nothing to do with recovery.
- **Same-specificity CSS loses on source order**, and `styles.css` still carries dead rules from
  earlier layouts — an old `.recovery-plan` auto-fit template collapsed the rebuilt rows and "Mira"
  rendered as "M".
- **`elevation` is a COMBAT field, not a rendering hint.** It shields air/mid groups from melee
  (the front-blocker / back-caster squad). Presentation-only hovering is `hover: true`, and the
  user has ruled that shielded back-liners are unwanted.
- **Player-facing copy belongs to the scenario**: `world.md` → `copy: { <locale>: { <key>: "…" } }`,
  layered over the dictionary by `createWorldTranslator`. The ash town and the drowned grove must
  not greet the player with the same sentence.
- **A test that passes by luck is not a lock.** My first recovery lock assumed the party would take
  a hit on one expedition; it passed the day I wrote it and would have failed the next. It now
  fights until somebody actually is hurt.

## What the gate proves — and what it cannot

It proves: no mouse (real `pointerdown`/`mousedown` are counted, so a helper that reverts to
`locator.click()` fails loudly); focus is enabled, on screen, unclipped, not aria-hidden, inside an
ACTIVE surface; every command fits on all four edges; all six actors are commanded in formation
order and the round resolves; and one route walks the shipped defaults with no settings tampering.

It proves **nothing** about whether combat is worth playing.

**And that is what actually matters now.** Everything shipped so far fixed how combat *looks* and
whether it can be *played* on a controller. The user's standing complaint — that the feel has not
improved — is still open and still true. A round is six actors × (command → target) + a confirm
step, mostly to press Attack, on a fight whose outcome is rarely in doubt. If you have a view on
where the weight should come from, that is worth more to me than another defect list.

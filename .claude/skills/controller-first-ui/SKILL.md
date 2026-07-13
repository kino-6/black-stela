---
name: controller-first-ui
description: Building and PROVING keyboard/gamepad-first game UI, and writing browser gates that can actually fail. Use when touching any player-facing screen (title, scenario picker, guild, town, shop, dungeon, combat), when a screen "works" but only with a mouse, or when a test suite is green while the game is broken.
---

# Controller-first UI, and gates that can fail

Written after a hand playtest found Black Stela **unplayable on a controller** while
`npm run selfplay:browser` passed in 38.5 seconds. Every rule below is a bug that shipped.

## The first defect is usually the gate

A suite that navigates with `locator.click()` and checks only horizontal overflow will pass
a game that a keyboard cannot play and whose commands are below the fold. **Build the gate
so it fails on today's code, and read the failures, before fixing anything.** If your first
gate run is green, you have not built a gate — you have built a description of the bug.

### Prove "no mouse" by MEASURING it

A comment saying a route is controller-only rots the moment a helper reverts to a click.
Count real pointer events instead:

```ts
// pointerdown/mousedown are an exact detector of a mouse.
// Keyboard Enter on a focused button fires `click` — but NEVER a pointer event.
// So there are no false positives, and no way for a click to sneak back in.
window.addEventListener("pointerdown", (e) => { if (e.isTrusted) count += 1; }, true);
```

### `test.fail()` is reported as a PASS

Playwright counts an expected failure as green. Fix one defect and the whole command turns
green while a known gap is still broken. Provide an escape hatch that strips every marker
(`FINAL_GATE=1` → `npm run gate:final`) and **treat only that as the gate.**

### Half a lock is not a lock

Asserting a screen "does not move" says nothing about whether it **fits**. Black Stela's
combat dock sat at y=719–786 in a 720px viewport, on a page that cannot scroll, while the
no-reflow lock stayed green — it was even running at exactly that viewport size. Assert both.

## Focus is a fact, not a colour

- **Every screen hands the cursor a place to land.** A screen that registers no focus surface
  is dead to a controller: arrows do nothing and the player is stuck. (Tab is not a gamepad button.)
- **The cursor must be on something usable**: enabled, on screen, not clipped by an ancestor,
  not inside `aria-hidden`/`inert`, and inside an ACTIVE surface. A cursor on a disabled or
  off-screen element is "no cursor" wearing a disguise.
- **What LOOKS selected must BE what is focused.** Do not give a "recommended" command the same
  gold as the focus ring — the player will press Enter on it and get something else. Black Stela's
  town painted "Enter dungeon" gold while focus sat on "Guild".
- **Focus survives every transition.** The transitions that break it are the ones that *unmount
  the focused button*: a dialogue replaced by its answer, a form replaced by a result. Watch that
  state in the autofocus effect, not just the screen name.

## Surfaces

- **Every command belongs to a surface.** A "Back to town" button outside every surface means a
  gamepad player can enter the guild and **never leave**.
- **Always-present navigation is CHROME** (`data-controller-chrome`): it joins the focus ring and
  answers Cancel, but it is **never the cursor's starting place** (it is first in the DOM, so it
  will otherwise steal focus on every transition) and it is **not counted** when asking "does this
  screen own its input?".
- **One non-chrome surface per screen.** Sibling surfaces flatten into ONE focus ring, so a roster
  rendered beside a class grid lets arrows wander out of the step the player is being asked for.
  A step is a step; another screen's controls do not sit beside it.
- **Cancel means "back one step", and it must always resolve.** If the focused surface has no
  cancel target, fall back to the screen's exit — but **never to chrome by accident**: Escape
  inside a text field blurs FIRST, and a naive "first surface in the DOM" fallback then ejected the
  player out of registration entirely.

## Decorations must not be able to rename what they decorate

**Never use `::before { content: "▸" }` as a focus caret on an interactive element.** Chrome folds
`::before` content into the **accessible name**, so the button silently became `"▸Enter dungeon"`
and every exact-name query for it broke — *only while focused*, which surfaced as an intermittent
failure of a completely unrelated test. Carets are CSS **shapes** (a border triangle).

## Fitting the screen

- Check **all four edges**, and **each command inside a surface** — a panel can measure as fitting
  while a button inside it hangs off the bottom.
- **A command a scrollable panel can bring into view is NOT a defect.** Focusing it scrolls it in;
  that is what a controller does. A long roster and an unreachable dock are different things. Ban
  page scroll, not internal scroll.
- When a screen overflows, **measure, do not eyeball**: dump every zone's bounding box and do the
  arithmetic. If the children sum to more than the container, flex children that cannot shrink are
  shoving the last one off the screen — and a "min-height" on the elastic zone can be the thing
  that makes the sum impossible.

## Copy belongs to content, not to components

Service copy, dialogue, room text and tutorial lines hardcoded in an i18n TypeScript dictionary
means every world greets the player with the same sentence. Let the scenario override any key
(`world.md` → `copy: { <locale>: { <key>: "…" } }`) and layer it over the dictionary with the same
`{variable}` interpolation, falling through for anything a world does not say itself.

## And: do not put the user's name on your checklist

"User real-play approval" is not a task you own. Verifying a player-facing change in a real
browser is **your** job; the user reviews continuously and raises what is wrong. A pending item
with their name on it reserves their time on your behalf and makes work look blocked on them when
it is blocked on you. Ask for their **judgement** (a specific question), never for their QA.

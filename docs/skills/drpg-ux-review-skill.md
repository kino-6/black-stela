# DRPG UX Review Skill

Use this skill before changing player-facing UI, party formation, dungeon
exploration, combat commands, town services, character creation, or automation.

Start by using `docs/skills/black-stela-gate-review-skill.md`; it routes this
review through the Past Trouble Regression Gate and the relevant domain gates.

## Goal

Black Stela must feel like a playable DRPG, not a browser admin tool. Codex
must review the screen before claiming a player-facing change is done.

## Source Basis

- Wizardry-style party DRPGs normalize a six-character expedition and formation
  decisions.
- Etrian Odyssey-style party combat makes front/back rows visible and tactically
  meaningful.
- Classic console RPG UI keeps command positions stable, controller-friendly,
  and separated from logs.
- First-person dungeon crawlers rely on grid movement, visible affordances, and
  readable party state.

## Controller-First Contract

- Treat keyboard/controller as the primary input model for normal play.
- Design screens as focusable command windows and staged choices, not web forms.
- Directional navigation must move through choices in a predictable order.
- Confirm/cancel must have obvious equivalents for every staged flow.
- Text entry and portrait import can use form controls, but they must be reached
  from a controller-friendly staged flow and must not dominate the screen.
- Browser proof must include keyboard/controller-style traversal for changed
  guild, town, combat, dungeon, shop, records, recovery, or config surfaces.

## Blocking Review Loop

1. Name the player expectation: party planning, formation, danger reading,
   command selection, mapping, return, reward, or town service.
2. Compare the current screen against DRPG references and the latest user
   complaint before changing code.
3. Implement the smallest vertical slice that fixes the visible player problem.
4. Verify by browser, not only unit/headless tests:
   - desktop and mobile layout
   - English and Japanese labels when text changes
   - keyboard/controller-style operation
   - stable focus order and confirm/cancel behavior for changed surfaces
   - screenshot or DOM proof of the exact state
5. Run one self-review pass and record remaining UX risk honestly.

## Party Formation Contract

- Normal party capacity is six.
- Formation is visible as front row and back row, not a flat list.
- A six-person template should show three front-line and three rear-line slots
  unless scenario rules intentionally say otherwise.
- Combat and exploration must both expose row status compactly.
- Back-row restrictions must be visible in the UI before they block a command.

## Red Flags

- The UI shows a flat horizontal list of adventurers during exploration/combat.
- Party size, row rules, or disabled commands are only implied by logs.
- A feature is called done without a browser screenshot/DOM assertion.
- Passing headless reachability is used as proof of player UX.
- The user has to identify obvious layout, copy, or affordance problems after
  Codex says the work is complete.
- Normal play asks the player to hunt scattered web controls with a mouse.

## Acceptance Checks

- [ ] Six-member party capacity is visible in guild UI and starter templates.
- [ ] Front/back rows are visually separated in exploration and combat.
- [ ] Command layout remains stable after messages/logs change.
- [ ] Mouse is supported, but keyboard/controller-style operation is tested.
- [ ] Guild/town/combat/dungeon flows have staged focus order and confirm/cancel
  actions rather than scattered form controls.
- [ ] Desktop and mobile layouts avoid overlap, overflow, and web-app residue.
- [ ] Japanese UI is checked when labels or layout change.

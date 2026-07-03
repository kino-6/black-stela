# Player-Facing Red Flags

Use this checklist before shipping normal-play UI, copy, controls, or DRPG
presentation. Any blocking red flag must be fixed or explicitly moved behind
debug mode.

Also check [`past-trouble-regression-gate.md`](past-trouble-regression-gate.md)
before claiming done. Repeating a recorded trouble is a blocking failure even if
new tests pass.

## Blocking

- Title screen contains explanatory product copy, AI copy, provider names,
  debug terms, or implementation language.
- Normal play exposes AI settings, provider selection, endpoint/model fields,
  narration proposals, or hidden automation plumbing.
- Save/load, arbitrary slot controls, debug progress, or headless buttons appear
  outside debug mode.
- A clear path depends on hidden commands, scenario truth, or debug state that a
  player cannot see.
- `Return` appears before the room has an authored stair or return seal.
- `Return` is hidden correctly, but the authored stair/return seal or next-floor
  descent is not visible and usable through normal controls.
- A reachable room cannot route back to town without debug knowledge.
- A multi-floor scenario claims depth but has no player-visible route to the
  next floor.
- Enemy, door, stair, trap, wall, or side opening exists only in text/logs and
  is not visually signaled in the dungeon view.
- Minimap reveals rooms the party has not discovered through known exits.
- Labels such as mapped, explored, or unseen do not explain the actual state, or
  fail to fit in Japanese.
- UI is dominated by dashboard panels, admin-style controls, or generic web
  form chrome instead of diegetic game surfaces.
- Character creation is only a name/notes form when the task promises guild
  registration, roles, identity, or party coverage.
- Scenario or UI prose sounds like translated English, explains theme directly,
  or uses abstract fantasy filler instead of concrete scene detail.
- The task does not state which past trouble was considered.

## Advisory

- Controls are technically correct but lack DRPG rhythm, tension, or ceremony.
- Repeated logs crowd out the current scene.
- Automation hides meaningful decisions or risk.
- English-only assertions cover a Japanese-facing copy or layout change.
- Headless success is used as evidence for visual affordance or UX quality.
- The feature is explained by prose instead of being visible through layout,
  art, state, or control behavior.
- Town, room, or event copy tells the player what the party feels or what story
  they should imagine.

## Required Evidence

- Browser-visible Playwright test for normal-play flows.
- Unit test for deterministic rule boundaries.
- Screenshot review for visual/layout work on desktop and mobile.
- README or task note when headless output is reachability-only.
- Japanese check for any player-facing text or compact control.

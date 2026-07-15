# IMP-018 to IMP-020 Completion Record

Completed on 2026-07-15 in the isolated `feat/character-presence` slice.

## IMP-018: Portable Adventurer Visual Identity

- [x] Added a portable visual profile with base art, optional battle/bust art,
  and bounded focal-point metadata.
- [x] Character creation previews token, profile, and battle framing before
  registration. Focus adjustment is available through the controller surface;
  only the operating-system file picker remains pointer/native UI.
- [x] Save data and portable-adventurer export embed and restore both image data
  and focus metadata. Legacy `portraitRef` values upgrade through the same resolver.
- [x] Scenario portraits and one-image imports remain valid fallbacks when no
  separate battle image exists.

## IMP-019: Contextual Character Presence In Play

- [x] The active combat actor owns a fixed portrait lane beside the command menu.
  It follows formation command order and does not add actor-card selection.
- [x] During round playback, the lane follows the acting or affected party member.
- [x] Dungeon event rooms show one selected adventurer beside the bounded message
  area. The six-member party strip and enemy field remain intact.
- [x] The lane reserves its footprint, so command positions do not move when the
  subject changes or disappears.

## IMP-020: GM-Aware Adventurer Framing

- [x] Event subjects are chosen deterministically from existing, able party members.
- [x] Provider input contains only bounded identity, condition, and recorded-deed
  fields. Notes and unrestricted character data are excluded.
- [x] Provider output must retain the rule-selected `subjectId`; unknown, omitted,
  or changed subjects are rejected.
- [x] Policy constraints forbid PC speech, decisions, feelings, and canonical state
  changes. Authored scenario text remains the visible fallback.
- [x] Normal play exposes no AI provider, model, or configuration terminology.

## Evidence

- Unit: `tests/characterVisualProfile.test.ts`, `tests/narrationSubject.test.ts`,
  `tests/aiPolicyGuard.test.ts`, `tests/narrationOperations.test.ts`
- Browser: `tests/e2e/character-presence.spec.ts`
- Review viewport: Chromium 1280x720; character authoring, combat command-order
  transition, and B3F event framing captured under Playwright test results.
- Build: `npm run build`

Headless was not used as acceptance evidence. It can prove deterministic route
reachability, but not crop quality, controller focus, visual hierarchy, or overlap.

Past trouble checked: character creation as data entry; tiny portrait-only HUD;
mouse-first actor selection; enemies receiving leftover space; command/log reflow;
AI controls exposed to players; narration speaking or deciding for player characters.

Remaining risk: expression-specific hurt and growth art is still progressive
enhancement. The shared base/battle fallback is deliberately restrained until a
scenario supplies authored variants.

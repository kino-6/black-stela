# Completed Tasks: Scenario Text Externalization and Japanese Line Layout

Archived: 2026-07-06

Lane V. Move remaining hardcoded player-facing strings into localization data
and gate Japanese copy by its displayed line layout.

## BS-189: Inventory Hardcoded Player-Facing Strings

- [x] Audited `src/`: UI chrome is already routed through `t()` (290 calls in
  `App.tsx`, no stray JSX literals); room prose and item/enemy names are already
  in scenario data (`locales.ja`); class/origin/trait copy is already
  data-driven in `characterCreation.ts` (`{ en, ja }`).
- [x] Identified the remaining hardcoded surface: the event/combat/town log text
  in `src/domain/replayLog.ts`, previously duplicated across an English switch
  and a parallel Japanese switch (~50 messages).
- [x] Noted an intentional non-target: the `["Vanguard", "前衛"]`-style tuples in
  `App.tsx` are default-title comparison sentinels for duplicate-title
  suppression, not displayed copy; left in place.

## BS-190: Localization Text Schema For Event Messages

- [x] Added an `events` namespace to `src/i18n/en.ts` and `src/i18n/ja.ts` with
  keyed, interpolated templates for every log projection (party, movement,
  combat, trap, item, shop, recovery, town, block/inspection messages).
- [x] Kept the existing interpolation convention (`{name}`, `{enemy}`, `{gold}`)
  so the translator fills runtime values; locale-specific side/direction come
  from existing `events.sideLeft/sideRight` and `direction.*` keys.

## BS-191: Move Visible Guild/Town/Dungeon Messages Into Localization Data

- [x] Rewrote `projectEventToLog` in `replayLog.ts` as a single switch that
  resolves `tags` + a dictionary key + interpolation values, removing the
  duplicated Japanese switch and five locale-specific helper functions.
- [x] Name localization (enemy/item/room) is now locale-aware and preserves the
  stored-log path (default locale, no world) exactly.
- Human expectation: log/combat/town messages read identically before and after;
  translators edit one dictionary, not domain code.
- Browser evidence: full Playwright suite (47) green, including `player-clear`
  and `town` specs that assert exact message strings.
- Headless caveat: unit/headless prove the text values; player-facing legibility
  is covered by the browser specs below.

## BS-192: Japanese Line-Layout Gate

- [x] Added `tests/e2e/lineLayout.ts`: `analyzeLineLayout` measures real rendered
  line boxes (per-character client rects clustered into visual lines) and reports
  one-character orphan tails and stranded line-start punctuation;
  `assertNoOrphanWrap` fails on either.
- [x] Added `docs/gates/japanese-line-layout-gate.md` and cross-linked it from the
  Japanese Dialogue Gate.
- [x] A self-check test proves the detector rejects a known orphan tail and a
  known stranded punctuation, so the gate cannot pass vacuously.
- Human expectation: no Japanese message box ships with a lonely one-character
  tail or punctuation at a line start.
- Red flags: orphan tail, kinsoku violation, machine-translated-looking break.

## BS-193: Capture Representative Japanese Message Boxes

- [x] `tests/e2e/japanese-line-layout.spec.ts` drives the normal Japanese route
  to the guild briefing, party-ready copy, room prose, event window, and combat
  message, asserts each with the gate, and writes screenshots to
  `test-results/ja-line-layout/`.
- Browser evidence: `01-guild-briefing.png`, `03-party-ready.png`,
  `04-room-copy.png`, `05-event-window.png`.
- Headless caveat: screenshots + rendered-line measurement are browser-only; the
  headless reachability probe proves none of this.

## Follow-Ups (not in Lane V scope)

- In-registration roster mini-cards can wrap member meta (`黒の手 / 先鋒 / 前衛`)
  into a narrow column during the per-adventurer flow (playtest `08`). This is a
  card-layout issue for a DRPG-UX lane, not a message box; tracked separately.

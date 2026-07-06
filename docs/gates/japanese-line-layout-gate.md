# Japanese Line-Layout Gate

Use this gate whenever player-facing Japanese copy in a message box changes, or
when a message box changes width, font, or padding. Japanese line breaks are
part of the writing: a technically correct sentence still fails if it wraps
badly in its target box.

This gate is the layout half of the [Japanese Dialogue Gate](japanese-dialogue-gate.md)
and the [Scenario Prose Gate](scenario-prose-gate.md). Those judge the words;
this one judges how the words wrap on screen.

## Blocking Checks

- [ ] No one-character orphan tail: a wrapped message never leaves a single
  character (or a single punctuation mark) alone on the final line.
- [ ] No stranded line-start punctuation: a wrapped line never begins with
  closing punctuation such as `、` `。` `」` `）` `！` `？` `・` `…` `ー`
  (line-start kinsoku).
- [ ] The break does not make the sentence look machine-translated (e.g. a
  particle split from its clause in a way that reads as careless).
- [ ] Interpolated content (names, item names, numbers) was considered: the
  longest realistic value was checked, not only the default.

When a box fails, fix it by rewriting or shortening the copy, adjusting the box
width/padding, or authoring a display-specific variant in localization data.
Do not ship the orphan.

## Automated Check

The gate is enforced in the browser, against real rendered line boxes — not a
string check. See:

- `tests/e2e/lineLayout.ts` — `analyzeLineLayout(locator)` measures per-character
  client rects, clusters them into visual lines, and reports `orphanTail` and
  `strandedPunctuation`. `assertNoOrphanWrap(locator, label)` fails the test on
  either.
- `tests/e2e/japanese-line-layout.spec.ts` — drives the normal Japanese route to
  representative message boxes (guild briefing, party-ready copy, room prose,
  event window, combat message), asserts each, and captures screenshots to
  `test-results/ja-line-layout/`. A second test proves the detector itself
  rejects a known orphan tail and a known stranded punctuation, so the gate can
  never pass vacuously.

Run it:

```sh
npx playwright test tests/e2e/japanese-line-layout.spec.ts
```

## Required Evidence

- [ ] The line-layout spec passes for the changed box, or a new box was added to
  its coverage.
- [ ] Screenshot of the actual wrapped box under `test-results/ja-line-layout/`.
- [ ] For layout-sensitive copy, a note on the longest interpolated value tested.

## What This Gate Does Not Prove

It measures wrapping at the test viewport. It is not a substitute for reading the
prose (dialogue/prose gates) and does not cover narrow mobile widths unless a box
is added at that viewport.

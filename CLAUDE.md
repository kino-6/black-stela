# Claude Code Entry Point

Before working in this repository, read `AGENTS.md`; it is the canonical product,
controller, gameplay, Japanese, Gate, and external-action rule set for both
agents. Do not weaken or duplicate those rules here.

For the current improvement backlog, read `Improve.md` and follow its
"Codex / Claude Code Allocation" section:

- Claude Code is the default primary for React/state/layout, controller focus,
  runtime asset wiring, renderer behavior, localization data flow, and E2E Gates.
- Codex is the default primary for art direction, image generation/retakes,
  asset contracts, pack placement, and independent browser-visible review.
- The primary implementer does not self-approve player-facing visual or
  controller completion.
- Work on one `IMP` slice at a time and leave a handoff containing changed files,
  tests, screenshots, and unresolved risk.
- Commit, push, merge, and other external actions require an explicit user
  request; completing an implementation task does not imply permission.

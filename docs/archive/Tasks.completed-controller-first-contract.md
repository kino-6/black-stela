# Completed Task: Controller-First UI Contract

## Scope

- BS-155 Controller-First UI Contract

## Completed Outcome

- Added the upper-rule expectation that normal play must be controller/keyboard
  first before mouse convenience.
- Recorded the same expectation in DRPG UX gate/skill and Past Trouble
  Regression Gate so future UI work is judged against it.

## Gate Notes

- Human expectation: normal play can be driven without mouse hunting.
- Red flag covered: a future UI can pass tests while still requiring scattered
  web-form interaction.

## Verification

- `git diff --check`

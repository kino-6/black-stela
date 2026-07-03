# ADR-001: Game Events and Persistence Boundaries

## Status

Accepted.

## Context

Black Stela needs deterministic game rules, replayable logs, save/load, localization, and optional AI narration. Directly mixing prose strings into state transitions made those concerns harder to test and localize.

## Decision

Rules emit typed `GameEvent` payloads. The canonical `GameState` still stores an `AdventureLogEntry[]`, but entries retain their source event so UI can re-project log text by locale.

Save/load is isolated behind repository interfaces:

- Browser development uses `LocalStorageSaveRepository`.
- Desktop packaging can use `TauriFileSaveRepository` through an injected file API.
- Save data is validated through versioned Zod schemas.

## Consequences

- Game rules stay language-independent.
- Logs can be localized without mutating saved state.
- Corrupt saves can be reported without crashing.
- Desktop persistence can be added without changing React UI state management.

## Rejected Alternatives

- Store only prose logs: simpler, but blocks localization and replay tooling.
- Let AI mutate `GameState`: flexible, but violates deterministic tabletop-style play.
- Hardcode browser `localStorage` everywhere: fast for MVP, but blocks Tauri-safe persistence.

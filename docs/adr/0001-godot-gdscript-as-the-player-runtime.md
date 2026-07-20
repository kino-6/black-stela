# ADR 0001 — Godot 4.7.1 / GDScript is the player runtime; TypeScript stays the oracle and toolchain

- **Status:** Accepted (2026-07-20)
- **Supersedes:** the S1–S5 spike plan's open engine question (`docs/design/godot-go-no-go.md` = GO)
- **Context doc:** `docs/design/godot-full-migration-plan.md` (M0–M7)

## Decision

Black Stela's **player runtime is Godot 4.7.1 with GDScript**. The TypeScript codebase remains as the
**rules oracle** and the **authoring / simulation / validation toolchain**. The React player UI is
retired from normal play but kept in the repository as the UX reference the migration is measured
against.

## Why

1. **Presentation cost.** The composition problems that dominated the React build — a first-person
   dungeon beside a fixed command dock, an enemy stage that owns the screen, controller focus that
   survives every transition — are structural in a scene graph and were recurring CSS/layout work in
   the DOM. This was the S5 Go/No-Go's decisive criterion.
2. **The rules did not have to be trusted twice.** Porting was made safe by making TypeScript the
   oracle: every command ships a golden trace (initial state + commands → per-step events + a canonical
   state hash) that the GDScript port must reproduce byte-for-byte. **All 50 domain commands are ported
   and 33 golden traces pass across both shipped worlds.** Drift is a test failure, not a discovery.
3. **Web export stays possible.** GDScript only, `gl_compatibility` renderer, no unofficial bindings.

## What this does NOT change

The following stay TypeScript and keep their value after cutover — they are tooling, not runtime:

- Content authoring + validation (`content/worlds/<id>/`, the scenario schema).
- The deterministic simulators (`descentSim` / `contentSim`) and balance reports.
- The golden-trace oracle (`src/domain` + `src/headless/traceFixture`) and the world-pack / save schemas.
- The Japanese copy (`src/i18n/ja.ts`) — the Godot build READS the same file via `npm run export:i18n`,
  so the two runtimes cannot drift apart in wording.

## Consequences

- **A rules change is a TWO-sided change**: the TS oracle first, then the GDScript port, with the trace
  updated in the same commit. `npm run gate:migration` is the arbiter.
- **A screen is not done because it renders.** `godot/gates/ux-parity-manifest.json` names, per migrated
  screen, the React panel it replaces and the i18n keys that panel renders; the gate asserts the Godot
  screen shows the same information in the same words AND that a comparison screenshot exists. This
  exists because a milestone was once declared done with bare button lists.
- **The React player UI is kept, not deleted.** It is the reference the UX-parity gate points at, and
  deleting it would remove the standard the port is held to. It is removed from the shipped app entry
  and marked archived.

## Alternatives considered

- **Babylon.js behind a TS adapter** — kept the rules in one language (cheaper, safer) but left the
  presentation cost, which was the actual problem. Rejected at S5.
- **C# in Godot** — would have shared more with the TS mental model but drops the Web export. Rejected.
- **Stay on React** — rejected on the recurring presentation cost the playtests kept surfacing.

## Status of the cutover (M7)

- Content parity on **both** worlds (default + verdant), rules and screens: **done**.
- Export **presets** committed (`godot/export_presets.cfg`, Web + macOS). Producing a build requires
  Godot's export templates for 4.7.1, which are a separate download and are **not installed in the
  development environment used for this migration** — the packaging pass is therefore **unverified**
  and is the one M7 item still open.

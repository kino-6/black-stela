# ADR 0001 — Godot 4.7.1 / GDScript is the player runtime; TypeScript stays the oracle and toolchain

- **Status:** Accepted (2026-07-20)
- **Supersedes:** the S1–S5 spike plan's open engine question (`docs/archive/godot-go-no-go.decided.md` = GO)
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
- **Packaging: done and verified.** `npm run package` produces both a Web build (`build/web/`,
  gl_compatibility, ~42 MB pck) and a macOS app (`build/macos/BlackStela.zip`), and the packaged macOS
  binary boots with no missing-data errors. Export templates for 4.7.1 are a separate download
  (`Godot_v4.7.1-stable_export_templates.tpz`, ~1.3 GB) extracted into
  `~/Library/Application Support/Godot/export_templates/4.7.1.stable/`.
- Three things the packaging pass exposed that no headless test could: `data/*.json` and the staged art
  are read with FileAccess / Image.load_from_file rather than as Godot resources, so they had to be
  named in `include_filter` or the build would ship with no worlds and no art; the parity fixtures and
  sample data were being shipped to players and are now excluded; an arm64 macOS export refuses to
  build unless `textures/vram_compression/import_etc2_astc` is enabled; and the app still called itself
  "(Godot vertical slice)".

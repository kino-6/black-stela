# IMP-023 — Deterministic content & economy simulation Gate

Externalized jobs, affixes, enemies, and economy need one deterministic check before browser play so
new scenarios (and AI-assisted data proposals) enter play in a bounded range instead of shipping dead
affixes, compulsory careers, loot floods, or enemies with a single answer.

## Owner split (per AGENTS.md / the two-agent rule)

- **Claude (delivered here):** the DETERMINISTIC STATIC content Gate — loader-level rejections that
  run inside `validateScenarioGraph`, so a bad pack fails to load rather than reaching playtest.
- **Codex (IMP-023A/B/C, NOT done here):** the seeded ECONOMY SIMULATOR over the production loaders/
  rules (progression/drop/appraisal/economy report), and the AI-assisted authoring loop where AI
  proposes external data and the simulator accepts/rejects it. These are art/content/simulation
  ownership and must not be built by the code agent.
- **Claude (IMP-023V):** parity verifier — reproduce selected simulator seeds in browser before the
  Gate can block releases (pending the Codex simulator).

## Static Gate checks (Claude — in `validateScenarioGraph`)

- **Vocation unlock cycles** — a `requires.mastered` graph with a cycle is rejected (an "advanced"
  job could gate itself and be unreachable). ✓ (IMP-021A)
- **Vocation prerequisites resolve** — every `requires.mastered` id is a built-in class or an
  authored vocation. ✓ (IMP-021A)
- **Dead affixes** — an affix that can never roll because no equipment carries a slot it rolls on is
  rejected. ✓ (IMP-023, this slice)

Locked by `tests/contentGate.test.ts` (each rejection + the shipped default world passing clean).

## Deferred to the Codex simulator (IMP-023A/B thresholds)

- Enemy counter coverage (every dangerous enemy has ≥2 supported approaches, no mandatory key),
  vocation unlock TIMING and mastery-farming decay, drop/appraisal/conversion income cadence, and
  outlier seeds. These need the seeded run over production rules and versioned, scenario-overridable
  thresholds — the simulator's job, not a static loader check.

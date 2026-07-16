# IMP-023 — Deterministic content & economy simulation Gate

Externalized jobs, affixes, enemies, and economy need one deterministic check before browser play so
new scenarios (and AI-assisted data proposals) enter play in a bounded range instead of shipping dead
affixes, compulsory careers, loot floods, or enemies with a single answer.

## What is delivered

- **Static content Gate** (`validateScenarioGraph`): loader-level deterministic rejections so a bad
  pack fails to LOAD, before playtest. See "Static Gate checks" below.
- **Seeded content/economy SIMULATOR** (`src/headless/contentSim.ts` `simulateContent`, IMP-023A/B):
  runs the PRODUCTION drop/economy/mastery rules over a world + seed and reports the rarity split,
  per-affix usage (unused = candidate dead content), sell/dismantle income, mastery timing, and
  in/out-of-band findings against versioned thresholds. It also reports basic-vocation route
  coverage, compulsory prerequisites, weak-floor mastery decay, estimated unlock fights, and
  dangerous enemies with fewer than two affix-supported strategies. Identical seed ⇒ identical
  report. Locked by `tests/contentSim.test.ts`.
- **Acceptance harness** (`reviewAffixProposal` / `reviewVocationProposal`, IMP-023C): merges a
  PROPOSED affix/vocation into a candidate world and runs the same validator + simulator a release
  would, returning accept/reject with reasons. The proposer (AI/Codex) and the final "does it feel
  good" browser review sit outside this deterministic core.

## Owner note (AGENTS.md two-agent rule)

The deterministic tooling above is Claude's (code/gates). The AUTHORED content it checks —
enriched vocation graphs and affix pools (IMP-021B / IMP-022B) and the live AI proposer wired to a
provider — is Codex's ownership; 黒碑 ships a working set that Codex enriches. Claude remains the
IMP-023V parity verifier (reproduce selected seeds in browser) for any Codex simulator additions.

## Static Gate checks (Claude — in `validateScenarioGraph`)

- **Vocation unlock cycles** — a `requires.mastered` graph with a cycle is rejected (an "advanced"
  job could gate itself and be unreachable). ✓ (IMP-021A)
- **Vocation prerequisites resolve** — every `requires.mastered` id is a built-in class or an
  authored vocation. ✓ (IMP-021A)
- **Dead affixes** — an affix that can never roll because no equipment carries a slot it rolls on is
  rejected. ✓ (IMP-023, this slice)

Locked by `tests/contentGate.test.ts` (each rejection + the shipped default world passing clean).

## Delivered Codex simulator checks

- Enemy counter coverage (every dangerous enemy has ≥2 supported approaches, no mandatory key),
  vocation prerequisite coverage and unlock timing, mastery-farming decay, affix roll coverage,
  rarity bands, and sell/dismantle income are reported from production rules.

Still pending under `IMP-021V`/`IMP-022V`: player-facing vocation decision
quality, appraisal cost, conversion confirmation/filtering, a material sink,
equipment comparison, and Claude's selected-seed browser parity review.

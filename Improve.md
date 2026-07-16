# Black Stela Active Improvement Backlog

Last browser acceptance: 2026-07-15, Chromium, 1280x720.

## Active Status

`IMP-001` through `IMP-020` are archived. `IMP-021`/`IMP-022`/`IMP-023` are in
progress: the Claude-owned contracts and player routes are shipped, and the
deterministic tooling is landing; the remaining content authoring is enrichment.

| Item | Priority | State | Player-visible problem |
| --- | --- | --- | --- |
| `IMP-021` | High | Shipped (A,C); B enriched | Class choice ends at the current class instead of becoming an adventurer's accumulated career. |
| `IMP-022` | High | Shipped (A,C,D); B enriched | Rare drops lack an identification, comparison, retention, and bulk-conversion loop that makes repeated expeditions rewarding. |
| `IMP-023` | High | Static Gate + seeded simulator shipped | Externalized jobs, affixes, enemies, and economy data have no deterministic simulation Gate against dominant builds, dead effects, or inflation. |

Archived work:

- `IMP-001` to `IMP-008`:
  [docs/archive/Improve.completed-browser-slices-2026-07-14.md](docs/archive/Improve.completed-browser-slices-2026-07-14.md)
- `IMP-009` to `IMP-011`:
  [docs/archive/Improve.completed-imp-009-011-2026-07-14.md](docs/archive/Improve.completed-imp-009-011-2026-07-14.md)
- `IMP-012`:
  [docs/archive/Improve.completed-imp-012-2026-07-14.md](docs/archive/Improve.completed-imp-012-2026-07-14.md)
- `IMP-015` to `IMP-016`:
  [docs/archive/Improve.completed-imp-015-016-2026-07-14.md](docs/archive/Improve.completed-imp-015-016-2026-07-14.md)
- `IMP-017`:
  [docs/archive/Improve.completed-imp-017-2026-07-14.md](docs/archive/Improve.completed-imp-017-2026-07-14.md)
- `IMP-018` to `IMP-020`:
  [docs/archive/Improve.completed-imp-018-020-2026-07-15.md](docs/archive/Improve.completed-imp-018-020-2026-07-15.md)

## IMP-013: Separate Party Completion From Roster Administration

At 6/6, show the completed 3+3 formation and departure choice as one stable
screen. Reserve, retired, portable-vault, and repeated Bench controls belong in
the party/roster service and must not peek below the 720p completion frame.

## IMP-014: Recompose Recovery as a Town Command Window

Keep wounds, before/after HP, individual cost, total cost, affordability, and
confirm/cancel, but remove the large empty field and oversized web-form submit.
The selected treatment and result should read as one compact service exchange.

## IMP-021: Career Mastery and Advanced Vocations

**Category:** Character growth / party building

**Evidence:** Approved product direction on 2026-07-16. Use the structural
lesson of Dragon Quest VI/VII-style vocation mastery without copying names,
skills, prose, or proprietary data.

**Player outcome:** An adventurer's build is the history of vocations they have
mastered. Character level persists, vocation mastery advances separately,
mastered techniques remain learned, and authored prerequisite combinations
unlock stronger advanced vocations.

### Sub-IMP ownership and order

- [x] `IMP-021A` — **Claude Code / contract owner:** define external vocation
  data, character/save schema, mastery gain, unlock prerequisites, retained
  techniques, migration, and content validation. This lands before other
  `IMP-021` work edits shared domain types.
- [ ] `IMP-021B` — **Codex / content and simulation owner:** author an original
  basic-to-advanced vocation graph and seeded progression fixtures after
  `IMP-021A` freezes the contract. Check intended unlock floors and low-floor
  mastery-farming decay without changing the runtime contract in parallel.
- [x] `IMP-021C` — **Claude Code / player-route owner:** add controller-first
  town career review, vocation change, prerequisite preview, learned-technique
  review, and a bounded combat technique loadout. Do not turn the service into
  a skill-tree web form or expose raw ids and formulas.
- [ ] `IMP-021V` — **Codex / independent verifier:** run browser normal-route
  acceptance at 1920x1080 and the 1280x720 minimum Gate, then compare the
  progression report with actual town and combat behavior.

### Acceptance

- [ ] Advanced vocations are intentional progression destinations; basic jobs
  need not be artificial end-game sidegrades, but every unlock route is visible
  before the player commits.
- [ ] Changing vocation does not reset character level or erase mastered
  techniques. The current vocation still owns stat modifiers, equipment
  permissions, and its signature feature.
- [ ] Learned techniques remain part of the character record while a bounded,
  reorderable combat loadout prevents an unmanageable command list.
- [ ] Weak early-floor encounters cannot remain the optimal mastery strategy,
  and the simulation report identifies any one compulsory route.
- [ ] Save migration preserves existing adventurers. Japanese labels and
  descriptions come from localization/scenario data and pass line-layout review.

**Browser route:** town -> guild/roster career service -> vocation preview ->
confirm/cancel -> dungeon combat -> retained technique.

**Past trouble most likely to recur:** character growth becoming data entry;
mouse-first forms; raw implementation terms; commands below the 720p frame;
headless progression being mistaken for player-visible proof.

## IMP-022: Rare Equipment, Appraisal, and Bulk Asset Conversion

**Category:** Expedition rewards / equipment economy

**Evidence:** Approved product direction on 2026-07-16. Common drops should not
create appraisal chores; rare finds should create a short, meaningful keep,
equip, sell, or dismantle decision.

**Player outcome:** Repeated expeditions can produce exciting rare variants,
while routine loot is cleared in one safe controller operation and converted
into a small, useful set of assets.

### Sub-IMP ownership and order

- [x] `IMP-022A` — **Claude Code / contract owner:** define external affix pools,
  rarity/slot rules, seeded rolling, item-instance identity, save migration,
  appraisal state, favorite/lock state, and sale/dismantle yields.
- [ ] `IMP-022B` — **Codex / content owner:** author original affix pools by
  equipment category, floor tier, and enemy family. Every effect family must
  have recurring authored encounters where it matters, with at least two viable
  answers to each dangerous enemy rather than a mandatory key item.
- [x] `IMP-022C` — **Claude Code / player-route owner:** implement controller-first
  appraisal, equipment comparison, lock/favorite, and previewed bulk conversion.
  Equipped, locked, favorite, and unidentified rare items are protected by
  default; Common items are identified automatically.
- [x] `IMP-022D` — **Claude Code / player-route owner:** add an enemy record that
  accumulates observed behavior, coarse condition, resistances, affix-relevant
  counters, and known rare-drop sources. It must not expose exact HP or raw
  internal coefficients without an authored identification ability.
- [ ] `IMP-022V` — **Codex / independent verifier:** verify reward presentation,
  Japanese item naming, enemy-record disclosure, comparison clarity, protection
  rules, one-screen town handling, and the resulting economy report without
  changing `IMP-022A` types.

### Acceptance

- [ ] Common items are known on acquisition. Rare-or-higher items can conceal
  authored random affixes, while their category and equip eligibility remain
  readable before appraisal.
- [ ] Previously catalogued base items do not repeatedly demand busywork;
  appraisal reveals only genuinely unknown rare properties, curses, or history.
- [ ] Bulk sell/dismantle is filterable, reversible before confirmation, and
  shows exact totals. It never consumes equipped, locked, favorite, or protected
  unidentified items.
- [ ] Currency/material count stays deliberately small. Appraisal and conversion
  values do not create a buy-dismantle, appraisal-resale, or reroll-profit loop.
- [ ] Affixes support identifiable enemy problems such as armor, regeneration,
  evasion, status pressure, groups, and species without making one effect a
  progression lock.
- [ ] The enemy record tells players where a discovered rare can be pursued and
  which observed defenses matter, while undiscovered information remains hidden.

**Browser route:** expedition result -> inventory review -> rare appraisal ->
comparison/equip -> enemy record -> filtered bulk conversion -> confirm/cancel.

**Past trouble most likely to recur:** shop/inventory as a generic web list;
controller focus drift; unexplained colors or English affix fragments; command
movement after messages; destructive bulk actions without a truthful preview.

## IMP-023: Deterministic Content and Economy Simulation Gate

**Category:** External content tooling / balance evidence

**Evidence:** Jobs, items, encounters, and enemies are externalized, but the
project currently lacks one report that tests their combined progression and
economy before browser play.

**Player outcome:** New scenarios and AI-assisted data proposals enter play in
a bounded balance range instead of producing dead affixes, compulsory careers,
loot floods, or enemies with only one answer.

### Sub-IMP ownership and order

- [ ] `IMP-023A` — **Codex / owner:** after `IMP-021A` and `IMP-022A` freeze their
  contracts, build a seeded simulator that uses production loaders and rules;
  do not duplicate a second set of combat, mastery, or loot formulas.
- [ ] `IMP-023B` — **Codex / owner:** report vocation unlock timing, mastery gain,
  party-route performance, drop/appraisal/conversion income, equipment-update
  cadence, affix use, enemy-counter coverage, defeat rate, and outlier seeds.
- [ ] `IMP-023C` — **Codex / owner:** add a documented AI-assisted authoring loop
  in which AI proposes external data, the deterministic simulator rejects or
  reports it, and a human/browser review accepts player-facing feel. AI never
  mutates runtime `GameState` or silently tunes production data.
- [ ] `IMP-023V` — **Claude Code / independent verifier:** review simulator parity
  against production rules and reproduce selected seeds in browser play before
  the Gate can block releases.

### Acceptance

- [ ] Identical seed, content pack, party, and rules produce an identical report.
- [ ] Scenario validation rejects affixes with no eligible item or authored use,
  vocation unlock cycles, unreachable advanced jobs, and enemy counter sets with
  fewer than two supported approaches.
- [ ] Thresholds are versioned and scenario-overridable rather than hidden in an
  AI prompt. Reports retain the failing seed and enough inputs to reproduce it.
- [ ] Simulation is balance evidence only. Browser play remains required for
  reward excitement, controller handling, Japanese layout, and transition rhythm.

**Verification route:** seeded simulation -> selected-seed browser reproduction
-> expedition reward and career-service review.

**Past trouble most likely to recur:** headless success being called UX proof;
AI acting as hidden game authority; duplicated rule implementations drifting;
tests passing without reproducing the player-visible state.

## Review Baseline

- Use 1920x1080 as the primary desktop presentation target.
- Keep 1280x720 as the minimum no-overlap, no-scroll controller Gate.
- Verify through normal browser play. Debug routes are diagnostic and headless
  proves engine reachability only.
- A passing route is not visual acceptance. Review enemy readability, Japanese
  layout, focus truth, transition rhythm, and screenshots.
- Give one implementer ownership of a player-facing slice and use an independent
  browser verifier before acceptance.

## Next Improvement Rule

Add a new numbered item only for a concrete reproduced defect or an explicitly
approved product capability. Record category, evidence, expected player-visible
outcome, owner boundary, acceptance checks, browser route, and the past-trouble
regression most likely to recur. Capability proposals remain `Proposed` until
their contract and implementation order are approved; they are not evidence of
shipped behavior. Do not reopen an archived item merely because a later defect
appears on the same screen.

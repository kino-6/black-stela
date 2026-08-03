# Codex art request — 10F extension (true-clear layer), both worlds (2026-08-03)

Both scenarios go from 8 floors to **10** (user 2026-08-03). Structure: 3-floor atmosphere
bands B1–3 / B4–6 / B7–9 (three acts) + **B10 = 真層 (the true-clear layer)**. The existing
finale boss moves to **B9/G9 = scenario-clear boss** (reuses its current art), and **B10/G10 =
完全クリアの真ボス (a NEW true/super boss)**. Balance extends continuously from the current
8F curve — see `docs/design/dungeon-areas.md` (being updated to 10F).

Claude authors the enemy DATA (stats/abilities/ids) + wires the floors; **Codex delivers the
art**. Deliver to `content/worlds/<world>/assets/dungeon/` (enemy sprites) and
`content/worlds/<world>/assets/ui/` (backdrops/palette refs), then `npm run export:godot`.

## 1. True-boss sprites (base + hurt) — REQUIRED for B10 / G10

Same silhouette/grounding contract as the T14 roster (base + a `-hurt` variant, transparent
PNG, the engine grounds + sizes it — see `.claude/skills/combat-ui-drpg`). Two bosses:

- **Default `enemy.b10.<id>` (真層の主 / the true final of 黒碑)** — a superboss escalation of
  the Ash Votary / Black Stela: a towering ash-and-obsidian idol, more monumental and broken than
  the B9 votary. `enemy-b10-<id>.png` + `enemy-b10-<id>-hurt.png`. Size class: huge.
- **Verdant `enemy.verdant.g10.<id>` (真の樹心 / the true heart)** — a superboss escalation of the
  Rootheart: the living heartwood core laid bare, larger and more radiant-decayed than the G9
  rootheart. `enemy-verdant-g10-<id>.png` + `-hurt.png`. Size class: huge.

(Exact ids/names finalised in `enemies.md` as Claude authors the data; Codex can name them — the
filename must match the enemy id's short form, e.g. `enemy-verdant-g10-worldheart.png`.)

## 2. 真層 atmosphere — OPTIONAL now, nice later

B10/G10 are their own atmosphere band. **Interim: the floors reuse the deepest existing texture
band (Default block3 / Verdant block3) so they ship intact.** A dedicated 真層 look is a later
polish:

- Default B10: the stela's inmost vault — black obsidian shot with cold ash-light, more sacral/
  final than B7–B9's gate. Wall/floor textures (a `block4` band) + optional combat backdrop.
- Verdant G10: the heartwood's true core — pale living wood and sap-light, luminous but decayed.
  Wall/floor `block4` band + optional backdrop.
- If delivered, drop into the world's `assets/dungeon/` texture band + `world.md` palette for the
  B10/G10 floor id; the still-coverage / palette wiring picks it up. Not blocking.

## 3. NOT needed (reuse)

- B9/G9 scenario bosses reuse the current finale sprites (ash-votary, rootheart) — no new art.
- B7–B9 keep the Act III (block3) look. B4–B6 / B1–B3 unchanged.

**Priority:** the two true-boss sprites (§1) are on the critical path (B10/G10 render invisible
without them); the 真層 textures (§2) are optional polish. Tracked in Tasks.md T31.

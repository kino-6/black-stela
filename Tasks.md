# Tasks — active playtest backlog

## Conventions (READ FIRST)

- **Status markers:** `[ ]` = not started · `[-]` = in progress · `[x]` = done (awaiting move to Archive).
- **Every task NAMES its Gate** — a headless gate/test proven to fail on the pre-fix code where one fits,
  else the explicit manual/visual check. A task is not `[x]` until its gate is green **and** it is committed.
- **Done → Archive, groom on EVERY status change (user rule 2026-08-05).** When you touch a task's status,
  in the SAME edit move any freshly-`[x]` item out to `docs/archive/Tasks.completed-2026-08.md` (leave a
  one-line pointer), collapse verbose done blocks, delete dead notes — this file holds only open work.
- **One at a time.** Process the active queue top-down; finish (verify + gate + commit) before the next.
- **Verify it YOURSELF before asking the user (user rule 2026-08-11, "あまりに無責任").** (1) Can I verify this
  myself? render the real screen to PNG and READ it / run the gate / probe the value — do it. (2) Did I give a
  ONE-SHOT way to see it in the real game? Add a `debug_fixtures.gd` fixture / boot flag, never "open this PNG".
- **Build / verify:** `npm run export:godot && npm run play`. Truth gate `npm run gate:final` (e2e); unit
  `npm run test`; Godot gates `npm run gate:migration` / `gate:godot`; runtime-error gate `gate:godot-runtime`.
- **Codex delivery flow:** Codex leaves finished work UNCOMMITTED; 検品 (named gate + read the PNG) + commit is Claude's job.
- **Lanes:** Codex owns art / assets / **visual sign-off** (primary implementer does NOT self-approve visual
  completion). Claude owns rules / data / renderer wiring / parity / gates.

Archived history: `docs/archive/Tasks.completed-2026-08.md` (T/P/U/V/Y/D/X + W0/W1/W4 + 玄室/W2/W5 verification),
`docs/archive/Tasks.completed-2026-07.md`, IMP records in `Improve.md`.

**Recently shipped:** Y/D playtest + Codex D-series 検品 + Claude 実機playtest batch (`a9a8dad`) · Tasks groom +
dungeon-dock ux-parity fix (`88cb96c`) · **玄室/W2/W4/W5 実装確認・全ゲート緑** (2026-08-12, archive) — `export:godot`
全通・`gate:migration` 90 PASS・`gate:final` e2e 緑.

---

## Active queue (process top-down)

**（空）** — Claude レーンの実装・検証は全て完了、全ゲート緑、commit 済み。玄室/W2/W4/W5 は実装済み＋ゲート緑＋実機PNG
提示済みで、残るのは user/Codex の**最終審美サインオフ**（人の目視。NG なら該当項目を再オープン）。下は未承認の将来アイデア（active work ではない）。

## 将来アイデア（未承認・parked — 着手には user の設計承認が必要）

- **W3a 弾薬/戦略の後継案（廃案「共有弾薬＋警戒度」の置換, user 2026-08-05）:**
  (a) **特殊弾頭＝戦略消耗品**（貫通/焼夷/閃光 等、既存 damage/status/debuff effect で解決、通常攻撃は弾不要 — 完全に
  Claude レーンで完結、承認あれば即着手可）· (b) **警戒度＝世界樹風エンカウント率カラー表示**（一部 Codex アート依存）。
  どちらを採るか（or 見送るか）は設計判断。
- **将来世界プログラム W-series（terminal-line 封鎖線）:** F1–F10 実装・アセット投入・全ゲート緑（archive）。次段は
  Codex の実機見え方レビュー＋（承認後）W3a、その先に W5 独立レビュー。設計/契約: `docs/design/ballistic-world-program.md`。

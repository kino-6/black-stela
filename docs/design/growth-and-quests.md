# Growth means & quests — deferred slice

The user wants several ways to grow that the XP falloff does NOT punish, because they are the
player's effort/cleverness, not mindless repetition (2026-07-14/15):

> 単純なステータス向上、経験値取得アイテム、繰り返し可能な討伐、納品クエストなどで消化。
> はぐれメタル的な存在もいい。
> クエスト系は外部ファイル化、実装と別 Slice で。

## Already done (balance slices 1–4)

- **The rare "prized" runner** (metal-slime) — `enemy.prizedXp: true`. Its XP bypasses the
  out-levelling falloff. One per world: 灰銀の残光 (star-weak) / 黄金の胞子雲 (metal-weak).
- **The bypass rule itself** — `leveling.rewardXpFor` applies the falloff only to ordinary combat
  XP; a `prizedXp` enemy, and any *direct* XP grant, pay full by construction.

## Q1 — growth items: DONE (2026-07-15, `c72b9c6`)

- Item `kind: "growth"` + a `grants` map (aptitudes / maxHp / maxMp / attack / xp), authored in
  `content/worlds/*/items.md`. On use OUTSIDE combat, `rulesEngine.useGrowthItem` raises the target
  permanently; `grants.xp` is applied directly (bypasses the falloff by construction).
- Content: 黒碑 ashroot-tonic / whetstone-rite / emberwit-ash (buyable) + deed-of-passage (found);
  翠碑 heartsap-tonic (buyable) + rootgrowth-seed (found). Locked by `tests/growthItems.test.ts`.

## Q2 — the quest board: STILL TO BUILD (its own slice — externalize, don't hardcode)

Everything below is **content in `content/worlds/<id>/`**, driven by data, per the project's
externalization boundary (dungeon/enemy/gear/items = data; formulas = code).

1. **Stat-up items** — a consumable that permanently raises one aptitude/stat. Schema: an item
   `kind: "growth"` with a `grants: { might?: n, maxHp?: n, ... }`. Applied on use, outside combat.
2. **XP items** — a consumable granting XP directly. Because the falloff lives only in the combat
   path, a direct grant bypasses it automatically — this is the mechanical reason the user's
   "成長アイテムでの稼ぎはOK" already holds.
3. **Repeatable bounties** — a named target (often a `prizedXp` enemy) with a standing reward for
   each kill. Needs a lightweight quest record on `GameState` and a town board to claim from.
4. **Delivery / collection quests** — bring N of an item (or a specific drop) to a town NPC for a
   reward (gold / XP item / gear). Same quest record + board.

Items 1–2 are small (item schema + a use-effect) and could ride a balance slice. Items 3–4 are a
**quest system** — a new `quests` data file per world, a `GameState.quests` progress record, a
town quest board UI, and completion/turn-in commands. That is a feature in its own right; do not
smuggle it into the balance work.

## Ordering

Balance slice 5 (auto-tune enemy stats so `preparationValue().levelsSaved ≈ 10`) comes first — it
finishes the difficulty design the falloff and counterplay were built for. The quest/growth slice
follows, on top of a settled curve.

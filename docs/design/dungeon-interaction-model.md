# Dungeon interaction & presentation model — redesign (#39g)

Status: **COMPLETE on the Claude-Code side (2026-08-14).** Shipped: **Slice 1** (`3ca9786`)
confirm-before-return + generic 帰還 label + A1 facing-aware 決定; **Slice 2** (`493ee2e`) minimap
door/lock truth + faced-gate inspect; **diegetic clue** (`c30e1a5`); **Slice 3** (`b3a4d8d`) the centred
Wizardry message surface (§3.4) replacing the top-right clue line; **3D sealed-shutter barrier**
(`023fcf0`, §3.5); **full-map lock bar** (`ea5a099`); **discovery-vs-ambient presentation** (`c2a3cd9`,
§3.4). Also fixed the raised-chamber ceiling void (`47275a1`). Remaining is art only: the flat phone
texture (Codex). Forks resolved by the user:
**FORK A → A1 (facing decides)** · **FORK B → generic 「町へ戻る」 default + optional `returnKind` override**
· **presentation → the centred surface REPLACES the top-right hint panel** (ambient flavor stays the
bottom one-liner). Written after the 2026-08-14 `play:late`
playtest surfaced a cluster of dungeon-interaction UX defects that reactive patching won't fix.
This doc defines the model to build against. Balance/content numbers are out of scope.

## 1. The problem (what the playtest hit)

All five are symptoms of ONE gap: the crawl has **no interaction model** — just a rigid
"what does 決定 do on this cell" ladder that ignores what you're facing, no confirmation on
transitions, no object/feature interaction, and a map that hides doors.

| # | Symptom (playtest) | Root cause (code) |
|---|---|---|
| a | 扉を調べようとして非常電話（帰還）に吸われる | `_context_command()` (dungeon.gd:544-552) picks 決定 by cell precedence **stairs→return→disarm→search, ignoring facing**. The 非常電話 room is `stairsToTown:true`, so 決定=帰還 shadows the faced door. Doors are **not a 決定 target at all** — you traverse them by walking in (`_move_forward` auto-opens). Standalone `open_door` verb is unbound. |
| b | 非常電話が確認なしで即・町へ戻る | `return_to_town` fires on one 決定, changes scene immediately. **No confirm.** (`dungeon.gd:736-739`) |
| c | ラベルが「階段で町へ戻る」なのに階段でない | Label hardcoded: `stairsToTown` → `play.useReturnStairs` = "階段で町へ戻る" regardless of the point being a phone. (`dungeon.gd:561-564`) |
| d | 重要情報が右上パネルに埋もれる／全知的で雑 | Only a one-line bottom log + a non-interactive command panel. **No centred (Wiz-style) message modal.** Clues are authored omnisciently ("信号を通すと…"). |
| e | 北が開いて見えるのに「固く閉ざされている」 | Minimap draws a **door identical to open floor**, and **locked gates are invisible** (`minimap.gd:_is_passage` treats `door` as passage, never reads room `gates[]`). 3D shows no barrier on a gated edge. |

Also: **stairs and doors use OPPOSITE interaction models** — a stair is a 決定 action (walking into it is
refused: "階段は使うコマンドで"), a door is walk-into-to-open. Inconsistent mental model.

## 2. Principles (Wizardry / Etrian lineage)

1. **The player always knows what 決定 does here, and can reach every interactable deliberately.** No
   silent wrong action, no un-addressable object.
2. **Consequential transitions confirm.** Leaving the dungeon or changing floor is a decision, not a twitch.
3. **Presentation matches weight.** A consequential/important beat gets a prominent (centred) message the
   player must acknowledge; ambient atmosphere stays a quiet one-liner. Everything **diegetic** — only what
   the party can perceive, never omniscient meta ("a signal opens a shutter" the characters don't know).
4. **The map tells the truth.** A door reads as a door; a locked/gated edge reads as blocked — on the
   minimap and in 3D — so "looks open but isn't" never happens.

## 3. The model

### 3.1 Decide-action resolution (the crux) — `_context_command` becomes facing-aware + confirmed

Replace the flat ladder with: **address the FACED edge first, then the cell, and confirm transitions.**

Proposed 決定 resolution (first match):
1. **Faced edge is a door/gate/shortcut** → 決定 = **「調べる」on that edge**: if openable, open it; if
   locked/gated, report the requirement diegetically ("鉄扉。押しても動かない — 錠が下りている" / a clue if
   the party has grounds to guess). This gives doors a real 決定 affordance and stops a cell feature from
   shadowing them. (Walking into an open door still steps through, unchanged.)
2. **On a stair** → 決定 = 「階段を使う」 → **confirm** (下る／上る／やめる).
3. **On a return point** (stairsToTown/restPoint) → 決定 = 「町へ戻る」 → **confirm** (戻る／やめる),
   label per point type (§3.3).
4. **Trap present** → 決定 = 「解除」.
5. **Else** → 決定 = 「調べる」 (search: secret edge → gather → nothing).

> **FORK A (needs your call):** when a cell has BOTH a faced door AND a return point (the 非常電話 case),
> option (1) makes 決定 address the door and the return needs its own route. Two ways:
> - **A1 — facing decides:** face the door → 決定 opens/among; face away (into the room) → 決定 = 帰還(確認).
>   Natural, no extra UI. (Recommended.)
> - **A2 — a small "何をする？" picker** when >1 interactable coexists (調べる／扉／町へ戻る). Explicit but
>   one extra step every time. Heavier.

### 3.2 Confirmation on transitions

`return_to_town` and `use_stairs` route through a **centred Yes/No confirm modal** (§3.4) before applying.
Fixes symptom (b) and makes the 非常電話 collision a dismissable prompt, not a silent exit.

### 3.3 Per-point return label (symptom c)

Derive the 帰還 label from the point, not a hardcoded 階段. Cleanest: a room field
`returnKind: phone | stairs | marker` (optional; default inferred), mapping to
「非常電話で通報して戻る」/「階段で町へ戻る」/「退避点から戻る」.
> **FORK B:** author `returnKind` per return room (precise) **vs** just use a generic 「町へ戻る」 everywhere
> (zero authoring, never wrong). Recommend the generic default + optional `returnKind` override.

### 3.4 Presentation — add a centred message surface (symptoms d, #39e)

Add one **centred Wizardry-style message box** used for beats that deserve acknowledgement:
transition confirms, a locked-door discovery, a key/shortcut opening, a room/boss reveal, a chest result
(already modal). Ambient flavor (random dungeon events, "何も見つからない") stays the quiet bottom one-liner.
Rule of thumb: **does the player need to decide or notice? → centred. Atmosphere only? → bottom log.**
All copy **diegetic** — rewrite existing clue lines (e.g. the #15 signal/shutter) to what the party
perceives ("この先の退避シャッターは下りたまま。どこかで解除しないと開かない").

### 3.5 Map legibility (symptom e)

- **Minimap:** draw a **door** as a distinct mark (a gap with a door tick, not blank open), and a
  **locked/gated edge** as a blocked/○-locked line — read room `gates[]`, not just edge `kind`.
- **3D:** render a visible **barrier/closed-door mesh** on a locked or gated edge so an impassable way never
  looks like an open corridor.

## 4. Where each change lands (build map)

- Decide resolver: `godot/scripts/dungeon.gd:_context_command` (544-552) + `_context_label` (555-568) +
  `_on_command` (716-746) — add a faced-edge branch + confirm routing.
- Faced-edge inspect (locked/gated report): new rules path near `exploration_commands._move_forward`
  gate check (204-229) / `_is_gate_open` (863-886); emit a diegetic `room_event_triggered`-style message.
- Confirm modal + centred message surface: new in `dungeon.gd` (model on the existing chest overlay
  `_show_chest_overlay` 864-887 / `_show_chest_result` 901-930).
- Return label: `dungeon._context_label` case "return" (561-564) + i18n; optional room `returnKind`
  (scenario schema).
- Minimap doors/locks: `godot/scripts/minimap.gd:_draw_walls` (126-139) + `_is_passage` (152-155) — read
  gates; new door/lock draw.
- 3D barrier on locked edge: the dungeon renderer (`DungeonRenderer.build`) wall/edge pass.

## 5. Verification (playtest-grade, not just headless)

Add checks that FAIL on today's defects (controller-first-ui discipline):
- **Confirm exists:** driving 決定 on a return/stair cell shows a confirm and does NOT change scene until
  confirmed (a gate on the town-transition).
- **Label correct:** a phone return point never renders "階段で".
- **Minimap truth:** a gated-shut edge does NOT draw as open passage; a door draws distinctly.
- **Faced-door affordance:** 決定 while facing a locked edge reports the lock (not a silent block / not a
  shadowing return).
- Real-screen PNG of the centred message + confirm modal.

## 6. Out of scope here
Flat emergency-phone wall art (Codex/art handoff). Font sizing (#36-d). Balance of gather/encounters.

---
**Review asks:** FORK A (A1 facing-decides vs A2 picker), FORK B (per-point `returnKind` vs generic 町へ戻る),
and whether the centred message surface should also replace the current top-right clue panel or sit beside it.

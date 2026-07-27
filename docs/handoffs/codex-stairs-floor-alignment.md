# Codex request — 階段の描画を床面に合わせる (Verdant / shared dungeon renderer)

**Lane:** art / rendering (Godot `dungeon_renderer.gd`) + independent browser-visible review.
**Reporter:** playtest (2026-07-27) — 「階段の描写おかしいでしょ。床面の傾きに見た目を合わせて。」

## Problem
First-person の階段（下り＝穴＋梯子、上り＝登り梯子）が **床の傾き（パースペクティブ）に合っていない**。
現状は **カメラ正対のビルボード**（立て看板）なので、床に寝ておらず、近づいても床面と一体に見えない。

これは行ったり来たりした経緯がある課題です。両極端はどちらもNGでした：
1. **フラットな床デカール** … 低いカメラ角度で「潰れて」見えた（過去指摘：「階段の画像潰れているんだけど」）。
2. **カメラ正対ビルボード**（現状） … 立ってしまい、床の傾きに合わない（今回指摘）。

望ましいのは、**床平面に沿って寝かせつつ、ゲームのカメラピッチで自然に読める**中間解です。

## Where
- `godot/scripts/dungeon/dungeon_renderer.gd`
  - `_add_stairs()`（L136付近）: 現状 `QuadMesh` + `billboard_mode = BILLBOARD_ENABLED`、`position = base + (0, h/2, 0)`（立位）。
  - 呼び出し: L106-108（`_stairs_kind` が "down"/"up" を返し、`dungeon/stair-<kind>.png` を貼る）。
  - 参考: 直下の床/壁は `_add_plane`（床は水平プレーン, `rot = (0,0,0)` / 天井は `(PI,0,0)`）。同じ床平面に合わせるのが基準。
- アセット: `content/worlds/<world>/assets/dungeon/stair-down.*` / `stair-up.*`（`_asset()` 経由でワールド差し替え可）。

## Desired
- **下り階段**: 床平面に寝かせる（水平プレーン、`_add_plane` と同じ向き）。ただの潰れたデカールにしない：
  - 穴＋梯子が床に **埋まって見える**よう、浅いくぼみ（凹）ジオメトリ or 床法線に沿ったプレーン＋適切なアセット枠で、カメラピッチ（現行の一人称視点）で自然に読めること。
  - セル中央に収め、隣接壁を貫かないサイズ（現状 `CELL * 0.8` 目安）。
- **上り階段**: 同様に床（または奥壁）に沿わせ、立て看板っぽさを消す。上りは「登る」方向が伝わる見せ方（床から奥/上へ）。
- ライティングは周囲床と馴染ませる（現状 `SHADING_MODE_UNSHADED`。周囲床は陰影ありなので、浮いて見えるなら shaded 側へ）。

## Constraints
- ルール不変（`_stairs_kind` の判定、`use_stairs` の挙動は触らない）。見た目のみ。
- 共有レンダラなので Verdant 専用色/前提を焼き込まない（アセットはワールド持ち）。
- 変更後 `npm run gate:migration`（特に `verify_dungeon_controller` / `verify_scene_harness` / `verify_assets`）が緑。

## Acceptance
- 実機（Godot ビルド）で Verdant G1–G3 の下り／上り階段が **床の傾きに沿って自然に**見える（潰れず、立て看板でもない）。
- Before/After を `docs/evidence/` に保存。プレイヤー可視レビューは Codex 側で。

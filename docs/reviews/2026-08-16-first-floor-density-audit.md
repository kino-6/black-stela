# 一階・10分遠征の密度監査 — 2026-08-16

対象は `default / terminal-line / verdant` の開始階。ここでいう「10分」は最短到達を
止める鍵ではなく、初回の往復でプレイヤーが判断できる密度を点検するための時間枠である。

## 結論

全ワールドに、可視ルート選択・結果を伴う情報行動・資源交換・戦闘または回避・帰還または
下りのランドマークが、開始階の到達可能領域に存在する。今回、穴を埋めるためのコンテンツ
追加は不要だった。`verify_first_floor_density.gd` がこの五点を pack ごとに固定する。

| World | 可視ルート選択 | 情報行動 → 結果 | 資源交換 | 圧力 / 回避 | ランドマーク |
| --- | --- | --- | --- | --- | --- |
| 黒碑 — 灰の門 | 灰の辻・番人の広間へ伸びるループ | 番人の巻上げ機を調べ、入口脇の近道を開く | 供物龕・聖遺室・罠箱 | 古い塵の広間の灰泥、または迂回 | 静まり返った石室の町階段、巻き階段 |
| 終端隔離線 — 零番線 | 保安通路（速いが敵）と浸水コンコース（遅いが補給） | 信号室で下層へ信号を通し、退避シャッターの近道を開く | 浸水ロッカー、保守端末の反復採取、遺失物箱 | 保安棒ユニットを通るか浸水を選ぶ | 防火シャッター、非常電話、ホーム脇の保守階段 |
| 翠碑 — 沈む樹心 | 入口から東西二系統に分かれる根の回廊 | 怪しい壁を調べ、下り近くの隠しみちを見つける | 胞子の窪み・各翠の間の箱 | 守護者のいる翠の間を通るか、根の別枝へ回る | 沈んだ入口の地上階段、根の下り |

## 再現用の state / PNG 証跡

`capture_first_floor_density.gd` は各世界を新規降下状態で開始し、開始セルと最初の入力後の
状態を標準出力へ出し、前後の実画面を `godot/tests/_density-<world>-before.png` / `after.png`
に書き出す。前者は帰還ランドマークと最初の開けた方角、後者は最初の移動（default では
灰泥との遭遇）を示す。全画像は 1280×720 に正規化する。

```sh
npm run export:godot
npm run gate:first-floor-density
godot --path godot/ --script res://tests/capture_first_floor_density.gd
```

作者ルートの一次資料はそれぞれ
`content/worlds/default/dungeons/b1f.md`、
`content/worlds/terminal-line/dungeons/tl1f.md`、
`content/worlds/verdant/dungeons/g1f.md` である。上表の「結果」は説明文だけでなく、
treasure/chest/gather・encounter・gate の著述に対応する。

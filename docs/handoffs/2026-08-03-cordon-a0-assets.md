# 封鎖線（仮称）— Codex A0 構造アセット納品表

Status: **pre-pack asset batch**。正式 world id／表示名と Claude の受入済みシナリオID表が未到着のため、
アセットは `content/worlds/cordon/assets/` にのみ置く。`world.md` を置かないので world registry／世界選択へは
露出しない。受入後、Codex が `cordon` を正式 world id へ rename またはコピーし、`ART.md` の正規契約へ昇格する。

## 生成済み

| Runtime basename | 形式 | 内容 | 状態 |
| --- | --- | --- | --- |
| `dungeon/stone-wall-block1.jpg` | 1024² JPG | 通勤圏。摩耗した白灰タイルとくすんだ青灰帯 | 生成済み |
| `dungeon/stone-floor-block1.jpg` | 1024² JPG | 通勤圏。ゴム床・テラゾー・控えめな誘導面 | 生成済み |
| `dungeon/stone-wall-block2.jpg` | 1024² JPG | 保守圏。湿った塗装コンクリートと点検パネル | 生成済み |
| `dungeon/stone-floor-block2.jpg` | 1024² JPG | 保守圏。格子床・鋼板・油染み | 生成済み |
| `dungeon/stone-wall-block3.jpg` | 1024² JPG | 隔離局。黒鉛の吸音パネル・焼損・鈍い紫灰 | 生成済み |
| `dungeon/stone-floor-block3.jpg` | 1024² JPG | 隔離局。黒ゴム・乾いた灰・鈍い紫灰の摩耗 | 生成済み |
| `dungeon/wood-door.jpg` | 1024² JPG | 旧式の両開き防火扉。通常の通過edge用で、ボス門にしない | 生成済み |
| `dungeon/stair-down.png` | 768² RGBA | 貨物リフトへ続く下り階段。edgeに接続する実在の竪坑 | 生成済み・alpha確認済み |
| `dungeon/stair-up.png` | 768² RGBA | 天井開口へ続く避難梯子。edgeに接続する上り | 生成済み・alpha確認済み |
| `dungeon/return-marker.png` | 768² RGBA | 緊急電話・無線機・小型誘導灯の退避設備 | 生成済み・alpha確認済み |
| `dungeon/treasure-chest-closed.png` | 768² RGBA | 施錠された非常物資ケース。閉状態 | 生成済み・alpha確認済み |
| `dungeon/treasure-chest-open.png` | 768² RGBA | 開封済み非常物資ケース。包帯・補給箱・整備工具を見せ、取得済みを一目で示す | 生成済み・alpha確認済み |
| `dungeon/treasure-reward-still.png` | 1600×900 PNG | 物資ケースと報酬内容を中央で見せる結果画。ログだけに取得情報を残さない | 生成済み |
| `dungeon/sealed-door.jpg` | 1024² JPG | 中央ハンドルと横閂を備える隔離区画用の大型防火扉。通常扉とは明確に別物 | 生成済み |
| `ui/town-hub.jpg` | 1600×900 JPG | 乗換広場。市場・整備卓・診療スペースを寄せた旧コンコース | 生成済み |
| `ui/dungeon-entrance.png` | 1600×900 PNG | 雨の出入口、改札、下り通路が同時に見える探索開始地点 | 生成済み |
| `ui/combat-vignette.jpg` | 1600×900 JPG | 中央の戦闘レーンを空けた、封鎖ホームの対岸背景 | 生成済み |

## Claude への入力要求

Codex が次のバッチを正しく作るには、受入handoffに以下を含めること。

- 正式な `world id` と `assetPack`。
- F1/F2で実際に参照する敵・アイテム・宝・部屋・階段・帰還地点のID表。
- `treasure-chest-open.png`、`treasure-reward-still.png`、封鎖扉、補給端末、拠点／入口／戦闘still を使う
  scene／状態の対応。
- 6敵の role・size・hover・base/hurt の対応。Codexは受入済み enemy ID だけを描く。

## Codex の次の投入

1. 受入済みの F1/F2 ID に対応する敵6種の base/hurt、弾薬・医療・端末・運行鍵の icons を作る。
2. `npm run export:godot` 後、実機で stair edge・return current-cell・chest result を確認する。

封鎖扉と3枚のUI stillは、F1/F2 の最終数値・敵IDに依存しない共通成果物として先行した。実装可能な
`terminal-line` pack へ昇格するまでは、ここに留めて world registry には登録しない。

## 生成方法

Built-in image generation を使用。壁／床／扉は中立光のPNGを1024² JPGへ変換、透明プロップは平坦な
`#00ff00` chroma-key で生成し、alpha抽出後に768² PNG RGBAへ整形した。強い全画面フラッシュ、発光床印、
背景付きの敵／プロップは使わない。

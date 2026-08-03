# W0 受入案 — 終端隔離線 — 零番線

Status: **review-ready draft / 未登録**。ユーザーの「W* の content を進める」指示に基づく、W1へ渡す
シナリオ受入案である。`content/worlds/` に有効な `world.md` はまだ作らない。よって通常プレイの世界選択、
既存二世界のルール、セーブ、Godot画面には影響しない。

## 固定する候補

| 種別 | 値 | 意図 |
| --- | --- | --- |
| 表示名 | **終端隔離線 — 零番線** | 都市インフラの冷たさと、超常的な「終点」を併せる。単なる災害・戦場の題名にしない。 |
| world id | `terminal-line` | 表示名から独立した短いpack名。確定後に仮アセット置場 `cordon` をrenameする。 |
| 世界の一文 | 封鎖された地下交通網で、夜ごと走る零番線の終点を目指し、探索隊は弾薬で安全と時間を買いながら「誰を地上へ通すか」を知る。 | 銃・探索・結末を一文に固定する。 |
| 拠点 | 乗換広場 | 生存者が市場、工房、診療所、記録端末を寄せ集めた旧連絡通路。 |
| 最終到達点 | 中央隔離局・地上昇降路 | 零番線が運ぶものと、地上に開く資格を決める場所。 |

この題名は W0 の**提示値**であり、世界選択への固定や W0 完了扱いはタイトル確認後に行う。
「鉄雨の零番線」は採用しない。蒸気・金属・行政設備の質感は持たせるが、既存作品の設定、用語、敵、物語を
取り込まない。

## 世界の核と三幕

地下の広域避難施設は、避難記録を照合して住民を地上へ戻すはずだった。十七年後も、登録のない人を隔離側へ
送り返す零番線だけが夜ごと走る。乗換広場へ届く無線は救難か、選別機構の自己維持か、まだ分からない。

| 幕 | 層 | 場所 | プレイヤーが知ること | 主な圧力 |
| --- | --- | --- | --- | --- |
| I: 生活圏の終端 | F1–F3 | 改札外縁、浸水ホーム、連絡通路 | 運行鍵が必要で、鍵は帰還者を隔離へ戻す命令でもある。 | 弾不足、狭い射線、低い保安機。 |
| II: 記録する施設 | F4–F6 | 雨水処理区、配給庫、医療記録庫 | 零番線は脱出便ではなく、中央隔離局へ人を回収する巡回線である。 | 警戒度、端末妨害、射撃人型、複数経路。 |
| III: 終点の選別 | F7–F8 | 隔離局、列車管制、地上昇降路 | 放送の主は人か記録か。地上への道を誰のために開くか。 | 遠近混成、資源の最終管理、警戒を下げる最後の余地。 |

終幕では、零番線を停止する／人の手で運行を引き継ぐ／地上昇降路を開放する、の三択を置く。ただし選択の
発火条件・報酬・セーブ上の表現は W3b より後に決め、W0では結末の主題だけを固定する。

## F1で必ず教える判断

最初の5〜8分に、同じ目的地へ次の二経路を置く。

| 経路 | 目先の支払い | 得るもの | 後への影響 |
| --- | --- | --- | --- |
| 保安通路 | 汎用弾2発。四脚保安機を遠距離で安全に止める。 | 短時間で運行端末に着き、軽傷で探索を続けられる。 | 残弾と警戒度を払う。発砲の意味を初回で学ぶ。 |
| 浸水ホーム | 弾は使わない。水没改札を回り、探索・軽い消耗を引き受ける。 | 医療品または補給ロッカーに着く。 | 地図と探索が弾を買うことを学ぶ。 |

どちらも正解であり、初手で全滅させない。銃は最大火力ではなく、事故率と時間を買う有限資源である。
一発目の発砲だけがフロア警戒度を上げ、表示は **静穏 → 注意 → 警報** の三段階にする。個別弾倉、手動装填、
部位狙い、遮蔽はこの第一幕の範囲から除外する。

## W1へ渡すF1/F2 ID表（受入候補）

以下は Codex がアート都合で増やさないための仮ID表である。Claudeの内容受入時に数値・本文・最終配列を
決め、このIDを変更するなら対応表も同時に更新する。

### 迷宮・部屋・ランドマーク

| 種別 | ID | F | 役割 | 必要アセット |
| --- | --- | --- | --- | --- |
| dungeon | `dungeon.tl1f` | F1 | 改札外縁。二択を学ぶ入口。 | block1壁床、通常扉、下り、帰還標識、戦闘背景。 |
| dungeon | `dungeon.tl2f` | F2 | 浸水ホームと保守連絡路。補給の価値を確認する層。 | block1壁床、通常扉、封鎖扉、下り・上り、戦闘背景。 |
| room | `room.tl1f.security-corridor` | F1 | 保安通路。銃を撃つ短路。 | 防火扉、保安機。 |
| room | `room.tl1f.flooded-concourse` | F1 | 浸水迂回路。探索で弾を温存。 | 水位痕、補給ロッカー。 |
| room | `room.tl1f.signal-office` | F1 | 零番線無線と最初の運行鍵の手掛かり。 | 端末、戻り標識。 |
| room | `room.tl2f.platform-bay` | F2 | 浸水ホーム。射線と迂回の両立。 | ホーム端、貨物階段。 |
| room | `room.tl2f.maintenance-locker` | F2 | 警戒度を下げる補給ロッカー。 | ロッカー、電源端末。 |
| room | `room.tl2f.sealed-platform-office` | F2 | 重要宝と封鎖扉の正当な用途。 | 封鎖扉、保管庫。 |

### 敵

| ID | 日本語名 | F | role | silhouette / asset contract |
| --- | --- | --- | --- | --- |
| `enemy.tl1f.drain-rat` | 排水ネズミ | F1 | attrition | 低い四足。濡れた毛と太い尾。base/hurt。 |
| `enemy.tl1f.baton-unit` | 保安棒ユニット | F1 | blocker | 腰高の四脚警備機。点灯は一点のみ。base/hurt。 |
| `enemy.tl1f.breath-collector` | 呼気採取機 | F1 | status | マスクとホースの医療機。浮遊させない。base/hurt。 |
| `enemy.tl1f.unmanned-stationmaster` | 無人駅務長 | F1 | miniboss | 改札機と作業服が歪に接続した大型。base/hurt。 |
| `enemy.tl2f.cable-hound` | 配線犬 | F2 | ambusher | ケーブルと陶器質の歯を持つ四足。base/hurt。 |
| `enemy.tl2f.rain-reclaimer` | 雨具の回収屋 | F2 | ranged | 暗色の雨具と下げた散弾銃。base/hurt。 |

敵は全て `768×768 PNG RGBA`、clean alpha、base/hurt同一シルエット外接、接地前提とする。敵名・能力・数値は
このW0では物語上の役を示すだけで、W1のcanonical dataには Claude の受入後に確定する。

### アイテム・宝・遭遇

| 種別 | ID | 日本語名 | F | 用途 |
| --- | --- | --- | --- | --- |
| item | `item.tl-universal-round` | 汎用弾 | F1–F2 | W3aの共有弾薬。銃行動1回につき1消費。 |
| item | `item.tl-field-dressing` | 応急包帯 | F1–F2 | 単体回復。銃の代用品にしない。 |
| item | `item.tl-terminal-fuse` | 端末ヒューズ | F1–F2 | 補給ロッカー／保守端末を動かす探索資源。 |
| item | `item.tl-transit-key-fragment` | 運行鍵片 | F1 | 第一幕の進行証。売却不可。 |
| equip | `equip.tl-service-pistol` | 保安拳銃 | F1 | 銃タグの最初の選択肢。万能高火力にしない。 |
| equip | `equip.tl-crowbar` | 保守用バール | F1 | 静かな近接側の最初の選択肢。 |
| equip | `equip.tl-rain-jacket` | 防水作業着 | F1 | 浸水迂回の損害を少し抑える防具。 |
| treasure | `treasure.tl1f.locker` | 補給ロッカー | F1 | 閉／開保管庫と中央報酬stillを使う。 |
| treasure | `treasure.tl2f.sealed-cache` | 封鎖配給箱 | F2 | 封鎖扉の奥の報酬。通常扉をボス門にしない。 |
| encounters | `encounters.tl1f.corridor` | 保安通路の遭遇 | F1 | 排水ネズミ／保安棒ユニット。 |
| encounters | `encounters.tl2f.platform` | ホームの遭遇 | F2 | 配線犬／雨具の回収屋。 |

## アセット正規化表（W1で `ART.md` へ移す）

既に生成済みの `content/worlds/cordon/assets/dungeon/` は、W1で `terminal-line` が受入された場合のみ
`content/worlds/terminal-line/assets/dungeon/` へ移し、次のbasenameに固定する。素材の都合でIDや部屋は増やさない。

| 用途 | basename | 状態 |
| --- | --- | --- |
| 深度帯 | `stone-wall-block1..3.jpg`, `stone-floor-block1..3.jpg` | 生成済み |
| 通常扉 | `wood-door.jpg` | 生成済み |
| 下り／上り／帰還 | `stair-down.png`, `stair-up.png`, `return-marker.png` | 生成済み |
| 保管庫 | `treasure-chest-closed.png`, `treasure-chest-open.png` | 生成済み |
| 獲得結果 | `treasure-reward-still.png` | 生成済み |
| 封鎖扉 | `sealed-door.jpg` | 未生成。F2の `sealed-platform-office` 受入後に生成。 |
| 町／入口／戦闘still | `town-hub.jpg`, `dungeon-entrance.jpg`, `combat-vignette.jpg` | 未生成。F1/F2の本文とHUD構図を受入後に生成。 |
| 敵 | `enemy-tl1f-*`, `enemy-tl2f-*` と各 `-hurt` | 未生成。上の6 ID と一対一で生成。 |

## W1 で作る正規ファイル集合

`content/worlds/terminal-line/` に、受入済み本文・数値・gridだけを入れる。

```text
manifest.md
world.md
town.md
rules.md
items.md
enemies.md
encounters.md
treasure.md
progression.md
quests.md
vocations.md
affixes.md
dungeons/tl1f.md
dungeons/tl2f.md
ART.md
assets/**
```

W1の受入条件は、全参照が `loadScenarioPack` と scenario validation を通ること、そして `npm run export:godot`
によって `terminal-line.json` とワールド所有アセットが自動出力されることである。未受入の草稿を混ぜず、Godotへ
手作業で登録・コピーしない。

## W0 review checklist

- [ ] 表示名「終端隔離線 — 零番線」を確定する、または置換名を受け取る。
- [ ] `terminal-line` を正式 world id とする、または置換IDを受け取る。
- [ ] 共有弾薬／三段階警戒度を W3a の独立ルールとして進めることを確認する。
- [ ] 上のF1/F2 ID表を Claude のシナリオ受入の出発点として採用する。

この四点が揃うまでW0は `[-]` のままにし、W1のcanonical packは作らない。

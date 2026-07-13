# Black Stela Browser Playtest Development Loop

## 結論

実現可能。ただし、既存の `npm run selfplay:browser` を長くするだけでは
足りない。現状の Self-Play は既知ルートが壊れていないことを確かめる
回帰テストであり、遊びにくさや古さを発見するプレイテスターではない。

目標は、次の三層を分けて運用すること。

1. **回帰テスト**: 既知の仕様違反を高速に検出する。
2. **Browser Playtest**: 画面と通常入力だけで遊び、未知の問題を発見する。
3. **Human Review**: 作品の方向性や好みを変える判断だけを人間へ返す。

AIは再現性、網羅性、比較には強い。一方で「面白い」の最終判断や、
一度の違和感から作品方針を変える判断は代行できない。この境界を守れば、
人間が毎回最初の粗探しをする状態はかなり減らせる。

## 目的

- 実ブラウザ上でタイトルから街、編成、迷宮、戦闘、帰還まで遊ぶ。
- 現代のDRPGとして不足する標準品質を、証拠付きで指摘する。
- 一度に小さな修正を行い、同じ場面と通常ルートを再プレイする。
- 過去の失敗をGateへ昇格し、同じ指摘を人間に繰り返させない。
- Headless到達性、固定E2E、探索的プレイを混同しない。

## 「現代のDRPG標準」の扱い

単一作品の模倣や点数表にはしない。Black Stelaのコンセプトを中心に、
次の観点を比較基準として持つ。

| 観点 | 最低限確認すること |
| --- | --- |
| 導入 | タイトルから最初の判断までが短く、世界観をUI説明で壊さない |
| キャラクター | 編成を試したくなる職業差、外見、来歴、成長方針がある |
| 街 | 回復、売買、装備、編成、再出発が準備の循環として読める |
| 迷宮 | 視界、マップ、壁、扉、階段、現在地、移動結果が一致する |
| 探索 | 分岐、近道、危険、発見、報酬が進むか戻るかの判断を作る |
| 戦闘 | 六人分の役割と命令、対象、結果、危険、資源消費が読める |
| 緊張 | HP/MP、状態、所持品、帰還手段、全滅の損失が判断へ効く |
| 成長 | レベル、技能、装備、収集が次の遠征の選択肢を増やす |
| 快適性 | リピート、オート、速度、図鑑、履歴が判断を奪わず手間を減らす |
| 操作 | キーボード/コントローラだけで全通常画面を往復できる |
| 表示 | 一画面に収まり、固定窓が動かず、日本語と図像が読みやすい |
| 雰囲気 | 仮素材、開発文言、英語漏れ、Web管理画面らしさがない |

参考作品は構造の比較にのみ使い、固有の名称、文章、画像、数値、
シナリオをコピーしない。『世界樹の迷宮 HD』の公式説明は、地図作成、
カスタムパーティ、ターン制戦闘、街での休息・売却・装備更新を一つの
循環として示している。『ガレリアの地下迷宮』は長い探索と大規模な
編成カスタマイズを前面に出している。これらはBlack Stelaの比較軸には
なるが、合格条件そのものではない。

## 成果物

### 1. 永続する設計資産

- `DevLoop.md`: ループ全体の正本。頻繁なプレイ結果は書き込まない。
- `docs/skills/browser-playtest-devloop-skill.md`: Agentが毎回従う手順。
- `docs/gates/modern-drpg-playtest-gate.md`: 合否条件と重大度定義。
- `docs/playtest/drpg-standard.md`: 出典、比較観点、Black Stelaでの解釈。
- `docs/playtest/issues/<issue-id>.md`: 再現可能な未解決指摘。
- `docs/gates/past-trouble-regression-gate.md`: 修正済みで再発防止が必要な問題。

Skillは「どう調べ、どう遊び、どう報告するか」を持つ。Gateは「何を
満たさない限り完了としないか」を持つ。過去トラブルは具体的な失敗例を
持つ。この三つを混ぜない。

### 2. 実行ごとの証跡

`test-results/devloop/<run-id>/` に次を残す。このディレクトリはGit管理
しない。

```text
run.json                 実行条件、commit、world、言語、viewport、seed
actions.jsonl            観察した画面、意図、通常入力、結果
findings.md              重要度、再現手順、期待、実際、改善候補
screenshots/             指摘の前後と主要チェックポイント
trace.zip                Playwright Trace
console.txt              例外と警告。プレイ終了後の診断用
metrics.json             迷い、入力数、戦闘時間、画面遷移等の観測値
comparison.md            修正前後で何が改善し、何が残ったか
```

Playwright Traceは各操作前後のDOM snapshot、画面、console、networkを
時系列で確認できる。通常プレイ中の意思決定には内部情報を使わず、
失敗後の診断資料として利用する。

### 3. 人間へ返す短い報告

各ループの報告は次の形式に固定する。

```md
Player experience problem:
Evidence:
Severity / confidence:
Expected DRPG behavior:
Smallest proposed fix:
Regression risk:
Replayed result:
Human decision needed:
```

長いプレイ日記や、根拠のない総合点は成果物にしない。

## 実行アーキテクチャ

### Playフェーズ

プレイ担当Agentには次だけを許可する。

- 1280x720を基準とする実ブラウザ画面
- 可視要素のアクセシビリティ情報
- キーボードまたはゲームパッド相当の入力
- 待機、スクリーンショット、画面内テキストの読み取り
- 自分が直前までに観察した短期メモ

次は禁止する。

- `GameState`、scenarioファイル、マップ座標、敵データの直接参照
- DebugMode、URLパラメータ、保存データ編集、hidden command dispatch
- DOM内に存在しても不可視な情報の利用
- 正解ルートをhelpersやテストコードから読むこと
- マウスクリックだけで通常操作を済ませること
- 失敗を「操作不能」ではなく強引な待機やリロードで隠すこと

Agentは各入力前に、画面から分かる短い意図を`actions.jsonl`へ残す。
秘密の推論過程ではなく、「東の扉が見えるため前進する」のような、
プレイヤーにも説明できる根拠だけを記録する。

### Diagnoseフェーズ

プレイを終了してから、別の診断担当がTrace、DOM、console、ソース、
シナリオデータを読める。ここで初めて内部状態と表示状態を突き合わせる。
PlayとDiagnoseを同じ文脈で行うと、Agentが地図や正解を知った状態で
「遊べた」と判定するため、担当またはコンテキストを分離する。

### Fixフェーズ

- 一回の反復では、一つのプレイヤー体験問題だけを修正する。
- ルール変更はunit test、表示と操作はPlaywrightで先に再現する。
- 修正前スクリーンショットと同じ場面を、同じviewportと言語で再撮影する。
- 局所再現が通った後、短い通常ルートを再プレイする。
- 新しい不具合を見つけても同じ修正へ混ぜず、issueとして次へ送る。

### Learnフェーズ

| 発見 | 保存先 |
| --- | --- |
| 一度だけの主観的な違和感 | 実行内の`findings.md` |
| 再現できる未修正問題 | `docs/playtest/issues/` |
| 修正済みで再発しやすい問題 | relevant Gate + automated test |
| 複数領域に効く作業手順 | Skill |
| 製品方針を変える決定 | PlanまたはADR、人間承認必須 |

過去トラブルへ何でも追記するとGateが読めなくなる。高影響、再発実績、
または構造的に再発しやすい項目だけを昇格する。

## 一回のループ

1. commit、world、言語、viewport、seed、プレイ憲章を固定する。
2. 過去トラブルと対象領域のGateだけを読む。
3. Play担当を、ソースを読ませない新しい文脈で開始する。
4. タイトルから通常入力で、憲章の終了条件まで遊ぶ。
5. 証跡を保存し、操作不能、視覚矛盾、迷い、退屈、過剰作業を抽出する。
6. Studio Reviewで体験問題を一文に絞り、重大度と確信度を付ける。
7. 既存issue、既存Gate、既存テストとの重複を調べる。
8. 最小の一件を修正し、再現テストを追加する。
9. 同じ場面を再プレイし、その後に短い通常ルートを通す。
10. 比較結果を保存し、Gate昇格、次issue、人間判断のいずれかへ送る。

## プレイ憲章

毎回フルクリアを目指すと遅く、同じ序盤だけが過学習される。以下を
ローテーションする。

| 憲章 | 主な発見対象 | 終了条件 |
| --- | --- | --- |
| 初見30分 | 導入、説明、迷い、情報過多 | 初帰還または30分 |
| Controller Only | focus、confirm/cancel、固定窓 | 街→戦闘→帰還 |
| 日本語UI | 文体、英語漏れ、改行、密度 | 街・迷宮・戦闘を各1画面 |
| 遠征判断 | attrition、戦利品、撤退判断 | 資源不足で帰還判断まで |
| 戦闘三連戦 | 命令、敵差、テンポ、結果理解 | 異なる3遭遇終了 |
| 編成変更 | キャラ作成、装備、職業差 | 異なる六人編成で出発 |
| 深層再開 | 中盤以降の単調さ、難度、近道 | 指定階の次の拠点まで |
| Verdant初見 | 外部world差替え、雰囲気、整合 | 初戦闘と初発見まで |

深層憲章の開始地点だけは、専用のテストfixtureで用意してよい。ただし
「通常プレイでそこへ到達できること」は別の回帰テストで保証し、fixtureを
通常ルートの証明には使わない。

## 指摘の優先順位

| 重大度 | 基準 | 処置 |
| --- | --- | --- |
| P0 | 進行不能、保存破壊、通常ルート消失 | 直ちに停止して修正 |
| P1 | 表示とルールの矛盾、controller不能、必須情報不可視 | 次の変更より先に修正 |
| P2 | 戦術や探索判断を弱める、頻繁なUX摩擦 | 小さなsliceとして修正 |
| P3 | polish、稀な文言、軽い視覚不整合 | backlogへ送る |
| Direction | 面白さ、美術、難度、物語の方針変更 | 人間へ選択を返す |

`severity`とは別に`confidence`を high / medium / low で記録する。低確信の
主観だけでコードを変更しない。別憲章または別seedで再現してから扱う。

## 自動観測できる指標

数値は診断の手掛かりであり、面白さの点数ではない。

- タイトルから最初の迷宮入力までの時間と入力数
- 一つの通常行動に必要なfocus移動数
- cancel/backで一段戻れなかった回数
- command領域の座標変化、viewport overflow、意図しないscroll
- 同一メッセージの重複、英語漏れ、日本語一文字孤立
- 視認前に使用可能になった扉、階段、帰還、宝、敵
- minimap、移動可否、first-person viewの不一致
- 一戦の命令数、演出時間、入力待ち、同一行動比率
- 被害、MP/道具消費、戦利品、帰還時余力、全滅位置
- 街で装備更新や回復判断に必要な画面遷移数

スクリーンショットの画像評価は補助に使えるが、単独で合否を決めない。
DOM geometry、ゲーム内イベント、操作ログと組み合わせる。

## RAGと記憶の方針

初期段階でvector databaseは不要。Repo内文書は規模が小さく、明示的な
routingの方が誤検索と古い規則の混入を防げる。

1. `AGENTS.md`: 変えてはいけない上位制約。
2. Skill: その作業で読む順序と手順。
3. Domain Gate: 対象領域のblocking条件。
4. `docs/playtest/drpg-standard.md`: 外部比較と出典。
5. issue: 未解決の具体例と証拠。
6. archive: 通常は検索対象外。履歴調査時だけ読む。

文書が増えたら、front matterへ`area`、`status`、`world`、`lastVerified`、
`sourceVersion`を持たせ、まず`rg`/索引で絞る。RAGを導入する条件は、
有効な比較資料が100件規模になった、複数worldで同義語が増えた、または
検索漏れを測るeval corpusが用意できた時とする。RAGはGateの代わりに
せず、関連資料を提示する検索層としてのみ使う。

## コマンド案

実装時は、既存コマンドを残したまま次を追加する。

```sh
# 既知ルートの回帰。従来どおり決定的に動かす
npm run selfplay:browser

# 探索的プレイ。画面観察から次の入力を選ぶ
npm run devloop:play -- --world default --charter first-run --minutes 30

# 指定runの診断とissue候補生成。ゲームは操作しない
npm run devloop:review -- --run test-results/devloop/<run-id>

# 修正前後の同一場面比較
npm run devloop:compare -- --before <run-id> --after <run-id>
```

最初から完全自律の「修正して永遠に回る」コマンドにはしない。まず
`play`と`review`を実装し、5回程度の実行で指摘の質、重複率、誤検知、
証跡の有用性を測る。その後、P1/P2のうち高確信かつ既存方針内の修正だけを
自動Fix対象に広げる。

## Human approval points

次は自動修正せず、人間へ返す。

- 戦闘、死亡、帰還、保存、成長の基本ルールを変える。
- シナリオ、美術方向、キャラクター像、難度方針を変える。
- proprietary作品へ似せるために固有表現を取り込む。
- 複数の正しい解があり、どちらかで既存プレイヤー体験を失う。
- 外部サービス、課金API、telemetry送信、公開・push・mergeを行う。

## Stop conditions

- P0/P1を発見した。
- 同じ操作を3回試して進行できない。
- 画面情報だけでは次の合理的な行動を選べない。
- 予定時間または入力数を超えた。
- 前回と同じ問題しか得られず、新しい証拠がない。
- fix後に既存Gateまたは通常ルートが悪化した。
- 人間判断が必要なDirection問題へ到達した。

停止は失敗ではない。「どの画面情報が不足して止まったか」を残せれば、
有効なプレイテスト結果になる。

## 段階導入

### Phase 1: Evidence Runner

- `devloop:play`のrun directoryとreport schemaを作る。
- Playwright traceを常時記録し、主要画面と失敗時を撮る。
- Controller Onlyと日本語UIの二憲章を実装する。
- 既存`selfplay:browser`を変更せず、結果だけ共通schemaへ変換する。

### Phase 2: Review and Memory

- Studio Review rubricで`findings.md`を生成する。
- 重複issue検索、重大度、確信度、再現手順を定型化する。
- Skill、Gate、`drpg-standard.md`を作り、参照順を固定する。
- 5 runで、人間が採用した指摘率と明白な見逃しを測る。

### Phase 3: Bounded Fix Loop

- high-confidenceのP1/P2から一件だけ選ぶ。
- 再現テスト、最小修正、同場面再プレイ、通常route smokeを行う。
- 失敗、低確信、Direction問題ではコードを変更せず停止する。
- 反復上限を3回とし、終わらない自律ループを禁止する。

### Phase 4: Coverage Expansion

- 初見、戦闘三連戦、遠征判断、編成変更、深層、Verdantへ広げる。
- seed/world/言語/viewportのmatrixを夜間実行する。
- 必要になった時だけ、外部比較資料のRAGと画像差分評価を追加する。

## 最初の完成条件

- Play担当がソースやGameStateを読まず、通常入力だけで街→迷宮→戦闘→帰還を行う。
- runごとに操作ログ、Trace、スクリーンショット、findingsが揃う。
- 指摘が一文のplayer experience problemと再現手順を持つ。
- 修正前後を同じ場面で比較できる。
- Controller Onlyと日本語UIの憲章が最低一回ずつ完走する。
- Headless、固定Self-Play、探索的Playtestの結果が別々に表示される。
- 5 run中、採用できる新規指摘が得られ、既存issueの重複を自動で避ける。
- 過去トラブル再発時は、完了扱いせず停止する。

## 参考資料

- [Nintendo: Etrian Odyssey Origins Collection](https://www.nintendo.com/us/store/products/etrian-odyssey-origins-collection-switch/)
  - 地図、カスタムパーティ、戦術戦闘、街での休息・売却・装備更新、
    難度選択、図鑑・クエスト・技能へのアクセスを比較軸に用いる。
- [NIS America: Labyrinth of Galleria](https://nisamerica.com/labyrinth-of-galleria/)
  - 長期探索と編成カスタマイズを、content depthの比較軸に用いる。
- [Playwright: Trace Viewer](https://playwright.dev/docs/trace-viewer-intro)
  - 操作前後の画面、DOM、console、networkを再現証跡として用いる。
- [Xbox Accessibility Guideline 107: Input](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107)
  - 通常機能をdigital inputでも等価に操作できることを基準に用いる。
- [Xbox Accessibility Guideline 112: UI navigation](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112)
  - 一貫したUI navigationとfocusをcontroller-first Gateへ反映する。


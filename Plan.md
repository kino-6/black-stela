# Black Stela Modernization Plan

## 目的

現在のBlack Stelaは、町、パーティ作成、ポートレート読み込み、1フロア探索、罠、戦闘、帰還、ログ、Headlessクリア検証まで通るMVPです。

次の段階では、仮実装に近い縦スライスを、現代的なデスクトップゲーム/ツールとして保守・拡張できる基盤へ育てます。

重要方針:

- プレイヤーキャラクターの発話、内面、行動決定は常にプレイヤーの領域に残す。
- AIは任意、ローカル優先、ゲーム真実を変更しない。
- Scenario truthは外部編集可能なMarkdown/YAMLに置く。
- すべての重要なルール変更はHeadlessで検証可能にする。
- 日本語UI/テキストを一級対応にする。

## 現状

実装済み:

- Tauri v2 + Vite + React + TypeScript
- Three.jsによる一人称ダンジョン表示
- Zodによるシナリオ検証
- `GameState` / `Command` / `RulesEngine`
- 町、パーティ作成、ポートレート読み込み
- 罠、固定イベント、簡易戦闘、町への帰還
- Adventure Log
- AI Policy Guard
- Debug起動
- Headless clear runner
- Vitest / Playwright / `cargo check`

主な不足:

- セーブ/ロード永続化
- 外部シナリオフォルダの読み込み
- 日本語ローカライズ基盤
- LocalAI/Ollama等のLocal AI provider抽象化
- `GameEvent`中心のイベント駆動ルール
- 地図UI、探索リソース、町メニュー
- Windows配布に向けたTauri packaging

## アーキテクチャ方針

### Game Core

ゲーム真実はReact UIから独立した純粋なドメイン層に寄せる。

推奨構造:

```text
Command
  -> RulesEngine
  -> GameEvent[]
  -> GameState
  -> ReplayLog
```

理由:

- Headless検証しやすい
- セーブ/ロードしやすい
- AI提案とゲーム真実を分離しやすい
- UIから副作用を追い出せる

### Persistence

Tauriデスクトップを前提に、まずはローカルファイル保存を採用する。

保存対象:

- セーブスロット
- パーティ
- キャラクター notes
- ポートレート参照
- 現在位置
- 地図情報
- 解決済み罠/イベント/撃破敵
- Adventure Log
- 設定
- AI provider設定
- 言語設定

将来的にSQLiteへ移行できるよう、UIから直接保存先を触らずRepository層を挟む。

### Scenario Repository

Vite raw importは開発MVP用に残しつつ、製品実装では外部フォルダを読む。

必要機能:

- scenario pack選択
- Markdown/YAML読み込み
- Zod validation
- エラー一覧表示
- シナリオID/バージョン管理
- 既存セーブとの互換性チェック

### Japanese Localization

日本語対応は後付け翻訳ではなく、早い段階で文字列管理を導入する。

方針:

- UI文言は辞書化する。
- シナリオ本文は言語別ファイルまたはfront matterで分離する。
- 日本語タイトルは直訳を避ける。`Black Stela`を当面の正式表示名にし、日本語副題は後で決める。
- 日本語フォント、禁則処理、行間、長文ログの読みやすさをUI要件に含める。

初期対応言語:

- `en`
- `ja`

### Local AI

LocalAI導入は必要。ただし特定サーバーにハード依存しない。

方針:

- AI defaultはoff。
- Providerを差し替え可能にする。
- 最初はOpenAI-compatible local endpointとして扱う。
- OllamaとLocalAIを同じNarrator provider interfaceで扱う。
- AI出力は常にproposalであり、GameStateには直接適用しない。

Provider候補:

- `none`
- `ollama`
- `localai`
- `openai_compatible_local`

必要な安全境界:

- 送信する文脈をpublic situationに限定する。
- PC名/notesは必要最小限にする。
- PC発話、PC行動、ルール変更、新規事実生成を拒否する。
- AI応答をログ本文とは別のproposalとして保存する。
- proposal承認UIを作る場合も、承認可能な種類を限定する。

## フェーズ計画

## Phase 1: Core State Hardening

目的: 仮実装のGameStateを、保存・検証・Headless実行に耐える形にする。

### Task 1: GameEvent導入

Description:
`RulesEngine`が直接ログ文言を作るのではなく、まず`GameEvent[]`を返し、Reducerで`GameState`と`ReplayLog`へ反映する。

Acceptance criteria:

- [ ] `executeCommand`が状態遷移とイベント生成を明確に分離している
- [ ] Headless clearが既存と同じ結果になる
- [ ] Adventure LogがGameEventから生成される

Verification:

- [ ] `npm test`
- [ ] `npm run headless:clear`
- [ ] `npm run build`

Dependencies:

- None

Estimated scope:

- M

### Task 2: Save Data Schema

Description:
セーブデータ用Zod schemaを追加し、現在の`GameState`をバージョン付き保存形式へ変換できるようにする。

Acceptance criteria:

- [ ] `SaveDataV1` schemaがある
- [ ] `GameState -> SaveDataV1 -> GameState` round tripが通る
- [ ] 不正セーブデータを検出できる

Verification:

- [ ] `npm test`
- [ ] round trip unit test

Dependencies:

- Task 1推奨

Estimated scope:

- S

### Task 3: Save/Load Repository

Description:
Tauri環境とブラウザ開発環境の両方で使える保存Repositoryを作る。初期はブラウザではlocalStorage、Tauriでは後続でファイル保存に差し替え可能なinterfaceにする。

Acceptance criteria:

- [ ] Save slotを保存できる
- [ ] Save slotを読み込める
- [ ] Save slot一覧を取得できる
- [ ] 保存失敗時にUIが壊れない

Verification:

- [ ] `npm test`
- [ ] `npm run test:e2e`

Dependencies:

- Task 2

Estimated scope:

- M

### Checkpoint: Core State

- [ ] Headless clear passes
- [ ] Save/load round trip passes
- [ ] Browser MVP flow still passes

## Phase 2: Debug, Headless, and Map System

目的: テスト可能な探索基盤にする。

### Task 4: Map Model Generalization

Description:
現在の`visitedRooms`/`knownExits`を、階層、座標、向き、扉、階段、未踏情報を扱えるモデルへ拡張する。

Acceptance criteria:

- [ ] room IDだけでなくfloor IDを持てる
- [ ] visited/known/blocked/secret candidateを表現できる
- [ ] Debug startが新Map modelを使う

Verification:

- [ ] `npm test`
- [ ] Debug start E2E

Dependencies:

- Task 1

Estimated scope:

- M

### Task 5: Headless Explorer

Description:
固定コマンド列ではなく、Scenario graphを読んで「クリア条件まで探索する」Headless runnerにする。

Acceptance criteria:

- [ ] 既知exitから次の移動を選べる
- [ ] combat/trap/stairsに対応できる
- [ ] stuck reasonが診断しやすい

Verification:

- [ ] `npm run headless:clear`
- [ ] Headless unit tests

Dependencies:

- Task 4

Estimated scope:

- M

### Task 6: Map UI

Description:
訪問済み部屋、現在位置、既知出口を表示する地図UIを追加する。

Acceptance criteria:

- [ ] 現在位置が表示される
- [ ] 訪問済み部屋が表示される
- [ ] 未踏出口が区別される
- [ ] 日本語UIでも崩れない

Verification:

- [ ] Playwright screenshot/smoke test
- [ ] 390px mobile viewport確認

Dependencies:

- Task 4

Estimated scope:

- M

### Checkpoint: Exploration

- [ ] Headless explorer can clear
- [ ] Map UI shows progress
- [ ] Debug progress starts still work

## Phase 3: Japanese Localization

目的: 日本語UI/シナリオ/ログを一級対応にする。

### Task 7: i18n Foundation

Description:
UI文字列を辞書化し、`en`/`ja`を切り替えられるようにする。

Acceptance criteria:

- [ ] UI textが辞書から出る
- [ ] 言語切替ができる
- [ ] 言語設定が保存される

Verification:

- [ ] `npm test`
- [ ] E2Eで日本語UI表示

Dependencies:

- Task 3推奨

Estimated scope:

- M

### Task 8: Japanese Scenario Text

Description:
シナリオ本文、部屋名、イベント文、ログ表示を日本語対応する。

Acceptance criteria:

- [ ] B1Fの日本語テキストがある
- [ ] `ja`選択時に日本語部屋名/説明が出る
- [ ] YAML truthとlocalized proseが混ざらない

Verification:

- [ ] Scenario validation tests
- [ ] E2E日本語モード

Dependencies:

- Task 7

Estimated scope:

- M

### Task 9: Japanese Typography and Layout

Description:
日本語の長文ログ、町説明、ボタン、地図ラベルが読みやすく崩れないようにUIを調整する。

Acceptance criteria:

- [ ] 長い日本語ログがカード内で破綻しない
- [ ] ボタン内テキストが折り返し/省略で崩れない
- [ ] mobile viewportで重ならない

Verification:

- [ ] Playwright screenshots
- [ ] 390px / 768px / 1440px viewport

Dependencies:

- Task 7
- Task 8

Estimated scope:

- S

### Checkpoint: Japanese Support

- [ ] `en`/`ja` switch works
- [ ] 日本語でMVP clearまで遊べる
- [ ] Headless clear remains language-independent

## Phase 4: Local AI Integration

目的: Ollama/LocalAI/OpenAI互換ローカルサーバーを安全に使えるようにする。

### Task 10: Narrator Provider Interface

Description:
`NarratorService`をprovider interfaceへ分割し、`none`/`ollama`/`localai`/`openai_compatible_local`を選べる設計にする。

Acceptance criteria:

- [ ] provider interfaceがある
- [ ] provider configが保存される
- [ ] AI offで完全に遊べる
- [ ] provider失敗時にゲームが止まらない

Verification:

- [ ] `npm test`
- [ ] provider failure test

Dependencies:

- Task 3

Estimated scope:

- M

### Task 11: LocalAI Provider

Description:
LocalAI等のOpenAI互換ローカルAPIに対して、環境描写/リプレイ提案のみを要求するproviderを追加する。

Acceptance criteria:

- [ ] endpoint URLを設定できる
- [ ] model名を設定できる
- [ ] API keyなしでもローカル利用できる
- [ ] 応答はproposalとして保持される
- [ ] GameStateは変更されない

Verification:

- [ ] mocked provider unit tests
- [ ] AI policy guard tests

Dependencies:

- Task 10

Estimated scope:

- M

### Task 12: AI Proposal UI

Description:
AIの出力をAdventure Logとは別のproposalとして表示し、承認できる種類を限定するUIを作る。

Acceptance criteria:

- [ ] AI proposalがcanonical logと見分けられる
- [ ] 拒否理由が表示される
- [ ] PC発話/行動/新規事実は承認不能
- [ ] AI disabled時にUIが邪魔にならない

Verification:

- [ ] E2E AI-off flow
- [ ] mocked AI proposal E2E

Dependencies:

- Task 10
- Task 11

Estimated scope:

- M

### Checkpoint: Local AI

- [ ] AI off full flow passes
- [ ] LocalAI-compatible mocked flow passes
- [ ] AI cannot mutate GameState

## Phase 5: Scenario Repository

目的: 外部編集可能なシナリオシステムを製品品質に近づける。

### Task 13: Scenario Pack Loader

Description:
外部シナリオフォルダを読み込み、world/rules/town/dungeonsを検証するloaderを作る。

Acceptance criteria:

- [ ] シナリオフォルダを選べる
- [ ] 必須ファイル不足を検出する
- [ ] YAMLエラーを表示する
- [ ] 読み込み失敗時に既存ゲームが壊れない

Verification:

- [ ] Loader unit tests
- [ ] Invalid scenario tests

Dependencies:

- Task 2

Estimated scope:

- M

### Task 14: Scenario Validation UI

Description:
シナリオ読み込みエラーをプレイヤー/作者が理解できる形で表示する。

Acceptance criteria:

- [ ] ファイル名、フィールド、理由が表示される
- [ ] 日本語UIに対応する
- [ ] エラーがあるシナリオは開始できない

Verification:

- [ ] E2E invalid scenario flow

Dependencies:

- Task 13
- Task 7

Estimated scope:

- M

### Checkpoint: Scenario Authoring

- [ ] Valid scenario can start
- [ ] Invalid scenario shows actionable errors
- [ ] Bundled default scenario remains playable

## Phase 6: Game Loop Depth

目的: Wizardry/TRPG風の緊張感を、現代的な摩擦の少なさで足す。

### Task 15: Town Menu

Description:
町を単一画面から、Guild/Recovery/Records/Dungeon Entryを持つメニューにする。

Acceptance criteria:

- [ ] Guildでパーティ編集できる
- [ ] Recoveryで負傷を回復できる
- [ ] Recordsでログを見られる
- [ ] Dungeon Entryで再突入できる

Verification:

- [ ] E2E town loop

Dependencies:

- Task 3
- Task 7推奨

Estimated scope:

- M

### Task 16: Injury and Recovery

Description:
即時キャラ削除ではなく、負傷、治療費、休息、引退候補を表現する。

Acceptance criteria:

- [ ] HP 0で削除されない
- [ ] injury stateが保存される
- [ ] townで回復できる
- [ ] Headlessで回復ループを検証できる

Verification:

- [ ] Unit tests
- [ ] Headless injury flow

Dependencies:

- Task 1
- Task 3

Estimated scope:

- M

### Task 17: Combat Choices

Description:
攻撃だけでなく、防御、後退、簡易スキル、消耗品を追加する。

Acceptance criteria:

- [ ] deterministic combat choicesがある
- [ ] AIが戦術を決めない
- [ ] UIで選択しやすい

Verification:

- [ ] Rules tests
- [ ] E2E combat flow

Dependencies:

- Task 1
- Task 16推奨

Estimated scope:

- M

### Checkpoint: Playable Loop

- [ ] 保存込みで町-探索-戦闘-帰還が回る
- [ ] 日本語UIで回る
- [ ] Headlessで主要分岐を検証できる

## Phase 7: Desktop Packaging

目的: Steam/Windows配布へ向けた下地を作る。

### Task 18: Tauri File Persistence

Description:
Tauri plugin/APIを使って、セーブ、設定、ポートレートをOS標準アプリデータ領域に保存する。

Acceptance criteria:

- [ ] Windows/macOSで保存先が分かれる
- [ ] ポートレートが永続化される
- [ ] 保存失敗時のエラー表示がある

Verification:

- [ ] `cargo check`
- [ ] Tauri dev manual check

Dependencies:

- Task 3

Estimated scope:

- M

### Task 19: Windows Build Smoke

Description:
Windows向けTauri buildのための設定、アイコン、metadata、bundle確認を行う。

Acceptance criteria:

- [ ] 仮アイコンではなく正式アイコンがある
- [ ] Windows app metadataが設定される
- [ ] build手順がREADMEにある

Verification:

- [ ] Windows環境またはCIでTauri build

Dependencies:

- Task 18推奨

Estimated scope:

- M

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| AIがPC行動/発話を侵す | High | `AiPolicyGuard`、proposal分離、承認可能範囲の制限 |
| シナリオデータが壊れて起動不能になる | High | Zod validation、Scenario Validation UI、default fallback |
| セーブ互換性が壊れる | High | versioned SaveData schema、migration tests |
| 日本語対応が後付けでUI崩壊する | Medium | 早期i18n導入、日本語E2E、viewport確認 |
| Tauri file APIがUIに漏れる | Medium | Repository interfaceで隔離 |
| Headlessが固定ルートに依存しすぎる | Medium | Graph-based explorerへ移行 |
| LocalAI provider差異で壊れる | Medium | OpenAI-compatible adapter、mock tests、provider failure handling |

## Open Questions

- 日本語タイトル/副題をどうするか。直訳の「黒碑の迷宮」は避ける方針。
- セーブ保存先は最初からTauri file APIにするか、localStorage fallbackを正式に残すか。
- Scenario packの配布形式をフォルダにするかzipにするか。
- LocalAIを正式サポート名として出すか、OpenAI-compatible local endpointとして抽象表現にするか。
- AI proposalの承認UIをMVP2で入れるか、当面は表示のみか。
- 戦闘をどこまでWizardry風に寄せるか。

## Recommended Next Step

最初に着手するべきはPhase 1です。

優先順:

1. `GameEvent`導入
2. SaveData schema
3. Save/Load Repository

理由:

- 日本語対応、LocalAI、外部シナリオ、町メニューのすべてが安定した状態管理に依存する。
- ここを固めるとHeadless検証の価値が上がる。
- 後続のUI変更が壊れても、GameEvent/SaveData/Headlessで検出できる。

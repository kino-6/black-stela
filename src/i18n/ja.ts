import type { Dictionary } from "./en";

export const ja = {
  app: {
    title: "Black Stela",
    subtitle: "街、隊列、迷宮、戦闘、帰還。AIは標準でオフです。"
  },
  locale: {
    label: "言語",
    en: "英語",
    ja: "日本語"
  },
  save: {
    controls: "保存操作",
    slot: "スロット",
    slotInput: "保存スロット",
    save: "保存",
    load: "読込",
    unavailable: "保存ストレージを利用できません。",
    saved: "{slot} に保存しました。",
    loaded: "{slot} を読み込みました。",
    slots: "{count} 件",
    corrupt: "破損した保存"
  },
  ai: {
    local: "ローカルAI",
    settings: "AI設定",
    enabled: "AIを有効化",
    disabled: "AIオフ",
    provider: "プロバイダー",
    none: "なし",
    ollama: "Ollama",
    openAiCompatible: "LocalAI互換",
    endpoint: "エンドポイント",
    model: "モデル",
    apiKey: "APIキー",
    invalidEndpoint: "エンドポイントURLが不正です。",
    settingsSaved: "AI設定を更新しました。",
    proposal: "AI提案",
    noProposal: "提案なし",
    rejected: "拒否",
    accepted: "採用可能"
  },
  debug: {
    heading: "デバッグ開始",
    visited: "踏破 {visited}/{total} · 状態 {phase}",
    progress: "進捗",
    ready: "街で準備済み",
    afterEncounter: "初戦後",
    clearReady: "帰還直前",
    loadProgress: "進捗を読込",
    headlessClear: "Headlessクリア",
    headlessStatus: "Headless clear: {reason} ({count} commands)"
  },
  party: {
    heading: "隊列",
    empty: "迷宮に入る前に冒険者を1人以上作成してください。",
    name: "名前",
    notes: "メモ",
    portrait: "肖像",
    portraitPreview: "選択した肖像のプレビュー",
    namePlaceholder: "プレイヤー作成の冒険者",
    notesPlaceholder: "来歴、誓い、傷跡、卓のメモ",
    noNotes: "まだメモはありません。",
    add: "冒険者を追加",
    hpAtk: "HP {hp}/{maxHp} · 攻撃 {attack}"
  },
  play: {
    town: "街",
    combat: "戦闘",
    safe: "安全",
    facing: "{direction}向き",
    townCopy:
      "ギルドホールの灯は低く燃えている。古い黒い石碑の下へ続く階段は、物語を持ち帰れる隊列を待っている。",
    enterDungeon: "迷宮に入る",
    combatDescription: "{enemy} が行く手を塞いでいる。",
    combatCommands: "戦闘コマンド",
    dungeonCommands: "迷宮コマンド",
    dungeonView: "一人称迷宮ビュー",
    turnLeft: "左を向く",
    turnRight: "右を向く",
    move: "進む",
    search: "探索",
    listen: "聞く",
    return: "帰還",
    attack: "攻撃",
    retreat: "退却",
    enemyHp: "敵HP {hp}"
  },
  map: {
    heading: "地図",
    noFloor: "階層なし",
    current: "現在地",
    town: "街",
    visited: "踏破済み",
    none: "なし",
    exits: "出口",
    knownExits: "既知の出口"
  },
  log: {
    heading: "冒険記録",
    replay: "描写を生成",
    empty: "確定イベントがここに表示されます。",
    turn: "ターン {turn}",
    narratorIdle: "語り手は待機中",
    requesting: "ローカル語り手に要求中...",
    rejected: "描写は拒否されました。",
    localProposal: "ローカル描写案",
    fallbackProposal: "代替描写"
  },
  direction: {
    north: "北",
    east: "東",
    south: "南",
    west: "西"
  }
} as const satisfies Dictionary;

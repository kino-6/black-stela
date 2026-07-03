import type { Dictionary } from "./en";

export const ja = {
  app: {
    title: "Black Stela"
  },
  locale: {
    label: "言語",
    en: "英語",
    ja: "日本語"
  },
  title: {
    menu: "タイトルメニュー",
    newGame: "新たな探索",
    continue: "続きから",
    config: "設定"
  },
  save: {
    controls: "保存操作",
    devControls: "開発用保存操作",
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
  debug: {
    heading: "デバッグ開始",
    visited: "探索 {visited}/{total} · 状態 {phase}",
    progress: "進捗",
    ready: "街で準備済み",
    afterEncounter: "初戦後",
    clearReady: "帰還直前",
    floorStart: "{floor} 開始",
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
    dungeon: "迷宮",
    combat: "戦闘",
    safe: "安全",
    facing: "{direction}向き",
    townCopy:
      "ギルドホールの灯は低く燃えている。古い黒い石碑の下へ続く階段は、物語を持ち帰れる隊列を待っている。",
    enterDungeon: "迷宮に入る",
    combatDescription: "{enemy} が行く手を塞いでいる。",
    combatCommands: "戦闘コマンド",
    battleScreen: "戦闘画面",
    round: "ラウンド {round}",
    enemyGroups: "敵群",
    partyFormation: "隊列",
    frontRow: "前衛",
    backRow: "後衛",
    selectOrder: "行動者と対象を選択。",
    selectedOrder: "{actor} → {target}",
    enemyGroupStatus: "残り {count} · HP {hp}",
    actorStatus: "HP {hp}/{maxHp} · {row}",
    resolveRound: "ラウンド解決",
    sleep: "睡眠",
    dungeonCommands: "迷宮コマンド",
    dungeonView: "一人称迷宮ビュー",
    turnLeft: "左を向く",
    turnRight: "右を向く",
    move: "進む",
    search: "探索",
    listen: "聞く",
    return: "帰還",
    attack: "攻撃",
    defend: "防御",
    useItem: "道具を使う",
    retreat: "退却",
    enemyHp: "敵HP {hp}"
  },
  town: {
    guild: "ギルド",
    recovery: "回復",
    records: "記録",
    entry: "迷宮入口",
    recoveryHeading: "回復",
    recordsHeading: "記録",
    recoverParty: "隊列を回復",
    recoverAll: "全員回復",
    logCount: "{count} 件の記録",
    inventory: "所持品"
  },
  tempo: {
    repeat: "リピート",
    autoCombat: "自動戦闘",
    autoMove: "自動探索",
    noRepeat: "繰り返すコマンドがありません。",
    repeatBlocked: "ここでは直前のコマンドを繰り返せません。",
    repeated: "直前のコマンドを繰り返しました。",
    autoStoppedClear: "自動戦闘停止: 戦闘が終了しました。",
    autoStoppedBoss: "自動停止: ボス/中ボスは手動操作が必要です。",
    autoStoppedDanger: "自動停止: 隊列の危険を検知しました。",
    autoStoppedLimit: "自動停止: 手数上限に達しました。",
    autoMoveStoppedEvent: "自動移動停止: 注目イベントまたは危険状態です。",
    autoMoveStoppedBranch: "自動移動停止: 分岐または未知の経路です。"
  },
  map: {
    heading: "周辺",
    noFloor: "階層なし",
    current: "現在地",
    town: "街",
    miniMap: "ミニマップ",
    paths: "通路",
    visited: "記録済み",
    open: "通路",
    unseen: "未確認",
    wall: "壁",
    unknown: "不明"
  },
  visual: {
    visible: "見えているもの",
    door: "扉",
    trap: "罠",
    stairs: "階段"
  },
  log: {
    empty: "確定イベントがここに表示されます。",
    turn: "ターン {turn}"
  },
  direction: {
    north: "北",
    east: "東",
    south: "南",
    west: "西"
  },
  scenario: {
    validation: "シナリオ検証",
    blocked: "シナリオを開始できません。",
    warnings: "シナリオ警告",
    error: "エラー",
    warning: "警告",
    file: "ファイル",
    field: "項目",
    reason: "理由"
  }
} as const satisfies Dictionary;

#!/usr/bin/env bash
# Black Stela — the single entry point. 起動方法を覚えなくても運用できるようにするランチャ。
#
#   ./run.sh                  引数なし → メニュー（何も覚えていなくてよい）
#   ./run.sh play [開始地点]   ゲームを起動
#   ./run.sh gate [名前]       ゲートを実行（名前なしなら一覧から選ぶ）
#   ./run.sh help             全コマンド
#
# 方針: 覚えるのは `./run.sh` だけ。fixture / gate / verify / capture の一覧は
# コードから毎回導出するので、この台本が古くなって嘘をつくことはない。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------- output helpers
if [ -t 1 ]; then
  B=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; CYA=$'\033[36m'; N=$'\033[0m'
else
  B=""; DIM=""; RED=""; GRN=""; YEL=""; CYA=""; N=""
fi
say()  { printf '%s\n' "$*"; }
info() { printf '%s\n' "${CYA}▸${N} $*"; }
warn() { printf '%s\n' "${YEL}!${N} $*" >&2; }
die()  { printf '%s\n' "${RED}✗${N} $*" >&2; exit 1; }
step() { printf '%s\n' "${DIM}\$ $*${N}"; "$@"; }

NO_EXPORT=0

# ---------------------------------------------------------------- discovery
# fixture 名は debug_fixtures.gd から導出する（追加しても run.sh を直さなくてよい）
fixtures() {
  local f="godot/scripts/debug_fixtures.gd" lo hi
  [ -f "$f" ] || return 0
  awk '
    /^const TRACES := \{/           { t = 1; next }
    t && /^\}/                      { t = 0; next }
    t && match($0, /"[a-z0-9_]+"[ \t]*:/) { s = substr($0, RSTART + 1); sub(/".*/, "", s); print s; next }
    /^const (VERDANT_CHAMBER_FIXTURES|STAIR_FIXTURES|COMBAT_FIXTURES|BASE_FIXTURES) :=/ {
      n = split($0, p, "\""); for (i = 2; i <= n; i += 2) print p[i]; next }
  ' "$f"
  if grep -q 'floor_%d' "$f"; then
    lo="$(grep -o 'range([0-9]*, *[0-9]*)' "$f" | head -1 | sed 's/[^0-9 ]//g' | awk '{print $1}')"
    hi="$(grep -o 'range([0-9]*, *[0-9]*)' "$f" | head -1 | sed 's/[^0-9 ]//g' | awk '{print $2}')"
    [ -n "${lo:-}" ] && seq "$lo" "$((hi - 1))" | sed 's/^/floor_/'
  fi
}

# npm の gate:* / play:* スクリプトは package.json から導出する
npm_scripts() {  # $1 = prefix
  node -e '
    const s = require("./package.json").scripts || {};
    for (const k of Object.keys(s)) if (k.startsWith(process.argv[1])) console.log(k.slice(process.argv[1].length) + "\t" + s[k]);
  ' "$1"
}

gd_tests() { ls godot/tests/"$1"_*.gd 2>/dev/null | sed "s|godot/tests/$1_||; s|\.gd$||"; }

# 短い別名 → 正式な fixture 名
resolve_fixture() {
  local want="$1"
  case "$want" in
    combat)        want="terminal_line_combat" ;;
    base)          want="terminal_line_base" ;;
    late)          want="terminal_line_late" ;;
    down|stair)    want="terminal_line_down_stair" ;;
    up)            want="terminal_line_up_stair" ;;
    chamber)       want="verdant_chamber_closed" ;;
    cleared)       want="verdant_chamber_cleared" ;;
    [0-9]|[0-9][0-9]) want="floor_$want" ;;
  esac
  # 一度変数に受けてから照合する。`fixtures | grep -q` は grep が早期終了して SIGPIPE を起こし、
  # pipefail のせいで「見つからなかった」と誤判定するため。
  local all; all="$(fixtures)"
  if ! printf '%s\n' "$all" | grep -qx "$want"; then
    warn "開始地点 '$1' は存在しません。使えるのは:"
    printf '%s\n' "$all" | sed 's/^/    /' >&2
    exit 1
  fi
  printf '%s\n' "$want"
}

# ---------------------------------------------------------------- preflight
need_godot() {
  command -v godot >/dev/null 2>&1 || die "godot が PATH にありません（Godot 4.7.1 が必要）: brew install godot"
  local v; v="$(godot --version 2>/dev/null | head -1)"
  case "$v" in 4.7.1*) ;; *) warn "Godot $v — このリポジトリは 4.7.1 前提です" ;; esac
}

need_deps() {
  command -v node >/dev/null 2>&1 || die "node がありません（Node.js 22 以上）"
  [ -d node_modules ] || { info "node_modules がないので npm install します"; step npm install; }
}

STAMP=".tmp/run-export.stamp"
export_stale() {
  [ -d godot/data ] || return 0
  [ -f "$STAMP" ] || return 0
  [ -n "$(find src content scripts package.json -newer "$STAMP" -type f -print -quit 2>/dev/null)" ]
}

# データブリッジ（godot/data）を必要なときだけ焼き直す。--fast で常にスキップ。
need_export() {
  need_deps
  if [ "$NO_EXPORT" = 1 ]; then info "エクスポートはスキップ（--fast）"; return 0; fi
  if export_stale; then
    info "TS 側が更新されているのでデータブリッジを再エクスポートします"
    step npm run export:godot
    mkdir -p .tmp && : > "$STAMP"
  else
    info "データブリッジは最新（再エクスポート不要）"
  fi
}

# ---------------------------------------------------------------- commands
PLAYLOG="$ROOT/.tmp/playtest/records.jsonl"

cmd_play() {
  local fixture="${1:-}"
  # 名前の検証は先に。数十秒のエクスポートを走らせてから typo で落ちるのは最悪。
  [ -n "$fixture" ] && fixture="$(resolve_fixture "$fixture")"
  need_godot; need_export
  mkdir -p "$(dirname "${PLAYLOG}")"
  # 人間のプレイは貴重なので、開発ビルドのプレイは黙って PlayLog に残す（./run.sh log で読める）。
  local flags=(--playtest-log "${PLAYLOG}")
  [ -n "$fixture" ] && flags+=(--fixture "$fixture")
  info "起動: ${fixture:-通常プレイ（タイトルから）}   ${DIM}PlayLog → .tmp/playtest/records.jsonl${N}"
  step godot --path godot/ -- "${flags[@]}"
}

# 直近のプレイ記録を読む。1 行 = 1 回の潜行（コマンド列つき）。
cmd_log() {
  local n="${1:-3}"
  [ -s "${PLAYLOG}" ] || die "まだ記録がありません（${PLAYLOG}）。./run.sh play で 1 回遊べば書き出されます"
  info "${PLAYLOG}  （$(wc -l < "${PLAYLOG}" | tr -d " ") 件 / 直近 $n 件を表示）"
  tail -n "$n" "${PLAYLOG}" | node -e '
    let raw = ""; process.stdin.on("data", d => raw += d).on("end", () => {
      for (const line of raw.trim().split("\n")) {
        const r = JSON.parse(line);
        const v = r.lastVisibleState || {};
        console.log(`\n■ ${r.worldId}  ${r.result}${r.returnReason ? " (" + r.returnReason + ")" : ""}  ${r.elapsedSeconds}s  ${r.stepCount ?? (r.steps || []).length} コマンド`);
        console.log(`  最後の場所: ${v.phase} ${v.floorId || "-"} ${v.cellId || "-"}`);
        console.log(`  行動種別  : ${(r.commandFamilies || []).join(", ") || "-"}`);
        const steps = r.steps || [];
        if (steps.length) {
          const line2 = steps.map(s => `${s.t}s ${s.cmd}`).join(" → ");
          console.log(`  手順      : ${line2.length > 900 ? line2.slice(0, 900) + " …" : line2}`);
        }
      }
    });
  '
}

cmd_gate() {
  local name="${1:-}"
  if [ -z "$name" ]; then
    name="$(pick "実行するゲート" "$(npm_scripts 'gate:' | cut -f1)")" || return 0
  fi
  name="${name#gate:}"
  local all; all="$(npm_scripts 'gate:' | cut -f1)"
  printf '%s\n' "$all" | grep -qx "$name" || {
    warn "gate:$name はありません。使えるのは:"; printf '%s\n' "$all" | sed 's/^/    /' >&2; exit 1; }
  need_deps
  case "$name" in *ux-parity|migration|godot|ci|play|controller|first-*|debug-start|landmark-vis|font|i18n|fixtures|chambers|prefs|package-smoke|title-asset|playtest-record) need_godot ;; esac
  step npm run "gate:$name"
}

cmd_verify() {  # 任意の godot/tests/verify_*.gd を headless で回す
  local name="${1:-}"
  [ -n "$name" ] || name="$(pick "verify スクリプト" "$(gd_tests verify)")" || return 0
  [ -f "godot/tests/verify_${name}.gd" ] || die "godot/tests/verify_${name}.gd がありません"
  need_godot; need_export
  step godot --headless --path godot/ --script "res://tests/verify_${name}.gd" -- --background
}

cmd_capture() {  # 画面の PNG 証跡。--headless では絵が撮れないので必ず windowed
  local name="${1:-}"
  [ -n "$name" ] || name="$(pick "capture スクリプト" "$(gd_tests capture)")" || return 0
  [ -f "godot/tests/capture_${name}.gd" ] || die "godot/tests/capture_${name}.gd がありません"
  need_godot; need_export
  info "windowed で実行します（--headless では絵が撮れないため）。${DIM}画面とフォーカスは奪いません${N}"
  step godot --path godot/ --script "res://tests/capture_${name}.gd" -- --background
}

# Playwright のブラウザはリポジトリに入らない別インストール。未導入だと gate:final は 140 件全部
# `browserType.launch` で落ちる — コードの赤ではないので、走らせる前に見分けて直し方を出す。
browser_dir() {
  printf '%s\n' "${PLAYWRIGHT_BROWSERS_PATH:-$HOME/Library/Caches/ms-playwright}"
}
have_browser() {
  local d; d="$(browser_dir)"
  [ -d "$d" ] && [ -n "$(find "$d" -maxdepth 1 -name 'chromium*' -print -quit 2>/dev/null)" ]
}
need_browser() {
  have_browser || die "Playwright の chromium が未インストールです（$(browser_dir)）。
    先にこれを 1 度だけ実行してください: ${B}npx playwright install chromium${N}
    ※ 約 130MB のダウンロードなので run.sh は自動では取りに行きません"
}

cmd_check() { need_deps; step npm run gate:prepush; }
cmd_test()  { need_deps; step npm run test; }
cmd_final() { need_deps; need_browser; step npm run gate:final; }
cmd_export(){ need_deps; step npm run export:godot; mkdir -p .tmp && : > "$STAMP"; }
cmd_dev()   { need_deps; info "React は UX 参照用のアーカイブです（出荷面は Godot）"; step npm run dev; }
cmd_package(){ need_deps; need_godot; step npm run package; }

data_status() {
  [ -d godot/data ] || { echo '未生成 → 起動時に自動生成します'; return; }
  export_stale && echo '要再エクスポート（起動時に自動）' || echo '最新'
}

cmd_doctor() {
  say "${B}環境チェック${N}"
  printf '  node    : %s\n' "$(command -v node >/dev/null && node --version || echo '${RED}なし${N}')"
  printf '  npm     : %s\n' "$(command -v npm  >/dev/null && npm --version  || echo 'なし')"
  printf '  godot   : %s\n' "$(command -v godot >/dev/null && godot --version 2>/dev/null | head -1 || echo 'なし（4.7.1 が必要）')"
  printf '  deps    : %s\n' "$([ -d node_modules ] && echo 'node_modules あり' || echo '未インストール → ./run.sh play が自動で入れます')"
  printf '  data    : %s\n' "$(data_status)"
  printf '  branch  : %s\n' "$(git branch --show-current 2>/dev/null || echo '-')"
  printf '  e2e     : %s\n' "$(have_browser && echo 'chromium あり（gate:final 実行可）' || echo '未導入 → npx playwright install chromium')"
  printf '  playlog : %s\n' "$([ -s "${PLAYLOG}" ] && echo "$(wc -l < "${PLAYLOG}" | tr -d ' ') 件（./run.sh log）" || echo 'まだなし（プレイすると自動で記録）')"
  say ""
  say "  開始地点 : $(fixtures | wc -l | tr -d ' ') 個   ゲート: $(npm_scripts 'gate:' | wc -l | tr -d ' ') 個"
}

cmd_list() {
  say "${B}開始地点 (./run.sh play <名前>)${N}"
  fixtures | sed 's/^/  /'
  say ""
  say "  ${DIM}短縮形: combat / base / late / stair / up / chamber / cleared / 2〜10${N}"
  say ""
  say "${B}ゲート (./run.sh gate <名前>)${N}"
  npm_scripts 'gate:' | awk -F'\t' '{ printf "  %-18s %.70s\n", $1, $2 }'
}

usage() {
  cat <<EOF
${B}Black Stela — ./run.sh${N}   ${DIM}覚えるのはこの 1 本だけ${N}

  ${B}./run.sh${N}                    メニューを出す（何も覚えていなくてよい）

  ${B}play${N} [開始地点]            ゲームを起動。例: ./run.sh play combat / play late / play 5
  ${B}list${N}                      開始地点とゲートの一覧
  ${B}gate${N} [名前]                ゲートを実行（名前なし → 一覧から選ぶ）
  ${B}check${N}                     push 前の速い検証（typecheck + unit を並列）
  ${B}test${N}                      ユニットテストだけ
  ${B}final${N}                     gate:final（真実を語る唯一のゲート）
  ${B}verify${N} [名前]              godot/tests/verify_*.gd を headless 実行
  ${B}capture${N} [名前]             godot/tests/capture_*.gd を windowed 実行（PNG 証跡）
  ${B}log${N} [件数]                直近のプレイ記録（PlayLog）を読む
  ${B}export${N}                    データブリッジ（godot/data）を再生成
  ${B}dev${N}                       Vite（React は UX 参照アーカイブ）
  ${B}package${N}                   Web / macOS ビルド
  ${B}doctor${N}                    godot / node / 依存 / データの状態を見る

  ${DIM}--fast (-f)  起動前のエクスポートを常にスキップ${N}
EOF
}

# ---------------------------------------------------------------- menu
# $1 = 見出し, $2 = 改行区切りの選択肢。選ばれた値を stdout に返す。
pick() {
  local title="$1" opts="$2" i=1 line choice
  say "${B}$title${N}" >&2
  while IFS= read -r line; do printf '  %2d) %s\n' "$i" "$line" >&2; i=$((i + 1)); done <<< "$opts"
  printf '   %s> %s' "$DIM" "$N" >&2
  read -r choice || return 1
  [ -n "$choice" ] || return 1
  case "$choice" in
    [0-9]*) printf '%s\n' "$opts" | sed -n "${choice}p" ;;
    *)      printf '%s\n' "$choice" ;;
  esac
}

menu() {
  say ""
  say "${B}Black Stela${N} ${DIM}— ./run.sh（番号を選ぶ / q で終了）${N}"
  say ""
  say "   ${GRN}1${N}) 遊ぶ                通常プレイで起動"
  say "   ${GRN}2${N}) 開始地点を選んで遊ぶ  戦闘 / 拠点 / 深層など好きな場所から"
  say "   ${GRN}3${N}) push 前チェック       typecheck + ユニット（速い）"
  say "   ${GRN}4${N}) ゲートを実行          gate:* から選ぶ"
  say "   ${GRN}5${N}) final ゲート          gate:final（唯一の真実）"
  say "   ${GRN}6${N}) 画面を撮る            capture_*.gd で PNG 証跡"
  say "   ${GRN}7${N}) プレイ記録を読む      直近の PlayLog（自動保存）"
  say "   ${GRN}8${N}) 一覧を見る            開始地点とゲート"
  say "   ${GRN}9${N}) 環境チェック          godot / node / データの状態"
  say ""
  printf '   %s選択> %s' "$DIM" "$N"
  local c; read -r c || exit 0
  say ""
  case "$c" in
    1) cmd_play ;;
    2) local f; f="$(pick "開始地点" "$(fixtures)")" && cmd_play "$f" ;;
    3) cmd_check ;;
    4) cmd_gate ;;
    5) cmd_final ;;
    6) cmd_capture ;;
    7) cmd_log ;;
    8) cmd_list ;;
    9) cmd_doctor ;;
    q|Q|"") exit 0 ;;
    *) warn "そんな番号はありません"; exit 1 ;;
  esac
}

# ---------------------------------------------------------------- dispatch
ARGS=()
for a in "$@"; do
  case "$a" in
    --fast|-f) NO_EXPORT=1 ;;
    *) ARGS+=("$a") ;;
  esac
done
set -- ${ARGS+"${ARGS[@]}"}

case "${1:-}" in
  "")                     menu ;;
  play|p)                 shift; cmd_play "${1:-}" ;;
  list|ls|fixtures)       cmd_list ;;
  gate|g)                 shift; cmd_gate "${1:-}" ;;
  check|prepush)          cmd_check ;;
  test|unit)              cmd_test ;;
  final)                  cmd_final ;;
  verify|v)               shift; cmd_verify "${1:-}" ;;
  capture|cap)            shift; cmd_capture "${1:-}" ;;
  log|playlog)            shift; cmd_log "${1:-}" ;;
  export)                 cmd_export ;;
  dev)                    cmd_dev ;;
  package)                cmd_package ;;
  doctor|env)             cmd_doctor ;;
  help|-h|--help)         usage ;;
  *)                      warn "不明なコマンド: $1"; say ""; usage; exit 1 ;;
esac

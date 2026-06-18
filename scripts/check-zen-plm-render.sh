#!/usr/bin/env bash
set -euo pipefail

URL="${DRAMA_VERIFY_URL:-http://127.0.0.1:3198/app/plm?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198}"
OUTPUT="${DRAMA_VERIFY_SCREENSHOT:-tmp/verification/zen-plm-first-viewport.png}"
DOM_OUTPUT=""
BROWSER="${DRAMA_VERIFY_BROWSER:-}"
WINDOW_SIZE="${DRAMA_VERIFY_WINDOW_SIZE:-1440,900}"
VIRTUAL_TIME_BUDGET="${DRAMA_VERIFY_VIRTUAL_TIME_BUDGET:-7000}"

usage() {
  cat <<'EOF'
Usage: check-zen-plm-render.sh [--url URL] [--output PATH] [--dom PATH] [--browser PATH]

Captures the PLM first viewport with a Chromium-family browser and fails if the
rendered DOM looks like raw JSON, a stack trace, browser-default document flow,
or a page that never mounted the Drama/PLM shell.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --dom) DOM_OUTPUT="$2"; shift 2 ;;
    --browser) BROWSER="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$DOM_OUTPUT" ]]; then
  DOM_OUTPUT="${OUTPUT%.*}.dom.html"
fi

find_browser() {
  local candidates=(
    "$BROWSER"
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
}

json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

emit_json() {
  local ok="$1"
  local status="$2"
  local reason="$3"
  local escaped_reason escaped_url escaped_output escaped_dom escaped_browser
  escaped_reason="$(printf '%s' "$reason" | json_escape)"
  escaped_url="$(printf '%s' "$URL" | json_escape)"
  escaped_output="$(printf '%s' "$OUTPUT" | json_escape)"
  escaped_dom="$(printf '%s' "$DOM_OUTPUT" | json_escape)"
  escaped_browser="$(printf '%s' "$BROWSER" | json_escape)"
  cat <<EOF
{
  "ok": $ok,
  "status": "$status",
  "reason": $escaped_reason,
  "url": $escaped_url,
  "screenshot": $escaped_output,
  "dom": $escaped_dom,
  "browser": $escaped_browser
}
EOF
}

fail() {
  emit_json false "failed" "$1"
  exit 1
}

BROWSER="$(find_browser || true)"
if [[ -z "$BROWSER" ]]; then
  fail "No Brave, Chrome, Chrome Canary, or Chromium executable was found."
fi

mkdir -p "$(dirname "$OUTPUT")" "$(dirname "$DOM_OUTPUT")"

"$BROWSER" \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --window-size="$WINDOW_SIZE" \
  --virtual-time-budget="$VIRTUAL_TIME_BUDGET" \
  --screenshot="$OUTPUT" \
  "$URL" >/tmp/zen-plm-screenshot.log 2>&1 || fail "Headless screenshot capture failed. See /tmp/zen-plm-screenshot.log."

"$BROWSER" \
  --headless=new \
  --disable-gpu \
  --window-size="$WINDOW_SIZE" \
  --virtual-time-budget="$VIRTUAL_TIME_BUDGET" \
  --dump-dom \
  "$URL" >"$DOM_OUTPUT" 2>/tmp/zen-plm-dom.log || fail "Headless DOM capture failed. See /tmp/zen-plm-dom.log."

[[ -s "$OUTPUT" ]] || fail "Screenshot file was not created."
[[ -s "$DOM_OUTPUT" ]] || fail "DOM file was not created."

if command -v stat >/dev/null 2>&1; then
  SIZE="$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null || printf '0')"
  [[ "$SIZE" -gt 12000 ]] || fail "Screenshot is too small to prove a styled first viewport."
fi

if command -v sips >/dev/null 2>&1; then
  DIMENSIONS="$(sips -g pixelWidth -g pixelHeight "$OUTPUT" 2>/dev/null || true)"
  WIDTH="$(printf '%s\n' "$DIMENSIONS" | awk '/pixelWidth/ {print $2}' | tail -1)"
  HEIGHT="$(printf '%s\n' "$DIMENSIONS" | awk '/pixelHeight/ {print $2}' | tail -1)"
  [[ "${WIDTH:-0}" -ge 800 && "${HEIGHT:-0}" -ge 600 ]] || fail "Screenshot dimensions are below the PLM first-viewport threshold."
fi

if grep -Eiq 'Unhandled Runtime Error|ReferenceError|SyntaxError|TypeError:|Stack trace|<pre[^>]*>[[:space:]]*[\{\[]|<body[^>]*>[[:space:]]*[\{\[]' "$DOM_OUTPUT"; then
  fail "Rendered DOM contains raw JSON, a stack trace, or a browser-default error body."
fi

if ! grep -Eq 'data-drama-shell="workbench"|data-plm-failure=|data-drama-style-state=|Zen PLM Integration Contract|Runtime unavailable|Codex auth required|Workspace missing' "$DOM_OUTPUT"; then
  fail "Rendered DOM does not contain a Drama shell, PLM failure panel, or styled critical fallback marker."
fi

emit_json true "passed" "PLM first viewport rendered as a styled Drama surface or styled failure state."

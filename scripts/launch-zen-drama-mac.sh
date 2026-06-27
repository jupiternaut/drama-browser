#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ZEN_APP="${ZEN_APP:-}"
PROFILE_DIR="${ZEN_DRAMA_PROFILE:-$HOME/Library/Application Support/DramaBrowser/profile-main}"
SURFACE="${ZEN_DRAMA_SURFACE:-start}"
RUNTIME_URL="${DRAMA_RUNTIME_URL:-http://127.0.0.1:3198}"
WAIT_FOR_EXIT=0
NO_RUNTIME_LAUNCH=0
INTERNAL_APP_MODE="${ZEN_DRAMA_INTERNAL_APP:-auto}"
PLM_LAUNCH_TIMEOUT_SECONDS="${ZEN_DRAMA_PLM_LAUNCH_TIMEOUT_SECONDS:-45}"

usage() {
  cat <<'EOF'
Usage: launch-zen-drama-mac.sh [--zen-app PATH] [--profile PATH] [--surface start|graph|plm|crew]
                               [--runtime-url URL] [--internal-app true|false|auto]
                               [--no-runtime-launch] [--wait]
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --zen-app) ZEN_APP="$2"; shift 2 ;;
    --profile) PROFILE_DIR="$2"; shift 2 ;;
    --surface) SURFACE="$2"; shift 2 ;;
    --runtime-url) RUNTIME_URL="$2"; shift 2 ;;
    --internal-app) INTERNAL_APP_MODE="$2"; shift 2 ;;
    --no-runtime-launch) NO_RUNTIME_LAUNCH=1; shift ;;
    --wait) WAIT_FOR_EXIT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

case "$SURFACE" in
  start|graph|plm|crew) ;;
  *) echo "Invalid surface: $SURFACE" >&2; exit 2 ;;
esac

find_zen_app() {
  local candidates=(
    "$ZEN_APP"
    "/Applications/Zen Browser.app"
    "$HOME/Applications/Zen Browser.app"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -n "$candidate" && -d "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
}

adopt_plotpilot_runtime() {
  local deadline response
  deadline=$((SECONDS + PLM_LAUNCH_TIMEOUT_SECONDS))
  while (( SECONDS < deadline )); do
    response="$(
      curl -fsS -X POST "$RUNTIME_URL/runtime/rpc" \
        -H 'content-type: application/json' \
        --data '{"channel":"plotpilot:runtime:start","payload":{"preferExisting":true}}' 2>/dev/null || true
    )"
    if [[ -n "$response" ]] && python3 -c 'import json,sys; body=json.load(sys.stdin); data=body.get("data") or {}; sys.exit(0 if body.get("ok") and data.get("healthy") is True else 1)' <<<"$response" 2>/dev/null; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

ZEN_APP="$(find_zen_app || true)"
if [[ -z "$ZEN_APP" ]]; then
  echo "Zen Browser.app was not found. Product-path Zen PLM validation is blocked; set ZEN_APP or pass --zen-app for a real Zen Browser app/build." >&2
  exit 1
fi

mkdir -p "$PROFILE_DIR"
USER_JS="$PROFILE_DIR/user.js"
INTERNAL_APP_ENABLED="false"

if [[ "$INTERNAL_APP_MODE" == "true" ]]; then
  INTERNAL_APP_ENABLED="true"
elif [[ "$INTERNAL_APP_MODE" == "auto" ]]; then
  if [[ -f "$ZEN_APP/Contents/Resources/browser/chrome/browser/content/browser/drama/app/index.html" ]]; then
    INTERNAL_APP_ENABLED="true"
  fi
fi

cat > "$USER_JS" <<EOF
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.shell.didSkipDefaultBrowserCheckOnFirstRun", true);
user_pref("zen.drama.base-url", "${RUNTIME_URL}/app");
user_pref("zen.drama.runtime-url", "${RUNTIME_URL}");
user_pref("zen.drama.internal-app.enabled", ${INTERNAL_APP_ENABLED});
user_pref("zen.drama.internal-app-url", "chrome://browser/content/drama/app/index.html");
user_pref("zen.drama.runtime-launch.enabled", $([[ "$NO_RUNTIME_LAUNCH" == "1" ]] && echo false || echo true));
user_pref("zen.drama.runtime-launch.command", "/bin/bash");
user_pref("zen.drama.runtime-launch.args", "[\\"$REPO_ROOT/scripts/launch-drama-runtime.sh\\"]");
user_pref("zen.drama.runtime-launch.cwd", "$REPO_ROOT");
user_pref("zen.drama.open-on-startup", true);
user_pref("zen.drama.start-surface", "$SURFACE");
EOF

ENCODED_RUNTIME="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$RUNTIME_URL")"
if [[ "$INTERNAL_APP_ENABLED" == "true" ]]; then
  DRAMA_DOCUMENT_URI="chrome://browser/content/drama/app/index.html?host=zen&runtime=${ENCODED_RUNTIME}&surface=${SURFACE}"
else
  DRAMA_DOCUMENT_URI="${RUNTIME_URL}/app/${SURFACE}?host=zen&runtime=${ENCODED_RUNTIME}&surface=${SURFACE}"
fi

if [[ "$NO_RUNTIME_LAUNCH" == "0" && "$SURFACE" != "start" ]]; then
  "$REPO_ROOT/scripts/launch-drama-runtime.sh"
  if [[ "$SURFACE" == "plm" ]]; then
    "$REPO_ROOT/scripts/launch-plotpilot-sidecar-mac.sh"
    if ! adopt_plotpilot_runtime; then
      echo "PlotPilot sidecar is not healthy through the Drama runtime at $RUNTIME_URL." >&2
      exit 1
    fi
  fi
fi

OPEN_ARGS=(-n -a "$ZEN_APP" --args -profile "$PROFILE_DIR" -no-remote)
if [[ "$WAIT_FOR_EXIT" == "1" ]]; then
  open -W "${OPEN_ARGS[@]}"
else
  open "${OPEN_ARGS[@]}"
  sleep 0.8
  open -a "$ZEN_APP" "$DRAMA_DOCUMENT_URI" >/tmp/zen-drama-open-url.log 2>&1 || true
fi

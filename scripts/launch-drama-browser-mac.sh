#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DRAMA_APP="${DRAMA_BROWSER_APP:-$REPO_ROOT/dist/zen-drama-mac/Drama Browser.app}"
PROFILE_DIR="${DRAMA_BROWSER_PROFILE:-$HOME/Library/Application Support/DramaBrowser/profile-main}"
SURFACE="${DRAMA_BROWSER_SURFACE:-start}"
RUNTIME_URL="${DRAMA_RUNTIME_URL:-http://127.0.0.1:3198}"
WAIT_FOR_EXIT=0
NO_RUNTIME_LAUNCH=0
INTERNAL_APP_MODE="${DRAMA_BROWSER_INTERNAL_APP:-auto}"
PLM_LAUNCH_TIMEOUT_SECONDS="${DRAMA_BROWSER_PLM_LAUNCH_TIMEOUT_SECONDS:-45}"

usage() {
  cat <<'EOF'
Usage: launch-drama-browser-mac.sh [--drama-app PATH] [--profile PATH] [--surface start|graph|plm|crew|memory]
                                   [--runtime-url URL] [--internal-app true|false|auto]
                                   [--no-runtime-launch] [--wait]

Launches the packaged Drama Browser app by bundle path. This script intentionally
does not fall back to /Applications/Zen Browser.app and does not ask
LaunchServices to resolve the Drama URL through a browser URL handler.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --drama-app) DRAMA_APP="$2"; shift 2 ;;
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
  start|graph|plm|crew|memory) ;;
  *) echo "Invalid surface: $SURFACE" >&2; exit 2 ;;
esac

if [[ ! -d "$DRAMA_APP" ]]; then
  echo "Drama Browser.app was not found at $DRAMA_APP. Build or package it first." >&2
  exit 1
fi
DRAMA_APP_BUNDLE="${DRAMA_APP%/}/"

INFO_PLIST="$DRAMA_APP/Contents/Info.plist"
BUNDLE_ID="$(plutil -extract CFBundleIdentifier raw -o - "$INFO_PLIST" 2>/dev/null || true)"
if [[ "$BUNDLE_ID" != "app.drama-browser.local" ]]; then
  echo "Refusing to launch a non-Drama bundle: $DRAMA_APP has CFBundleIdentifier=$BUNDLE_ID" >&2
  exit 1
fi

EXECUTABLE_NAME="$(plutil -extract CFBundleExecutable raw -o - "$INFO_PLIST" 2>/dev/null || true)"
if [[ -z "$EXECUTABLE_NAME" ]]; then
  echo "Could not resolve CFBundleExecutable for $DRAMA_APP." >&2
  exit 1
fi

DRAMA_EXECUTABLE="$DRAMA_APP/Contents/MacOS/$EXECUTABLE_NAME"
if [[ ! -x "$DRAMA_EXECUTABLE" ]]; then
  echo "Drama Browser executable is not runnable: $DRAMA_EXECUTABLE" >&2
  exit 1
fi

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

mkdir -p "$PROFILE_DIR"
USER_JS="$PROFILE_DIR/user.js"
INTERNAL_APP_ENABLED="false"

if [[ "$INTERNAL_APP_MODE" == "true" ]]; then
  INTERNAL_APP_ENABLED="true"
elif [[ "$INTERNAL_APP_MODE" == "auto" ]]; then
  if [[ -f "$DRAMA_APP/Contents/Resources/browser/chrome/browser/content/browser/drama/app/index.html" ]]; then
    INTERNAL_APP_ENABLED="true"
  fi
fi

cat > "$USER_JS" <<EOF
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.shell.didSkipDefaultBrowserCheckOnFirstRun", true);
user_pref("drama.browser.base-url", "${RUNTIME_URL}/app");
user_pref("drama.browser.runtime-url", "${RUNTIME_URL}");
user_pref("drama.browser.internal-app.enabled", ${INTERNAL_APP_ENABLED});
user_pref("drama.browser.internal-app-url", "chrome://browser/content/drama/app/index.html");
user_pref("drama.browser.runtime-launch.enabled", $([[ "$NO_RUNTIME_LAUNCH" == "1" ]] && echo false || echo true));
user_pref("drama.browser.runtime-launch.command", "/bin/bash");
user_pref("drama.browser.runtime-launch.args", "[\\"$REPO_ROOT/scripts/launch-drama-runtime.sh\\"]");
user_pref("drama.browser.runtime-launch.cwd", "$REPO_ROOT");
user_pref("drama.browser.open-on-startup", true);
user_pref("drama.browser.start-surface", "$SURFACE");
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

if [[ "$WAIT_FOR_EXIT" == "1" ]]; then
  open -W -n "$DRAMA_APP_BUNDLE" --args -profile "$PROFILE_DIR" -no-remote
  exit $?
fi

open -n "$DRAMA_APP_BUNDLE" --args -profile "$PROFILE_DIR" -no-remote

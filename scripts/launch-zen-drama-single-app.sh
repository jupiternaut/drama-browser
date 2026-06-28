#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${ZEN_DRAMA_REPO_ROOT:-/Users/gengrf/drama-browser}"
RUNTIME_URL="${DRAMA_RUNTIME_URL:-http://127.0.0.1:3198}"
PROFILE_DIR="${ZEN_DRAMA_PROFILE:-/Users/gengrf/Library/Application Support/ZenDrama/profile-main}"
ZEN_RUNTIME_BUNDLE="${ZEN_DRAMA_RUNTIME_BUNDLE:-$REPO_ROOT/dist/zen-drama-runtime.noindex/Zen Browser.app}"
ZEN_BIN="$ZEN_RUNTIME_BUNDLE/Contents/MacOS/zen"
PINNED_ENTRY_STYLE="${ZEN_DRAMA_PINNED_ENTRY_STYLE:-jade}"

echo "launch-zen-drama-single-app.sh is a legacy Zen/Gecko adapter launcher. Use launch-drama-browser-mac.sh for Drama Browser product launches." >&2

if [[ ! -x "$ZEN_BIN" ]]; then
  echo "Zen Drama runtime binary is missing: $ZEN_BIN" >&2
  exit 1
fi

mkdir -p "$PROFILE_DIR"
cat > "$PROFILE_DIR/user.js" <<EOF
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.shell.didSkipDefaultBrowserCheckOnFirstRun", true);
user_pref("browser.startup.page", 1);
user_pref("browser.startup.homepage", "about:blank");
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("sidebar.visibility", "always-show");
user_pref("sidebar.expandOnHover", false);
user_pref("zen.view.sidebar-expanded", true);
user_pref("zen.urlbar.open-on-startup", false);
user_pref("zen.drama.base-url", "${RUNTIME_URL}/app");
user_pref("zen.drama.runtime-url", "${RUNTIME_URL}");
user_pref("zen.drama.internal-app.enabled", true);
user_pref("zen.drama.internal-app-url", "chrome://browser/content/drama/app/index.html");
user_pref("zen.drama.runtime-launch.enabled", true);
user_pref("zen.drama.runtime-launch.command", "/bin/bash");
user_pref("zen.drama.runtime-launch.args", "[\"$REPO_ROOT/scripts/launch-drama-runtime.sh\"]");
user_pref("zen.drama.runtime-launch.cwd", "$REPO_ROOT");
user_pref("zen.drama.open-on-startup", true);
user_pref("zen.drama.start-surface", "plm");
user_pref("zen.drama.pinned-entry-style", "$PINNED_ENTRY_STYLE");
EOF

"$REPO_ROOT/scripts/launch-drama-runtime.sh"

ZEN_PROCESS_PATTERN="[z]en-drama-runtime\\.noindex/Zen Browser\\.app/Contents/MacOS/zen.*ZenDrama/profile-main"
if pgrep -f "$ZEN_PROCESS_PATTERN" >/dev/null 2>&1; then
  osascript -e 'tell application "Zen Browser" to activate' >/dev/null 2>&1 || true
  exit 0
fi

rm -f "$PROFILE_DIR/.parentlock" "$PROFILE_DIR/parent.lock" "$PROFILE_DIR/lock"

if [[ "${ZEN_DRAMA_RESET_SESSION_ON_STARTUP:-0}" == "1" ]]; then
  rm -f "$PROFILE_DIR/zen-sessions.jsonlz4" "$PROFILE_DIR/sessionstore.jsonlz4"
  rm -f "$PROFILE_DIR/sessionstore-backups/recovery.jsonlz4" \
    "$PROFILE_DIR/sessionstore-backups/recovery.baklz4" \
    "$PROFILE_DIR/sessionstore-backups/previous.jsonlz4"
fi

nohup "$ZEN_BIN" -profile "$PROFILE_DIR" -no-remote >/tmp/zen-drama-zen.log 2>&1 &

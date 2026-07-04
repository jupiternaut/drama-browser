#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_APP="${DRAMA_BROWSER_APP:-$REPO_ROOT/dist/drama-browser-mac/Drama Browser.app}"
INSTALL_APP="${DRAMA_BROWSER_INSTALL_APP:-/Applications/Drama Browser.app}"

usage() {
  cat <<'EOF'
Usage: install-drama-browser-mac.sh [--source-app PATH] [--install-app PATH]

Installs the source-built Gecko Drama Browser.app. Electron bundles are rejected.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-app) SOURCE_APP="$2"; shift 2 ;;
    --install-app) INSTALL_APP="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ ! -d "$SOURCE_APP" ]]; then
  echo "Drama Browser.app was not found: $SOURCE_APP" >&2
  exit 1
fi

INFO_PLIST="$SOURCE_APP/Contents/Info.plist"
BUNDLE_ID="$(plutil -extract CFBundleIdentifier raw -o - "$INFO_PLIST" 2>/dev/null || true)"
if [[ "$BUNDLE_ID" != "app.drama-browser.local" ]]; then
  echo "Refusing non-Drama source app: CFBundleIdentifier=$BUNDLE_ID" >&2
  exit 1
fi
if [[ -d "$SOURCE_APP/Contents/Frameworks/Electron Framework.framework" ]]; then
  echo "Refusing Electron app: Electron Framework.framework is present." >&2
  exit 1
fi

rm -rf "$INSTALL_APP"
ditto "$SOURCE_APP" "$INSTALL_APP"

if [[ -d "$INSTALL_APP/Contents/Frameworks/Electron Framework.framework" ]]; then
  echo "Installed app contains Electron Framework.framework." >&2
  exit 1
fi

LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
if [[ -x "$LSREGISTER" ]]; then
  INSTALL_APP_REAL="$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$INSTALL_APP")"
  if command -v mdfind >/dev/null 2>&1; then
    while IFS= read -r candidate; do
      [[ -n "$candidate" && -d "$candidate" ]] || continue
      candidate_real="$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$candidate")"
      if [[ "$candidate_real" != "$INSTALL_APP_REAL" ]]; then
        "$LSREGISTER" -u "$candidate" >/dev/null 2>&1 || true
      fi
    done < <(mdfind 'kMDItemCFBundleIdentifier == "app.drama-browser.local"' 2>/dev/null || true)
  fi
  for candidate in \
    "$REPO_ROOT/dist/drama-browser-mac/Drama Browser.app" \
    "$REPO_ROOT/dist/zen-drama-mac/Drama Browser.app" \
    "$HOME/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app" \
    "$HOME/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser-internal/Drama Browser.app" \
    "$HOME/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/Drama Browser.app"
  do
    [[ -d "$candidate" ]] || continue
    candidate_real="$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$candidate")"
    if [[ "$candidate_real" != "$INSTALL_APP_REAL" ]]; then
      "$LSREGISTER" -u "$candidate" >/dev/null 2>&1 || true
    fi
  done
  "$LSREGISTER" -f "$INSTALL_APP" >/dev/null 2>&1 || true
fi

if ! swift - <<'SWIFT' >/dev/null 2>&1
import Foundation
import CoreServices

_ = LSSetDefaultHandlerForURLScheme(
  "drama" as CFString,
  "app.drama-browser.local" as CFString
)
SWIFT
then
  echo "Warning: could not set drama:// default handler; LaunchServices may still prefer another Drama app." >&2
fi

echo "Installed Drama Browser.app: $INSTALL_APP"

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_APP="${DRAMA_SOURCE_APP:-/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app}"
OUTPUT_DIR="${DRAMA_BROWSER_MAC_OUTPUT:-$REPO_ROOT/dist/drama-browser-mac}"
APP_DEST="$OUTPUT_DIR/Drama Browser.app"
DMG_PATH="$OUTPUT_DIR/Drama Browser.dmg"
SKIP_BUILD=0
SKIP_DMG=0

usage() {
  cat <<'EOF'
Usage: package-drama-browser-mac.sh [--source-app PATH] [--output DIR] [--skip-build] [--skip-dmg]

Packages the source-built Gecko Drama Browser.app as the production macOS app.
This script rejects Electron bundles and does not run electron-builder.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-app) SOURCE_APP="$2"; shift 2 ;;
    --output) OUTPUT_DIR="$2"; APP_DEST="$OUTPUT_DIR/Drama Browser.app"; DMG_PATH="$OUTPUT_DIR/Drama Browser.dmg"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --skip-dmg) SKIP_DMG=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "$SKIP_BUILD" == "0" ]]; then
  (cd "$REPO_ROOT" && bun run drama:browser:build)
fi

if [[ ! -d "$SOURCE_APP" ]]; then
  echo "Source-built Drama Browser.app was not found: $SOURCE_APP" >&2
  exit 1
fi

INFO_PLIST="$SOURCE_APP/Contents/Info.plist"
BUNDLE_ID="$(plutil -extract CFBundleIdentifier raw -o - "$INFO_PLIST" 2>/dev/null || true)"
EXECUTABLE_NAME="$(plutil -extract CFBundleExecutable raw -o - "$INFO_PLIST" 2>/dev/null || true)"
if [[ "$BUNDLE_ID" != "app.drama-browser.local" ]]; then
  echo "Refusing non-Drama source app: CFBundleIdentifier=$BUNDLE_ID" >&2
  exit 1
fi
if [[ -z "$EXECUTABLE_NAME" || ! -x "$SOURCE_APP/Contents/MacOS/$EXECUTABLE_NAME" ]]; then
  echo "Source app executable is missing or not runnable." >&2
  exit 1
fi
if [[ -d "$SOURCE_APP/Contents/Frameworks/Electron Framework.framework" ]]; then
  echo "Refusing Electron app: Electron Framework.framework is present." >&2
  exit 1
fi

rm -rf "$APP_DEST"
mkdir -p "$OUTPUT_DIR"
ditto "$SOURCE_APP" "$APP_DEST"

if [[ -d "$APP_DEST/Contents/Frameworks/Electron Framework.framework" ]]; then
  echo "Packaged app contains Electron Framework.framework." >&2
  exit 1
fi

if [[ "$SKIP_DMG" == "0" ]]; then
  rm -f "$DMG_PATH"
  hdiutil create -volname "Drama Browser" -srcfolder "$APP_DEST" -ov -format UDZO "$DMG_PATH" >/dev/null
fi

echo "Packaged Drama Browser.app: $APP_DEST"
if [[ "$SKIP_DMG" == "0" ]]; then
  echo "Packaged DMG: $DMG_PATH"
fi


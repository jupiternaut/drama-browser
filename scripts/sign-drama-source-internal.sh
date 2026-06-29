#!/usr/bin/env bash
set -euo pipefail

APP="${1:-/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app}"
ENTITLEMENTS="${2:-/Users/gengrf/drama-browser/scripts/drama-source-internal.entitlements.plist}"

if [[ ! -d "$APP" ]]; then
  echo "Drama Browser app bundle not found: $APP" >&2
  exit 1
fi

if [[ ! -f "$ENTITLEMENTS" ]]; then
  echo "Drama Browser entitlements file not found: $ENTITLEMENTS" >&2
  exit 1
fi

find "$APP/Contents" -maxdepth 3 \( -name "*.app" -o -name "*.framework" \) -print0 |
  while IFS= read -r -d '' item; do
    codesign --force --sign - --timestamp=none "$item"
  done

codesign --force --sign - --timestamp=none --options runtime --entitlements "$ENTITLEMENTS" "$APP"
codesign --verify --deep --strict --verbose=4 "$APP"

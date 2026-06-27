#!/usr/bin/env bash
set -euo pipefail

SURFACE="${ZEN_DRAMA_SURFACE:-plm}"
RUNTIME_URL="${DRAMA_RUNTIME_URL:-http://127.0.0.1:3198}"
ZEN_APP="${ZEN_APP:-}"
LAUNCH=false

usage() {
  cat <<'EOF'
Usage: verify-zen-drama-mac.sh [--zen-app PATH] [--surface start|graph|plm|crew] [--runtime-url URL] [--launch]

Verifies the macOS product-path boundary. If a real Zen Browser.app or local Zen
build is missing, this reports blocked instead of substituting Brave, Electron,
localhost, or a renamed wrapper.

With --launch, the verifier asks the real Zen app/build to open the chrome-resource
URI and records that loaded document URI in the JSON output.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --zen-app) ZEN_APP="$2"; shift 2 ;;
    --surface) SURFACE="$2"; shift 2 ;;
    --runtime-url) RUNTIME_URL="$2"; shift 2 ;;
    --launch) LAUNCH=true; shift ;;
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

json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

emit_blocked() {
  local reason="$1"
  local escaped_reason
  escaped_reason="$(printf '%s' "$reason" | json_escape)"
  cat <<EOF
{
  "ok": false,
  "status": "blocked",
  "surfaceClassification": "product-zen-panel",
  "surface": "$SURFACE",
  "reason": $escaped_reason
}
EOF
}

ZEN_APP="$(find_zen_app || true)"
if [[ -z "$ZEN_APP" ]]; then
  emit_blocked "Zen Browser.app was not found. macOS product-path validation requires a real Zen app/build."
  exit 2
fi

LOOSE_RESOURCE_PATH="$ZEN_APP/Contents/Resources/browser/chrome/browser/content/browser/drama/app/index.html"
OMNI_JA="$ZEN_APP/Contents/Resources/browser/omni.ja"
OMNI_RESOURCE_PATH="chrome/browser/content/browser/drama/app/index.html"
RESOURCE_PATH="$LOOSE_RESOURCE_PATH"
if [[ -f "$OMNI_JA" ]] && zipinfo -1 "$OMNI_JA" | grep -qx "$OMNI_RESOURCE_PATH"; then
  RESOURCE_PATH="$OMNI_JA!/$OMNI_RESOURCE_PATH"
elif [[ ! -f "$LOOSE_RESOURCE_PATH" ]]; then
  emit_blocked "Zen Browser.app exists, but the Drama chrome-resource PLM panel is not installed in browser/omni.ja or at $LOOSE_RESOURCE_PATH."
  exit 2
fi

ENCODED_RUNTIME="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$RUNTIME_URL")"
DOCUMENT_URI="chrome://browser/content/drama/app/index.html?host=zen&runtime=${ENCODED_RUNTIME}&surface=${SURFACE}"
LOADED_DOCUMENT_URI=""
LOADED_DOCUMENT_URI_SOURCE="not-launched"
if [[ "$LAUNCH" == "true" ]]; then
  open -n -a "$ZEN_APP" "$DOCUMENT_URI" >/tmp/zen-drama-mac-open.log 2>&1 || {
    emit_blocked "Zen Browser.app exists, but macOS open failed for $DOCUMENT_URI. See /tmp/zen-drama-mac-open.log."
    exit 2
  }
  LOADED_DOCUMENT_URI="$DOCUMENT_URI"
  LOADED_DOCUMENT_URI_SOURCE="macos-open-request"
fi

cat <<EOF
{
  "ok": true,
  "status": "ready",
  "surfaceClassification": "product-zen-panel",
  "zenApp": "$ZEN_APP",
  "surface": "$SURFACE",
  "documentUri": "$DOCUMENT_URI",
  "loadedDocumentUri": "$LOADED_DOCUMENT_URI",
  "loadedDocumentUriSource": "$LOADED_DOCUMENT_URI_SOURCE",
  "resourcePath": "$RESOURCE_PATH"
}
EOF

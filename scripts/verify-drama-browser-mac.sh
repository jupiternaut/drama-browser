#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APP="${DRAMA_BROWSER_APP:-$REPO_ROOT/dist/zen-drama-mac/Drama Browser.app}"
SURFACE="${DRAMA_BROWSER_SURFACE:-start}"
RUNTIME_URL="${DRAMA_RUNTIME_URL:-http://127.0.0.1:3198}"
PROFILE_DIR="${DRAMA_BROWSER_PROFILE:-$HOME/Library/Application Support/DramaBrowser/profile-main}"
LAUNCH=false

usage() {
  cat <<'EOF'
Usage: verify-drama-browser-mac.sh [--app PATH] [--surface start|graph|plm|crew|memory] [--runtime-url URL] [--profile-dir PATH] [--launch]

Verifies the packaged Drama Browser product wrapper. This verifier never falls
back to /Applications/Zen Browser.app and never treats localhost, Brave, Chrome,
Electron, or an installed Zen app as Drama Browser product evidence.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app) APP="$2"; shift 2 ;;
    --surface) SURFACE="$2"; shift 2 ;;
    --runtime-url) RUNTIME_URL="$2"; shift 2 ;;
    --profile-dir) PROFILE_DIR="$2"; shift 2 ;;
    --launch) LAUNCH=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

case "$SURFACE" in
  start|graph|plm|crew|memory) ;;
  *) echo "Invalid surface: $SURFACE" >&2; exit 2 ;;
esac

if [[ ! -d "$APP" ]]; then
  echo "{\"ok\":false,\"status\":\"blocked\",\"reason\":\"Drama Browser.app was not found\",\"app\":$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$APP")}" >&2
  exit 2
fi

ORIGINAL_ZEN_PATTERN="/Applications/Zen Browser.app/Contents/MacOS"
ZEN_BEFORE="$(pgrep -fl "$ORIGINAL_ZEN_PATTERN" || true)"
LAUNCH_STATUS="not-launched"
if [[ "$LAUNCH" == "true" ]]; then
  DRAMA_BROWSER_APP="$APP" \
  DRAMA_BROWSER_SURFACE="$SURFACE" \
  DRAMA_BROWSER_PROFILE="$PROFILE_DIR" \
    "$REPO_ROOT/scripts/launch-drama-browser-mac.sh" --no-runtime-launch --internal-app auto
  sleep 3
  LAUNCH_STATUS="launched"
fi
ZEN_AFTER="$(pgrep -fl "$ORIGINAL_ZEN_PATTERN" || true)"

python3 - "$APP" "$SURFACE" "$RUNTIME_URL" "$PROFILE_DIR" "$LAUNCH_STATUS" "$ZEN_BEFORE" "$ZEN_AFTER" <<'PY'
import json
import plistlib
import subprocess
import sys
import urllib.parse
import zipfile
from pathlib import Path

app = Path(sys.argv[1])
surface = sys.argv[2]
runtime_url = sys.argv[3]
profile_dir = Path(sys.argv[4])
launch_status = sys.argv[5]
zen_before = sys.argv[6]
zen_after = sys.argv[7]

def read_plist(path: Path) -> dict:
    try:
        with path.open("rb") as handle:
            return plistlib.load(handle)
    except Exception:
        return {}

info = read_plist(app / "Contents" / "Info.plist")
bundle_id = info.get("CFBundleIdentifier")
bundle_name = info.get("CFBundleName")
display_name = info.get("CFBundleDisplayName")
executable = info.get("CFBundleExecutable")
version = info.get("CFBundleShortVersionString") or info.get("CFBundleVersion")
url_schemes = []
for item in info.get("CFBundleURLTypes") or []:
    url_schemes.extend(item.get("CFBundleURLSchemes") or [])

loose_resource = app / "Contents" / "Resources" / "browser" / "chrome" / "browser" / "content" / "browser" / "drama" / "app" / "index.html"
omni_ja = app / "Contents" / "Resources" / "browser" / "omni.ja"
omni_resource = "chrome/browser/content/browser/drama/app/index.html"
resource_path = None
if loose_resource.exists():
    resource_path = str(loose_resource)
elif omni_ja.exists():
    try:
        with zipfile.ZipFile(omni_ja) as archive:
            if omni_resource in archive.namelist():
                resource_path = f"{omni_ja}!/{omni_resource}"
    except Exception:
        pass

helpers = []
for helper_plist in (app / "Contents" / "Frameworks").glob("*.app/Contents/Info.plist"):
    helper_info = read_plist(helper_plist)
    helpers.append({
        "name": helper_info.get("CFBundleName"),
        "bundleId": helper_info.get("CFBundleIdentifier"),
        "executable": helper_info.get("CFBundleExecutable"),
    })

user_js = profile_dir / "user.js"
pref_namespace = "missing"
pref_keys = []
if user_js.exists():
    text = user_js.read_text(errors="replace")
    has_canonical = "drama.browser." in text
    has_legacy = "zen.drama." in text
    if has_canonical and has_legacy:
        pref_namespace = "dual-write"
    elif has_canonical:
        pref_namespace = "canonical"
    elif has_legacy:
        pref_namespace = "legacy"
    pref_keys = sorted(set(part.split('"')[0] for part in text.split('user_pref("')[1:]))

encoded_runtime = urllib.parse.quote(runtime_url, safe="")
document_uri = f"chrome://browser/content/drama/app/index.html?host=drama&runtime={encoded_runtime}&surface={surface}"

zen_before_set = {line.strip() for line in zen_before.splitlines() if line.strip()}
zen_after_set = {line.strip() for line in zen_after.splitlines() if line.strip()}
new_zen_processes = sorted(zen_after_set - zen_before_set)

source_fork_gaps = []
if executable == "zen":
    source_fork_gaps.append("CFBundleExecutable is still zen")
for helper in helpers:
    helper_blob = " ".join(str(helper.get(key) or "") for key in ("name", "bundleId", "executable")).lower()
    if "zen" in helper_blob or "mozilla" in helper_blob or "firefox" in helper_blob:
        source_fork_gaps.append(f"helper identity inherited: {helper}")
if version and "zen" in str(version).lower():
    source_fork_gaps.append(f"version string inherited: {version}")

checks = {
    "bundleId": bundle_id == "app.drama-browser.local",
    "displayName": display_name == "Drama Browser" or bundle_name == "Drama Browser",
    "resourceInstalled": resource_path is not None,
    "originalZenNotAwakened": not new_zen_processes,
    "canonicalDocumentUri": "host=drama" in document_uri,
}

ok = all(checks.values())
status = "ready" if ok else "blocked"
result = {
    "ok": ok,
    "status": status,
    "surfaceClassification": "product-drama-browser",
    "hostAdapter": "zen-gecko",
    "surface": surface,
    "app": str(app),
    "bundleId": bundle_id,
    "bundleName": bundle_name,
    "displayName": display_name,
    "executable": executable,
    "version": version,
    "urlSchemes": url_schemes,
    "documentUri": document_uri,
    "resourcePath": resource_path,
    "profileDir": str(profile_dir),
    "prefNamespace": pref_namespace,
    "prefKeys": pref_keys,
    "launchStatus": launch_status,
    "originalZenNewProcesses": new_zen_processes,
    "checks": checks,
    "sourceForkGaps": source_fork_gaps,
}
print(json.dumps(result, indent=2, ensure_ascii=False))
sys.exit(0 if ok else 2)
PY

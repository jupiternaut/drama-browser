#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ZEN_APP="${ZEN_APP:-}"
OUTPUT_DIR="${ZEN_DRAMA_MAC_OUTPUT:-$REPO_ROOT/dist/zen-drama-mac}"
SKIP_BUILD=0

usage() {
  cat <<'EOF'
Usage: package-zen-drama-mac.sh --zen-app PATH [--output DIR] [--skip-build]

Copies a macOS Zen Browser.app tree and installs the Drama browser shell into the
loose chrome resource path used by local/dev Zen builds.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --zen-app) ZEN_APP="$2"; shift 2 ;;
    --output) OUTPUT_DIR="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$ZEN_APP" || ! -d "$ZEN_APP" ]]; then
  echo "A source Zen Browser.app is required. Pass --zen-app or set ZEN_APP." >&2
  exit 1
fi

if [[ "$SKIP_BUILD" == "0" ]]; then
  (cd "$REPO_ROOT" && bun run drama:build-packages && bun run browser-shell:build && bun run runtime:typecheck)
fi

prepare_chrome_index() {
  local index_file="$1"
  if [[ -f "$index_file" ]]; then
    perl -0pi -e 's#(src|href)="/assets/#$1="./assets/#g; s/ crossorigin//g' "$index_file"
  fi
}

install_browser_chrome_hooks() {
  local browser_xhtml="$1"
  if [[ ! -f "$browser_xhtml" ]]; then
    echo "Zen browser.xhtml was not found at $browser_xhtml; Drama chrome panel hook was not installed." >&2
    return 1
  fi

  BROWSER_XHTML="$browser_xhtml" python3 <<'PY'
import os
from pathlib import Path

path = Path(os.environ["BROWSER_XHTML"])
text = path.read_text()
head_marker = "<!-- zen-drama-head-hook -->"
body_marker = "<!-- zen-drama-body-hook -->"

if head_marker not in text:
    head_hook = """  <!-- zen-drama-head-hook -->
  <link rel="stylesheet" href="chrome://browser/content/zen-styles/zen-drama.css" />
  <script type="module" src="chrome://browser/content/zen-components/ZenDramaManager.mjs"></script>
"""
    text = text.replace("</head>", f"{head_hook}</head>", 1)

if body_marker not in text:
    body_hook = """  <!-- zen-drama-body-hook -->
  <commandset id="zen-drama-commandset">
    <command id="cmd_dramaBrowserToggle" />
    <command id="cmd_dramaBrowserOpenStart" />
    <command id="cmd_dramaBrowserOpenGraph" />
    <command id="cmd_dramaBrowserOpenPlm" />
    <command id="cmd_dramaBrowserOpenCrew" />
    <command id="cmd_dramaBrowserOpenMemory" />
    <command id="cmd_dramaBrowserOpenInTab" />
  </commandset>
  <toolbarbutton id="zen-drama-launcher-button" class="toolbarbutton-1 zen-drama-launcher-button" image="chrome://browser/content/zen-icons/drama-start.svg" label="Drama" tooltiptext="Open Drama Browser" />
  <vbox id="zen-drama-panel" hidden="true">
    <hbox id="zen-drama-toolbar" class="chromeclass-toolbar" align="center">
      <toolbarbutton id="zen-drama-start-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_dramaBrowserOpenStart" label="Drama Start" tooltiptext="Drama Start" />
      <toolbarbutton id="zen-drama-graph-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_dramaBrowserOpenGraph" label="Drama Graph" tooltiptext="Drama Graph" />
      <toolbarbutton id="zen-drama-plm-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_dramaBrowserOpenPlm" label="Drama PLM" tooltiptext="Drama PLM" />
      <toolbarbutton id="zen-drama-crew-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_dramaBrowserOpenCrew" label="Skill Crew" tooltiptext="Skill Crew" />
      <toolbarbutton id="zen-drama-memory-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_dramaBrowserOpenMemory" label="Basic Memory" tooltiptext="Basic Memory" />
      <spacer flex="1" />
      <label id="zen-drama-runtime-status" value="Drama" />
      <toolbarbutton id="zen-drama-open-tab-button" class="toolbarbutton-1 zen-drama-icon-button" command="cmd_dramaBrowserOpenInTab" tooltiptext="Open Drama in a tab" />
      <toolbarbutton id="zen-drama-lock-button" class="toolbarbutton-1 zen-drama-icon-button" command="cmd_dramaBrowserToggle" tooltiptext="Lock Drama and release panel memory" />
    </hbox>
    <browser id="zen-drama-browser" type="content" remote="true" flex="1" maychangeremoteness="true" disableglobalhistory="true" />
  </vbox>
"""
    text = text.replace("</html:body>", f"{body_hook}</html:body>", 1)
elif "zen-drama-launcher-button" not in text:
    launcher_hook = """  <toolbarbutton id="zen-drama-launcher-button" class="toolbarbutton-1 zen-drama-launcher-button" image="chrome://browser/content/zen-icons/drama-start.svg" label="Drama" tooltiptext="Open Drama Browser" />
"""
    text = text.replace('  <vbox id="zen-drama-panel" hidden="true">', f"{launcher_hook}  <vbox id=\"zen-drama-panel\" hidden=\"true\">", 1)

text = text.replace('id="zen-drama-close-button"', 'id="zen-drama-lock-button"')
text = text.replace('tooltiptext="Close Drama"', 'tooltiptext="Lock Drama and release panel memory"')
if 'id="cmd_dramaBrowserOpenStart"' not in text:
    text = text.replace(
        '    <command id="cmd_dramaBrowserOpenGraph" />',
        '    <command id="cmd_dramaBrowserOpenStart" />\n    <command id="cmd_dramaBrowserOpenGraph" />',
        1,
    )
if 'id="cmd_dramaBrowserOpenMemory"' not in text:
    text = text.replace(
        '    <command id="cmd_dramaBrowserOpenInTab" />',
        '    <command id="cmd_dramaBrowserOpenMemory" />\n    <command id="cmd_dramaBrowserOpenInTab" />',
        1,
    )
if 'id="zen-drama-start-button"' not in text:
    text = text.replace(
        '      <toolbarbutton id="zen-drama-graph-button"',
        '      <toolbarbutton id="zen-drama-start-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_dramaBrowserOpenStart" label="Drama Start" tooltiptext="Drama Start" />\n      <toolbarbutton id="zen-drama-graph-button"',
        1,
    )
if 'id="zen-drama-memory-button"' not in text:
    text = text.replace(
        '      <spacer flex="1" />',
        '      <toolbarbutton id="zen-drama-memory-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_dramaBrowserOpenMemory" label="Basic Memory" tooltiptext="Basic Memory" />\n      <spacer flex="1" />',
        1,
    )

path.write_text(text)
PY
}

install_direct_app_launcher() {
  local app_dest="$1"
  local repo_root="$2"
  local info_plist="$app_dest/Contents/Info.plist"
  local executable_name real_executable_name executable_path real_executable_path launcher_script_path launcher_c_path

  executable_name="$(plutil -extract CFBundleExecutable raw -o - "$info_plist" 2>/dev/null || true)"
  if [[ -z "$executable_name" ]]; then
    echo "Could not resolve CFBundleExecutable for $app_dest; direct app launcher was not installed." >&2
    return 1
  fi

  real_executable_name="${executable_name}-gecko-bin"
  executable_path="$app_dest/Contents/MacOS/$executable_name"
  real_executable_path="$app_dest/Contents/MacOS/$real_executable_name"
  launcher_script_path="$app_dest/Contents/MacOS/${executable_name}-launcher.sh"
  launcher_c_path="$app_dest/Contents/MacOS/${executable_name}-launcher.c"

  if [[ ! -x "$real_executable_path" ]]; then
    if [[ ! -x "$executable_path" ]]; then
      echo "Could not find executable at $executable_path; direct app launcher was not installed." >&2
      return 1
    fi
    mv "$executable_path" "$real_executable_path"
  fi

  cat > "$launcher_script_path" <<EOF
#!/usr/bin/env bash
set -euo pipefail

MACOS_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="\$(cd "\$MACOS_DIR/../.." && pwd)"
PACKAGE_DIR="\$(cd "\$APP_DIR/.." && pwd)"
REAL_EXECUTABLE="\$MACOS_DIR/$real_executable_name"
SOURCE_REPO_ROOT="$repo_root"

PROFILE_DIR="\${DRAMA_BROWSER_PROFILE:-\$HOME/Library/Application Support/DramaBrowser/profile-main}"
SURFACE="\${DRAMA_BROWSER_SURFACE:-start}"
RUNTIME_URL="\${DRAMA_RUNTIME_URL:-http://127.0.0.1:3198}"
INTERNAL_APP_URL="chrome://browser/content/drama/app/index.html"
INTERNAL_APP_ENABLED="false"
if [[ -f "\$APP_DIR/Contents/Resources/browser/chrome/browser/content/browser/drama/app/index.html" ]]; then
  INTERNAL_APP_ENABLED="true"
fi
RUNTIME_SCRIPT="\$PACKAGE_DIR/scripts/launch-drama-runtime.sh"
RUNTIME_CWD="\$PACKAGE_DIR"
if [[ -x "\$SOURCE_REPO_ROOT/scripts/launch-drama-runtime.sh" && -d "\$SOURCE_REPO_ROOT/apps/drama-runtime" ]]; then
  RUNTIME_SCRIPT="\$SOURCE_REPO_ROOT/scripts/launch-drama-runtime.sh"
  RUNTIME_CWD="\$SOURCE_REPO_ROOT"
fi

mkdir -p "\$PROFILE_DIR"
PROFILE_MARKER="\$PROFILE_DIR/.drama-browser-direct-launch-v1"
if [[ ! -f "\$PROFILE_MARKER" ]]; then
  rm -f \
    "\$PROFILE_DIR/zen-sessions.jsonlz4" \
    "\$PROFILE_DIR/sessionstore.jsonlz4" \
    "\$PROFILE_DIR/sessionCheckpoints.json" \
    "\$PROFILE_DIR/addonStartup.json.lz4"
  rm -rf "\$PROFILE_DIR/sessionstore-backups"
  : > "\$PROFILE_MARKER"
fi

cat > "\$PROFILE_DIR/user.js" <<PREFS
user_pref("app.update.auto", false);
user_pref("app.update.background.scheduling.enabled", false);
user_pref("app.update.badge", false);
user_pref("app.update.checkInstallTime", false);
user_pref("app.update.disabledForTesting", true);
user_pref("app.update.doorhanger", false);
user_pref("app.update.enabled", false);
user_pref("app.update.service.enabled", false);
user_pref("browser.aboutwelcome.enabled", false);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.shell.didSkipDefaultBrowserCheckOnFirstRun", true);
user_pref("browser.startup.homepage", "about:blank");
user_pref("browser.startup.page", 0);
user_pref("startup.homepage_welcome_url", "");
user_pref("startup.homepage_welcome_url.additional", "");
user_pref("drama.browser.base-url", "\${RUNTIME_URL}/app");
user_pref("drama.browser.runtime-url", "\${RUNTIME_URL}");
user_pref("drama.browser.internal-app.enabled", \${INTERNAL_APP_ENABLED});
user_pref("drama.browser.internal-app-url", "\${INTERNAL_APP_URL}");
user_pref("drama.browser.runtime-launch.enabled", true);
user_pref("drama.browser.runtime-launch.command", "/bin/bash");
user_pref("drama.browser.runtime-launch.args", "[\\\"\$RUNTIME_SCRIPT\\\"]");
user_pref("drama.browser.runtime-launch.cwd", "\$RUNTIME_CWD");
user_pref("drama.browser.open-on-startup", true);
user_pref("drama.browser.start-surface", "\$SURFACE");
user_pref("zen.drama.base-url", "\${RUNTIME_URL}/app");
user_pref("zen.drama.runtime-url", "\${RUNTIME_URL}");
user_pref("zen.drama.internal-app.enabled", \${INTERNAL_APP_ENABLED});
user_pref("zen.drama.internal-app-url", "\${INTERNAL_APP_URL}");
user_pref("zen.drama.runtime-launch.enabled", true);
user_pref("zen.drama.runtime-launch.command", "/bin/bash");
user_pref("zen.drama.runtime-launch.args", "[\\\"\$RUNTIME_SCRIPT\\\"]");
user_pref("zen.drama.runtime-launch.cwd", "\$RUNTIME_CWD");
user_pref("zen.drama.open-on-startup", true);
user_pref("zen.drama.start-surface", "\$SURFACE");
PREFS

filtered_args=()
for arg in "\$@"; do
  case "\$arg" in
    -psn_*) ;;
    *) filtered_args+=("\$arg") ;;
  esac
done

if (( \${#filtered_args[@]} > 0 )); then
  exec "\$REAL_EXECUTABLE" -profile "\$PROFILE_DIR" -no-remote "\${filtered_args[@]}"
fi

exec "\$REAL_EXECUTABLE" -profile "\$PROFILE_DIR" -no-remote
EOF
  chmod +x "$launcher_script_path"

  cat > "$launcher_c_path" <<'EOF'
#include <limits.h>
#include <mach-o/dyld.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
  char executable_path[PATH_MAX];
  uint32_t size = sizeof(executable_path);
  if (_NSGetExecutablePath(executable_path, &size) != 0) {
    fprintf(stderr, "Drama Browser launcher path is too long.\n");
    return 127;
  }

  char *last_slash = strrchr(executable_path, '/');
  if (last_slash == NULL) {
    fprintf(stderr, "Drama Browser launcher could not resolve its directory.\n");
    return 127;
  }
  *last_slash = '\0';

  char script_path[PATH_MAX];
  int written = snprintf(script_path, sizeof(script_path), "%s/zen-launcher.sh", executable_path);
  if (written < 0 || written >= (int)sizeof(script_path)) {
    fprintf(stderr, "Drama Browser launcher script path is too long.\n");
    return 127;
  }

  char **args = calloc((size_t)argc + 2, sizeof(char *));
  if (args == NULL) {
    perror("calloc");
    return 127;
  }
  args[0] = "/bin/bash";
  args[1] = script_path;
  for (int i = 1; i < argc; i++) {
    args[i + 1] = argv[i];
  }
  args[argc + 1] = NULL;

  execv("/bin/bash", args);
  perror("execv");
  return 127;
}
EOF

  if command -v cc >/dev/null 2>&1; then
    cc -Os -Wall -Wextra -o "$executable_path" "$launcher_c_path"
    rm -f "$launcher_c_path"
  else
    echo "C compiler not found; falling back to a script executable, which may not work through LaunchServices." >&2
    cp "$launcher_script_path" "$executable_path"
    chmod +x "$executable_path"
  fi
}

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

APP_DEST="$OUTPUT_DIR/Drama Browser.app"
ditto "$ZEN_APP" "$APP_DEST"
INFO_PLIST="$APP_DEST/Contents/Info.plist"
if [[ -f "$INFO_PLIST" ]]; then
  plutil -replace CFBundleName -string "Drama Browser" "$INFO_PLIST"
  plutil -replace CFBundleDisplayName -string "Drama Browser" "$INFO_PLIST"
  plutil -replace CFBundleIdentifier -string "app.drama-browser.local" "$INFO_PLIST"
fi
install_direct_app_launcher "$APP_DEST" "$REPO_ROOT"

# Transitional adapter path only.
# Source-built Drama Browser registers these resources through browser/base/jar.mn
# and must not use this post-copy injection as source-level acceptance evidence.
RESOURCE_ROOT="$APP_DEST/Contents/Resources/browser/chrome/browser/content/browser"
APP_RESOURCE_DIR="$RESOURCE_ROOT/drama/app"
COMPONENT_DIR="$RESOURCE_ROOT/zen-components"
STYLE_DIR="$RESOURCE_ROOT/zen-styles"
ICON_DIR="$RESOURCE_ROOT/zen-icons"

mkdir -p "$APP_RESOURCE_DIR" "$COMPONENT_DIR" "$STYLE_DIR" "$ICON_DIR"
ditto "$REPO_ROOT/apps/drama-browser-shell/dist" "$APP_RESOURCE_DIR"
prepare_chrome_index "$APP_RESOURCE_DIR/index.html"
cp "$REPO_ROOT/gecko-drama-chrome/DramaBrowserChromeManager.mjs" "$COMPONENT_DIR/ZenDramaManager.mjs"
cp "$REPO_ROOT/zen-drama-chrome/zen-drama.css" "$STYLE_DIR/zen-drama.css"
install_browser_chrome_hooks "$RESOURCE_ROOT/browser.xhtml"

for icon in drama-start.svg drama-graph.svg drama-plm.svg drama-crew.svg drama-memory.svg; do
  if [[ -f "$REPO_ROOT/zen-drama-chrome/$icon" ]]; then
    cp "$REPO_ROOT/zen-drama-chrome/$icon" "$ICON_DIR/$icon"
  fi
done

OMNI_JA="$APP_DEST/Contents/Resources/browser/omni.ja"
if [[ -f "$OMNI_JA" ]]; then
  OMNI_STAGING="$(mktemp -d)"
  trap 'rm -rf "$OMNI_STAGING"' EXIT
  mkdir -p \
    "$OMNI_STAGING/chrome/browser/content/browser/drama/app" \
    "$OMNI_STAGING/chrome/browser/content/browser/zen-components" \
    "$OMNI_STAGING/chrome/browser/content/browser/zen-styles" \
    "$OMNI_STAGING/chrome/browser/content/browser/zen-icons"
  ditto "$REPO_ROOT/apps/drama-browser-shell/dist" \
    "$OMNI_STAGING/chrome/browser/content/browser/drama/app"
  prepare_chrome_index "$OMNI_STAGING/chrome/browser/content/browser/drama/app/index.html"
  cp "$REPO_ROOT/gecko-drama-chrome/DramaBrowserChromeManager.mjs" \
    "$OMNI_STAGING/chrome/browser/content/browser/zen-components/ZenDramaManager.mjs"
  cp "$REPO_ROOT/zen-drama-chrome/zen-drama.css" \
    "$OMNI_STAGING/chrome/browser/content/browser/zen-styles/zen-drama.css"
  for icon in drama-start.svg drama-graph.svg drama-plm.svg drama-crew.svg drama-memory.svg; do
    if [[ -f "$REPO_ROOT/zen-drama-chrome/$icon" ]]; then
      cp "$REPO_ROOT/zen-drama-chrome/$icon" \
        "$OMNI_STAGING/chrome/browser/content/browser/zen-icons/$icon"
    fi
  done
  (cd "$OMNI_STAGING" && zip -qr "$OMNI_JA" chrome/browser/content/browser/drama chrome/browser/content/browser/zen-components/ZenDramaManager.mjs chrome/browser/content/browser/zen-styles/zen-drama.css chrome/browser/content/browser/zen-icons)
else
  echo "Zen browser omni.ja was not found at $OMNI_JA; installed Drama as loose chrome resources only."
fi

mkdir -p "$OUTPUT_DIR/scripts"
cp "$REPO_ROOT/scripts/launch-drama-runtime.sh" "$OUTPUT_DIR/scripts/"
cp "$REPO_ROOT/scripts/launch-plotpilot-sidecar-mac.sh" "$OUTPUT_DIR/scripts/"
cp "$REPO_ROOT/scripts/launch-drama-browser-mac.sh" "$OUTPUT_DIR/scripts/"
cat > "$OUTPUT_DIR/Start-Drama-Browser.command" <<EOF
#!/usr/bin/env bash
set -euo pipefail

PACKAGE_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
DRAMA_BROWSER_APP="\${DRAMA_BROWSER_APP:-\$PACKAGE_DIR/Drama Browser.app}"

exec "\$PACKAGE_DIR/scripts/launch-drama-browser-mac.sh" --drama-app "\$DRAMA_BROWSER_APP" --surface "\${DRAMA_BROWSER_SURFACE:-\${ZEN_DRAMA_SURFACE:-start}}" "\$@"
EOF
chmod +x "$OUTPUT_DIR/scripts/launch-drama-runtime.sh" \
  "$OUTPUT_DIR/scripts/launch-plotpilot-sidecar-mac.sh" \
  "$OUTPUT_DIR/scripts/launch-drama-browser-mac.sh" \
  "$OUTPUT_DIR/Start-Drama-Browser.command"

cat > "$OUTPUT_DIR/README.md" <<EOF
# Drama Browser macOS package

This package is a Drama Browser product wrapper backed by the current Zen/Gecko
adapter. A developer runtime wrapper, Brave, Electron, localhost browser shell,
or installed Zen Browser.app does not count as \`product-drama-browser\`
validation.

Launch:

\`\`\`bash
DRAMA_BROWSER_APP="$APP_DEST" "$OUTPUT_DIR/Start-Drama-Browser.command" --surface start --internal-app auto
\`\`\`

If the source Zen build does not already register the Drama Browser chrome manager,
this package can still launch the local runtime, but the sidebar panel itself
requires the matching Zen source/build integration.

Verify the product-path boundary:

\`\`\`bash
"$REPO_ROOT/scripts/verify-drama-browser-mac.sh" --app "$APP_DEST" --surface start
\`\`\`
EOF

echo "Packaged Drama Browser macOS tree at $OUTPUT_DIR"

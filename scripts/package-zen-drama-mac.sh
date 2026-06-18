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
    <command id="cmd_zenDramaToggle" />
    <command id="cmd_zenDramaOpenGraph" />
    <command id="cmd_zenDramaOpenPlm" />
    <command id="cmd_zenDramaOpenCrew" />
    <command id="cmd_zenDramaOpenInTab" />
  </commandset>
  <toolbarbutton id="zen-drama-launcher-button" class="toolbarbutton-1 zen-drama-launcher-button" image="chrome://browser/content/zen-icons/drama-plm.svg" label="PLM" tooltiptext="Open Drama PLM" />
  <vbox id="zen-drama-panel" hidden="true">
    <hbox id="zen-drama-toolbar" class="chromeclass-toolbar" align="center">
      <toolbarbutton id="zen-drama-graph-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_zenDramaOpenGraph" label="Drama Graph" tooltiptext="Drama Graph" />
      <toolbarbutton id="zen-drama-plm-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_zenDramaOpenPlm" label="Drama PLM" tooltiptext="Drama PLM" />
      <toolbarbutton id="zen-drama-crew-button" class="toolbarbutton-1 zen-drama-toolbar-button" command="cmd_zenDramaOpenCrew" label="Skill Crew" tooltiptext="Skill Crew" />
      <spacer flex="1" />
      <label id="zen-drama-runtime-status" value="Drama" />
      <toolbarbutton id="zen-drama-open-tab-button" class="toolbarbutton-1 zen-drama-icon-button" command="cmd_zenDramaOpenInTab" tooltiptext="Open Drama in a tab" />
      <toolbarbutton id="zen-drama-lock-button" class="toolbarbutton-1 zen-drama-icon-button" command="cmd_zenDramaToggle" tooltiptext="Lock Drama and release panel memory" />
    </hbox>
    <browser id="zen-drama-browser" type="content" remote="true" flex="1" maychangeremoteness="true" disableglobalhistory="true" />
  </vbox>
"""
    text = text.replace("</html:body>", f"{body_hook}</html:body>", 1)
elif "zen-drama-launcher-button" not in text:
    launcher_hook = """  <toolbarbutton id="zen-drama-launcher-button" class="toolbarbutton-1 zen-drama-launcher-button" image="chrome://browser/content/zen-icons/drama-plm.svg" label="PLM" tooltiptext="Open Drama PLM" />
"""
    text = text.replace('  <vbox id="zen-drama-panel" hidden="true">', f"{launcher_hook}  <vbox id=\"zen-drama-panel\" hidden=\"true\">", 1)

text = text.replace('id="zen-drama-close-button"', 'id="zen-drama-lock-button"')
text = text.replace('tooltiptext="Close Drama"', 'tooltiptext="Lock Drama and release panel memory"')

path.write_text(text)
PY
}

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

APP_DEST="$OUTPUT_DIR/Zen Browser.app"
ditto "$ZEN_APP" "$APP_DEST"

RESOURCE_ROOT="$APP_DEST/Contents/Resources/browser/chrome/browser/content/browser"
APP_RESOURCE_DIR="$RESOURCE_ROOT/drama/app"
COMPONENT_DIR="$RESOURCE_ROOT/zen-components"
STYLE_DIR="$RESOURCE_ROOT/zen-styles"
ICON_DIR="$RESOURCE_ROOT/zen-icons"

mkdir -p "$APP_RESOURCE_DIR" "$COMPONENT_DIR" "$STYLE_DIR" "$ICON_DIR"
ditto "$REPO_ROOT/apps/drama-browser-shell/dist" "$APP_RESOURCE_DIR"
prepare_chrome_index "$APP_RESOURCE_DIR/index.html"
cp "$REPO_ROOT/zen-drama-chrome/ZenDramaManager.mjs" "$COMPONENT_DIR/ZenDramaManager.mjs"
cp "$REPO_ROOT/zen-drama-chrome/zen-drama.css" "$STYLE_DIR/zen-drama.css"
install_browser_chrome_hooks "$RESOURCE_ROOT/browser.xhtml"

for icon in drama-graph.svg drama-plm.svg drama-crew.svg; do
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
  cp "$REPO_ROOT/zen-drama-chrome/ZenDramaManager.mjs" \
    "$OMNI_STAGING/chrome/browser/content/browser/zen-components/ZenDramaManager.mjs"
  cp "$REPO_ROOT/zen-drama-chrome/zen-drama.css" \
    "$OMNI_STAGING/chrome/browser/content/browser/zen-styles/zen-drama.css"
  for icon in drama-graph.svg drama-plm.svg drama-crew.svg; do
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
cat > "$OUTPUT_DIR/Start-Drama-Zen.command" <<EOF
#!/usr/bin/env bash
set -euo pipefail

PACKAGE_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
SOURCE_REPO_ROOT="$REPO_ROOT"
ZEN_APP="\${ZEN_APP:-\$PACKAGE_DIR/Zen Browser.app}"

exec "\$SOURCE_REPO_ROOT/scripts/launch-zen-drama-mac.sh" --zen-app "\$ZEN_APP" "\$@"
EOF
chmod +x "$OUTPUT_DIR/scripts/launch-drama-runtime.sh" \
  "$OUTPUT_DIR/scripts/launch-plotpilot-sidecar-mac.sh" \
  "$OUTPUT_DIR/Start-Drama-Zen.command"

cat > "$OUTPUT_DIR/README.md" <<EOF
# Zen Drama macOS package

This package is Zen-backed only when \`Zen Browser.app\` is a real Zen app/build
with the Drama chrome-resource integration. A developer runtime wrapper, Brave,
Electron, or localhost browser shell does not count as \`product-zen-panel\`
validation.

Launch:

\`\`\`bash
ZEN_APP="$APP_DEST" "$OUTPUT_DIR/Start-Drama-Zen.command" --surface plm --internal-app auto
\`\`\`

If the source Zen build does not already register the ZenDrama chrome manager,
this package can still launch the local runtime, but the sidebar panel itself
requires the matching Zen source/build integration.

Verify the product-path boundary:

\`\`\`bash
"$REPO_ROOT/scripts/verify-zen-drama-mac.sh" --zen-app "$APP_DEST" --surface plm
\`\`\`
EOF

echo "Packaged Zen Drama macOS tree at $OUTPUT_DIR"

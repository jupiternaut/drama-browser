# Stage 06 - Source-Registered Drama Chrome

Status: passed

Generated: 2026-06-29

## Source Workspace

- Source workspace: `/Users/gengrf/zen-browser-desktop`
- Source-built app: `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app`
- JSON evidence: `stage-06-source-chrome.json`

## Implementation

- Added source browser chrome resources under `engine/browser/base/content/drama/`.
- Added `engine/browser/base/content/drama-assets.jar.inc.mn`.
- Included Drama chrome resources from `engine/browser/base/jar.mn`.
- Added `drama-assets-head.inc.xhtml` to load the Drama manager and CSS from source-registered chrome.
- Added `drama-assets-body.inc.xhtml` to declare the Drama commands, toolbar, panel, and embedded browser.
- Kept the current wrapper package injection only as a transitional adapter and labeled it in `scripts/package-zen-drama-mac.sh`.
- Fixed the source package manifest so component manifests are included through chrome manifests instead of being treated as separate package roots.

## Verification

Command:

```bash
bun run scripts/verify-drama-source-chrome.ts \
  --source-workspace /Users/gengrf/zen-browser-desktop \
  --app-bundle "/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app" \
  --out /Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-06-source-chrome.json
```

Result: `ok: true`

Verified packaged `browser/omni.ja` entries:

- `chrome/browser/content/browser/drama/DramaBrowserChromeManager.mjs`
- `chrome/browser/content/browser/drama/app/index.html`
- `chrome/browser/content/browser/zen-components/ZenDramaManager.mjs`
- `chrome/browser/content/browser/zen-styles/zen-drama.css`
- `chrome/browser/content/browser/zen-icons/drama-start.svg`
- `chrome/browser/content/browser/zen-icons/drama-graph.svg`
- `chrome/browser/content/browser/zen-icons/drama-plm.svg`
- `chrome/browser/content/browser/zen-icons/drama-crew.svg`
- `chrome/browser/content/browser/zen-icons/drama-memory.svg`

Verified source-registered surface URLs:

- `chrome://browser/content/drama/app/index.html?host=drama&surface=start`
- `chrome://browser/content/drama/app/index.html?host=drama&surface=graph`
- `chrome://browser/content/drama/app/index.html?host=drama&surface=plm`
- `chrome://browser/content/drama/app/index.html?host=drama&surface=crew`
- `chrome://browser/content/drama/app/index.html?host=drama&surface=memory`

## Notes

The manager still publishes compatibility aliases such as `ZenDramaManager.mjs` and accepts `zen.drama.*` preferences as migration aliases. Those aliases are not counted as final product identity and are handled by later profile/preference and verifier stages.

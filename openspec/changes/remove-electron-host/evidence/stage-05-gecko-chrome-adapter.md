# Stage 05 Gecko Chrome Adapter

Date: 2026-06-29

## Files Changed

- `gecko-drama-chrome/DramaBrowserChromeManager.mjs`
- `/Users/gengrf/zen-browser-desktop/engine/browser/base/content/drama/DramaBrowserChromeManager.mjs`
- `/Users/gengrf/zen-browser-desktop/engine/browser/base/content/drama/app/index.html`
- `scripts/verify-drama-source-chrome.ts`
- `openspec/changes/remove-electron-host/evidence/stage-05-source-chrome.json`

## Browser Commands Added

`DramaBrowserChromeManager` now exposes browser-level commands:

- `openUrl(url)`
- `openInternalRoute(surface, params)`
- `newTab(url)`
- `newWindow(url)`
- `openFile(path)`
- `showInFolder(path)`
- `getDiagnostics()`

This assigns native URL, tab/window, file launch, file reveal, and browser diagnostics to Gecko chrome instead of Electron.

## Runtime Handoff

The manager continues to pass `runtime=<url>` into source-registered Drama app URLs. It now also supports optional `runtimeToken=<token>` from `drama.browser.runtime-token` / `zen.drama.runtime-token` prefs, without any Electron preload bridge.

## Source Chrome Registration

The source workspace under `/Users/gengrf/zen-browser-desktop` includes:

- source-registered `DramaBrowserChromeManager.mjs`
- source-registered app shell at `chrome://browser/content/drama/app/index.html`
- Start, Graph, PLM, Skill Crew, and Basic Memory surface routes
- Drama icons and CSS through browser chrome resources

The source app index was corrected to use `./assets/...` so chrome packaged assets resolve relative to the app document.

## Verification

Commands:

```bash
node --check gecko-drama-chrome/DramaBrowserChromeManager.mjs
node --check /Users/gengrf/zen-browser-desktop/engine/browser/base/content/drama/DramaBrowserChromeManager.mjs
bun run scripts/verify-drama-source-chrome.ts --out openspec/changes/remove-electron-host/evidence/stage-05-source-chrome.json
```

Results:

- Gecko manager syntax passed in wrapper repo and source workspace.
- `verify-drama-source-chrome.ts` passed.
- The verifier now checks for browser command methods and runtime token handoff support.

## Open Item

Runtime-unavailable styled recovery UI is not claimed here. It remains task 5.5 and will be accepted with source-built UI parity screenshots.


# Stage 03 Production UI Electron Boundary

Date: 2026-06-29

## Scope

Production UI roots checked:

- `apps/drama-browser-shell/src`
- `packages/drama-plm-ui/src`
- `packages/drama-graph-ui/src`
- `packages/drama-ui/src`

These roots are the source-built Drama Browser UI path for Start, PLM, Graph, Skill Crew, and Basic Memory work. `apps/webui` is documented in Stage 01 as a compatibility blocker and is not allowed to satisfy production UI gates.

## Changes

`scripts/check-drama-boundaries.ts` now includes a `production-ui-does-not-use-electron` rule that fails production UI source on:

- `window.electronAPI`
- `ipcRenderer`
- `contextBridge`
- direct `electron` imports
- `require("electron")`

The existing Gecko/browser main-path rule was also tightened to reject `ipcRenderer` and `contextBridge`.

## Verification

Commands:

```bash
cd /Users/gengrf/drama-browser
rg -n "window\\.electronAPI|ipcRenderer|contextBridge|from ['\\\"]electron|require\\(['\\\"]electron" apps/drama-browser-shell packages/drama-plm-ui packages/drama-graph-ui packages/drama-host packages/drama-ui packages/ui -g '!node_modules' -g '!dist'
bun scripts/check-drama-boundaries.ts
```

Results:

- No direct Electron calls were found in `apps/drama-browser-shell/src`, `packages/drama-plm-ui/src`, `packages/drama-graph-ui/src`, or `packages/drama-ui/src`.
- Remaining hits were README/comment-only examples outside the production UI gate.
- `bun scripts/check-drama-boundaries.ts` passed.

## Boundary

This stage verifies the current production UI path is Electron-free at source level. It does not claim `apps/webui` has been migrated; `apps/webui` remains a compatibility surface to contain or retire in later stages.


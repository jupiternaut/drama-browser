# Stage 01 Electron Surface Inventory

Date: 2026-06-29

Scope: `/Users/gengrf/drama-browser`, excluding `node_modules`, `dist`, `tmp`, and `.git`. `apps/electron` was inspected as the legacy boundary, but the production-blocker search focused on references outside that boundary.

## Summary

The current production blocker is not only the legacy Electron app. The main product-facing coupling is:

1. `apps/webui` still manufactures `window.electronAPI` and reuses Electron renderer transport/types.
2. `packages/shared/src/utils/open-url.ts` can dynamically import the Electron package for OAuth URL opening.
3. Root package scripts still expose Electron build/dist/install/update paths as first-class commands.
4. `/Applications/Drama.app` is Electron-based and must remain rejected as production.
5. The source-built Gecko app exists at `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app`, but it is not installed to `/Applications/Drama Browser.app`.

## Production UI Coupling Outside `apps/electron`

| Path | Classification | Evidence |
|---|---|---|
| `apps/webui/src/App.tsx` | production UI compatibility path | Assigns `(window as any).electronAPI = api` before mounting the Electron renderer app. |
| `apps/webui/src/adapter/web-api.ts` | production UI compatibility path | Builds a browser-compatible `ElectronAPI` using Electron renderer transport/types and a websocket RPC client. |
| `apps/webui/vite.config.ts` | production UI coupling | Aliases `@` to `../electron/src/renderer`. |
| `apps/webui/tsconfig.json` | production UI coupling | Includes Electron renderer source in the web UI TypeScript graph. |
| `apps/webui/src/index.css` | production UI coupling | Imports/scans Electron renderer CSS. |
| `packages/shared/src/utils/open-url.ts` | shared runtime blocker | Uses dynamic `import('electron')` before falling back to platform commands. |
| `packages/shared/src/auth/*-oauth.ts` | transitive runtime blocker | OAuth flows transitively call the shared URL opener. |

No source outside `apps/electron` directly uses `ipcRenderer`, `contextBridge`, or Electron `BrowserWindow` construction.

## Legacy Electron Boundary

The following paths are classified as legacy-only until final parity is accepted:

- `apps/electron/**`
- `apps/electron/scripts/**`
- root `electron:*` scripts
- `typecheck:electron`
- `lint:electron`
- `scripts/electron-*`
- `scripts/install-app.sh`
- `scripts/install-app.ps1`
- `scripts/build/**` Electron packager helpers

## Build, Package, Update, and Install Coupling

| Area | Classification | Evidence |
|---|---|---|
| root `package.json` `electron:*` scripts | legacy-only | Build, start, dev, and dist commands still target Electron. |
| root `package.json` `server:dev` / `server:prod` | production leak | Still set `CRAFT_BUNDLED_ASSETS_ROOT=$PWD/apps/electron`. |
| root dependencies | legacy dependency blocker | Root still declares `electron`, `electron-builder`, `@electron/packager`, and `@sentry/electron`. |
| `apps/electron/package.json` | legacy-only | Contains Electron runtime, updater, and build dependencies. |
| `apps/electron/electron-builder.yml` | legacy-only | Publishes generic Electron update metadata and packages macOS/Windows/Linux Electron artifacts. |
| `apps/electron/src/main/auto-update.ts` | legacy-only | Uses `electron-updater`; production Gecko path must not reuse it. |
| `scripts/install-app.sh` / `scripts/install-app.ps1` | legacy-only | Fetch Electron latest manifests from hosted Electron release path. |
| `scripts/package-zen-drama-win.ps1` | production leak | Copies `apps/electron/resources/drama-icon.ico`; asset should move to a neutral Drama resource path. |

## API Method Classification

| Category | Representative APIs | Target owner |
|---|---|---|
| Navigation/window | `openUrl`, `menuNewWindow`, `menuQuit`, browser pane commands | Gecko chrome adapter |
| Files/dialogs | `openFile`, `showInFolder`, `readFile`, `readFilePreviewDataUrl`, file dialogs | Runtime or Gecko chrome, depending on native UI need |
| Sessions | `sessionCommand`, `cancelProcessing`, status/progress/event subscriptions | Drama Runtime |
| AI/MCP/server | `invokeOnServer`, model/provider calls, workspace transport | Drama Runtime |
| PLM sidecar | PlotPilot runtime status/start/stop/logs | Drama Runtime |
| Graph | graph load/history/backup/node/edge/task-binding operations | Drama Runtime |
| Skill Crew | refresh/import/run/feedback | Drama Runtime |
| Basic Memory | library read/search/edit/save | Drama Runtime |
| Settings/preferences | send-message key, spell check, preferences, workspace settings | Runtime with host settings bridge where native |
| Updates | update checks/latest release/release notes | legacy-only until Drama-owned updater exists |
| Electron process/window focus | Electron window focus events, Electron menu toggles | legacy-only or replaced by Gecko chrome commands |

## Removal Blockers and Owners

| Blocker | Owner module | Next action |
|---|---|---|
| `apps/webui` creates `window.electronAPI` | UI host layer | Replace with `DramaHost` and runtime/gecko adapters; stop importing Electron renderer app as the production UI root. |
| Electron renderer aliases in web UI | UI build config | Move shared UI to neutral packages or route production shell through `apps/drama-browser-shell`. |
| Shared URL opener imports Electron | shared/runtime | Replace Electron branch with injected host opener or runtime endpoint. |
| Root Electron scripts look production-like | build tooling | Mark as legacy, add production `drama:browser:*` scripts, and exclude legacy from production gates. |
| Electron updater release flow | release tooling | Disable in production until Drama-owned updater exists. |
| Electron app installed as `/Applications/Drama.app` | install transition | Keep as legacy or remove after `/Applications/Drama Browser.app` is accepted. |

## Conclusion

OpenSpec tasks 1.1 through 1.5 are satisfied by this inventory plus the companion JSON files in this evidence directory. No code migration is claimed by this stage.

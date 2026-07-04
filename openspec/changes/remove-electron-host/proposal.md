## Why

Drama Browser has a source-built Gecko product path, but the installed daily package and several build/runtime modules still depend on Electron. This keeps two desktop hosts alive, makes verification ambiguous, and prevents Drama Browser from becoming a single Gecko-native browser product.

## What Changes

- Make the source-built Gecko `Drama Browser.app` the only supported desktop host for production builds.
- Move Electron main/preload responsibilities behind Drama-owned host/runtime APIs.
- Route UI modules through `@drama/host` instead of direct `window.electronAPI` calls.
- Move local filesystem, session, AI, MCP, PLM, Graph, Crew, and Memory capabilities into `apps/drama-runtime` or source-registered Gecko chrome adapters.
- Register the Drama Browser Shell and all Drama surfaces in the source-built browser package rather than Electron renderer packaging.
- Replace Electron distribution scripts with source-built Drama Browser package/install/verify scripts.
- Keep `apps/electron` only as a legacy compatibility archive until all parity gates pass.
- **BREAKING** for final production builds: Electron app packaging, Electron IPC, Electron preload APIs, Electron Helper processes, and Electron updater are not production interfaces.

## Capabilities

### New Capabilities

- `electron-free-drama-browser`: production builds, host API boundaries, runtime ownership, Gecko chrome integration, Electron removal gates, and user-facing parity requirements for a Drama Browser build with no Electron dependency.

### Modified Capabilities

- `zen-native-concurrency-performance`: extend launch and runtime budgets so the source-built Gecko host, not the Electron package, is the production performance target.
- `zen-native-uiux-quality`: require Drama surfaces to render through the source-built Gecko product path and not depend on Electron renderer/preload behavior.

## Impact

- Affected app/runtime areas:
  - `apps/drama-browser-shell`
  - `apps/drama-runtime`
  - `packages/drama-host`
  - `packages/drama-ui`
  - `packages/drama-plm-ui`
  - `packages/drama-graph-ui`
  - `packages/session-mcp-server`
  - `gecko-drama-chrome`
- Affected legacy areas:
  - `apps/electron`
  - Electron build scripts in root `package.json`
  - `scripts/electron-*`
  - `electron-builder` release artifacts
- Affected source-built browser areas:
  - `/Users/gengrf/zen-browser-desktop`
  - source-registered Drama chrome/resources
  - macOS source-built package, helper, profile, URL scheme, and verifier scripts
- Verification:
  - OpenSpec strict validation.
  - Host API typecheck proving production UI does not access `window.electronAPI`.
  - Bundle scan proving production app contains no `Electron Framework.framework`.
  - Process scan proving no Electron Helper process appears.
  - Surface screenshots for Start, Graph, PLM, Skill Crew, and Basic Memory from source-built Drama Browser.
  - Runtime parity for filesystem, session, AI/MCP, PLM sidecar, Graph data, Skill Crew, and Basic Memory.

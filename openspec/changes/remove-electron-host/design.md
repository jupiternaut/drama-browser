## Context

Drama Browser currently has two desktop host paths:

1. a legacy Electron application at `/Applications/Drama.app`;
2. a source-built Gecko application at `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app`.

The source-built app has already passed product-identity gates, but the app-layer repository still carries Electron as a production host. The strongest coupling is not React itself; it is the host bridge around Electron main/preload, `window.electronAPI`, Electron distribution scripts, Electron updater, and bundled resources under `apps/electron`.

The desired architecture keeps React/Vite/Bun, but removes Electron as a desktop host. Gecko owns the browser window, profile, tabs, URL schemes, and privileged chrome. Drama Runtime owns local filesystem, session, AI, MCP, PLM, Graph, Skill Crew, and Basic Memory capabilities. UI code talks only to `@drama/host` and runtime APIs.

## Goals / Non-Goals

**Goals:**

- Make source-built Gecko `Drama Browser.app` the only production desktop app.
- Remove Electron from production build, package, install, update, verification, and process expectations.
- Replace direct `window.electronAPI` usage with a Drama-owned host API.
- Move business capabilities out of Electron main/preload into `apps/drama-runtime`, `packages/*`, or Gecko chrome adapters.
- Preserve Start, Graph, PLM, Skill Crew, Basic Memory, local files, session workflows, AI/MCP, and Chinese UI paths.
- Keep a temporary legacy Electron archive until Gecko parity passes.

**Non-Goals:**

- Do not rewrite PLM, Graph, Crew, or Basic Memory UI in XUL.
- Do not remove Firefox/Gecko/Mozilla dependencies or source attribution.
- Do not remove React, Vite, Bun, or TypeScript.
- Do not delete `apps/electron` before all production callers stop using it.
- Do not claim public release readiness until signing/notarization and Drama-owned updater infrastructure are complete.

## Decisions

### Decision 1: Use Gecko as the only production desktop host

Production packaging shall target source-built `Drama Browser.app`. Electron shall become a legacy compatibility surface, not a production fallback.

Alternative considered: keep both Electron and Gecko as supported production hosts. Rejected because it doubles verification, update, process, and UI bridge surfaces and makes "Drama Browser" identity ambiguous.

### Decision 2: Introduce `@drama/host` as the only UI host boundary

React UI modules shall depend on a typed `DramaHost` interface instead of `window.electronAPI`. The production adapter shall call Drama Runtime APIs and Gecko chrome APIs. A legacy adapter can map to `window.electronAPI` while migration is incomplete.

Alternative considered: mechanically replace `window.electronAPI` with direct `fetch()` calls in every component. Rejected because browser chrome commands, native dialogs, and local capabilities need a stable contract and typed capability discovery.

### Decision 3: Move Electron main/preload capabilities into Runtime or Gecko chrome by ownership

Capability ownership:

- local files, sessions, AI/MCP, PLM sidecar, Graph persistence, Skill Crew, Basic Memory: `apps/drama-runtime` and shared packages;
- window/tab/navigation/profile/protocol/native browser affordances: Gecko chrome manager;
- purely visual UI state: React packages and `@drama/host`.

Alternative considered: run Electron main as a hidden sidecar. Rejected because it still ships Electron, keeps Electron Helper processes, and fails the no-Electron product gate.

### Decision 4: Build the shell once and package it into Gecko chrome resources

`apps/drama-browser-shell` remains the main React/Vite entrypoint. Its production build is registered in the source-built browser package and opened via `chrome://drama/...` or the canonical Drama product path.

Alternative considered: serve the shell only from localhost. Rejected because the first viewport would depend on runtime startup and would not be a native browser resource.

### Decision 5: Delete Electron only after production gates pass

The migration shall first make Electron unused in production and only then remove dependencies and scripts. During migration, tests may allow legacy Electron files only under an explicit archive path.

Alternative considered: delete `apps/electron` first. Rejected because it would break current file/session/update/menu implementations before replacement APIs are verified.

## Risks / Trade-offs

- Electron API surface is large -> classify each method by ownership and migrate high-use methods first.
- Runtime sidecar may become a bottleneck -> add health, timeout, and startup budgets before removing Electron fallback.
- Gecko chrome APIs differ from Electron APIs -> isolate browser-native behavior behind a small adapter with verifier coverage.
- Local file permissions may change -> verify open file, reveal in Finder, import/export, and thumbnail flows on macOS and Windows paths.
- Public updater cannot reuse Electron updater -> keep production updater disabled until Drama-owned metadata/signing exists.
- Large diff risk -> stage changes through adapters, then remove scripts/deps after parity.

## Migration Plan

1. Inventory Electron surface:
   - list all `window.electronAPI` methods;
   - classify each as runtime, Gecko chrome, UI-only, or legacy-only;
   - add an inventory artifact that becomes the migration checklist.
2. Host API phase:
   - add `DramaHost` interfaces in `packages/drama-host`;
   - route shell, PLM, Graph, Crew, Memory, and common UI through `DramaHost`;
   - keep a legacy Electron adapter only for non-production paths.
3. Runtime phase:
   - move local/session/AI/MCP/PLM/Graph/Crew/Memory capabilities into `apps/drama-runtime`;
   - expose token-protected localhost/WebSocket APIs;
   - add health and capability discovery.
4. Gecko chrome phase:
   - expose window/tab/profile/protocol/native browser commands through `gecko-drama-chrome`;
   - register shell assets into the source-built package;
   - verify all Drama surfaces in source-built `Drama Browser.app`.
5. Packaging phase:
   - replace `electron:*` production scripts with source-built package/install/verify scripts;
   - install `/Applications/Drama Browser.app` from the source-built artifact;
   - remove Electron updater from production release flow.
6. Removal phase:
   - move `apps/electron` to legacy/archive or delete it after parity;
   - remove Electron dependencies from root production dependencies;
   - add a CI/verifier gate that fails production builds containing Electron.

Rollback strategy:

- Before the removal phase, keep the legacy Electron package available for emergency local use.
- After removal, rollback means reinstalling the last legacy artifact, not reintroducing Electron into production builds.

## Open Questions

- Should legacy Electron be archived inside this repo or moved to a separate branch/tag?
- Should the production installed app be `/Applications/Drama Browser.app` while `/Applications/Drama.app` is uninstalled?
- Which `window.electronAPI` methods are still required by Basic Memory and the full chat/cowork/code surfaces?
- Should runtime startup be launched by Gecko chrome, a LaunchAgent, or a user-started sidecar for public builds?

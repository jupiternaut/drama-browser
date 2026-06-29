## 1. Electron Surface Inventory

- [ ] 1.1 Generate an inventory of all `window.electronAPI` usages and Electron imports outside `apps/electron`
- [ ] 1.2 Generate an inventory of all Electron build, package, update, and install scripts in root `package.json` and `scripts/`
- [ ] 1.3 Classify each Electron API method as `runtime`, `gecko-chrome`, `ui-state`, or `legacy-only`
- [ ] 1.4 Record the current installed app state for `/Applications/Drama.app` and source-built `Drama Browser.app`
- [ ] 1.5 Add an evidence file listing Electron removal blockers and owners by module

## 2. DramaHost Contract

- [ ] 2.1 Define a typed `DramaHost` interface in `packages/drama-host` covering navigation, dialogs, files, sessions, runtime, PLM, Graph, Skill Crew, Basic Memory, settings, and diagnostics
- [ ] 2.2 Add capability discovery so UI can disable or recover when a host capability is unavailable
- [ ] 2.3 Add a production `DramaBrowserHostAdapter` that talks to Drama Runtime and Gecko chrome APIs
- [ ] 2.4 Keep a `LegacyElectronHostAdapter` only under an explicit legacy path
- [ ] 2.5 Add tests proving production host selection never returns the legacy Electron adapter

## 3. UI Migration Off `window.electronAPI`

- [ ] 3.1 Replace direct Electron API access in `apps/drama-browser-shell` with `DramaHost`
- [ ] 3.2 Replace direct Electron API access in `packages/drama-plm-ui` with `DramaHost` or runtime APIs
- [ ] 3.3 Replace direct Electron API access in `packages/drama-graph-ui` with `DramaHost` or runtime APIs
- [ ] 3.4 Replace direct Electron API access in shared Drama UI packages with `DramaHost`
- [ ] 3.5 Add a source check that fails production UI code containing `window.electronAPI`, `ipcRenderer`, `contextBridge`, or direct `electron` imports

## 4. Runtime Capability Migration

- [ ] 4.1 Move local file open/reveal/preview/import/export capabilities from Electron main/preload ownership into Drama Runtime or Gecko chrome ownership
- [ ] 4.2 Move session command, cancellation, progress, source, skill, label, and status operations behind Runtime APIs
- [ ] 4.3 Move PLM sidecar start/stop/status/log operations behind Runtime APIs
- [ ] 4.4 Move Graph persistence/history/backup/node/edge/task-binding operations behind Runtime APIs
- [ ] 4.5 Move Skill Crew refresh/import/run/feedback operations behind Runtime APIs
- [ ] 4.6 Move Basic Memory library read/search/edit/save operations behind Runtime APIs
- [ ] 4.7 Add `/health` and `/capabilities` runtime endpoints with timeout-safe responses

## 5. Gecko Chrome Adapter

- [ ] 5.1 Add Gecko chrome commands for open URL, internal route navigation, new tab/window, profile-aware launch, and native browser diagnostics
- [ ] 5.2 Register Drama Browser Shell static assets through source-built chrome/resource registration
- [ ] 5.3 Route `drama://`, Start, Graph, PLM, Skill Crew, and Basic Memory to source-registered Drama resources
- [ ] 5.4 Add token handoff from Gecko chrome to Drama Runtime without Electron preload
- [ ] 5.5 Verify Gecko chrome failure states render styled recovery UI when Runtime is unavailable

## 6. Production Build and Packaging

- [ ] 6.1 Add `drama:browser:build` to build Drama packages, browser shell assets, runtime artifacts, and source-built Gecko resources without Electron
- [ ] 6.2 Add `drama:browser:package:mac` to produce the source-built `Drama Browser.app` and DMG without Electron tooling
- [ ] 6.3 Add `drama:browser:install:mac` to install `/Applications/Drama Browser.app` from the source-built artifact
- [ ] 6.4 Mark `electron:*` scripts as legacy and exclude them from production validation
- [ ] 6.5 Remove Electron updater from production release flow and keep updates disabled until Drama-owned updater infrastructure exists

## 7. Legacy Electron Containment

- [ ] 7.1 Move Electron-only documentation, release artifacts, and compatibility scripts under an explicit legacy/archive boundary
- [ ] 7.2 Ensure production imports and package scripts do not traverse `apps/electron`
- [ ] 7.3 Remove root production dependency on `electron`, `electron-builder`, `@electron/packager`, `@sentry/electron`, and `electron-updater`
- [ ] 7.4 Keep a documented emergency legacy launch path only until source-built parity is accepted
- [ ] 7.5 Add a verifier allowlist for legacy Electron paths and fail any Electron reference outside that boundary

## 8. Source-Built UI Parity

- [ ] 8.1 Capture Start screenshot from source-built Drama Browser with no Electron processes running
- [ ] 8.2 Capture Graph screenshot and runtime status from source-built Drama Browser with no Electron processes running
- [ ] 8.3 Capture PLM screenshot with runtime, sidecar, AI, workspace, and parity states visible from source-built Drama Browser
- [ ] 8.4 Capture Skill Crew screenshot and capability status from source-built Drama Browser
- [ ] 8.5 Capture Basic Memory screenshot and local library status from source-built Drama Browser
- [ ] 8.6 Capture runtime-unavailable and local-file/permission recovery states from source-built Drama Browser

## 9. Performance and Process Verification

- [ ] 9.1 Add a production verifier that fails if the app bundle contains `Electron Framework.framework`
- [ ] 9.2 Add a production process verifier that fails on Electron Helper processes during Start, Graph, PLM, Skill Crew, or Basic Memory launch
- [ ] 9.3 Record first styled viewport, runtime readiness, sidecar readiness, route switch time, and listener counts through the Gecko host
- [ ] 9.4 Ensure Electron timing data is labeled legacy and cannot satisfy production performance gates
- [ ] 9.5 Verify duplicate runtime launch prevention without Electron main-process lock ownership

## 10. Cross-Platform Path and Workflow Checks

- [ ] 10.1 Verify long macOS paths render correctly in file, session, Graph, PLM, Skill Crew, and Basic Memory panels
- [ ] 10.2 Verify Windows-style paths render correctly in the same panels even when running on macOS test fixtures
- [ ] 10.3 Smoke test file open/reveal/preview/import/export through Runtime or Gecko chrome APIs
- [ ] 10.4 Smoke test session, AI/MCP, PLM, Graph, Skill Crew, and Basic Memory workflows without Electron IPC
- [ ] 10.5 Confirm Chinese status, recovery, and diagnostics copy remains usable after host migration

## 11. Installed App Transition

- [ ] 11.1 Decide whether `/Applications/Drama.app` is removed, renamed, or left as legacy during migration
- [ ] 11.2 Install source-built `/Applications/Drama Browser.app` as the accepted production app
- [ ] 11.3 Confirm system search finds the source-built Drama Browser icon/name rather than the Electron app
- [ ] 11.4 Confirm `drama://` routes open the source-built Drama Browser app
- [ ] 11.5 Confirm production verification rejects `/Applications/Drama.app` while it is Electron-based

## 12. Final Validation and Handoff

- [ ] 12.1 Run OpenSpec strict validation for `remove-electron-host`
- [ ] 12.2 Run production typecheck/build for Drama packages, browser shell, runtime, and Gecko source package scripts
- [ ] 12.3 Run no-Electron bundle/process verifier
- [ ] 12.4 Run source-built UI/runtime parity verifier and save screenshots/evidence
- [ ] 12.5 Update PR/handoff docs with accepted production path, legacy Electron boundary, remaining updater/signing blockers, and rollback instructions

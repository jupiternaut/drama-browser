# Handoff: Zen Drama Migration

## Status

Date: 2026-06-18

Drama has been migrated from the Electron-first path toward a Zen Browser hosted workbench. The current public-preview path is:

```text
Zen Browser chrome
  -> Zen sidebar buttons for Drama Graph / Drama PLM / Skill Crew
  -> bundled chrome resource chrome://browser/content/drama/app/index.html
  -> standalone Drama runtime at http://127.0.0.1:3198
  -> Graph / PLM / Crew package surfaces
```

Electron remains as a legacy compatibility path. It is not the primary host for the current migration.

## Repository Areas

| Area | Purpose |
| --- | --- |
| `apps/drama-browser-shell` | React browser shell used by the Zen hosted panel |
| `apps/drama-runtime` | Standalone local runtime for Graph, PLM, Crew, filesystem, and PlotPilot proxying |
| `packages/drama-core` | Shared Drama graph/event primitives |
| `packages/drama-graph` | Graph store, persistence, IPC contracts, Storylet adapter |
| `packages/drama-graph-ui` | Drama Graph React canvas surface |
| `packages/drama-plm` | PlotPilot runtime/client contracts |
| `packages/drama-plm-ui` | Drama PLM React surface, including the Script Studio UI |
| `packages/drama-crew` | Skill Crew runtime/event helpers |
| `packages/drama-host` | Browser/runtime host abstractions |
| `packages/drama-ui` | Shared Drama UI primitives and styles |
| `scripts/package-zen-drama-win.ps1` | Creates the Windows Zen Drama package directory |
| `scripts/install-zen-drama-package.ps1` | Installs the package into `%LOCALAPPDATA%\Programs\DramaZen` |
| `docs/ui-aesthetic-scorecard.md` | Current UI/UX scoring and acceptance table |
| `openspec/changes/zen-drama-workbench-ui` | OpenSpec baseline for the Zen workbench UI |
| `openspec/changes/zen-plm-phase-zero-contract` | OpenSpec contract for product-path Zen PLM integration |
| `openspec/changes/zen-native-port-performance-uiux` | OpenSpec gates for Zen-native concurrency, performance, screenshots, and UI/UX quality |
| `docs/decisions/ADR-003-zen-plm-integration-contract.md` | ADR defining PLM surface classifications and readiness tiers |
| `docs/verification/zen-plm-phase1-local-2026-06-17.md` | Local macOS fallback verification record for the PLM contract work |
| `docs/verification/zen-drama-windows-adapter-dependencies-current.json` | Windows adapter dependency file; it is not Windows runtime evidence |

## Zen PLM Integration Contract

PLM product-path validation requires:

```text
chrome://browser/content/drama/app/index.html?host=zen&runtime=...&surface=plm
```

Surface classifications:

| Classification | Counts as product Zen PLM? | Meaning |
| --- | --- | --- |
| `product-zen-panel` | yes | Real Zen Browser panel loaded from packaged chrome resources |
| `dev-localhost` | no | `http://127.0.0.1:3198/app/plm?...` developer compatibility route |
| `browser-fallback` | no | Brave, Chromium, Chrome, or other non-Zen browser-shell validation |
| `legacy-electron` | no | Electron compatibility surface |

Readiness tiers:

| Tier | Current meaning |
| --- | --- |
| `shell-ready` | Zen chrome-resource panel opens and mounts the styled Drama PLM shell |
| `runtime-ready` | standalone Drama runtime is reachable |
| `plm-sidecar-ready` | PlotPilot-compatible sidecar is healthy through the runtime |
| `ai-ready` | Codex-backed AI is available and authenticated |
| `workflow-preview-ready` | Script Studio panels have an active project workspace |
| `plotpilot-parity-ready` | PlotPilot-native prompt registry writes and post-chapter memory sync visualization are complete |

## Current UX State

Graph:

- Opens as a Zen sidebar/panel surface.
- Renders a full canvas workbench with toolbar, search, minimap, and inspector.
- Still needs stronger Obsidian/AFFiNE-style editing feel: multi-select, box select polish, richer edge editing, screenshot regression.

PLM:

- Opens as a Zen sidebar/panel surface.
- Loads from `chrome://browser/content/drama/app/index.html?host=zen&runtime=...&surface=plm` in the product path; `127.0.0.1:3198/app/plm` is now a fallback/dev compatibility route.
- Uses the new light Script Studio layout: project navigation, chapter/beat list, central paper editor, script toolbar, and right-side control rail.
- Right rail now includes outline, relationship chain, progress, character-profile storage cards, prompt-storage cards, and a browser Web Audio music player.
- Right rail storage cards are editable: character cards save back to the Bible, prompt cards save to Drama project files, emit graph events, and are reloaded from project files when the novel is selected again.
- AI Invocation review now has a white Script Studio panel under Debug: session loading, resume, retry, accept, reject, commit, prompt snapshot, variable plan, output bindings, attempt output, and decision/commit status are visible without dropping into the old dark JSON panel.
- AI Invocation actions emit graph events (`plm.invocation.loaded/resumed/retried/accepted/rejected/committed`) when the session carries a novel context.
- The white Production mode now surfaces Hosted Write and Autopilot as first-class controls: chapter range, auto-save/outline switches, max-auto limit, auto-approve mode, progress bars, failure recovery, live chapter stream, and a unified production timeline.
- Hosted Write stream events are retained in UI state and key lifecycle events emit graph events (`plm.hostedWrite.session/chapter_start/saved/approval_required/session_done/error`). Autopilot control actions and terminal/failure events emit graph events (`plm.autopilot.started/stopped/resumed/breakerReset/error/beat_error/paused_for_review/autopilot_complete`).
- Debug mode now includes a white Memory graph panel: refresh/infer controls, entity chips, triple cards, Knowledge Graph search, retrieved-result cards, and `memory.search` / `memory.search.failed` graph events.
- Runtime root `/` redirects to `/app/plm?host=zen&runtime=...`, so users no longer land on raw JSON.
- Current readiness wording:
  - `shell-ready`, `runtime-ready`, `plm-sidecar-ready`, `ai-ready`, and `workflow-preview-ready` can be verified independently.
  - `plotpilot-parity-ready` is still blocked by PlotPilot-native prompt registry write APIs and post-chapter memory sync visualization.

Crew:

- Opens as a Zen sidebar/panel surface.
- Preserves crew tree, room feed, and AgentOS status layout.
- Still needs deeper AgentOS runtime parity and all agent outputs written as structured graph events.

## Verification Commands

Run these from the repository root:

```powershell
bun run browser-shell:typecheck
bun run browser-shell:build
bun run runtime:typecheck
bun run drama:build-packages
bun run zen:drama:package:win
bun run zen:drama:install:win
bun run zen:drama:install:verify:panel:win
bun run zen:drama:verify:marionette:win -- -AllSurfaces -CheckRouteSwitches
bun run zen:drama:windows-gate -- -PackageZip "path-or-url-to-zen-drama-win-x64.zip" -AllSurfaces -CheckRouteSwitches
bun run zen:drama:prepare-zen-bin:win -- -ZenInstallerUrl "https://github.com/zen-browser/desktop/releases/latest/download/zen.installer.exe" -OutputDir "dist\\zen-windows-bin" -Force
bun run zen:drama:verify:contract
bun run zen:drama:verify:visual
bun run zen:drama:verify:workflow
bun run zen:drama:verify:marionette -- --zen-app "/Users/gengrf/drama-browser/dist/zen-drama-mac-sourcebuilt/Zen Browser.app" --surface plm --output docs/verification/zen-drama-mac-marionette-plm-current.json --strict
bun run zen:drama:verify:marionette -- --zen-app "/Users/gengrf/drama-browser/dist/zen-drama-mac-sourcebuilt/Zen Browser.app" --surface plm --output docs/verification/zen-drama-mac-marionette-performance-plm-current.json --check-route-switches --strict
```

Manual smoke:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Programs\DramaZen\Start-Drama-Zen.ps1" -Surface plm
```

Then open from the installed Zen panel. The expected panel URL is:

```text
chrome://browser/content/drama/app/index.html?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198&surface=plm
```

Expected result: render the PLM Script Studio from Zen chrome resources. `http://127.0.0.1:3198/` still redirects to `/app/plm?...` only as a compatibility/dev smoke path.

Fallback validation:

```bash
bun run zen:drama:verify:contract -- --url "http://127.0.0.1:3198/app/plm?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198"
bun run zen:drama:verify:mac -- --surface plm
```

The contract verifier labels localhost as `dev-localhost`. Product-path proof now requires a real Zen package or source-built Zen tree loading `chrome://browser/content/drama/app/index.html`. Brave, Electron, localhost, and renamed wrappers must remain fallback evidence only.

The Windows Marionette gate writes product-path JSON and PNG evidence under `docs\verification`:

```powershell
bun run zen:drama:verify:marionette:win -- -AllSurfaces -CheckRouteSwitches
```

It starts the installed packaged runtime, verifies `runtimePackageRoot` against `%LOCALAPPDATA%\Programs\DramaZen`, launches the installed `zen\zen.exe`, captures WebDriver screenshots, enforces first-viewport/runtime/sidecar/route-switch/startup budgets, and writes `zen-drama-win-marionette-summary-current.json`.

The end-to-end Windows gate can install and verify a built package zip:

```powershell
bun run zen:drama:windows-gate -- -PackageZip "path-or-url-to-zen-drama-win-x64.zip" -AllSurfaces -CheckRouteSwitches
```

It writes `zen-drama-windows-product-gate-current.json` beside the Marionette JSON/PNG evidence. The manual GitHub workflow `Zen Drama Windows Product Gate` runs the same script on `windows-latest` when given a package zip URL.

For the current OpenSpec change, Windows is not a required runtime gate. The required Windows deliverable is the adapter dependency file:

```text
docs/verification/zen-drama-windows-adapter-dependencies-current.json
```

That file records the Windows tools, package inputs, commands, paths, and evidence policy. It does not claim that Windows Zen runtime behavior has passed.

If no built Zen Drama package zip is available, the workflow can build one from the official Zen Windows installer. Locally on Windows the equivalent preparation path is:

```powershell
bun run zen:drama:prepare-zen-bin:win -- -ZenInstallerUrl "https://github.com/zen-browser/desktop/releases/latest/download/zen.installer.exe" -OutputDir "dist\zen-windows-bin" -Force
bun run zen:drama:package:win -- -ZenBinDir "dist\zen-windows-bin" -NoPlotPilotBundle -Zip
bun run zen:drama:windows-gate -- -PackageZip "dist\zen-drama-win-x64.zip" -AllSurfaces -CheckRouteSwitches
```

On GitHub Actions, dispatch `Zen Drama Windows Product Gate` without `package-zip-url` to run the same installer -> package -> product gate path. This still must produce successful Windows JSON/PNG evidence before making a cross-platform runtime claim.

The local repository preflight for this Windows gate is:

```bash
bun run zen:drama:verify:win-gate-preflight
```

It verifies that the shared verifier, Windows wrapper, adapter dependency file, release wording, and OpenSpec 7.4 scope are wired correctly. It does not satisfy Windows product-path runtime verification.

Readiness release gate examples:

```bash
bun run zen:drama:verify:contract -- --claim-tier ai-ready
bun run zen:drama:verify:contract -- --url "chrome://browser/content/drama/app/index.html?host=zen&runtime=http%3A%2F%2F127.0.0.1%3A3198&surface=plm" --host-kind gecko --expect-product --require-runtime --workspace-present --claim-tier runtime-ready
```

The first command must fail on localhost/fallback evidence. The second is only a synthetic classifier gate; it does not replace a real Zen panel screenshot.

## Packaging

Current Windows package output:

```text
dist/zen-drama-win-x64
```

The package includes:

- Zen browser binary tree
- Drama browser shell build copied both to `drama-browser-shell/dist` and to `zen/browser/chrome/browser/content/browser/drama/app` for the internal `chrome://browser/content/drama/app/index.html` product path
- Standalone Drama runtime bundle
- PlotPilot v4.6 source/runtime sidecar when available locally
- Launch scripts and desktop shortcut installer
- Runtime lifecycle monitor that binds to the real Zen main-window process, not the transient launcher process
- Shutdown cleanup for the packaged Drama runtime and PlotPilot sidecar, including adopted PlotPilot listeners

`dist/` is intentionally ignored by Git. Upload package zips as GitHub release assets instead of committing them.

## Known Gaps

| Gap | Next Action |
| --- | --- |
| Graph editing not yet advanced-canvas grade | Continue Obsidian/AFFiNE-style editing work: box select, multi-select, edge creation/editing, keyboard shortcuts |
| PLM prompt cards are not PlotPilot-native writes | Project-file + graph-event persistence is implemented and reloads into the Script Studio prompt view; switch to real PlotPilot prompt registry write API when v4.6 exposes it |
| PLM Prompt Registry still lacks PlotPilot-native writes | Project-file + graph-event persistence works; wire real prompt registry mutations when PlotPilot exposes them |
| PLM Memory graph post-chapter sync is still shallow | Entity/triple/search UI is implemented; add per-chapter memory diff visualization after generation/save |
| Crew runtime parity incomplete | Move remaining AgentOS execution details into package-level runtime and graph events |
| Windows runtime verification not required for this OpenSpec change | Keep `docs/verification/zen-drama-windows-adapter-dependencies-current.json` current; run the Windows product gate only before making a cross-platform runtime claim |
| Package size is large | Consider a bootstrap installer that downloads Zen/PlotPilot dependencies instead of bundling everything |

PLM readiness blockers:

| Tier | Blocker |
| --- | --- |
| `plotpilot-parity-ready` | PlotPilot-native prompt registry writes are not wired yet |
| `plotpilot-parity-ready` | Post-chapter memory sync visualization is still shallow |
| `workflow-preview-ready` | Requires an active project workspace; a workspace-missing state must be visible when absent |

## Public Release Boundary

This release is a public preview of the Zen Browser migration. Release wording must match the lowest passing concurrency, performance, UI/UX, and platform gate. The current macOS source-built Zen evidence reaches `plm-sidecar-ready` for the product path, with visible `ai-unavailable` and `workspace-missing` recovery states. Windows support is represented by an adapter dependency file and package/verification entrypoints; cross-platform Zen-native runtime success is not claimed until the Windows package gate passes. It should not be described as:

- full PlotPilot parity,
- full AgentOS parity,
- final advanced Graph canvas,
- or a finished 90+ UI/UX product.

It is accurate to describe it as:

- a Zen Browser hosted Drama workbench,
- a de-Electronized main path with a local runtime,
- Graph / PLM / Crew package surfaces,
- and a PLM Script Studio prototype with right-side storage/control cards,
- verified on macOS source-built Zen for chrome-resource mounting, screenshots, runtime/sidecar budgets, and route-switch responsiveness.

It is not accurate to describe localhost, Brave, or Electron runs as `product-zen-panel` validation.

The release gate in `scripts/verify-zen-plm-contract.ts` compares any claimed readiness tier with the highest contiguous verified tier. If `shell-ready` is blocked, localhost runtime/Codex checks cannot be promoted into a product-path readiness claim.

## Most Recent Validation

Previously validated locally on Windows before the current macOS-only OpenSpec scope:

- `packages/drama-plm-ui` typecheck passed.
- `browser-shell:typecheck` passed.
- `browser-shell:build` passed.
- `runtime:typecheck` passed.
- `zen:drama:package:win` passed.
- `zen:drama:install:win` passed.
- Dev and installed Zen panel verification passed with `currentURI = chrome://browser/content/drama/app/index.html?...&surface=plm`.
- Installed Zen panel verification now seeds a legacy toolbar state with the stale `zen-drama-button`; the launcher/package code rewrites it to `zen-drama-graph-sidebar-button`, `zen-drama-plm-sidebar-button`, and `zen-drama-crew-sidebar-button` before focusing an existing window. This fixes the blank formal-profile window where PLM disappeared after prior runs.
- Installed lifecycle smoke passed: launching twice focuses the existing Zen window, keeps one monitor for the active Zen PID, closing Zen makes `runtime=offline`, makes PlotPilot `8005/health` unreachable, clears the monitor process, and restarting returns `runtime=ready`.
- Installed project-file smoke passed: `drama:projectFile:record` wrote a `plm.storageCard.prompt.saved` record and `drama:projectFile:list` read it back through the packaged runtime.
- Installed PLM panel verification passed after adding the white AI Invocation review panel and graph-event writer for invocation actions.

Validated locally on macOS as fallback evidence:

- `packages/drama-plm-ui` typecheck passed after Codex-backed generation handler gating.
- `browser-shell:typecheck`, `browser-shell:build`, and `runtime:typecheck` passed.
- `zen:drama:verify:visual` passed in Brave headless and captured a styled `PlotPilot sidecar unavailable` PLM first viewport at `tmp/verification/zen-plm-v2v4-dev-localhost-first-viewport.png`.
- `zen:drama:verify:workflow` passed and wrote/read a `plm.storageCard.prompt.saved` project-file record through runtime RPC.
- Failure-state JSON evidence exists for runtime unavailable, sidecar unavailable, Codex unauthenticated, workspace missing, and CSS/token bridge failure under `tmp/verification/zen-plm-failure-*.json`.

Validated locally on macOS product path with source-built Zen:

- `browser-shell:typecheck`, `browser-shell:build`, `runtime:typecheck`, `packages/drama-plm` typecheck, and 21 PLM runtime/client tests passed.
- Source-built package: `/Users/gengrf/drama-browser/dist/zen-drama-mac-sourcebuilt/Zen Browser.app`.
- Marionette product-path verifier proved `nsZenDramaManager`, visible `zen-drama-panel`, `chrome://browser/content/drama/app/index.html?...`, mounted React root, one runtime poller, chrome-resource JS/CSS, screenshot capture, and performance budgets.
- Graph first viewport: `docs/verification/zen-drama-mac-marionette-graph-current.json` / `.png`.
- PLM first viewport: `docs/verification/zen-drama-mac-marionette-plm-current.json` / `.png`.
- Skill Crew first viewport: `docs/verification/zen-drama-mac-marionette-crew-current.json` / `.png`.
- PLM performance and warm route switching: `docs/verification/zen-drama-mac-marionette-performance-plm-current.json` / `.png`; latest measured first viewport 61.030 ms, runtime 171.945 ms, sidecar 195.144 ms, route switches 31.953 / 23.361 / 33.865 ms, startup P95 blocking 11.775 ms.
- Runtime unavailable state: `docs/verification/zen-drama-mac-marionette-runtime-unavailable-current.json` / `.png`.
- PlotPilot sidecar unavailable state: `docs/verification/zen-drama-mac-marionette-sidecar-unavailable-current.json` / `.png`.
- CSS/token bridge failure state: `docs/verification/zen-drama-mac-marionette-css-token-failure-current.json` / `.png`; this run intentionally fails readiness because the stylesheet is hidden, while still proving the user sees a controlled fallback instead of a blank/default browser page.

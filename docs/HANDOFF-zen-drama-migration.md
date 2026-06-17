# Handoff: Zen Drama Migration

## Status

Date: 2026-06-17

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
- Still needs PlotPilot-native prompt registry write APIs, post-chapter memory sync visualization, and full PlotPilot parity completion.

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
| Runtime unavailable screenshot regression missing | Add automated screenshot checks for down-runtime and workspace-missing states |
| Package size is large | Consider a bootstrap installer that downloads Zen/PlotPilot dependencies instead of bundling everything |

## Public Release Boundary

This release is a public preview of the Zen Browser migration. It should not be described as:

- full PlotPilot parity,
- full AgentOS parity,
- final advanced Graph canvas,
- or a finished 90+ UI/UX product.

It is accurate to describe it as:

- a Zen Browser hosted Drama workbench,
- a de-Electronized main path with a local runtime,
- Graph / PLM / Crew package surfaces,
- and a PLM Script Studio prototype with right-side storage/control cards.

## Most Recent Validation

Validated locally on Windows:

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

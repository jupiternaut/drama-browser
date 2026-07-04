## Why

The Zen Drama migration can currently be misread as complete when the PLM runs in a localhost browser fallback or in Brave with `host=zen`. That is not the same as a first-class Zen Browser PLM panel loaded from Zen chrome resources and backed by a healthy local Drama runtime plus PlotPilot sidecar.

Phase 0 establishes the integration contract before more implementation work continues. It defines what counts as "PLM is integrated into Zen Browser", what remains a fallback or compatibility path, and which parity gaps must stay visible instead of being renamed as finished work.

## What Changes

- Add a formal Phase 0 contract for Zen Browser PLM integration.
- Define the product path as a Zen panel loaded from `chrome://browser/content/drama/app/index.html?...&surface=plm`, not from a normal `http://127.0.0.1` tab.
- Separate responsibilities across:
  - Zen Browser chrome and panel lifecycle
  - Drama browser shell
  - standalone Drama runtime
  - Drama PLM UI
  - PlotPilot sidecar
  - Codex-backed AI availability
  - legacy Electron compatibility
- Define readiness levels for runtime, PLM sidecar, Codex auth, workspace/project loading, and UI feature parity.
- Require visible failure states for runtime unavailable, PLM sidecar unavailable, Codex unavailable, workspace missing, and chrome-resource loading failure.
- Lock the release boundary: Phase 0 may claim a Zen-hosted PLM integration contract, but not full PlotPilot parity, final PLM parity, or finished advanced graph/crew parity.
- Define verification evidence that must exist before later phases can mark Zen PLM work complete.

## Capabilities

### New Capabilities

- `zen-plm-integration-contract`: Product and engineering contract for a first-class Drama PLM panel inside Zen Browser, including host boundaries, readiness states, fallback classification, and verification evidence.

### Modified Capabilities

- None. There are no accepted base specs under `openspec/specs/` yet; this change creates a new capability contract for future implementation phases to build against.

## Impact

- Affected product surfaces:
  - Zen Browser panel entrypoints and toolbar/sidebar commands
  - Drama PLM route in the browser shell
  - standalone Drama runtime readiness and process lifecycle
  - PlotPilot sidecar launch, health, and API proxy behavior
  - Codex-backed AI status display and gated generation actions
- Affected documentation:
  - Zen migration handoff and release boundary language
  - verification checklist for product-path Zen panel validation
  - packaging notes for Windows Zen builds and macOS Zen app adaptation
- Affected tests and evidence:
  - product-path panel verification must distinguish Zen chrome-resource panel success from localhost or Brave fallback success
  - screenshot evidence must include PLM-ready and failure states
  - runtime evidence must include Drama runtime, PlotPilot sidecar, and Codex status separately

## Non-Goals

- Implementing the Phase 1 refactor in this change.
- Claiming full PlotPilot parity.
- Treating Brave, Electron, or localhost browser-shell previews as proof of Zen Browser panel integration.
- Rewriting PLM in XUL or moving PLM domain logic into Zen chrome code.

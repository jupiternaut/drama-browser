## Why

Zen Drama can now open the PLM panel from a real macOS Zen chrome-resource path, but the most important user workflow is still only partially proven: a writer needs to load a real project, generate or save chapter work, persist prompt and memory evidence, and see the production state survive refresh and verification.

This change moves PLM from "panel integration is working" to a macOS production-parity slice that can be demonstrated and tested without claiming Windows or full PlotPilot/Crew parity.

## What Changes

- Add a reproducible macOS PLM production fixture so the Zen panel can enter a real project instead of stopping at `workspace-missing`.
- Add product-visible happy-path evidence for project load, chapter selection, Hosted Write state, prompt registry write status, post-chapter memory sync, and Autopilot control state.
- Require Prompt Plaza writes to use PlotPilot-native prompt endpoints when available, with explicit evidence when a fallback path is used.
- Require post-chapter memory sync evidence after chapter save or writeback, including visible per-chapter memory diff data.
- Add a minimal Autopilot production contract covering start, pause/stop, resume, breaker reset, review-required state, and event recording.
- Extend macOS Marionette verification so happy-path evidence is captured as JSON plus screenshot, not only failure-state screenshots.

## Capabilities

### New Capabilities

- `plotpilot-production-parity`: macOS PLM production workflow parity covering reproducible project load, Hosted Write, native prompt persistence, post-chapter memory evidence, Autopilot controls, and verification evidence.

### Modified Capabilities

- None.

## Impact

- Affected packages: `packages/drama-plm`, `packages/drama-plm-ui`, `apps/drama-browser-shell`, and `apps/drama-runtime`.
- Affected scripts: macOS Zen Marionette verification and any fixture/seed helpers needed for deterministic PLM project state.
- Affected docs/specs: OpenSpec change artifacts and handoff wording for what macOS production-parity does and does not claim.
- External dependency: local PlotPilot-compatible sidecar API remains the source of truth for native project, prompt, memory, Hosted Write, and Autopilot operations.

## Why

The macOS Zen PLM panel now produces production evidence, but the core writing loop still reports Prompt Registry, Memory Graph, Hosted Write, and Autopilot as `partial`. The next release gate must prove those four workflow areas are truly ready instead of merely visible.

## What Changes

- Promote Prompt Registry production evidence from fallback/partial to native PlotPilot registry persistence with reload proof.
- Promote post-chapter Memory Graph evidence from zero-diff/partial to non-empty chapter-derived memory diff evidence.
- Promote Hosted Write evidence from static control visibility to a saved session lifecycle with progress, writeback, retry/cancel recovery, and event persistence.
- Promote Autopilot evidence from visible controls to a minimum production-safe lifecycle covering start, pause, resume, manual review, and breaker reset.
- Add a strict macOS product-path verifier mode that fails when any Stage 9.2 production evidence item is not `ready`.
- Keep Windows Zen product-path verification, signed packaging, and full AgentOS/Crew parity out of scope.

## Capabilities

### New Capabilities

- `plotpilot-production-ready`: macOS Zen PLM Stage 9.2 production readiness covering ready-only Prompt Registry, Memory Graph, Hosted Write, Autopilot, and strict product-path verification.

### Modified Capabilities

- None.

## Impact

- Affected packages: `packages/drama-plm`, `packages/drama-plm-ui`, `apps/drama-browser-shell`, and `apps/drama-runtime`.
- Affected scripts: macOS Zen Marionette verification and any deterministic PLM fixture/evidence helpers.
- Affected evidence: JSON and screenshot artifacts under the repo `tmp/` directory.
- External dependency: local PlotPilot-compatible sidecar APIs remain preferred for native prompt, memory, hosted write, and autopilot state.

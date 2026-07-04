# Zen PLM Phase 1 Local Verification

Date: 2026-06-17

## Environment

- Host OS: macOS
- Browser used for fallback visual evidence: Brave Browser headless
- Real `Zen Browser.app`: not found locally
- Drama runtime URL: `http://127.0.0.1:3198`
- PlotPilot sidecar URL: `http://127.0.0.1:8005`

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Surface classifier unit tests | pass | `bun test packages/drama-host/src/surface.test.ts` |
| Host package typecheck/build | pass | `cd packages/drama-host && bun run typecheck && bun run build` |
| PLM UI typecheck/build | pass | `cd packages/drama-plm-ui && bun run typecheck && bun run build` |
| Browser shell typecheck/build | pass | `bun run browser-shell:typecheck && bun run browser-shell:build` |
| Runtime typecheck | pass | `bun run runtime:typecheck` |
| Localhost contract verification | pass as fallback | `tmp/verification/zen-plm-contract-dev-localhost.json` |
| Brave visual fallback screenshot | pass | `tmp/verification/zen-plm-dev-localhost-waited.png` |
| V2/V4 Brave visual regression | pass as fallback | `tmp/verification/zen-plm-v2v4-dev-localhost-first-viewport.png` and `.dom.html` |
| Failure-state contract evidence | pass | `tmp/verification/zen-plm-failure-*.json` |
| Release readiness gate | pass/fail as expected | `tmp/verification/zen-plm-release-gate-localhost-ai-ready-blocked.json`, `tmp/verification/zen-plm-release-gate-synthetic-product-runtime-ready.json` |
| V4 workflow smoke | pass | `tmp/verification/zen-plm-v4-workflow-smoke.json` |
| macOS product-path verification | blocked | `Zen Browser.app` not found locally |

## Readiness Snapshot

Localhost fallback verification reported:

- `surface.classification`: `dev-localhost`
- `runtime-ready`: `ready`
- `plm-sidecar-ready`: `ready`
- `ai-ready`: `ready`
- `plotpilot-parity-ready`: `blocked`

PlotPilot sidecar was verified healthy on port `8005` with health version `1.0.2`.

Codex-backed AI was verified in the earlier ready-state contract run as:

- `available`: `true`
- `authenticated`: `true`
- `plan_type`: `pro`

The V2/V4 merged visual run intentionally captured a styled failure state with:

- `surface.classification`: `dev-localhost`
- Drama runtime: `ready`
- PlotPilot sidecar: `unavailable`
- DOM marker: `data-plm-failure="plotpilot-sidecar-unavailable"`

The failure-state evidence set covers:

- runtime unavailable: `tmp/verification/zen-plm-failure-runtime-unavailable.json`
- PlotPilot sidecar unavailable: `tmp/verification/zen-plm-failure-sidecar-unavailable.json`
- Codex unauthenticated: `tmp/verification/zen-plm-failure-codex-unauthenticated.json`
- workspace missing with long macOS and Windows path metadata: `tmp/verification/zen-plm-failure-workspace-missing.json`
- CSS/token bridge failure simulation: `tmp/verification/zen-plm-failure-css-token-bridge.json`

The V4 workflow smoke wrote and read back a `plm.storageCard.prompt.saved` record through the runtime RPC:

```text
/Users/gengrf/.craft-agent/workspaces/my-workspace/drama-projects/zen-plm-v4-smoke-local/plm/1781694470915-plm.storageCard.prompt.saved-37044-359ccb.json
```

## Product-Path Boundary

This Mac still lacks a real `Zen Browser.app` or local Zen build with the Drama chrome-resource integration, so true product-path validation remains blocked here. Brave, localhost, and synthetic `chrome://...` classifier checks are not a substitute for Windows or real-Zen panel validation.

The synthetic product-path release gate can prove only classifier/readiness logic. It does not prove that a real Zen panel rendered.

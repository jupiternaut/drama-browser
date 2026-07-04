# ADR-003: Zen PLM Integration Contract

## Status

Accepted for Phase 1 implementation planning.

## Context

Drama PLM can run through multiple surfaces: the real Zen Browser panel, the localhost browser-shell route, Brave/Chromium fallback routes, and the legacy Electron shell. These surfaces are useful for different kinds of testing, but they are not equivalent.

The OpenSpec source of truth is:

```text
openspec/changes/zen-plm-phase-zero-contract
```

## Decision

PLM counts as product-path Zen Browser integration only when it is loaded from:

```text
chrome://browser/content/drama/app/index.html?host=zen&runtime=...&surface=plm
```

Accepted surface classifications:

| Classification | Meaning |
| --- | --- |
| `product-zen-panel` | Real Zen Browser panel loaded from the packaged chrome resource path |
| `dev-localhost` | Local runtime/browser-shell route such as `http://127.0.0.1:3198/app/plm?...` |
| `browser-fallback` | Brave, Chromium, Chrome, or another non-Zen browser rendering the browser shell |
| `legacy-electron` | Electron compatibility surface |

PLM readiness is tiered:

| Tier | Meaning |
| --- | --- |
| `shell-ready` | The expected panel/shell surface is loaded and styled |
| `runtime-ready` | The standalone Drama runtime is reachable |
| `plm-sidecar-ready` | The PlotPilot-compatible sidecar is healthy through the runtime |
| `ai-ready` | Codex-backed AI is available and authenticated |
| `workflow-preview-ready` | Script Studio has an active project workspace and preview workflow panels |
| `plotpilot-parity-ready` | PlotPilot-native prompt registry writes and post-chapter memory sync visualization are complete |

## Consequences

- `host=zen` in Brave or localhost is fallback validation, not product-path completion.
- A macOS wrapper named `zen-drama` is not product-path validation unless it embeds or launches a real Zen Browser app/build and loads the chrome-resource panel.
- Release notes must use the highest verified readiness tier and keep lower tiers visible as gaps.
- Verification artifacts must include the loaded document URI, surface classification, readiness tiers, and first-viewport visual evidence when available.

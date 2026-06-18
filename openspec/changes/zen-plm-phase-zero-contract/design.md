## Context

Drama is moving from an Electron-first app into a Zen Browser hosted workbench. The existing browser shell and runtime can already make PLM visible through localhost routes and non-Zen browsers, but those paths do not prove that PLM is integrated into Zen Browser.

The product contract for PLM must distinguish three surfaces:

- Product surface: Zen Browser panel loaded from `chrome://browser/content/drama/app/index.html?...&surface=plm`.
- Developer compatibility surface: `http://127.0.0.1:3198/app/plm?...`.
- Legacy compatibility surface: Electron.

Phase 0 does not implement a new PLM feature. It defines the boundary, readiness model, and evidence requirements that later implementation phases must satisfy.

## Goals / Non-Goals

**Goals:**

- Define the host/runtime/PLM boundaries for Zen Browser integration.
- Define what "PLM is ready" means beyond the Drama runtime process being reachable.
- Make fallback paths explicit so Brave, Electron, or localhost checks cannot be counted as product-path Zen validation.
- Preserve the package boundaries already used by Drama:
  - Zen chrome handles outer browser integration.
  - Drama browser shell handles route layout and host bridge.
  - Drama runtime handles local process, workspace, graph, PlotPilot, and Codex mediation.
  - PLM UI stays a React workbench surface.
- Define verification artifacts that future phases must produce.

**Non-Goals:**

- Rewriting PLM UI as XUL.
- Moving PlotPilot or Codex logic into Zen chrome scripts.
- Replacing the existing Drama browser shell or runtime package layout.
- Claiming full PlotPilot parity during Phase 0.
- Treating macOS Brave validation as real Zen Browser validation.

## Decisions

### 1. Use a layered integration contract

Zen Browser owns only the host frame: sidebar buttons, commands, panel lifecycle, profile prefs, theme variables, and opening the chrome-resource PLM URL.

Drama browser shell owns the embedded app frame: route selection, `host=zen` mode, token bridge, runtime client, loading states, and the PLM surface mount.

Drama runtime owns local authority: filesystem access, graph event writing, PlotPilot process lifecycle, Codex status, health endpoints, and API proxying.

Drama PLM UI owns the user workflow: project navigation, chapter editing, storage cards, hosted write/autopilot controls, invocation review, and memory graph panels.

PlotPilot remains a sidecar domain engine behind the Drama runtime. It is not imported directly into Zen chrome.

**Alternative considered:** Put more logic inside Zen chrome scripts. Rejected because it couples PLM domain behavior to browser chrome, makes testing harder, and violates the existing React/package boundary.

### 2. Product-path validation requires `chrome://browser/content/...`

A PLM route is product-path Zen integration only when the loaded document URI is the packaged Zen chrome resource:

```text
chrome://browser/content/drama/app/index.html?host=zen&runtime=...&surface=plm
```

The localhost route remains useful for development and runtime smoke tests, but it is a fallback. Brave can exercise the browser shell and runtime, but it cannot validate Zen chrome integration.

**Alternative considered:** Count `host=zen` query mode in any browser as Zen integration. Rejected because it proves only CSS/token/runtime behavior, not Zen panel packaging, resource loading, commands, sidebar buttons, or lifecycle.

### 3. PLM readiness is a composite state

The UI must not flatten readiness into a single "runtime is running" status. A PLM-ready state requires:

- Drama runtime reachable and API-compatible.
- PLM route mounted from the expected host surface.
- PlotPilot sidecar reachable when generation or PlotPilot-backed panels are used.
- Codex-backed AI available and authenticated for Codex-dependent generation actions.
- Active workspace or project state loaded, or an explicit workspace-missing state shown.
- Required PLM panels visible for the current parity tier.

**Alternative considered:** Treat `runtime/status` as the only readiness signal. Rejected because the runtime can be healthy while PLM generation, Codex auth, or workspace loading is still unavailable.

### 4. Keep parity claims tiered

Phase 0 defines these tiers:

- `shell-ready`: Zen chrome-resource panel opens and mounts the styled Drama PLM surface.
- `runtime-ready`: Drama runtime is reachable from the panel.
- `plm-sidecar-ready`: PlotPilot-compatible sidecar is healthy through the runtime.
- `ai-ready`: Codex-backed AI is available and authenticated.
- `workflow-preview-ready`: current Script Studio controls and visual panels render.
- `plotpilot-parity-ready`: all named PlotPilot-native write and memory-sync gaps are closed.

Only the last tier can be described as full PlotPilot parity.

**Alternative considered:** Use a single release checkbox. Rejected because it hides important user-facing gaps and makes regressions hard to diagnose.

### 5. macOS adaptation must target real Zen, not Brave

macOS adaptation can use the same layered contract, but validation must use a real `Zen Browser.app` or a local Zen build capable of loading the chrome-resource panel. If macOS only has Brave, Chromium, Electron, or the local runtime, the evidence must be labeled as fallback/dev validation.

**Alternative considered:** Ship a macOS wrapper named `zen-drama` and count it as Zen integration. Rejected unless it embeds or launches a real Zen Browser app/build and loads the same chrome-resource product path.

### 6. Failure states are part of the contract

The panel must render explicit, styled states for:

- Zen chrome resource unavailable or loaded from the wrong surface.
- Drama runtime unavailable.
- PlotPilot sidecar unavailable.
- Codex unavailable or unauthenticated.
- Workspace or project missing.
- CSS/token bridge failed and the workbench would otherwise appear as default browser HTML.

**Alternative considered:** Let browser network errors, raw JSON, or default fallback UI show through. Rejected because that makes the integration look broken and masks which layer failed.

## Risks / Trade-offs

**Risk: The contract blocks release language before all implementation exists** -> Mitigation: use readiness tiers so a public preview can be described accurately without claiming parity.

**Risk: macOS validation remains blocked when no real Zen app is installed** -> Mitigation: allow macOS implementation work to proceed, but label evidence as fallback until a real Zen host is available.

**Risk: Multiple readiness states add UI complexity** -> Mitigation: display a compact status stack in PLM and expose detailed diagnostics only when the user opens the status panel.

**Risk: PlotPilot APIs may not expose all native write hooks yet** -> Mitigation: keep current project-file and graph-event persistence as preview behavior, and reserve `plotpilot-parity-ready` for native API completion.

**Risk: Existing handoff language drifts from the contract** -> Mitigation: add documentation tasks that update release and validation text alongside code work in later phases.

## Migration Plan

1. Adopt this OpenSpec change as the Phase 0 source of truth.
2. Update handoff and validation docs to use the readiness tier names.
3. In Phase 1, wire the runtime and PLM UI to report the composite readiness states.
4. In Phase 1 or later, add product-path Zen panel verification that records the loaded document URI and first-viewport screenshots.
5. Keep Electron and localhost routes as compatibility surfaces, but report them separately.

Rollback is documentation-only for Phase 0: remove this change before apply/archive if the contract is rejected. Later implementation phases must keep fallback routes independent so product-path checks can be disabled without breaking developer previews.

## Open Questions

- Which macOS Zen build or install channel should be the first supported product-path target?
- Should Codex availability block all generation controls, or only Codex-backed generation modes?
- Which PlotPilot v4.6 native prompt registry write API should replace the current project-file persistence once available?
- What minimum screenshot set is required for release: PLM ready only, or PLM ready plus every failure state?

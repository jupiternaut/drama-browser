## 1. Contract Adoption

- [x] 1.1 Add a concise Zen PLM integration contract doc or ADR that points to this OpenSpec change and defines the accepted surface classifications.
- [x] 1.2 Update the Zen migration handoff to use the readiness tiers `shell-ready`, `runtime-ready`, `plm-sidecar-ready`, `ai-ready`, `workflow-preview-ready`, and `plotpilot-parity-ready`.
- [x] 1.3 Update release wording so localhost, Brave, and Electron runs are labeled as fallback or legacy evidence, not product Zen panel validation.
- [x] 1.4 List current PLM parity gaps under the readiness tier they block, including PlotPilot-native prompt registry writes and post-chapter memory sync visualization.

## 2. Host Surface Classification

- [x] 2.1 Add a shared surface classifier that distinguishes `product-zen-panel`, `dev-localhost`, `browser-fallback`, and `legacy-electron`.
- [x] 2.2 Teach the browser shell to expose the detected surface in PLM status and diagnostics.
- [x] 2.3 Ensure `host=zen` in Brave, Chromium, Chrome, or localhost remains classified as fallback unless the document URI is the Zen chrome-resource product path.
- [x] 2.4 Ensure Electron PLM runs are classified as `legacy-electron` and remain outside the product-path completion gate.

## 3. Composite PLM Readiness

- [x] 3.1 Extend the runtime or host status model so PLM can report shell, runtime, sidecar, AI, workspace, and parity readiness independently.
- [x] 3.2 Add PLM UI status presentation for the readiness tiers without replacing the existing Script Studio workflow.
- [x] 3.3 Gate Codex-backed generation controls on Codex availability and authentication while leaving non-Codex PLM navigation usable.
- [x] 3.4 Gate PlotPilot-backed controls on sidecar health while keeping project navigation and non-PlotPilot diagnostics usable.
- [x] 3.5 Add a parity status field that prevents `plotpilot-parity-ready` until PlotPilot-native prompt registry writes and post-chapter memory sync visualization are implemented.
- [x] 3.6 Add structured parity checks for prompt registry writes, post-chapter memory sync, AgentOS/Crew parity, and advanced Graph canvas parity, including native Prompt Plaza write and post-chapter memory evidence hooks.

## 4. Failure States

- [x] 4.1 Add or verify the wrong-host/fallback state so users can see when they are not in the product Zen panel.
- [x] 4.2 Add or verify the runtime-unavailable PLM panel with retry and diagnostics actions.
- [x] 4.3 Add or verify the PlotPilot sidecar-unavailable PLM panel.
- [x] 4.4 Add or verify the Codex unavailable or unauthenticated state for Codex-backed generation actions.
- [x] 4.5 Add or verify the workspace-missing state, including contained display of long macOS and Windows paths.
- [x] 4.6 Add a regression check that fails when the first viewport is dominated by browser-default controls, raw JSON, raw stack traces, or unstyled document flow.

## 5. macOS Zen Adaptation Boundary

- [x] 5.1 Make the macOS launcher require a real `Zen Browser.app` or explicit local Zen build for product-path validation.
- [x] 5.2 Make the macOS launcher report a blocked product-path validation when Zen is missing instead of silently substituting Brave, Electron, localhost, or a renamed wrapper.
- [x] 5.3 Add macOS packaging notes that distinguish a real Zen-backed `zen-drama` bundle from a developer runtime wrapper.
- [x] 5.4 Add a macOS verification command that records the loaded document URI when a real Zen app/build is available.

## 6. Product-Path Verification

- [x] 6.1 Add Zen panel verification that records the active PLM document URI and fails unless it is `chrome://browser/content/drama/app/index.html?...&surface=plm`.
- [x] 6.2 Capture screenshot or equivalent visual evidence for product-path Zen PLM first viewport.
- [x] 6.3 Capture failure-state evidence for runtime unavailable, PlotPilot sidecar unavailable, Codex unavailable, workspace missing, and CSS/token bridge failure.
- [x] 6.4 Add fallback verification output for localhost and Brave runs that explicitly labels them as `dev-localhost` or `browser-fallback`.
- [x] 6.5 Add a release gate that compares user-facing readiness claims against the highest verified readiness tier.

## 7. Regression Commands

- [x] 7.1 Run browser-shell typecheck and build after the status and failure-state changes.
- [x] 7.2 Run runtime typecheck after status model or health endpoint changes.
- [ ] 7.3 Run Zen panel verification on Windows Zen package before claiming product-path success.
- [x] 7.4 Run macOS product-path verification only when a real Zen app/build is available; otherwise record the validation as blocked, not passed.
- [x] 7.5 Attach or reference verification output in the handoff so later reviewers can distinguish product-path evidence from fallback evidence.

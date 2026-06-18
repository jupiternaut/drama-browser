## 1. Baseline and Instrumentation

- [x] 1.1 Record the current Zen product-path baseline for Graph, PLM, and Skill Crew, including screenshots, active URI, resource path, runtime status, sidecar status, and process/listener counts.
- [x] 1.2 Add product-path performance marks for shell document load, first styled viewport, route ready, runtime ready, and sidecar ready.
- [x] 1.3 Add a machine-readable verification output format that reports timings, readiness tiers, surface classification, screenshot paths, and failure reasons.
- [x] 1.4 Add black-screen, blank-viewport, browser-default-error, raw-JSON, raw-stack-trace, and first-run-prompt detectors to visual verification.

## 2. Concurrency and Lifecycle

- [x] 2.1 Add or harden a launch coordinator so concurrent Drama runtime start requests share one in-flight operation per host and port.
- [x] 2.2 Add or harden PlotPilot sidecar launch/adoption coordination so concurrent PLM startup requests share one in-flight operation per sidecar port.
- [x] 2.3 Add regression coverage proving adopted PlotPilot status persists across generic `/runtime/status` snapshots.
- [x] 2.4 Add a concurrent launch verifier that opens Zen Drama repeatedly and fails if more than one Drama runtime listener or one PlotPilot listener remains.
- [x] 2.5 Add bounded timeout and cancellation behavior for runtime, sidecar, Codex, and workspace status requests.
- [x] 2.6 Replace route-local health polling with a shared runtime status source or prove only one poller exists per product-path shell.

## 3. Chrome-Resource Execution

- [x] 3.1 Make the Zen package install Drama browser shell assets into the actual chrome-resource package used by `chrome://browser/content/...`.
- [x] 3.2 Ensure chrome-resource `index.html` loads JS and CSS assets with paths and attributes that execute correctly in Zen.
- [x] 3.3 Add Zen profile prefs that prevent default-browser and first-run prompts from blocking the dedicated Zen Drama profile.
- [x] 3.4 Add a product-path verifier that proves the React shell mounted, not only that `index.html` exists in the app bundle.
- [x] 3.5 Keep localhost and Brave compatibility builds working without product-path-only asset rewrites leaking into their output.

## 4. UI/UX State Machine

- [x] 4.1 Implement an explicit shell state machine for booting, runtime connecting, runtime ready, sidecar starting, sidecar ready, AI unavailable, workspace missing, and parity blocked states.
- [x] 4.2 Ensure Graph, PLM, and Skill Crew first viewports always show a ready route, styled loading state, or styled failure state.
- [x] 4.3 Add a shared Drama workbench navigation surface with icon-first controls and labels `Drama Graph`, `Drama PLM`, and `Skill Crew`.
- [x] 4.4 Add styled recovery panels for runtime unavailable, sidecar unavailable, CSS/token bridge failure, workspace missing, and AI unavailable.
- [x] 4.5 Ensure long macOS and Windows paths are contained in diagnostic panels without overflow or overlap.
- [x] 4.6 Add Chinese product-path copy for readiness labels, failure titles, and recovery actions.

## 5. Performance Budgets

- [x] 5.1 Enforce a 2 second budget for styled nonblank product-path first viewport.
- [x] 5.2 Enforce an 8 second budget for cold Drama runtime readiness or a visible runtime-unavailable state.
- [x] 5.3 Enforce a 45 second budget for PlotPilot sidecar readiness or a visible sidecar-unavailable state.
- [x] 5.4 Enforce a 500 ms warm route-switch budget between Graph, PLM, and Skill Crew without remounting the outer shell.
- [x] 5.5 Add a startup responsiveness check that fails if shell startup introduces a main-thread task longer than 100 ms.

## 6. Visual Verification

- [x] 6.1 Capture product-path screenshots for Zen-hosted Drama Graph, Drama PLM, and Skill Crew first viewports.
- [x] 6.2 Capture product-path screenshots for runtime unavailable, PlotPilot sidecar unavailable, CSS/token bridge failure, workspace missing, and AI unavailable states.
- [x] 6.3 Fail visual verification when screenshots are mostly black, mostly blank, blocked by browser prompts, unstyled, or dominated by browser-default error UI.
- [x] 6.4 Link screenshot evidence and JSON timing output from the migration handoff.

## 7. Regression and Release Gate

- [x] 7.1 Run browser-shell typecheck and build after shell state, CSS, or route changes.
- [x] 7.2 Run runtime typecheck and PLM runtime manager tests after lifecycle changes.
- [x] 7.3 Run product-path performance and visual verification on the source-built macOS Zen package.
- [x] 7.4 Record the Windows adapter dependency file and keep release wording explicit that this change only verifies macOS product-path runtime behavior.
- [x] 7.5 Update release wording so the highest verified tier cannot exceed the lowest passing concurrency, performance, and UI/UX gate.

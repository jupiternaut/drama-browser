## 1. Baseline and Contract

- [x] 1.1 Validate the Stage 9.2 OpenSpec artifacts before implementation.
- [x] 1.2 Inspect the current production readiness snapshot, fixture bootstrap, PLM client routes, and macOS verifier output shape.

## 2. Ready Evidence Implementation

- [x] 2.1 Make the production fixture produce native Prompt Registry write and readback evidence.
- [x] 2.2 Make the production fixture produce non-empty chapter-derived Memory Graph diff evidence.
- [x] 2.3 Make the production fixture produce Hosted Write lifecycle evidence with saved/writeback and recovery state.
- [x] 2.4 Make the production fixture produce Autopilot lifecycle evidence with start, stop or pause, resume or review, and breaker reset.

## 3. Product UI and Snapshot

- [x] 3.1 Feed Stage 9.2 evidence into the production readiness snapshot without losing partial diagnostics.
- [x] 3.2 Render compact ready evidence details for Prompt Registry, Memory Graph, Hosted Write, and Autopilot.
- [x] 3.3 Add stable DOM/JSON markers for Stage 9.2 readiness and non-ready diagnostics.

## 4. Strict Verification

- [x] 4.1 Add an opt-in strict macOS verifier mode that fails if any Stage 9.2 evidence item is not `ready`.
- [x] 4.2 Capture strict product-path JSON and screenshot evidence for the ready Stage 9.2 happy path.
- [x] 4.3 Keep the existing partial production evidence verifier mode available for debugging.

## 5. Validation

- [x] 5.1 Run OpenSpec strict validation for `plotpilot-production-ready-mac`.
- [x] 5.2 Run focused typecheck/build or unit checks for changed packages and scripts.
- [x] 5.3 Update the task checklist and summarize evidence paths.

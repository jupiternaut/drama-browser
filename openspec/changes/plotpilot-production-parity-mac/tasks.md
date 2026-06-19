## 1. OpenSpec Contract

- [x] 1.1 Create proposal, design, and spec artifacts for macOS PlotPilot production parity.
- [x] 1.2 Validate the OpenSpec change with strict validation before implementation.

## 2. Production Fixture And Readiness Model

- [x] 2.1 Add a deterministic PLM production fixture/bootstrap path that can load a real project and chapter on macOS.
- [x] 2.2 Add a typed production readiness snapshot for project, chapter, Hosted Write, prompt persistence, memory sync, Autopilot, and verification evidence.
- [x] 2.3 Feed production readiness into the existing PLM integration/parity status without reporting full parity when any item is partial or blocked.

## 3. PLM UI Evidence

- [x] 3.1 Render a compact production evidence panel in Drama PLM with `ready`, `partial`, and `blocked` states.
- [x] 3.2 Ensure project/chapter fixture metadata and long paths are contained in the Zen PLM first viewport.
- [x] 3.3 Add stable DOM markers for production project, chapter, evidence matrix, prompt evidence, memory evidence, and Autopilot evidence.

## 4. Prompt And Memory Production Hooks

- [x] 4.1 Persist Prompt Plaza card saves through PlotPilot-native prompt write endpoints when available.
- [x] 4.2 Mark prompt evidence as `ready` for native writes and `partial` for fallback writes with visible diagnostics.
- [x] 4.3 Capture post-chapter memory sync evidence after chapter save or writeback.
- [x] 4.4 Mark memory evidence as `ready` only when chapter-derived memory diff data is non-empty; otherwise show a partial sync result.

## 5. Hosted Write And Autopilot Evidence

- [x] 5.1 Record Hosted Write session lifecycle events in production readiness and graph/project evidence.
- [x] 5.2 Keep Hosted Write failure, cancellation, and retry state visible without clearing prior successful evidence.
- [x] 5.3 Record Autopilot start, stop, resume, review, and breaker-reset evidence in production readiness.
- [x] 5.4 Keep manual chapter editing available when Autopilot is stopped, blocked, or waiting for review.

## 6. Verification

- [x] 6.1 Extend macOS Marionette verification with a production happy-path mode that checks project/chapter/evidence DOM markers.
- [x] 6.2 Capture macOS Zen product-path JSON and screenshot evidence for the production happy path.
- [x] 6.3 Run typecheck/build/OpenSpec validation and document the resulting evidence paths.

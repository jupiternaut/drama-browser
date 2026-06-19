## Context

The previous Zen PLM work proved that the macOS Zen panel, Drama runtime, PlotPilot sidecar, Codex status, styled failure states, and product-path screenshots can work together. The remaining gap is production evidence: the PLM panel still needs a deterministic way to load a real project and prove that writing workflow actions mutate or synchronize the PlotPilot-backed state expected by a writer.

The implementation must stay inside existing boundaries:

- Zen chrome owns panel lifecycle only.
- Drama runtime owns local authority, PlotPilot proxying, graph/project files, and Codex mediation.
- `@drama/plm` owns PlotPilot client contracts.
- `@drama/plm-ui` owns native PLM presentation and user workflow state.
- Browser shell and Marionette verification provide product-path evidence.

## Goals / Non-Goals

**Goals:**

- Provide a reproducible macOS production fixture so PLM can leave `workspace-missing` and enter a real project in the Zen panel.
- Surface a production readiness snapshot in PLM that shows project, chapter, Hosted Write, prompt write, memory sync, Autopilot, and verification evidence independently.
- Persist Prompt Plaza writes through PlotPilot-native prompt endpoints when those endpoints are available.
- Capture post-chapter memory sync evidence after chapter save or writeback and show a per-chapter memory diff summary.
- Make Hosted Write and Autopilot controls observable through UI state and graph/project events.
- Add a Marionette happy-path check that fails unless a real project, chapter, prompt evidence, memory evidence, and production readiness markers are visible.

**Non-Goals:**

- Windows Zen product-path verification.
- A signed DMG, updater, or installer.
- Rewriting PlotPilot internals inside Zen chrome.
- Full AgentOS/Crew parity or final advanced Graph canvas parity.
- Claiming `plotpilot-parity-ready` when any named parity check remains partial or fallback-only.

## Decisions

1. **Use a deterministic production fixture instead of relying on whatever user data is present.**
   - Rationale: Marionette evidence must be reproducible, and `workspace-missing` cannot be the default happy path.
   - Alternative considered: require manual user project setup. Rejected because it cannot support automated acceptance.

2. **Represent production readiness as a structured snapshot, not a single boolean.**
   - Rationale: Hosted Write can be ready while prompt or memory evidence is partial. A single flag would recreate the old overclaiming problem.
   - Alternative considered: reuse only `parityChecks`. Rejected because parity checks are release-level, while production evidence must include concrete project/chapter artifacts.

3. **Treat PlotPilot-native mutations as preferred and fallback mutations as visible partial evidence.**
   - Rationale: Some local PlotPilot versions may expose prompt endpoints while others may not. The UI must remain useful without hiding that distinction.
   - Alternative considered: fail every prompt save when the native endpoint is absent. Rejected because current project-file persistence is still a valid preview fallback.

4. **Capture post-chapter memory evidence through existing knowledge graph statistics and triples first.**
   - Rationale: This minimizes backend changes and uses already proxied PlotPilot APIs.
   - Alternative considered: design a new memory diff database. Rejected for this phase because it increases migration risk before the PlotPilot API surface is fully proven.

5. **Extend Marionette verification with DOM markers for production readiness.**
   - Rationale: Screenshots alone can pass while the workflow is still hollow. DOM markers and JSON evidence make the gate machine-checkable.
   - Alternative considered: manual screenshot review only. Rejected because this phase is explicitly about reproducible parity evidence.

## Risks / Trade-offs

- PlotPilot native prompt endpoints differ across local builds -> keep endpoint errors visible and mark the prompt check as partial instead of ready.
- Fixture creation may mutate local user data -> isolate fixture names/IDs and avoid destructive cleanup unless explicitly requested.
- Hosted Write or Autopilot can invoke real AI work -> acceptance should support a seeded/demo mode for UI and state validation, with real generation tested separately.
- Memory sync may return zero triples for short fixture content -> show stats plus latest query evidence, and keep the check partial until non-empty chapter-derived data is observed.
- Too many readiness badges can clutter the PLM UI -> group production evidence under one compact status rail section with concise details.

## Migration Plan

1. Add OpenSpec contract and tasks.
2. Add fixture/project bootstrap and production readiness state.
3. Wire prompt and memory evidence into the readiness snapshot.
4. Add Hosted Write and Autopilot event evidence markers.
5. Add Marionette happy-path verifier checks and run macOS product-path evidence.
6. Update progress/verification docs only after the checks pass.

Rollback is straightforward: remove the fixture helper and production readiness markers; existing PLM failure-state and panel verification remain unaffected.

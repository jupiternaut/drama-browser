## Context

The previous production-parity change added a deterministic macOS fixture, production evidence panel, and Marionette JSON/screenshot capture. That evidence intentionally allows `partial` for Prompt Registry, Memory Graph, Hosted Write, and Autopilot so the product does not overclaim parity.

Stage 9.2 tightens that boundary. The PLM panel must now produce ready evidence for the four core writing workflow areas and the verifier must fail when any of them is still fallback-only, zero-diff, static, or unexercised.

## Goals / Non-Goals

**Goals:**

- Make Prompt Registry evidence `ready` only after a native PlotPilot prompt mutation succeeds and reload/readback proves persistence.
- Make Memory Graph evidence `ready` only after post-chapter sync records non-empty chapter-derived memory diff data.
- Make Hosted Write evidence `ready` only after a session lifecycle records start/progress/save or writeback plus recovery evidence.
- Make Autopilot evidence `ready` only after lifecycle controls record start, stop/pause, resume/review, and breaker-reset evidence.
- Add a strict product-path verifier mode that fails on any Stage 9.2 `partial` or `blocked` evidence state.

**Non-Goals:**

- Windows Zen product-path validation.
- Signed macOS installer, updater, or notarization.
- Full AgentOS/Crew parity.
- Replacing PlotPilot sidecar internals.
- Running expensive or nondeterministic AI generation during routine acceptance.

## Decisions

1. **Gate readiness on evidence, not UI availability.**
   - Rationale: The current panel already exposes controls. Stage 9.2 must prove the controls mutate or synchronize workflow state.
   - Alternative considered: mark controls as ready when present. Rejected because that preserves the existing partial gap.

2. **Use deterministic fixture-driven actions for product-path acceptance.**
   - Rationale: Verification must be fast, repeatable, and safe on a developer machine.
   - Alternative considered: require manual user interaction. Rejected because it cannot be a release gate.

3. **Prefer native PlotPilot APIs, with local compatibility adapters only at the runtime boundary.**
   - Rationale: Prompt and workflow evidence should match PlotPilot semantics while keeping Zen chrome isolated from backend details.
   - Alternative considered: keep Drama project-file fallback as ready. Rejected because fallback persistence is useful but not parity.

4. **Record event summaries in the production snapshot.**
   - Rationale: Marionette needs machine-checkable evidence without scraping long logs or raw sidecar output.
   - Alternative considered: screenshot-only verification. Rejected because a screenshot can show controls while actions remain unexercised.

5. **Keep strict readiness opt-in until Stage 9.2 is complete.**
   - Rationale: Existing evidence capture remains useful for diagnosing partial states. The stricter mode is a release gate, not the only debug path.
   - Alternative considered: make all production evidence checks strict immediately. Rejected because it would remove the partial diagnostic mode.

## Risks / Trade-offs

- PlotPilot local builds may expose different prompt or workflow endpoints -> probe routes in the PLM client/runtime adapter and keep failures diagnostic until strict mode is requested.
- Hosted Write or Autopilot can invoke real AI work -> support a seeded/product fixture path that exercises lifecycle evidence without expensive generation.
- Memory extraction can return zero items for short content -> fixture chapter content must include stable entities/relationships and the sync path must record chapter-derived diff metadata.
- Strict verification can become brittle if DOM marker names change -> use stable `data-*` markers already introduced for production evidence.
- Adding too much UI can clutter the PLM panel -> keep Stage 9.2 state inside the existing production evidence rail.

## Migration Plan

1. Add Stage 9.2 OpenSpec contract and task list.
2. Inspect current PLM client/runtime routes and production snapshot shape.
3. Patch Prompt Registry, Memory Graph, Hosted Write, and Autopilot evidence to produce deterministic ready states from the macOS fixture.
4. Add strict verifier mode and JSON evidence assertions.
5. Run typecheck/build/OpenSpec validation plus macOS product-path verification.

Rollback is limited to the Stage 9.2 fixture/evidence strictness changes; the existing partial production evidence mode remains available for diagnostics.

## Why

The Zen migration has reached the point where "the app opens" is no longer a useful success criterion. The remaining work is a native-port quality problem: Zen must host Drama without black screens, blocked UI, duplicate runtime launches, or degraded localhost-era assumptions while preserving responsive Graph, PLM, and Skill Crew workflows.

This change defines the performance, concurrency, and UI/UX gates for the next migration phase before implementation continues.

## What Changes

- Define a Zen-native port boundary for the browser-hosted Drama workbench, including what remains outside the migration.
- Introduce measurable startup, interaction, and recovery performance budgets for the Zen-hosted shell.
- Define a single-owner concurrency model for Drama runtime launch, PlotPilot sidecar launch/adoption, health polling, and UI requests.
- Require cancellation, deduplication, timeout, and backpressure behavior for runtime and PlotPilot operations.
- Require first-viewport UI/UX acceptance criteria for Graph, PLM, and Skill Crew in the Zen product path.
- Require explicit visual failure states for black screen, blank shell, blocked default-browser dialogs, runtime unavailable, sidecar unavailable, and CSS/token bridge failure.
- Require screenshot and smoke-test evidence that distinguishes product-path Zen behavior from localhost, Brave, and Electron compatibility behavior.
- Keep existing React package boundaries; this change does not authorize rewriting Graph, PLM, or Skill Crew in XUL.

## Capabilities

### New Capabilities

- `zen-native-concurrency-performance`: Defines observable concurrency behavior and performance budgets for the Zen-hosted Drama runtime, PlotPilot sidecar, and UI request paths.
- `zen-native-uiux-quality`: Defines observable UI/UX quality gates for the Zen product-path workbench, including first viewport, navigation, loading, failure, accessibility, and localization behavior.

### Modified Capabilities

- None. There are no accepted base specs under `openspec/specs/` yet.

## Impact

- Affected surfaces:
  - Zen Browser chrome-resource app packaging and startup profile prefs.
  - `apps/drama-browser-shell` route mounting, shell layout, loading states, and token bridge.
  - standalone Drama runtime launch/status endpoints.
  - PlotPilot sidecar launch/adoption and health checks.
  - Graph, PLM, and Skill Crew route integration inside the browser shell.
  - macOS and Windows Zen verification scripts.

- Affected verification:
  - product-path Zen screenshots and smoke tests.
  - runtime/sidecar concurrency tests.
  - UI regression checks for black screen, blank shell, unstyled fallback, and blocked first-run browser prompts.
  - readiness tier checks that separately report shell, runtime, sidecar, AI, workspace, workflow preview, and parity status.

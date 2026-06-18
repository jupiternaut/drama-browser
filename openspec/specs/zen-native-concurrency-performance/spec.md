# zen-native-concurrency-performance Specification

## Purpose
TBD - created by archiving change zen-native-port-performance-uiux. Update Purpose after archive.
## Requirements
### Requirement: Single-owner runtime launch

The system SHALL ensure that concurrent Zen startup paths share one Drama runtime launch operation for a given host and port.

#### Scenario: Concurrent Zen open requests

- **WHEN** the user or verifier opens the Zen Drama product path multiple times within 5 seconds
- **THEN** the system reports one healthy Drama runtime listener for the configured port
- **AND** no additional stale runtime process remains after startup completes

#### Scenario: Runtime already healthy

- **WHEN** Zen opens Drama while a compatible Drama runtime is already healthy
- **THEN** the launcher adopts the existing runtime instead of starting a duplicate listener
- **AND** the UI reports `runtime-ready`

### Requirement: Single-owner PlotPilot sidecar launch

The system SHALL ensure that concurrent PLM startup paths share one PlotPilot sidecar launch or adoption operation for the configured sidecar port.

#### Scenario: Concurrent PLM startup

- **WHEN** Zen opens the PLM route and the UI also requests PlotPilot startup
- **THEN** the system performs one sidecar launch or adoption operation
- **AND** the Drama runtime reports one `plm-sidecar-ready` status for the active sidecar

#### Scenario: Adopted sidecar status persists

- **WHEN** the Drama runtime adopts an already healthy PlotPilot sidecar
- **THEN** later runtime status snapshots preserve `state=running`, `healthy=true`, and `adopted=true`
- **AND** a generic runtime status request MUST NOT reset the sidecar to `stopped`

### Requirement: Bounded startup budgets

The system SHALL expose startup progress and fail visibly when startup exceeds defined budgets.

#### Scenario: Shell first viewport budget

- **WHEN** Zen loads `chrome://browser/content/drama/app/index.html?...`
- **THEN** a styled nonblank shell, loading state, or failure state is visible within 2 seconds after document load

#### Scenario: Drama runtime launch budget

- **WHEN** the Drama runtime is cold-started by the Zen package
- **THEN** the UI reaches `runtime-ready` within 8 seconds or shows a styled runtime-unavailable state

#### Scenario: PlotPilot sidecar launch budget

- **WHEN** the PLM route requires PlotPilot and no healthy sidecar is running
- **THEN** the UI reaches `plm-sidecar-ready` within 45 seconds or shows a styled sidecar-unavailable state

### Requirement: Responsive UI during backend startup

The system SHALL keep the Zen-hosted Drama shell interactive while runtime, sidecar, and AI checks are pending.

#### Scenario: Route switch during sidecar startup

- **WHEN** PlotPilot startup is still pending
- **THEN** the user can switch between Drama Graph, Drama PLM, and Skill Crew without waiting for sidecar completion
- **AND** non-PlotPilot controls remain usable

#### Scenario: Main-thread responsiveness

- **WHEN** the product-path shell starts and performs readiness checks
- **THEN** the shell does not introduce a main-thread task longer than 100 ms in the startup path
- **AND** user input is not blocked by synchronous runtime or filesystem work

### Requirement: Bounded polling and stale response protection

The system SHALL deduplicate runtime health polling and ignore stale responses from older request generations.

#### Scenario: Shared runtime status polling

- **WHEN** Graph, PLM, and Skill Crew components are mounted or switched
- **THEN** they consume a shared runtime status source
- **AND** they do not create independent polling loops for the same endpoint

#### Scenario: Stale health response

- **WHEN** an older health request completes after a newer route or startup request
- **THEN** the older response MUST NOT overwrite the newer readiness state

### Requirement: Request cancellation and timeout behavior

The system SHALL apply cancellation and timeout behavior to runtime, sidecar, and AI status requests.

#### Scenario: Route unmount cancels pending work

- **WHEN** the user leaves a route while its runtime request is pending
- **THEN** the request is cancelled or its result is ignored
- **AND** no stale loading state appears on the new route

#### Scenario: Slow endpoint fails visibly

- **WHEN** a runtime or sidecar status endpoint does not respond within 2 seconds
- **THEN** the UI reports a styled pending or unavailable state
- **AND** the request does not block navigation or other controls

### Requirement: Performance evidence is recorded

The system SHALL record enough performance evidence to compare future changes against the port budget.

#### Scenario: Product-path performance run

- **WHEN** a verifier runs the Zen product-path performance check
- **THEN** it records shell first viewport time, runtime readiness time, sidecar readiness time, route switch time, and listener counts
- **AND** the run fails if required budgets are exceeded

#### Scenario: Compatibility surfaces are measured separately

- **WHEN** localhost, Brave, or Electron compatibility surfaces are measured
- **THEN** their results are labeled separately
- **AND** they MUST NOT satisfy the Zen product-path performance gate

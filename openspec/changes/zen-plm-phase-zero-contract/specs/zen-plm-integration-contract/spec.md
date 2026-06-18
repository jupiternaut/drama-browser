# zen-plm-integration-contract Specification

## Purpose

Define the observable contract for first-class Drama PLM integration inside Zen Browser. The contract separates product-path Zen validation from localhost, Brave, and Electron compatibility paths, and defines readiness states that reflect the full PLM stack.

## ADDED Requirements

### Requirement: Product-Path Zen PLM Panel

The system SHALL count PLM as Zen Browser integrated only when it is opened as a Zen panel from the packaged chrome resource URL.

#### Scenario: Open PLM from Zen chrome

- **GIVEN** Zen Browser is installed or a local Zen build is running
- **WHEN** the user opens Drama PLM from the Zen sidebar, toolbar, or command entrypoint
- **THEN** the active panel document URI is `chrome://browser/content/drama/app/index.html?host=zen&runtime=...&surface=plm`
- **AND** Zen Browser chrome and sidebar remain visible around the panel
- **AND** the PLM surface renders inside the styled Drama workbench

#### Scenario: Localhost PLM does not satisfy product-path validation

- **GIVEN** the Drama runtime is running at `http://127.0.0.1:3198`
- **WHEN** the user opens `http://127.0.0.1:3198/app/plm?host=zen`
- **THEN** the route is reported as a developer compatibility surface
- **AND** it is not reported as successful Zen Browser panel integration

#### Scenario: Brave PLM does not satisfy product-path validation

- **GIVEN** Brave Browser opens the PLM route with `host=zen`
- **WHEN** the PLM workbench renders successfully
- **THEN** the result is reported as browser-shell fallback validation
- **AND** it is not reported as successful Zen Browser panel integration

### Requirement: Layered Responsibility Boundary

The system SHALL keep Zen host responsibilities separate from Drama runtime and PLM responsibilities.

#### Scenario: Zen owns panel lifecycle

- **GIVEN** Drama PLM is integrated into Zen Browser
- **WHEN** the user opens, focuses, or closes the PLM panel
- **THEN** Zen Browser handles sidebar buttons, commands, panel lifecycle, profile prefs, and chrome-resource loading
- **AND** Zen chrome code does not directly implement PlotPilot, Codex, graph persistence, or filesystem workflows

#### Scenario: Drama runtime owns local authority

- **GIVEN** PLM needs local process, project, graph, or AI status
- **WHEN** the PLM UI requests those capabilities
- **THEN** the requests go through the standalone Drama runtime
- **AND** the runtime mediates filesystem access, graph events, PlotPilot sidecar lifecycle, and Codex status

#### Scenario: PLM UI owns writing workflow presentation

- **GIVEN** the PLM panel is open
- **WHEN** project, chapter, invocation, storage, hosted-write, autopilot, or memory data renders
- **THEN** the data appears in the Drama PLM React workbench
- **AND** the outer Zen chrome does not become the PLM application UI

### Requirement: Composite PLM Readiness

The system SHALL report PLM readiness as separate states instead of a single runtime-ready flag.

#### Scenario: Shell ready

- **GIVEN** the Zen panel loads the chrome-resource PLM URL
- **WHEN** the Drama browser shell mounts the PLM route with required styles
- **THEN** the system reports `shell-ready`

#### Scenario: Runtime ready

- **GIVEN** the PLM shell is mounted
- **WHEN** the local Drama runtime responds with a compatible status payload
- **THEN** the system reports `runtime-ready`

#### Scenario: PLM sidecar ready

- **GIVEN** the Drama runtime is reachable
- **WHEN** the PlotPilot-compatible sidecar responds through the runtime health path
- **THEN** the system reports `plm-sidecar-ready`

#### Scenario: AI ready

- **GIVEN** Codex-backed generation features are visible
- **WHEN** the runtime reports Codex availability and authentication
- **THEN** the system reports `ai-ready`
- **AND** Codex-dependent actions are enabled only for compatible modes

#### Scenario: Workflow preview ready

- **GIVEN** the PLM shell, runtime, workspace, and required UI panels are available
- **WHEN** Script Studio renders project navigation, chapter paper, storage cards, invocation review, hosted-write/autopilot controls, and memory graph preview
- **THEN** the system reports `workflow-preview-ready`

#### Scenario: Full PlotPilot parity not yet reached

- **GIVEN** PlotPilot-native prompt registry writes or post-chapter memory sync visualization are incomplete
- **WHEN** the PLM panel is otherwise usable
- **THEN** the system does not report `plotpilot-parity-ready`
- **AND** release notes do not describe the PLM as full PlotPilot parity

### Requirement: Fallback Surface Classification

The system SHALL classify every PLM run surface so verification evidence cannot be misread.

#### Scenario: Product surface

- **GIVEN** PLM is loaded from the Zen chrome-resource URL inside Zen Browser
- **WHEN** verification records the run surface
- **THEN** the surface is classified as `product-zen-panel`

#### Scenario: Developer localhost surface

- **GIVEN** PLM is loaded from `http://127.0.0.1:3198/app/plm`
- **WHEN** verification records the run surface
- **THEN** the surface is classified as `dev-localhost`

#### Scenario: Brave or Chromium fallback surface

- **GIVEN** PLM is loaded in Brave, Chromium, Chrome, or another non-Zen browser
- **WHEN** verification records the run surface
- **THEN** the surface is classified as `browser-fallback`

#### Scenario: Electron legacy surface

- **GIVEN** PLM is loaded in the Electron shell
- **WHEN** verification records the run surface
- **THEN** the surface is classified as `legacy-electron`

### Requirement: Required PLM Failure States

The system SHALL render explicit Drama-styled PLM failure states for unavailable integration layers.

#### Scenario: Wrong host surface

- **GIVEN** PLM is opened outside the product Zen panel
- **WHEN** the user or verifier inspects integration status
- **THEN** the UI or verification output identifies the current surface as fallback
- **AND** it does not claim product Zen panel validation

#### Scenario: Drama runtime unavailable

- **GIVEN** the Zen panel opens PLM
- **AND** the local Drama runtime is unreachable
- **WHEN** the PLM route renders
- **THEN** the user sees a styled runtime-unavailable state
- **AND** the state exposes retry and diagnostics actions where supported

#### Scenario: PlotPilot sidecar unavailable

- **GIVEN** the Drama runtime is reachable
- **AND** the PlotPilot-compatible sidecar is unavailable
- **WHEN** the user opens generation, hosted-write, or PlotPilot-backed panels
- **THEN** PLM shows a styled sidecar-unavailable state
- **AND** non-PlotPilot navigation remains usable where possible

#### Scenario: Codex unavailable

- **GIVEN** Codex-backed generation actions are visible
- **AND** Codex is unavailable or unauthenticated
- **WHEN** the user opens the PLM status or tries a Codex-backed action
- **THEN** PLM shows a styled AI-unavailable or auth-required state
- **AND** unsupported actions are disabled or routed to a clear recovery path

#### Scenario: Workspace missing

- **GIVEN** no active Drama or PlotPilot project workspace is available
- **WHEN** PLM renders project-dependent surfaces
- **THEN** PLM shows a styled workspace-missing state
- **AND** long macOS or Windows paths are displayed as contained monospace metadata when present

#### Scenario: CSS or token bridge failure

- **GIVEN** the PLM route cannot load required Drama styles or the Zen token bridge
- **WHEN** the first viewport renders
- **THEN** the user sees a styled loading or failure state
- **AND** browser-default buttons, raw JSON, or unstyled document flow do not dominate the first viewport

### Requirement: macOS Zen Adaptation Boundary

The system SHALL support macOS adaptation only when validation targets a real Zen Browser app or Zen build, and SHALL label other macOS runs as fallback.

#### Scenario: macOS Zen app available

- **GIVEN** a real `Zen Browser.app` or local Zen build exists on macOS
- **WHEN** the Drama launcher opens PLM
- **THEN** it opens the Zen chrome-resource product path
- **AND** verification records the run surface as `product-zen-panel`

#### Scenario: macOS Zen app missing

- **GIVEN** macOS does not have a real Zen Browser app or local Zen build
- **WHEN** the Drama launcher or verifier attempts product-path validation
- **THEN** it reports that Zen product-path validation is blocked
- **AND** it does not substitute Brave, Electron, localhost, or a renamed wrapper as proof of Zen integration

### Requirement: Verification Evidence

The system SHALL require verification evidence that records host surface, readiness states, and first-viewport UI state before PLM integration is marked complete.

#### Scenario: Product-path verification record

- **GIVEN** a verifier checks Zen PLM integration
- **WHEN** the verification finishes
- **THEN** the evidence includes the loaded document URI
- **AND** the surface classification
- **AND** the readiness states reached
- **AND** screenshots or equivalent visual evidence for the PLM first viewport

#### Scenario: Failure-state verification record

- **GIVEN** runtime, sidecar, Codex, workspace, or styling failures are tested
- **WHEN** the verification finishes
- **THEN** the evidence identifies which integration layer failed
- **AND** confirms that a styled failure state appeared instead of blank, raw, or browser-default UI

#### Scenario: Release claim verification

- **GIVEN** release notes, handoff docs, or user-facing status describe PLM readiness
- **WHEN** those claims are reviewed
- **THEN** the wording matches the highest verified readiness tier
- **AND** unverified tiers remain listed as gaps

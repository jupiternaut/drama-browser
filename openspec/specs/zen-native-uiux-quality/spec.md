# zen-native-uiux-quality Specification

## Purpose
TBD - created by archiving change zen-native-port-performance-uiux. Update Purpose after archive.
## Requirements
### Requirement: Product-path first viewport is designed

The system SHALL render a designed Drama first viewport for the Zen product path.

#### Scenario: PLM product-path first viewport

- **WHEN** Zen opens `chrome://browser/content/drama/app/index.html?...&surface=plm`
- **THEN** the first viewport shows Zen chrome around a Drama PLM shell, a styled loading state, or a styled PLM failure state
- **AND** the viewport is not black, blank, unstyled, raw JSON, raw stack trace, or browser-default error UI

#### Scenario: Graph product-path first viewport

- **WHEN** Zen opens `chrome://browser/content/drama/app/index.html?...&surface=graph`
- **THEN** the first viewport shows Zen chrome around the Drama Graph shell, a styled loading state, or a styled Graph failure state
- **AND** graph navigation and runtime status are visible or intentionally pending

#### Scenario: Skill Crew product-path first viewport

- **WHEN** Zen opens `chrome://browser/content/drama/app/index.html?...&surface=crew`
- **THEN** the first viewport shows Zen chrome around the Skill Crew shell, a styled loading state, or a styled Crew failure state
- **AND** the surface does not render as plain text links or an unstyled document

### Requirement: First-run browser prompts do not block Drama

The system SHALL prevent Zen first-run or default-browser prompts from blocking the Drama workbench in the dedicated Zen Drama profile.

#### Scenario: Dedicated profile launch

- **WHEN** the Zen Drama launcher starts a dedicated profile
- **THEN** default-browser checks and first-run prompts are disabled or dismissed before screenshot verification
- **AND** no default-browser prompt occludes the Drama first viewport

### Requirement: Native-feeling host and workbench separation

The system SHALL preserve Zen as the outer host and Drama as the embedded workbench.

#### Scenario: Zen chrome remains visible

- **WHEN** a product-path Drama surface is open
- **THEN** Zen browser chrome and sidebar affordances remain visible around the workbench
- **AND** the content area reads as a hosted workbench, not a standalone localhost webpage

#### Scenario: Drama-owned navigation

- **WHEN** the user switches between Graph, PLM, and Skill Crew
- **THEN** route controls use Drama-owned labels and icon-first affordances
- **AND** imported product names do not replace the primary Drama navigation labels

### Requirement: Readiness is visible and actionable

The system SHALL show separate readiness states for shell, runtime, sidecar, AI, workspace, workflow preview, and parity.

#### Scenario: Runtime ready but sidecar pending

- **WHEN** the Drama runtime is reachable and PlotPilot is still starting
- **THEN** the UI shows `runtime-ready` and a distinct sidecar pending state
- **AND** non-PlotPilot features remain visibly available

#### Scenario: AI unavailable

- **WHEN** Codex-backed AI is unavailable or unauthenticated
- **THEN** Codex-backed actions are disabled with a clear status message
- **AND** Graph, project navigation, and non-Codex PLM diagnostics remain usable

### Requirement: Failure states are designed recovery surfaces

The system SHALL render styled, route-aware recovery surfaces for known failure modes.

#### Scenario: Runtime unavailable

- **WHEN** the product-path shell cannot reach the Drama runtime
- **THEN** the user sees a styled runtime-unavailable panel with retry and diagnostics actions

#### Scenario: PlotPilot sidecar unavailable

- **WHEN** the PLM route is open and PlotPilot health fails
- **THEN** the user sees a styled sidecar-unavailable panel
- **AND** the panel includes the configured project root, data directory, or log path when available

#### Scenario: CSS or token bridge failure

- **WHEN** required Drama styles or Zen token bridge styles fail to load
- **THEN** the shell shows an intentional styled fallback or fails verification
- **AND** browser-default buttons, plain text route links, or unstyled document flow MUST NOT dominate the first viewport

### Requirement: Path and diagnostic text is contained

The system SHALL display local paths and diagnostic text without breaking layout.

#### Scenario: Long macOS path

- **WHEN** the UI displays a long macOS path
- **THEN** the path is contained in a monospace metadata element with wrapping or horizontal scrolling
- **AND** it does not overflow its panel or overlap other controls

#### Scenario: Long Windows path

- **WHEN** the UI displays a long Windows path
- **THEN** the path is contained in a monospace metadata element with wrapping or horizontal scrolling
- **AND** drive letters, backslashes, and spaces remain readable

### Requirement: Chinese product path is usable

The system SHALL support Chinese user-facing status and recovery text for the Zen-hosted product path.

#### Scenario: Chinese status copy

- **WHEN** the product path is launched in a Chinese locale or configured Chinese mode
- **THEN** readiness labels, failure titles, and recovery actions are understandable in Chinese
- **AND** text does not overflow compact panels or buttons

### Requirement: Visual verification proves usable UI

The system SHALL require product-path screenshots or equivalent visual evidence before marking Zen-native UI/UX acceptance complete.

#### Scenario: Required screenshot set

- **WHEN** UI/UX verification is run for the Zen-native port
- **THEN** it captures Graph, PLM, Skill Crew, runtime-unavailable, sidecar-unavailable, and CSS/token failure states
- **AND** each screenshot is linked from the verification output

#### Scenario: Black or blank viewport fails

- **WHEN** a screenshot is mostly black, mostly blank, blocked by a browser prompt, or dominated by browser-default error UI
- **THEN** UI/UX verification fails
- **AND** the failure identifies the blocked layer when possible

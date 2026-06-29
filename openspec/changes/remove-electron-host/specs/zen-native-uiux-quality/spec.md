## ADDED Requirements

### Requirement: Drama surfaces do not depend on Electron renderer or preload
The system SHALL render production Drama surfaces through the source-built Gecko host without Electron renderer or preload behavior.

#### Scenario: Styled surface without Electron preload
- **WHEN** the production source-built Drama Browser opens Start, Graph, PLM, Skill Crew, or Basic Memory
- **THEN** the surface MUST render styled UI without `window.electronAPI`
- **AND** missing Electron preload MUST NOT cause blank, unstyled, or browser-default error UI.

#### Scenario: Recovery state without Electron IPC
- **WHEN** Drama Runtime, PLM sidecar, AI, Graph data, or Basic Memory is unavailable
- **THEN** the UI MUST show a styled route-aware recovery state
- **AND** recovery controls MUST call DramaHost or Runtime APIs, not Electron IPC.

### Requirement: Host identity reads as Drama Browser with Gecko chrome
The system SHALL present the product as Drama Browser running in Gecko chrome, not as an Electron app.

#### Scenario: Visible production host identity
- **WHEN** a user opens the production app
- **THEN** visible browser chrome, title, status labels, and diagnostics MUST identify the product as Drama Browser
- **AND** they MUST NOT describe Electron as the active host.

#### Scenario: Legacy Electron wording is contained
- **WHEN** legacy Electron is mentioned in settings, docs, or diagnostics
- **THEN** it MUST be labeled as legacy or archived
- **AND** it MUST NOT appear as a selectable production host path.

### Requirement: Visual verification covers Electron-free product path
The system SHALL require visual evidence from the source-built Gecko app before accepting Electron removal.

#### Scenario: Required source-built screenshots
- **WHEN** Electron-free production verification runs
- **THEN** it MUST capture Start, Graph, PLM, Skill Crew, Basic Memory, runtime-unavailable, and at least one local-file or permissions-related state from the source-built Drama Browser app
- **AND** Electron screenshots MUST NOT satisfy this gate.

#### Scenario: Electron-only UI gap blocks removal
- **WHEN** a workflow only renders correctly in the legacy Electron app
- **THEN** Electron removal acceptance MUST fail
- **AND** the verifier MUST report the missing Gecko-hosted workflow.

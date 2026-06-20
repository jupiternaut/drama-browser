## ADDED Requirements

### Requirement: Ready-Only Production Evidence
The system SHALL provide a Stage 9.2 macOS PLM production readiness mode where Prompt Registry, Memory Graph, Hosted Write, and Autopilot are all `ready` before the workflow is accepted.

#### Scenario: All core evidence is ready
- **GIVEN** the macOS Zen PLM production fixture is loaded
- **WHEN** Stage 9.2 production readiness is evaluated
- **THEN** Prompt Registry, Memory Graph, Hosted Write, and Autopilot evidence are all marked `ready`
- **AND** the product readiness tier reports a ready Stage 9.2 state

#### Scenario: Partial evidence is rejected
- **GIVEN** any Prompt Registry, Memory Graph, Hosted Write, or Autopilot evidence item is `partial` or `blocked`
- **WHEN** strict Stage 9.2 verification runs
- **THEN** verification fails
- **AND** the JSON evidence identifies the non-ready item and state

### Requirement: Native Prompt Registry Readiness
The system SHALL mark Prompt Registry evidence `ready` only after native PlotPilot prompt persistence succeeds and readback proves the saved prompt survives reload.

#### Scenario: Native prompt save and readback
- **GIVEN** the production fixture project is loaded
- **WHEN** PLM saves a Prompt Plaza card through the native PlotPilot registry path
- **THEN** the saved prompt is present after readback or refresh
- **AND** Prompt Registry evidence is marked `ready`
- **AND** verification JSON includes the prompt identifier, persistence source, and readback status

#### Scenario: Fallback prompt save remains partial
- **GIVEN** the native PlotPilot registry path is unavailable or rejects the write
- **WHEN** PLM uses Drama project-file or graph-event fallback persistence
- **THEN** Prompt Registry evidence is not marked `ready`
- **AND** diagnostics identify the fallback source and native failure reason

### Requirement: Chapter-Derived Memory Readiness
The system SHALL mark Memory Graph evidence `ready` only when post-chapter sync records non-empty memory diff data derived from the active chapter.

#### Scenario: Post-chapter memory diff is non-empty
- **GIVEN** the production fixture chapter contains stable entities and relationships
- **WHEN** the chapter is saved or written back and post-chapter memory sync runs
- **THEN** PLM records a non-empty chapter-derived memory diff
- **AND** Memory Graph evidence is marked `ready`
- **AND** the UI and verification JSON include the active chapter, diff count, and sync timestamp

#### Scenario: Zero memory diff remains partial
- **GIVEN** post-chapter memory sync runs but returns no chapter-derived memory entries
- **WHEN** Stage 9.2 evidence is evaluated
- **THEN** Memory Graph evidence is not marked `ready`
- **AND** diagnostics explain that sync ran but produced zero chapter-derived diff items

### Requirement: Hosted Write Lifecycle Readiness
The system SHALL mark Hosted Write evidence `ready` only after a fixture-safe session records lifecycle events that include persisted chapter output or writeback.

#### Scenario: Hosted Write session reaches saved evidence
- **GIVEN** the production fixture project and chapter are loaded
- **WHEN** a fixture-safe Hosted Write session runs
- **THEN** PLM records start, progress, save or writeback, and completion evidence
- **AND** Hosted Write evidence is marked `ready`
- **AND** verification JSON includes session id, event count, saved chapter count, and latest outcome

#### Scenario: Hosted Write recovery evidence is visible
- **GIVEN** a Hosted Write session is cancelled, retried, or fails before completion
- **WHEN** PLM renders Stage 9.2 evidence
- **THEN** recovery state remains visible without clearing prior saved evidence
- **AND** verification JSON includes the latest recovery action or failure reason

### Requirement: Autopilot Lifecycle Readiness
The system SHALL mark Autopilot evidence `ready` only after the fixture records minimum production-safe lifecycle controls and breaker evidence.

#### Scenario: Autopilot lifecycle evidence is complete
- **GIVEN** the production fixture project is loaded
- **WHEN** fixture-safe Autopilot controls run through start, pause or stop, resume or review, and breaker reset
- **THEN** PLM records each lifecycle action in production evidence
- **AND** Autopilot evidence is marked `ready`
- **AND** verification JSON includes event count, latest state, review state, and breaker state

#### Scenario: Manual writing remains available
- **GIVEN** Autopilot is stopped, blocked, or waiting for review
- **WHEN** the user edits or saves the active chapter manually
- **THEN** manual editing remains available
- **AND** Autopilot evidence remains separate from manual chapter evidence

### Requirement: Strict macOS Product-Path Verification
The system SHALL include an opt-in strict macOS verifier mode for Stage 9.2 production readiness.

#### Scenario: Strict verifier captures ready evidence
- **GIVEN** macOS Zen Browser can load `chrome://browser/content/drama/app/index.html?...surface=plm`
- **WHEN** the strict Stage 9.2 verifier runs
- **THEN** it captures screenshot and JSON evidence
- **AND** it fails unless Prompt Registry, Memory Graph, Hosted Write, and Autopilot evidence are all `ready`
- **AND** it does not describe the result as Windows or cross-platform Zen verification

#### Scenario: Strict verifier rejects unstyled or failure-dominated UI
- **GIVEN** the PLM panel renders raw JSON, a raw stack trace, an unstyled document flow, or a primary failure state
- **WHEN** the strict Stage 9.2 verifier runs
- **THEN** verification fails before reporting Stage 9.2 readiness

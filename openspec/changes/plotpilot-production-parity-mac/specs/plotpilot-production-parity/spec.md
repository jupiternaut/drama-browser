# plotpilot-production-parity Specification

## Purpose

Define the observable macOS production-parity slice for Drama PLM inside Zen Browser. This capability proves that the Zen-hosted PLM can run a real writing workflow with PlotPilot-backed evidence, without claiming Windows validation or full AgentOS/Crew parity.

## ADDED Requirements

### Requirement: Reproducible Production Project

The system SHALL provide a deterministic macOS PLM project fixture that can be loaded in the Zen product-path panel.

#### Scenario: Load production fixture

- **GIVEN** the Drama runtime and PlotPilot sidecar are ready on macOS
- **WHEN** the verifier or user requests the production parity fixture
- **THEN** PLM loads a real project and at least one chapter in the Zen panel
- **AND** PLM does not show `workspace-missing` as the primary state
- **AND** the fixture name, project identifier, and active chapter identifier are visible or present in verification JSON

#### Scenario: Fixture path metadata remains contained

- **GIVEN** the fixture uses local macOS or Windows-style paths as metadata
- **WHEN** PLM renders the production readiness panel
- **THEN** long paths use contained monospace metadata styling
- **AND** they do not push the chapter paper, status rail, or navigation off screen

### Requirement: Production Readiness Snapshot

The system SHALL show production workflow readiness as structured evidence rather than a single parity flag.

#### Scenario: Show production evidence

- **GIVEN** PLM has loaded a project and chapter
- **WHEN** the integration status or production panel renders
- **THEN** it shows separate evidence for project load, chapter load, Hosted Write, prompt persistence, post-chapter memory sync, Autopilot, and verification readiness
- **AND** each item is marked `ready`, `partial`, or `blocked`
- **AND** partial or fallback-backed checks include concise evidence text

#### Scenario: Do not overclaim parity

- **GIVEN** any production evidence item is partial or blocked
- **WHEN** PLM reports readiness tiers
- **THEN** `plotpilot-parity-ready` is not reported as ready
- **AND** release-facing text does not describe full PlotPilot parity

### Requirement: Hosted Write Production Evidence

The system SHALL make Hosted Write progress and outcomes observable in the PLM UI and runtime evidence.

#### Scenario: Hosted Write session records events

- **GIVEN** a project chapter is loaded
- **WHEN** the user starts a Hosted Write session for a chapter range
- **THEN** PLM records session start, chapter start, progress, save, approval-required, done, error, or cancellation events as they occur
- **AND** the events are visible in the production timeline or verification JSON
- **AND** the active production readiness snapshot updates without requiring a full page reload

#### Scenario: Hosted Write failure remains recoverable

- **GIVEN** Hosted Write fails or is cancelled
- **WHEN** PLM renders the session state
- **THEN** the user sees the failed or cancelled state with retry or recovery affordances where supported
- **AND** previous successful chapter evidence remains visible

### Requirement: Native Prompt Persistence Evidence

The system SHALL prefer PlotPilot-native prompt registry mutations for Prompt Plaza edits and SHALL expose fallback persistence clearly.

#### Scenario: Native prompt write succeeds

- **GIVEN** the PlotPilot-compatible sidecar exposes native prompt mutation endpoints
- **WHEN** the user edits and saves a Prompt Plaza card
- **THEN** PLM writes the prompt through the native PlotPilot endpoint
- **AND** refresh or reload evidence shows the saved prompt still exists
- **AND** the prompt production evidence is marked `ready`

#### Scenario: Prompt fallback is explicit

- **GIVEN** the native prompt endpoint is unavailable or rejects the write
- **WHEN** PLM persists the prompt through Drama project-file or graph-event fallback
- **THEN** the prompt production evidence is marked `partial`
- **AND** the fallback path and failure reason are visible in diagnostics or verification JSON

### Requirement: Post-Chapter Memory Graph Evidence

The system SHALL capture and show memory evidence after chapter save or writeback.

#### Scenario: Chapter save syncs memory evidence

- **GIVEN** a project chapter is saved or written back from PLM
- **WHEN** the post-chapter memory sync completes
- **THEN** PLM records knowledge graph statistics and latest chapter-derived memory entries where available
- **AND** the Memory panel shows the active chapter's sync timestamp and diff summary
- **AND** the production evidence is marked `ready` only when chapter-derived memory evidence is non-empty

#### Scenario: Memory sync partial state

- **GIVEN** memory sync runs but returns no chapter-derived entities, triples, or relationships
- **WHEN** PLM shows the memory evidence
- **THEN** the memory item is marked `partial`
- **AND** the UI explains that the sync ran but produced no chapter-derived memory diff

### Requirement: Autopilot Minimum Production Controls

The system SHALL expose a minimum production-safe Autopilot control loop for macOS PLM.

#### Scenario: Autopilot control states are visible

- **GIVEN** a project with chapters is loaded
- **WHEN** the user starts, stops, resumes, or resets the Autopilot breaker
- **THEN** PLM shows the latest Autopilot state, breaker state, and review-required state
- **AND** each control action records an event in the production timeline or verification JSON

#### Scenario: Autopilot does not block manual writing

- **GIVEN** Autopilot is stopped, blocked, or waiting for review
- **WHEN** the user edits or saves a chapter manually
- **THEN** manual chapter editing remains available
- **AND** Autopilot evidence remains visible as a separate production item

### Requirement: macOS Product-Path Happy-Path Verification

The system SHALL include automated macOS verification evidence for the PLM production happy path.

#### Scenario: Marionette captures production parity evidence

- **GIVEN** a real macOS Zen Browser app or local Zen build is available
- **WHEN** the production parity verifier runs against the PLM surface
- **THEN** it captures a screenshot and JSON evidence from `chrome://browser/content/drama/app/index.html?...surface=plm`
- **AND** the JSON includes surface classification, active project, active chapter, production evidence states, readiness tiers, and screenshot metadata
- **AND** the verifier fails if the first viewport is dominated by a failure state, raw JSON, raw stack traces, or unstyled document flow

#### Scenario: Verification remains scoped to macOS

- **GIVEN** Windows product-path verification has not been run
- **WHEN** macOS production parity verification passes
- **THEN** the result is described as macOS product-path production parity evidence
- **AND** it is not described as cross-platform Zen product-path success

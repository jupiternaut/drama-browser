## ADDED Requirements

### Requirement: Source-built Gecko is the production performance target
The system SHALL measure production performance against the source-built Drama Browser Gecko host, not the Electron package.

#### Scenario: Production performance verifier rejects Electron artifacts
- **WHEN** the production performance verifier is run
- **THEN** it MUST fail if the measured app bundle contains Electron
- **AND** it MUST fail if the process tree includes Electron helper processes.

#### Scenario: Runtime budgets are measured through Gecko host
- **WHEN** the source-built Drama Browser opens Start, Graph, PLM, Skill Crew, or Basic Memory
- **THEN** first styled viewport time, runtime readiness time, sidecar readiness time, route switch time, and listener counts MUST be recorded for the Gecko-hosted product path
- **AND** Electron timing data MUST be labeled legacy and MUST NOT satisfy production performance acceptance.

### Requirement: Runtime sidecar startup remains bounded after Electron removal
The system SHALL preserve bounded runtime and sidecar startup after Electron main/preload is removed from production.

#### Scenario: Cold runtime startup without Electron main
- **WHEN** source-built Drama Browser launches and Drama Runtime is not running
- **THEN** the Gecko host or user-approved runtime launcher MUST start or adopt Drama Runtime within the existing runtime budget
- **AND** failure MUST produce a styled runtime-unavailable surface rather than a blank page.

#### Scenario: Duplicate runtime prevention without Electron lock ownership
- **WHEN** multiple Drama Browser surfaces request runtime startup concurrently
- **THEN** they MUST share one runtime launch/adoption operation
- **AND** no stale duplicate listener remains after startup completes.

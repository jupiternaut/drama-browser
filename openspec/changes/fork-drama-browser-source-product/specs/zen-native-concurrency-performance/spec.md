## MODIFIED Requirements

### Requirement: Performance evidence is recorded

The system SHALL record enough performance evidence to compare future changes against the port budget while separating Zen/Gecko wrapper evidence from source-built Drama Browser product evidence.

#### Scenario: Product-path performance run

- **WHEN** a verifier runs the Zen wrapper product-path performance check
- **THEN** it records shell first viewport time, runtime readiness time, sidecar readiness time, route switch time, and listener counts
- **AND** the run fails if required budgets are exceeded
- **AND** the run is labeled as Zen/Gecko adapter or wrapper evidence unless the source-built Drama Browser identity verifier also passes

#### Scenario: Compatibility surfaces are measured separately

- **WHEN** localhost, Brave, Electron, or wrapper compatibility surfaces are measured
- **THEN** their results are labeled separately
- **AND** they MUST NOT satisfy the source-built Drama Browser performance gate

#### Scenario: Source-built product performance run

- **WHEN** the source-built Drama Browser app is used for performance validation
- **THEN** the evidence records app bundle path, main process path, helper process names, source-built classification, runtime readiness, sidecar readiness, route switch time, and listener counts
- **AND** the run fails if source-built identity verification fails before performance measurement

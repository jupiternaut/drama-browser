## MODIFIED Requirements

### Requirement: Performance evidence is recorded
The system SHALL record enough performance and launch evidence to compare future changes against the port budget while distinguishing Zen/Gecko adapter validation from Drama Browser product launch validation.

#### Scenario: Product-path performance run

- **WHEN** a verifier runs the Zen/Gecko adapter product-path performance check
- **THEN** it records shell first viewport time, runtime readiness time, sidecar readiness time, route switch time, and listener counts
- **AND** the run fails if required budgets are exceeded
- **AND** the run is labeled as adapter performance evidence unless it also verifies packaged Drama Browser identity

#### Scenario: Compatibility surfaces are measured separately

- **WHEN** localhost, Brave, or Electron compatibility surfaces are measured
- **THEN** their results are labeled separately
- **AND** they MUST NOT satisfy the Zen/Gecko adapter product-path performance gate
- **AND** they MUST NOT satisfy packaged Drama Browser launch isolation

#### Scenario: Drama Browser package launch evidence is recorded

- **WHEN** the packaged Drama Browser launcher is used for performance or readiness validation
- **THEN** the evidence records the launched app bundle path, process path, surface classification, preference namespace, and whether original Zen Browser was awakened
- **AND** runtime readiness budgets remain valid only after the product launch evidence passes

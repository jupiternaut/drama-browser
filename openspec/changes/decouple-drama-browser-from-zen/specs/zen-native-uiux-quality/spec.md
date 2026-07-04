## MODIFIED Requirements

### Requirement: Native-feeling host and workbench separation
The system SHALL preserve the outer browser host as an adapter frame and Drama as the embedded workbench, while keeping Drama Browser product identity separate from the Zen/Gecko adapter identity.

#### Scenario: Zen Gecko chrome remains visible in adapter validation

- **WHEN** a Drama surface is open through the Zen/Gecko adapter path
- **THEN** Zen-compatible browser chrome and sidebar affordances remain visible around the workbench
- **AND** the content area reads as a hosted Drama workbench, not a standalone localhost webpage
- **AND** the verification labels this as adapter validation rather than complete Drama Browser product decoupling

#### Scenario: Drama-owned navigation

- **WHEN** the user switches between Graph, PLM, Skill Crew, Start, or Basic Memory
- **THEN** route controls use Drama-owned labels and icon-first affordances
- **AND** imported product names do not replace the primary Drama navigation labels
- **AND** Zen-specific names appear only when describing the active host adapter or a compatibility alias

#### Scenario: Product identity remains separate from host theme

- **WHEN** a Zen/Gecko token bridge supplies host variables
- **THEN** the workbench may consume those tokens through an explicit host-follow skin or adapter bridge
- **AND** the skin name or token bridge does not make Zen the canonical Drama Browser product identity

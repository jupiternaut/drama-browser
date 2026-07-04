## MODIFIED Requirements

### Requirement: Product-path first viewport is designed

The system SHALL render a designed Drama first viewport for both the transitional Zen/Gecko wrapper path and the accepted source-built Drama Browser product path.

#### Scenario: PLM product-path first viewport

- **WHEN** the transitional Zen/Gecko wrapper opens `chrome://browser/content/drama/app/index.html?...&surface=plm`
- **THEN** the first viewport shows host chrome around a Drama PLM shell, a styled loading state, or a styled PLM failure state
- **AND** the viewport is not black, blank, unstyled, raw JSON, raw stack trace, or browser-default error UI
- **AND** the evidence is labeled as wrapper/adapter UI evidence

#### Scenario: Graph product-path first viewport

- **WHEN** the transitional Zen/Gecko wrapper opens `chrome://browser/content/drama/app/index.html?...&surface=graph`
- **THEN** the first viewport shows host chrome around the Drama Graph shell, a styled loading state, or a styled Graph failure state
- **AND** graph navigation and runtime status are visible or intentionally pending
- **AND** the evidence is labeled as wrapper/adapter UI evidence

#### Scenario: Skill Crew product-path first viewport

- **WHEN** the transitional Zen/Gecko wrapper opens `chrome://browser/content/drama/app/index.html?...&surface=crew`
- **THEN** the first viewport shows host chrome around the Skill Crew shell, a styled loading state, or a styled Crew failure state
- **AND** the surface does not render as plain text links or an unstyled document
- **AND** the evidence is labeled as wrapper/adapter UI evidence

#### Scenario: Source-built Drama Browser first viewport

- **WHEN** the source-built Drama Browser product opens Start, Graph, PLM, Skill Crew, or Basic Memory
- **THEN** the first viewport shows Drama Browser chrome and a designed Drama workbench surface
- **AND** it does not expose Zen as the primary product identity in visible host chrome, prompts, or app title

### Requirement: Native-feeling host and workbench separation

The system SHALL preserve a native browser host frame around the embedded Drama workbench while distinguishing transitional Zen/Gecko adapter UI from source-built Drama Browser product UI.

#### Scenario: Zen chrome remains visible in wrapper validation

- **WHEN** a transitional wrapper Drama surface is open
- **THEN** Zen-compatible browser chrome and sidebar affordances may remain visible around the workbench
- **AND** the content area reads as a hosted workbench, not a standalone localhost webpage
- **AND** verification labels this as adapter validation rather than complete source-level product decoupling

#### Scenario: Source-built Drama chrome is primary

- **WHEN** a source-built Drama Browser product surface is open
- **THEN** host chrome, app title, sidebar labels, permission prompts, and browser-owned controls identify as Drama Browser
- **AND** Zen-specific names appear only as source attribution, compatibility import labels, or migration diagnostics

#### Scenario: Drama-owned navigation

- **WHEN** the user switches between Graph, PLM, Skill Crew, Start, or Basic Memory
- **THEN** route controls use Drama-owned labels and icon-first affordances
- **AND** imported product names do not replace the primary Drama navigation labels

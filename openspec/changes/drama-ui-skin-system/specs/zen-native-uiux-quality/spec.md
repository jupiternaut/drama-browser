## ADDED Requirements

### Requirement: Product Skin System

The system SHALL provide a product-level Drama skin system for the Zen-native workbench.

#### Scenario: Active skin is applied to the product path

- **GIVEN** Zen opens `chrome://browser/content/drama/app/index.html?...&surface=plm`
- **WHEN** the Drama shell renders
- **THEN** the document root has a `data-drama-skin` value
- **AND** the shell root mirrors that value as `data-drama-active-skin`
- **AND** shell, PLM, Graph, and Crew surfaces consume Drama semantic variables from the active skin

#### Scenario: Skin selection persists

- **GIVEN** the user selects a built-in Drama skin
- **WHEN** the panel reloads or reopens in the same profile
- **THEN** the selected skin id is restored from local persistence
- **AND** the first styled viewport uses the restored skin before the route is marked ready

#### Scenario: Zen following is explicit

- **GIVEN** Drama is hosted inside Zen Browser
- **WHEN** the active skin is `zen-follow`
- **THEN** Zen-provided host variables are bridged into Drama semantic variables
- **AND** choosing any non-Zen skin applies Drama-owned tokens instead of forcing Zen variables

#### Scenario: Built-in skins are visible in chrome

- **GIVEN** the Drama workbench shell is loaded
- **WHEN** the user opens the appearance control
- **THEN** built-in skins are available from compact workbench chrome
- **AND** `jade-glass` and `opal-bloom` are available as first-class product skin bases
- **AND** the control does not replace or obscure Graph, PLM, and Skill Crew navigation

#### Scenario: Active skin is verifiable

- **GIVEN** automated UI/UX verification inspects the product path
- **WHEN** the Drama shell is ready
- **THEN** the active skin id is available through a readiness signal or DOM attribute
- **AND** verification can distinguish missing skin application from a ready styled viewport

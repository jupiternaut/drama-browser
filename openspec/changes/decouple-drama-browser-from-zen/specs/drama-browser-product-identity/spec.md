## ADDED Requirements

### Requirement: Drama Browser package launch isolation
The system SHALL launch the packaged Drama Browser app as the product entrypoint without falling back to an installed Zen Browser app.

#### Scenario: Packaged app path launch
- **WHEN** the Drama Browser launcher starts the macOS package
- **THEN** the launched process path includes `Drama Browser.app`
- **AND** the launcher does not open `/Applications/Zen Browser.app`
- **AND** the launcher does not perform a second LaunchServices URL open that can be claimed by another browser

#### Scenario: Invalid bundle rejection
- **WHEN** the configured app bundle does not have the Drama Browser bundle identifier
- **THEN** the launcher fails with an actionable error
- **AND** it does not substitute Zen Browser, Brave, Chrome, Electron, or localhost as product launch evidence

### Requirement: Drama-owned surface classification
The system SHALL expose Drama Browser product classifications without requiring Zen product naming.

#### Scenario: Packaged Drama Browser product path
- **WHEN** a Drama surface is loaded from the packaged browser chrome resource path
- **THEN** the canonical surface classification is `product-drama-browser`
- **AND** the classification evidence records the host adapter separately when the adapter is Zen/Gecko

#### Scenario: Legacy Zen classification alias
- **WHEN** existing code or archived verification data refers to `product-zen-panel`
- **THEN** the system treats it as a deprecated compatibility alias
- **AND** new verification output includes the canonical `product-drama-browser` classification

#### Scenario: Localhost remains developer compatibility
- **WHEN** a Drama surface is loaded from `http://127.0.0.1`
- **THEN** the surface is classified as `dev-localhost`
- **AND** `host=zen`, `host=drama`, or other query params do not upgrade it to product validation

#### Scenario: Non-product browsers remain fallback
- **WHEN** a Drama surface is loaded in Brave, Chrome, Chromium, or another non-packaged browser
- **THEN** the surface is classified as `browser-fallback`
- **AND** it does not satisfy Drama Browser package validation

### Requirement: Host adapter boundary
The system SHALL keep product identity separate from host adapter implementation.

#### Scenario: Zen Gecko adapter
- **WHEN** Drama Browser runs through the Zen/Gecko integration path
- **THEN** Zen-specific token variables, commands, and panel lifecycle are handled through an explicit host adapter
- **AND** React surfaces do not hardcode Zen as the product identity

#### Scenario: Browser fallback adapter
- **WHEN** Drama Browser runs in a normal browser development surface
- **THEN** host-specific APIs degrade through the browser fallback adapter
- **AND** product status does not claim packaged Drama Browser validation

### Requirement: Drama Browser preference namespace
The system SHALL use `drama.browser.*` as the canonical preference namespace for Drama Browser package configuration.

#### Scenario: Canonical prefs are present
- **WHEN** both `drama.browser.*` and `zen.drama.*` preferences exist
- **THEN** the chrome manager and launcher use `drama.browser.*`
- **AND** verification records that the canonical namespace was used

#### Scenario: Legacy prefs are present
- **WHEN** only `zen.drama.*` preferences exist in an existing local profile
- **THEN** the system reads them as a backward-compatible fallback
- **AND** verification records that legacy prefs were used

#### Scenario: New launcher profile
- **WHEN** the Drama Browser launcher creates or refreshes its dedicated profile
- **THEN** it writes `drama.browser.*` preferences
- **AND** it may write `zen.drama.*` compatibility preferences only for the migration window

### Requirement: Drama-owned start surface identity
The system SHALL implement the start page as a Drama Browser surface rather than a Zen-named component.

#### Scenario: Start surface renders
- **WHEN** the user opens the start surface in packaged Drama Browser
- **THEN** the component, DOM labels, and accessibility labels identify it as a Drama Browser start surface or neutral Start surface
- **AND** it does not require `ZenStartSurface` or `zen-start-*` naming to render

#### Scenario: Existing start route remains compatible
- **WHEN** an existing entrypoint opens `surface=start`
- **THEN** the Drama Browser start surface renders
- **AND** no broken route or blank viewport appears because of the rename

### Requirement: Package identity verification
The system SHALL verify product identity with bundle, process, surface, and wakeup evidence.

#### Scenario: Verification succeeds
- **WHEN** package verification runs against the packaged Drama Browser app
- **THEN** the evidence includes bundle id, app display name, launched process path, loaded document URI, canonical surface classification, and original Zen wakeup status
- **AND** the run passes only when the original Zen Browser app was not awakened

#### Scenario: Verification detects inherited engine identity
- **WHEN** helper executable names, engine metadata, or upstream version strings still contain Zen or Firefox-derived names
- **THEN** verification records them as engine-source rebrand gaps
- **AND** package-level decoupling is not described as a completed source-level fork

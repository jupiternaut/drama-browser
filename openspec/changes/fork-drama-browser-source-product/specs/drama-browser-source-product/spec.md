## ADDED Requirements

### Requirement: Source workspace is explicit
The system SHALL create and verify a dedicated source workspace for the Drama Browser source-level fork.

#### Scenario: Source workspace selected
- **WHEN** the source fork work begins
- **THEN** the workspace path is recorded in the change evidence
- **AND** the source workspace is separate from the wrapper repo unless an explicit repository migration decision is made

#### Scenario: Source tree prerequisites
- **WHEN** the source workspace is inspected
- **THEN** it contains a Zen/Firefox browser source build entrypoint such as `mach`, `moz.configure`, or the Zen tooling that downloads the engine source
- **AND** the wrapper-only repo MUST NOT be treated as sufficient evidence for source-level fork capability

### Requirement: Upstream baseline is reproducible
The system SHALL record the upstream Zen and Firefox/Gecko source baseline before applying Drama Browser product changes.

#### Scenario: Baseline recorded
- **WHEN** source bootstrap completes
- **THEN** the evidence includes upstream repository URL, commit hash, branch, toolchain versions, and build configuration
- **AND** the baseline can be rebuilt or the blocker log explains why it cannot

#### Scenario: Baseline build evidence
- **WHEN** an unmodified source baseline is built
- **THEN** the evidence records app bundle path, executable path, helper names, updater state, and profile location before Drama branding changes

### Requirement: Drama Browser branding is build-system owned
The source build SHALL define Drama Browser product identity through build-time branding rather than post-build plist-only edits.

#### Scenario: Build-time product identity
- **WHEN** the source-built app is packaged
- **THEN** the bundle display name, product name, bundle id, icon, vendor metadata, profile name, and URL scheme identify as Drama Browser
- **AND** those values originate from source/build configuration

#### Scenario: Plist-only rename rejected
- **WHEN** only generated `Info.plist` or copied app bundle metadata is edited after build
- **THEN** the verification MUST NOT count the result as source-level productization

### Requirement: Executable and helper identity is Drama-owned
The source-built product SHALL remove Zen product identity from the main executable and helper applications.

#### Scenario: Main executable identity
- **WHEN** the source-built app is launched
- **THEN** the main process name and executable path identify as Drama Browser or an approved Drama-owned executable name
- **AND** they do not identify as `zen`

#### Scenario: Helper identity
- **WHEN** GPU, renderer, plugin, crash, or utility helper processes are launched
- **THEN** helper app names, helper bundle ids, and visible process names identify as Drama Browser helpers
- **AND** they do not identify as Zen helpers

### Requirement: Updater ownership is explicit
The source-built product SHALL NOT inherit Zen update behavior as a product update channel.

#### Scenario: Updater disabled before ownership
- **WHEN** Drama Browser does not yet have its own signing identity and update metadata
- **THEN** inherited Zen updater behavior is disabled
- **AND** update checks cannot replace the Drama Browser build with an upstream Zen artifact

#### Scenario: Drama updater enabled
- **WHEN** updater behavior is enabled
- **THEN** update channel, metadata endpoint, signing identity, rollback policy, and verification keys are owned by Drama Browser

### Requirement: Profile and system integration identity is Drama-owned
The source-built product SHALL use Drama-owned profile, URL handler, default-browser, and LaunchServices metadata.

#### Scenario: Profile path
- **WHEN** the source-built app creates or opens a profile
- **THEN** profile directories and profile metadata use Drama Browser naming
- **AND** they do not reuse Zen product profile locations except through an explicit migration import

#### Scenario: URL and default-browser metadata
- **WHEN** macOS registers the source-built app
- **THEN** LaunchServices metadata, URL schemes, default-browser prompts, and permission prompts identify as Drama Browser
- **AND** `drama://` is the canonical Drama Browser product scheme

### Requirement: Drama chrome is source-registered
The source-built product SHALL register Drama resources at build time instead of relying on post-copy package injection.

#### Scenario: Chrome resource registration
- **WHEN** the source-built app loads the Drama shell
- **THEN** Start, Graph, PLM, Skill Crew, and Basic Memory resources resolve through build-registered Drama chrome or resource mappings
- **AND** the source-built artifact does not require a package script to copy Drama chrome into an already-built Zen bundle

#### Scenario: Wrapper fallback remains separate
- **WHEN** the wrapper package path remains available
- **THEN** its post-copy injection behavior is labeled as a transitional adapter
- **AND** it MUST NOT be used as source-level fork acceptance evidence

### Requirement: Source-built verification proves full decoupling
The system SHALL provide a verifier that fails when source-built product identity still exposes Zen as the product owner.

#### Scenario: Full identity scan passes
- **WHEN** the source-built verifier runs
- **THEN** it checks bundle id, app display name, main executable, helper apps, helper bundle ids, updater state, profile path, URL schemes, process tree, and document URI
- **AND** it passes only when those product identity fields are Drama-owned

#### Scenario: Allowed source attribution
- **WHEN** the verifier finds Zen, Firefox, Gecko, or Mozilla text only in license notices, source attribution, compatibility docs, or upstream dependency metadata
- **THEN** it records the finding as attribution rather than product identity failure

#### Scenario: Disallowed product identity
- **WHEN** the verifier finds Zen product identity in running processes, helper app names, updater channel, app bundle metadata, or profile owner metadata
- **THEN** the verification fails with actionable file paths or process evidence

### Requirement: Wrapper-to-source migration is controlled
The system SHALL keep the package-wrapper product path available until the source-built product reaches parity.

#### Scenario: Source build incomplete
- **WHEN** source bootstrap, build, signing, or identity verification fails
- **THEN** the current Drama Browser wrapper remains the supported local launch path
- **AND** the blocker is recorded without claiming full source-level decoupling

#### Scenario: Source product accepted
- **WHEN** the source-built app passes identity, runtime, UI, and no-original-Zen-wakeup verification
- **THEN** release documentation may promote it as the primary Drama Browser product
- **AND** wrapper launchers are either deprecated or explicitly labeled as compatibility adapters

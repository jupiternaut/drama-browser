## ADDED Requirements

### Requirement: Production app is Gecko-hosted
The system SHALL use the source-built Gecko `Drama Browser.app` as the only production desktop host.

#### Scenario: Production app bundle contains no Electron framework
- **WHEN** the production macOS app bundle is scanned
- **THEN** it MUST NOT contain `Electron Framework.framework`
- **AND** it MUST NOT contain Electron Helper app bundles.

#### Scenario: Production launch creates no Electron helper processes
- **WHEN** the production Drama Browser app launches Start, Graph, PLM, Skill Crew, and Basic Memory
- **THEN** the running process tree MUST NOT include Electron, Electron Helper, Electron Renderer, Electron GPU, or Electron Plugin helper processes
- **AND** the main browser process MUST identify as Drama Browser or `drama-browser`.

### Requirement: UI modules use DramaHost instead of Electron IPC
The system SHALL expose desktop host capabilities through a Drama-owned host API rather than direct Electron IPC.

#### Scenario: Production UI has no direct Electron API access
- **WHEN** production UI source under `apps/drama-browser-shell` and `packages/drama-*` is checked
- **THEN** it MUST NOT call `window.electronAPI`
- **AND** it MUST NOT import `electron`, `ipcRenderer`, or `contextBridge`.

#### Scenario: Legacy Electron adapter is isolated
- **WHEN** legacy compatibility code maps `DramaHost` to Electron APIs
- **THEN** that code MUST live under an explicitly legacy Electron path
- **AND** production builds MUST NOT include that adapter.

### Requirement: Runtime owns local business capabilities
The system SHALL move non-browser business capabilities out of Electron main/preload and into Drama Runtime or shared Drama packages.

#### Scenario: Runtime exposes local capability discovery
- **WHEN** the Gecko-hosted shell connects to Drama Runtime
- **THEN** the runtime MUST report available capabilities for sessions, local files, AI/MCP, PLM sidecar, Graph data, Skill Crew, and Basic Memory
- **AND** unavailable capabilities MUST be represented as styled disabled or recovery states in the UI.

#### Scenario: Local file paths remain usable
- **WHEN** a user opens, imports, reveals, or previews a local file from a Drama surface
- **THEN** the request MUST flow through Drama Runtime or a Gecko chrome adapter
- **AND** the UI MUST handle long macOS and Windows paths without overflowing visible panels.

### Requirement: Gecko chrome owns browser-native commands
The system SHALL route browser-native window, tab, URL, profile, protocol, and shell commands through the source-built Gecko chrome adapter.

#### Scenario: Open URL from Drama surface
- **WHEN** a Drama surface requests opening an internal route, external URL, or `drama://` URL
- **THEN** the command MUST be handled by the Gecko-hosted Drama Browser adapter
- **AND** it MUST NOT call Electron shell APIs.

#### Scenario: Production routes load through source-registered resources
- **WHEN** Start, Graph, PLM, Skill Crew, or Basic Memory is opened in production
- **THEN** the visible page MUST load from source-registered Drama Browser resources or the canonical Drama Browser product path
- **AND** it MUST NOT load from an Electron renderer bundle path.

### Requirement: Production packaging excludes Electron
The system SHALL remove Electron from production build, package, install, update, and verification scripts.

#### Scenario: Production build command does not invoke Electron
- **WHEN** the production package command runs
- **THEN** it MUST NOT invoke `electron`, `electron-builder`, `electron-packager`, or Electron preload/renderer build scripts
- **AND** it MUST produce a source-built Drama Browser app, DMG, or equivalent source-built artifact.

#### Scenario: Electron updater is not a production updater
- **WHEN** production update behavior is inspected
- **THEN** `electron-updater` MUST NOT be used
- **AND** updates MUST be disabled or owned by Drama Browser source-built release metadata.

### Requirement: Legacy Electron is explicitly non-production
The system SHALL keep any remaining Electron code clearly marked as legacy until it is archived or removed.

#### Scenario: Legacy code cannot satisfy production verification
- **WHEN** a verifier sees an Electron artifact, Electron process, or Electron dependency
- **THEN** production verification MUST fail unless the artifact is under an explicitly allowed legacy archive path
- **AND** the verifier MUST report the path that caused the failure.

#### Scenario: Legacy app is not installed as current Drama Browser
- **WHEN** the user's installed app is checked for production acceptance
- **THEN** `/Applications/Drama Browser.app` MUST resolve to the source-built Gecko app
- **AND** `/Applications/Drama.app` MUST NOT be treated as the current production app if it is still Electron-based.

### Requirement: Product parity survives Electron removal
The system SHALL preserve Drama Browser product surfaces and core workflows after Electron is removed from production.

#### Scenario: Surface parity check
- **WHEN** the source-built Drama Browser opens Start, Graph, PLM, Skill Crew, and Basic Memory
- **THEN** each surface MUST render a styled nonblank viewport
- **AND** each surface MUST show runtime-ready, a styled pending state, or a styled recovery state.

#### Scenario: Workflow parity check
- **WHEN** PLM, Graph, Skill Crew, and Basic Memory smoke workflows are run
- **THEN** each workflow MUST complete through DramaHost and Drama Runtime APIs
- **AND** no workflow may require Electron IPC to pass.

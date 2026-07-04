## Context

Drama is being moved from an Electron-first shell into Zen Browser as a native-feeling chrome-resource workbench. The previous phase defined what counts as a product-path Zen panel; this phase defines the quality bar for the port.

The current system can launch pieces of the stack, but it still has migration-grade failure modes: duplicate runtime launches, adopted sidecar state being lost, first-run browser prompts blocking the page, black chrome-resource views, and evidence that proves files exist without proving the UI is usable.

The target architecture remains layered:

- Zen Browser owns outer chrome, sidebar or command entrypoints, panel lifecycle, profile prefs, and chrome-resource loading.
- Drama browser shell owns React route mounting, shared workbench layout, Zen token bridge, loading states, and runtime client behavior.
- Drama runtime owns local process authority, filesystem, graph events, PlotPilot sidecar lifecycle, Codex status, and API proxying.
- Graph, PLM, and Skill Crew remain Drama-owned React surfaces.

## Goals / Non-Goals

**Goals:**

- Convert the Zen migration into a measurable port with concurrency, performance, and UI/UX gates.
- Ensure one user action cannot spawn duplicate Drama runtimes, duplicate PlotPilot sidecars, duplicate health loops, or stale route requests.
- Keep the Zen-hosted shell responsive while runtime and PlotPilot startup are still in progress.
- Define first-viewport acceptance for product-path Graph, PLM, and Skill Crew surfaces.
- Make black screens, blank shells, default browser prompts, unstyled HTML, raw JSON, and raw stack traces fail verification.
- Keep compatibility surfaces available while preventing localhost, Brave, or Electron evidence from satisfying Zen-native acceptance.

**Non-Goals:**

- Rewriting Graph, PLM, or Skill Crew in XUL.
- Moving PlotPilot, Codex, graph persistence, or filesystem authority into Zen chrome scripts.
- Achieving full PlotPilot feature parity in this change.
- Optimizing large-domain operations that are owned by PlotPilot internals unless they block the Zen workbench responsiveness contract.
- Replacing the existing Drama package layout before the port shape stabilizes.

## Decisions

### 1. Use a Zen host adapter, not a second application

Zen integration will be treated as a host adapter that boots the existing Drama browser shell from a chrome resource. The same route packages should run in localhost compatibility and Zen product paths, but only the Zen path can satisfy product acceptance.

The host adapter must own profile preferences that affect first-run experience, including default-browser checks, startup route, internal app URL, and runtime launch settings.

**Alternative considered:** fork a separate Zen-only UI. Rejected because it would create a second product surface and make Graph/PLM/Crew parity harder to verify.

### 2. Add a launch coordinator with single-owner semantics

Runtime and PlotPilot startup must be idempotent. A launch request should use a lock or equivalent coordination primitive so concurrent calls share the same in-flight operation.

The coordinator must keep separate ownership state:

- Drama runtime process: owned by the launcher or adopted from an already healthy process.
- PlotPilot sidecar: owned by the runtime manager, owned by a platform service, or adopted from an already healthy process.
- UI readiness: derived from health and route state, not from process existence alone.

On macOS, launchd can be used as a process supervisor. On Windows, the equivalent package launcher must provide the same observable semantics even if the mechanism differs.

**Alternative considered:** let Zen, the package command, and the UI each run their own startup command. Rejected because it causes races and duplicate processes.

### 3. Treat readiness as a state machine, not a boolean

The shell must move through explicit states:

```text
booting-shell -> shell-ready
shell-ready -> runtime-connecting -> runtime-ready | runtime-unavailable
runtime-ready -> sidecar-starting -> plm-sidecar-ready | sidecar-unavailable
plm-sidecar-ready -> ai-checking -> ai-ready | ai-unavailable
```

State transitions must be monotonic for a single request generation. Stale responses from an older request must not overwrite a newer route or health state.

**Alternative considered:** keep polling `/runtime/status` and render whatever comes back. Rejected because it allows stale or partial status to erase valid adopted sidecar state.

### 4. Use bounded polling and event-driven updates where possible

Health checks must be bounded by timeouts and backoff. UI components must not create independent polling loops for the same runtime or sidecar state. A shared runtime client should fan out status to route components.

If websocket events are available, use them for live updates; otherwise use a shared poller with a visible cadence and cancellation on route unmount.

**Alternative considered:** each panel polls independently. Rejected because it creates avoidable load and makes concurrent state harder to reason about.

### 5. Define performance budgets as release gates

Budgets are measured on a local developer machine running the source-built Zen package unless a stricter release target is added later.

Initial budgets:

- Zen product-path shell shows a styled nonblank first viewport within 2 seconds after document load.
- Warm route switch between Graph, PLM, and Skill Crew completes within 500 ms without remounting the outer shell.
- Runtime status request returns or fails visibly within 2 seconds.
- Drama runtime cold launch becomes `runtime-ready` within 8 seconds.
- PlotPilot sidecar cold launch or adoption becomes `plm-sidecar-ready` within 45 seconds.
- UI remains interactive during runtime and sidecar launch; no main-thread task over 100 ms should be introduced by the shell startup path.
- Repeated open/start requests within 5 seconds must not create more than one Drama runtime listener or one PlotPilot listener.

**Alternative considered:** defer budgets until after implementation. Rejected because performance is the main risk of this port and must shape the design.

### 6. Make first viewport a designed state

The first viewport must always be one of:

- a ready workbench route,
- a styled loading state,
- a styled failure state with recovery actions.

Black screens, empty white pages, raw browser error pages, default browser first-run prompts, unstyled document flow, raw JSON, and raw stack traces are not acceptable first-viewport states.

**Alternative considered:** accept browser default errors during early port work. Rejected because they hide which layer failed and make progress unverifiable.

### 7. Verify product behavior with visual and structural evidence

Verification must capture:

- active or requested product-path URI,
- resource location inside Zen's chrome resource package,
- screenshot evidence for Graph, PLM, and Skill Crew first viewports,
- runtime/sidecar status payloads,
- process/listener counts after concurrent launch attempts,
- failure-state screenshots.

Visual checks should inspect structure and text signals rather than pixel-perfect images. The test should fail when the page is mostly black, mostly blank, browser-default, or blocked by first-run UI.

**Alternative considered:** rely on static file existence in the package. Rejected because a resource can exist in the app bundle while still failing to load, execute, or render in Zen.

## Risks / Trade-offs

**Risk: macOS and Windows process supervision differ** -> Mitigation: specify observable single-owner behavior and hide platform mechanics behind launch scripts or runtime adapters.

**Risk: strict startup budgets fail on slower PlotPilot environments** -> Mitigation: keep shell readiness separate from sidecar readiness; only PlotPilot-backed controls wait for sidecar health.

**Risk: UI checks become too brittle** -> Mitigation: assert structural conditions, route labels, status badges, and nonblank viewport occupancy instead of pixel-perfect styling.

**Risk: route packages still assume localhost asset paths** -> Mitigation: verify chrome-resource asset loading and keep package-time rewrites isolated from localhost builds.

**Risk: default browser or first-run prompts pollute screenshots** -> Mitigation: Zen Drama profiles must set first-run and default-browser prefs before launch.

**Risk: concurrent startup bugs reappear as scripts evolve** -> Mitigation: add regression tests that intentionally issue parallel launch requests and count listeners/processes.

## Migration Plan

1. Add regression tests around runtime manager adopted-state persistence and startup deduplication.
2. Introduce a shared launch coordinator contract for macOS and Windows launch scripts.
3. Add shared browser-shell readiness state and bounded status polling.
4. Harden Zen package resource loading so `chrome://browser/content/drama/app/index.html` loads assets and executes the React shell.
5. Add first-viewport loading and failure states before route-specific content mounts.
6. Add product-path visual verification for Graph, PLM, and Skill Crew.
7. Add concurrent-launch verification that checks runtime and PlotPilot listener counts.
8. Update handoff/release docs to report the highest verified tier and measured budgets.

Rollback strategy: keep localhost and Electron compatibility routes independent. If the Zen adapter regresses, disable product-path release claims without removing route packages or runtime functionality.

## Open Questions

- The first release target for this change is macOS source-built Zen on the current machine. Windows is documented through an adapter dependency file and package/verification entrypoints, but Windows runtime success is not claimed by this change.
- Should the Zen panel auto-start PlotPilot on PLM open, or only when the user enters a PlotPilot-backed workflow?
- What final P95 budgets should be used for non-developer machines?
- Which visual verification runner should become canonical for Zen: Playwright with browser automation, OS-level screenshot automation, or Zen-specific test hooks?

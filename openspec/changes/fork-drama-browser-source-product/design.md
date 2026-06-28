## Context

The previous `decouple-drama-browser-from-zen` change completed package-wrapper decoupling: the packaged app launches as `Drama Browser.app`, uses `product-drama-browser` as the canonical classification, and verifies that `/Applications/Zen Browser.app` is not awakened. That does not remove inherited source-level identity: the executable, helper applications, updater, profile metadata, and browser build system still come from a Zen/Firefox-derived binary.

This repository does not contain a complete browser source tree. A source-level fork must start from a Zen Browser source checkout, because starting directly from Firefox would discard the Zen UI/chrome/side-bar behavior that Drama currently depends on.

## Goals / Non-Goals

**Goals:**

- Establish a reproducible Zen-source-based Drama Browser source workspace.
- Produce a source-built macOS artifact whose product identity is Drama Browser at process, helper, bundle, profile, URL scheme, and chrome-registration layers.
- Preserve Drama surfaces: Start, Graph, PLM, Skill Crew, and Basic Memory.
- Replace post-copy chrome injection with source-registered Drama resources.
- Disable inherited Zen updater behavior until Drama owns signing and update metadata.
- Add verifiers that fail on product-level `Zen` identity in the source-built artifact.
- Keep the wrapper package path as a fallback adapter until source-built parity is proven.

**Non-Goals:**

- Do not rewrite Drama Graph, PLM, Skill Crew, or Basic Memory in XUL.
- Do not remove third-party source attribution for Firefox, Gecko, Zen, MPL, or bundled dependencies.
- Do not claim source-level independence until process/helper/updater/profile verification passes.
- Do not publish auto-updates until signing, notarization, and update metadata are owned by Drama.

## Decisions

### Decision 1: Fork Zen source first, not Firefox source

Use `zen-browser/desktop` as the source baseline and let its build tooling fetch the Firefox/Gecko engine. This preserves Zen-specific browser UI behavior and minimizes product regression.

Alternative considered: fork Firefox directly. Rejected because Drama would lose the Zen/Gecko adapter behavior and would need to rebuild sidebars, chrome hooks, compact UI, and panel affordances from scratch.

### Decision 2: Create a separate source workspace

Use a separate workspace, proposed as `/Users/gengrf/drama-browser-source`, for source checkout and browser builds. Keep `/Users/gengrf/drama-browser` as the Drama app/runtime and OpenSpec planning repo until a mono-repo decision is explicit.

Alternative considered: vendor the source tree inside this repo. Rejected because Firefox/Zen source volume, generated build files, and dependency cache would pollute the app-layer repo and make PR review unmanageable.

### Decision 3: Treat updater ownership as a blocking product boundary

Disable inherited Zen update behavior in the first source-built Drama artifact. Re-enable update only after Drama owns the update channel, signing identity, metadata endpoint, and rollback policy.

Alternative considered: keep Zen updater temporarily. Rejected because it can replace a Drama-branded artifact with a Zen build and destroys product ownership.

### Decision 4: Move Drama chrome integration to build-time registration

Replace post-copy installation of `gecko-drama-chrome` with source-registered resources through the browser build/chrome registry mechanism. The source-built app should know about Drama resources at build time.

Alternative considered: keep package-script injection forever. Rejected because it is brittle against upstream layout changes and cannot prove full source-level ownership.

### Decision 5: Verify by observable identity, not search-and-replace volume

The acceptance gate should inspect the built artifact and running process tree: app bundle id, executable names, helper bundle ids, helper process names, updater, profile path, URL schemes, LaunchServices metadata, and chrome resource ownership. Textual references to Zen are allowed only when they are source attribution, adapter compatibility, or migration docs.

Alternative considered: fail every `Zen` string in source. Rejected because upstream source attribution and compatibility code can be legitimate.

## Risks / Trade-offs

- Firefox/Zen build bootstrap is heavy and may fail on local toolchain prerequisites -> capture blocker logs and separate "source workspace ready" from "full artifact built".
- Source build may be slower than official Zen if PGO/LTO/release flags are wrong -> preserve upstream release profile first, then optimize.
- Helper renames can break macOS sandboxing or code signing -> rename helpers and entitlements together and run codesign validation after every helper change.
- Updater changes can brick installs if partially configured -> disable updater before custom update ownership exists.
- Chrome registry migration can break first viewport -> keep wrapper artifact as fallback until source-built screenshots pass.
- Upstream Zen security updates become a maintenance obligation -> document rebase cadence and treat source fork as a product commitment.

## Migration Plan

1. Source workspace bootstrap:
   - clone/fork Zen Browser desktop source;
   - run source bootstrap/download commands;
   - record exact upstream commit, build tool versions, and local prerequisites.
2. Baseline build:
   - build an unmodified Zen-derived baseline from source;
   - capture process/helper/profile/update evidence before branding changes.
3. Minimal Drama branding fork:
   - add Drama branding assets and product config;
   - change app display name, bundle id, profile/vendor metadata, and URL scheme;
   - disable inherited updater.
4. Executable/helper identity:
   - rename main executable and helper app bundles;
   - update entitlements, bundle ids, launcher paths, and process verification.
5. Drama chrome registration:
   - register Drama resources at source/build time;
   - route Start, Graph, PLM, Skill Crew, and Basic Memory through source-built chrome.
6. Verification and parity:
   - run identity scan, no-original-Zen-wakeup check, and surface screenshots;
   - compare launch and runtime budgets against wrapper baseline.
7. Migration:
   - keep wrapper package as fallback;
   - migrate profile/preferences only through explicit compatibility code.

Rollback strategy:

- If source bootstrap fails, leave wrapper release path untouched and record blocker logs.
- If source-built Drama fails parity, do not replace wrapper launchers.
- If signing/updater is incomplete, ship only unsigned/internal builds and keep updater disabled.

## Open Questions

- Which source workspace path should be canonical: `/Users/gengrf/drama-browser-source`, `/Users/gengrf/zen-drama-source`, or a GitHub fork checkout path?
- Should the final product bundle id remain `app.drama-browser.local` for local builds or move to a signed distribution id before public release?
- Should the first source-built artifact be unsigned/internal only, or should signing/notarization be part of the first acceptance gate?
- How often should the Drama source fork rebase on upstream Zen/Firefox security updates?

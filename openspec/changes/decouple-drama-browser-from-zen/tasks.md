## 1. Product Surface Contract

- [x] 1.1 Add canonical `product-drama-browser` classification in `packages/drama-host/src/surface.ts`
- [x] 1.2 Keep `product-zen-panel` as a deprecated compatibility alias with tests proving old evidence still parses
- [x] 1.3 Replace `isZenDramaProductPath()` with a Drama-owned matcher and keep the old export as a deprecated wrapper
- [x] 1.4 Update `packages/drama-host` tests for packaged product, localhost, browser fallback, and legacy Electron classifications
- [x] 1.5 Update public README/API wording so Zen/Gecko is described as an adapter path, not the product identity

## 2. Shell Host Adapter Migration

- [x] 2.1 Move `host=zen` handling behind `host-adapter.ts` and add a canonical Drama Browser host marker for packaged product routes
- [x] 2.2 Replace React shell branches that check `product-zen-panel` with canonical Drama-owned classifications
- [x] 2.3 Replace user-visible status labels such as `Zen panel` with Drama Browser product labels plus explicit adapter details when useful
- [x] 2.4 Keep `host=zen` as a legacy query alias so existing chrome-resource URLs keep loading
- [x] 2.5 Verify browser-shell typecheck/build after the adapter migration

## 3. Start Surface and Skin Identity

- [x] 3.1 Rename `ZenStartSurface` to a Drama Browser or neutral Start component without changing route behavior
- [x] 3.2 Rename `zen-start-*` DOM classes, ids, and aria labels to Drama-owned or neutral names
- [x] 3.3 Preserve existing `surface=start` compatibility and add a regression check for a nonblank first viewport
- [x] 3.4 Rename or alias `zen-follow` to a host-follow skin concept while keeping existing saved skin preferences compatible
- [x] 3.5 Capture desktop and narrow screenshots for the Start surface after the rename

## 4. PLM Consumer and Evidence Migration

- [x] 4.1 Replace PLM-local `product-zen-panel` unions with the shared Drama-owned surface classification
- [x] 4.2 Update PLM integration contract cards, readiness labels, fixture tags, and production prompts to say Drama Browser product path plus Zen/Gecko adapter where appropriate
- [x] 4.3 Preserve historical fixture IDs or provide a migration alias so old runtime data remains readable
- [x] 4.4 Verify PLM still reports runtime, sidecar, AI, workspace, and parity states after classification migration

## 5. Preference Namespace Migration

- [x] 5.1 Add `drama.browser.*` prefs to the chrome manager with read-first priority over `zen.drama.*`
- [x] 5.2 Keep `zen.drama.*` read fallback for existing local profiles
- [x] 5.3 Update `launch-drama-browser-mac.sh` to write canonical prefs and temporary legacy compatibility prefs
- [x] 5.4 Update verification output to record whether canonical or legacy prefs were used
- [x] 5.5 Add a targeted test or script check for canonical-only and legacy-only pref scenarios

## 6. Chrome Manager Adapter Boundary

- [x] 6.1 Rename chrome manager concepts from `ZenDramaManager` toward `DramaBrowserChromeManager` while preserving package registration
- [x] 6.2 Move or alias `zen-drama-chrome` toward a Gecko adapter directory name without breaking package script inputs
- [x] 6.3 Replace log prefixes, globals, and command names that imply Zen is the product owner
- [x] 6.4 Keep Zen/Gecko DOM, `gBrowser`, `Services`, and `ZenCommonUtils` dependencies isolated behind the adapter boundary
- [x] 6.5 Verify packaged launch still opens Start, Graph, PLM, Skill Crew, and Basic Memory after manager rename

## 7. macOS Packaging and Launch Isolation

- [x] 7.1 Make `launch-drama-browser-mac.sh` the canonical packaged launcher and keep old Zen-named launchers marked as compatibility or development-only
- [x] 7.2 Remove or guard launch paths that fallback to `/Applications/Zen Browser.app` or `open -a "Zen Browser"` from product verification flows
- [x] 7.3 Make `Start-Drama-Browser.command` resolve its packaged scripts relative to the package directory instead of requiring the source checkout
- [x] 7.4 Update package metadata checks for bundle id, display name, icon, URL handler, app path, process path, and profile path
- [x] 7.5 Define the URL handler contract for `drama://` and decide whether `drama-graph://` and `drama-plm://` are system schemes or internal routes
- [x] 7.6 Record inherited executable/helper/updater identities as source-fork gaps instead of package-level failures

## 8. Drama-First Verification

- [x] 8.1 Add or rename a verifier that reports canonical Drama Browser package identity instead of `product-zen-panel`
- [x] 8.2 Verification MUST fail if original `/Applications/Zen Browser.app` is awakened during packaged Drama Browser launch
- [x] 8.3 Verification MUST distinguish product package, Zen/Gecko adapter, dev localhost, browser fallback, and legacy Electron surfaces
- [x] 8.4 Verification MUST include screenshot or equivalent visual evidence for Start, PLM, and at least one failure state
- [x] 8.5 Update PR/release wording so package-level decoupling is not described as a full source-level fork

## 9. Source-Fork Boundary Document

- [x] 9.1 Document remaining source-level fork work: executable, helper bundle ids, updater, signing, notarization, profile/vendor metadata, chrome registry, and build-system product names
- [x] 9.2 Estimate source-fork work separately from package-wrapper work
- [x] 9.3 Create a follow-up OpenSpec change only if the product decision is to fork the Zen/Firefox source tree rather than keep a branded Gecko adapter package

## 10. Final Validation

- [x] 10.1 Run OpenSpec validation for this change
- [x] 10.2 Run browser shell typecheck/build after implementation tasks
- [x] 10.3 Run package build and packaged launcher verification
- [x] 10.4 Run no-original-Zen-wakeup process check
- [x] 10.5 Update the PR with the completed phase, remaining source-fork gaps, and verification evidence

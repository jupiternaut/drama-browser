## Context

Drama Browser is currently packaged from a Zen-derived macOS app and loads Drama surfaces through a Gecko chrome resource path. The latest launcher work already removed the most visible launch bug: the packaged Drama Browser launch path no longer falls back to `/Applications/Zen Browser.app` and no longer performs a second URL open through LaunchServices.

The remaining coupling is layered:

1. Public host/surface contract still exposes `product-zen-panel` and `isZenDramaProductPath()`.
2. React shell still treats Zen as the default embedded host through `host=zen`, `ZenStartSurface`, `zen-follow`, `.zen-host`, and Zen-specific status labels.
3. PLM integration evidence duplicates the `product-zen-panel` vocabulary in its own types, fixtures, prompts, and contract cards.
4. Gecko chrome injection is implemented by `zen-drama-chrome/ZenDramaManager.mjs` and uses `zen.drama.*` prefs plus `ZenDrama` globals/log labels.
5. The macOS bundle is renamed to Drama Browser, but the underlying executable, helpers, engine path, and upstream metadata are still Zen/Firefox-derived.

The desired architecture is not "delete Zen support." Zen/Gecko should remain a supported host adapter, while Drama Browser becomes the product identity and verification target.

## Goals / Non-Goals

**Goals:**

- Make Drama Browser the first-class product identity for packaged launches, public classifications, UI status, and verification reports.
- Keep Zen/Gecko as an explicit adapter path that can still provide browser chrome, token variables, commands, and panel lifecycle.
- Introduce backward-compatible aliases so old `host=zen`, `product-zen-panel`, and `zen.drama.*` inputs keep working during migration.
- Split work into phases that can be delegated safely to subagents with minimal file conflicts.
- Define a clear boundary between short-term package decoupling and source-level browser-engine rebranding.

**Non-Goals:**

- Rebuild or fork the Zen/Firefox engine in this change.
- Remove the Zen/Gecko adapter before Drama Browser has equivalent chrome integration.
- Rename every helper executable, updater, signing identity, or upstream build-system product name in the first implementation slice.
- Rewrite Graph, PLM, or Skill Crew UI in XUL.
- Change the user-facing primary app navigation away from Drama-owned surfaces.

## Decisions

### Decision 1: Introduce a host-neutral product surface contract first

`@drama/host` should expose Drama Browser product classifications before React, PLM, and verification consumers are renamed.

Target vocabulary:

- `product-drama-browser`: packaged Drama Browser product path.
- `adapter-zen-gecko`: Zen/Gecko-hosted adapter path when that distinction is useful.
- `dev-localhost`: local development route.
- `browser-fallback`: Brave/Chrome/other browser compatibility route.
- `legacy-electron`: old Electron shell route.

Compatibility:

- Keep `product-zen-panel` as a deprecated alias until all consumers migrate.
- Keep `isZenDramaProductPath()` as a deprecated wrapper over a new Drama-owned matcher.
- New code should call a host-neutral classifier and should not branch on Zen product naming.

Alternative considered: rename every consumer first. Rejected because PLM, shell, and verification would temporarily disagree on classification names.

### Decision 2: Treat Zen as a host adapter, not the product default

`apps/drama-browser-shell/src/host-adapter.ts` should become the single place that maps host identity to:

- route params;
- `data-host`;
- default skin;
- host badge label;
- native host API implementation;
- host theme token ingestion.

The React shell should render based on adapter capability, not on hardcoded `zenHost` branches. `host=zen` can remain as a legacy query alias, but packaged Drama Browser should be able to produce `host=drama` or an equivalent Drama-owned product marker.

Alternative considered: keep `host=zen` because the engine is still Zen-derived. Rejected because user-visible and verification-facing identity would remain coupled to Zen even when the package is Drama Browser.

### Decision 3: Rename user-facing Start surface independently from engine work

The Start page should be implemented as a Drama Browser start surface, even if the design remains visually inspired by Brave/Cape and the adapter still runs in Gecko.

Migration shape:

- Rename `ZenStartSurface` to a Drama-owned component name.
- Rename DOM classes/ids/aria from `zen-start-*` to a product-neutral or Drama-owned prefix.
- Keep a route alias for existing `surface=start`.
- Decide separately whether the visible label should be `Zen Start`, `Drama Start`, or `Start`; the implementation should not require Zen naming.

Alternative considered: postpone Start rename until full engine fork. Rejected because it is a React/CSS product identity issue, not an engine-source issue.

### Decision 4: Migrate prefs with read fallback, not a breaking switch

The chrome manager and launchers should move from `zen.drama.*` to `drama.browser.*`.

Migration policy:

- Read `drama.browser.*` first.
- Fall back to `zen.drama.*` for existing local profiles.
- During one transition slice, launchers may write both namespaces.
- Verification should record which namespace was used.

Alternative considered: write only new prefs immediately. Rejected because local profiles and verifier scripts may still carry old prefs.

### Decision 5: Rename chrome manager concepts before source-level engine rebrand

The current file path and symbols can be moved toward:

- `gecko-drama-chrome/DramaBrowserChromeManager.mjs`
- `window.gDramaBrowserChromeManager`
- neutral log prefix such as `[DramaBrowserChrome]`

The implementation may still inject through Zen/Gecko chrome files in the package script. That is acceptable if the code names and prefs no longer claim Zen as the product.

Alternative considered: wait for a full fork before renaming chrome manager. Rejected because the manager is already Drama-specific glue and can be made product-neutral without changing the browser engine.

### Decision 6: Separate package identity cleanup from engine-source fork

Short-term package work can verify:

- bundle id is `app.drama-browser.local`;
- app display name is `Drama Browser`;
- packaged app process path points at `Drama Browser.app`;
- original `/Applications/Zen Browser.app` is not launched;
- URL handler and default-browser surfaces do not steal product launch validation.

Source-level fork work remains a later track:

- executable name;
- helper app names;
- update channel;
- signing identities;
- browser profile/vendor metadata;
- upstream build-system product metadata.

Alternative considered: block all decoupling on source-level fork. Rejected because launch isolation, product classification, and UI identity can be made correct first and are useful immediately.

## Risks / Trade-offs

- Public API rename risk -> keep deprecated aliases and migrate consumers in order.
- Verification drift risk -> update verifiers in the same phase as classifier changes and record both canonical and legacy classifications during transition.
- Local profile breakage risk -> read old prefs as fallback and write both namespaces temporarily.
- CSS/visual regression risk -> rename Start surface classes in a small slice with screenshots after build.
- Over-claiming independence risk -> keep engine-source fork explicitly out of scope until executable/helper/update/signing are actually rebuilt.
- Subagent merge conflict risk -> assign disjoint write sets: host contract, shell adapter/start CSS, PLM consumer, chrome manager/prefs, packaging/verifier.

## Migration Plan

1. Contract phase: add Drama-owned surface classifications and compatibility aliases in `packages/drama-host`.
2. Consumer phase: migrate React shell and PLM consumers to canonical Drama-owned classifications.
3. UI identity phase: rename Start surface implementation and host-follow skin vocabulary while preserving visual behavior.
4. Pref/chrome phase: add `drama.browser.*` prefs and rename chrome manager concepts with fallback to existing prefs.
5. Package verification phase: update launch/package/verify scripts to assert Drama Browser identity and no original Zen wakeup.
6. Source-fork planning phase: document remaining engine-level rename work as a separate change after package-level decoupling passes.

Rollback strategy:

- Keep old query params, prefs, and classification aliases until verification shows all current entrypoints use the canonical names.
- If a phase regresses launch, revert only that phase because contract aliases keep older callers working.

## Open Questions

- Should the visible Start tab label become `Drama Start`, `Start`, or keep `Zen Start` temporarily while internals are renamed?
- Should packaged Drama Browser emit `host=drama`, `host=gecko`, or no host query param for the canonical product path?
- Should `product-zen-panel` remain indefinitely for archived verification reports, or be removed after one migration window?
- Is the long-term target a full Zen/Firefox source fork, or a branded Gecko adapter package with clearly documented inherited internals?

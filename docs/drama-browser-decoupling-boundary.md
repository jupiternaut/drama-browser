# Drama Browser Decoupling Boundary

## Current Product Target

Drama Browser now has two maintained paths:

- `wrapper adapter`: the existing wrapper path remains available as a fallback and transition launcher.
- `source-built internal`: the accepted internal product is built from `/Users/gengrf/zen-browser-desktop` and passes source-level identity, helper, updater-disabled, profile, chrome, UI/runtime, performance, and no-original-Zen-wakeup gates.

The final accepted internal artifact is:

- Packed app: `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app`
- Executable: `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app/Contents/MacOS/drama-browser`
- DMG: `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser-1.21.2b.en-US.mac.dmg`
- Final evidence: `/Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-12-final-acceptance.json`

## URL Handler Contract

Canonical public deep link:

- `drama://` is the only planned system-level Drama Browser URL scheme.

Internal route concepts:

- `drama-graph://` and `drama-plm://` are not product-level system schemes in the current package-wrapper phase.
- Graph, PLM, Crew, Start, and Basic Memory route selection should use the internal `surface` parameter or app commands.
- If dedicated graph/plm schemes are needed later, they should be introduced by a separate OpenSpec change with macOS LaunchServices, Windows registry, and security validation.

Inherited browser schemes:

- `http`, `https`, and `file` may still appear in the Zen/Gecko-derived bundle metadata.
- They are inherited engine behavior and do not count as Drama Browser product deep-link design.

## Accepted Source-Built Internal Boundary

The source-built internal product is accepted when:

- the launched bundle is `Drama Browser.app`;
- the bundle id is `app.drama-browser.local`;
- the executable is `drama-browser`;
- helper app names and bundle ids are Drama-owned;
- product verification reports no original Zen wakeup;
- the embedded app uses `host=drama` as the canonical product marker;
- legacy `host=zen`, `product-zen-panel`, and `zen.drama.*` inputs are compatibility aliases only;
- Drama chrome resources are registered into the source-built browser package, not post-copied into a completed Zen bundle.

Passing evidence:

- Product verifier: `/Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-09-source-product.json`
- Packed Start verifier: `/Users/gengrf/drama-browser/docs/verification/drama-source-built-packed-start-current.json`
- UI/runtime parity: `/Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-10-source-built-ui-runtime-parity.json`
- Performance gate: `/Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-11-source-built-performance.json`
- OpenSpec validation: `/Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-12-openspec-validate.json`

## Public Distributable Remaining Work

The internal source-built artifact is not yet a public release. Public distribution still requires:

- Developer ID signing and notarization;
- a Drama-owned update endpoint, metadata format, signing keys, channel names, and rollback policy;
- replacing the intentionally disabled updater path with a verified Drama updater;
- release QA on a clean macOS user account after LaunchServices registration;
- a published provenance note for inherited Firefox/Gecko/Mozilla source attribution.

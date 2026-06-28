# Drama Browser Decoupling Boundary

## Current Product Target

Drama Browser is currently a product wrapper backed by a Zen/Gecko adapter.

Package-level decoupling is complete only when:

- the launched bundle is `Drama Browser.app`;
- the bundle id is `app.drama-browser.local`;
- product verification reports `product-drama-browser`;
- the embedded app uses `host=drama` as the canonical product marker;
- legacy `host=zen`, `product-zen-panel`, and `zen.drama.*` inputs are compatibility aliases only;
- package launch does not wake `/Applications/Zen Browser.app`.

This is not the same as a source-level Zen/Firefox fork.

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

## Source-Level Fork Remaining Work

The following require a real Zen/Firefox source-level fork or equivalent build-system productization:

- executable name, currently allowed to remain `zen` in the wrapper phase;
- helper app names and helper bundle ids;
- updater executable, update channel, and update metadata;
- signing identity, entitlements, notarization, and permission prompts;
- profile/vendor metadata and default app prompts;
- browser chrome registration through jar manifests or build files instead of post-copy injection;
- removal or formal encapsulation of Zen DOM ids, Zen sidebar APIs, and `ZenCommonUtils`;
- product icon and inherited Firefox/Zen metadata cleanup.

## Follow-Up Decision

Do not create the source-fork OpenSpec change until the product decision is explicit:

- keep a branded Drama Browser wrapper with a Zen/Gecko adapter; or
- fork the Zen/Firefox source tree and own the full browser product identity.

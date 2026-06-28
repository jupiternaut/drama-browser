## Why

Drama Browser has reached package-wrapper decoupling, but the underlying executable, helper apps, updater, profile/vendor metadata, and browser build system still inherit Zen/Firefox identity. Full product ownership requires a source-level fork so macOS, process, updater, and browser-chrome evidence all identify as Drama Browser rather than a Zen-wrapped product.

## What Changes

- Create a source-level Drama Browser productization track based on the Zen Browser source tree, not the current wrapper-only repository.
- Add a reproducible source workspace/bootstrap contract for fetching Zen/Firefox engine sources and building a first Drama Browser macOS artifact.
- Replace inherited Zen product identity at build time: executable name, helper app names, bundle ids, display names, icons, profile/vendor metadata, URL schemes, and default-browser prompts.
- Move Drama chrome integration from post-copy package injection toward source-registered chrome/resources.
- Disable or re-own inherited updater behavior until Drama Browser has its own signing, update channel, and release metadata.
- Add verification gates that prove no `zen` product process, helper, updater, profile, or package metadata remains in the source-built Drama Browser artifact except documented third-party source attribution.
- Keep the existing Zen/Gecko wrapper path as a transitional adapter until the source-built product passes parity.
- **BREAKING** for the final source-built product: old `zen.drama.*`, `product-zen-panel`, and Zen-named launch commands cannot remain canonical product interfaces after migration; they may exist only as migration aliases or adapter compatibility.

## Capabilities

### New Capabilities

- `drama-browser-source-product`: source checkout, build-system branding, executable/helper identity, updater ownership, profile/vendor metadata, source-registered chrome, signing/notarization boundary, migration, and full decoupling verification.

### Modified Capabilities

- `zen-native-concurrency-performance`: distinguish wrapper/adapter performance evidence from source-built Drama Browser performance evidence.
- `zen-native-uiux-quality`: require source-built Drama Browser UI to expose Drama-owned browser chrome and prevent Zen product identity from appearing as the primary host.

## Impact

- Affected systems:
  - new source workspace, proposed at `/Users/gengrf/drama-browser-source` or another explicit source checkout outside this wrapper repo;
  - Zen Browser desktop source bootstrap and `engine` / Firefox build artifacts;
  - macOS bundle metadata, helper bundles, codesigning, entitlements, notarization, updater, profile paths, URL schemes, and LaunchServices registration;
  - Drama chrome/resource integration currently staged from `gecko-drama-chrome`;
  - existing package scripts and verifiers in this repo, which become transitional adapter tooling.
- Verification:
  - OpenSpec strict validation;
  - successful source bootstrap/build or an explicit blocker log;
  - package/process/helper/updater/profile metadata scan;
  - no original Zen app wakeup;
  - no source-built product process/helper names containing Zen;
  - Start, Graph, PLM, Skill Crew, and Basic Memory parity screenshots from the source-built app.

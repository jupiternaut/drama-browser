## Why

Drama Browser now launches from a renamed Zen-derived app bundle, but several layers still expose Zen as the product owner. This makes verification ambiguous: "opens in the packaged app" is not the same as "Drama Browser is decoupled from Zen identity, launch behavior, host classification, preferences, and chrome injection."

## What Changes

- Define Drama Browser as the first-class product identity for packaged macOS launches.
- Keep Zen/Gecko as an adapter implementation detail instead of the product contract.
- Replace product classification such as `product-zen-panel` with Drama-owned classifications while preserving compatibility aliases during migration.
- Migrate preference/config namespace from `zen.drama.*` to `drama.browser.*` with backward-compatible reads during transition.
- Split host-specific code into explicit adapters so React surfaces, route params, token bridges, and status labels do not hardcode Zen as the default product.
- Reframe macOS packaging verification around "does not wake original Zen" and "identifies as Drama Browser" before attempting deeper engine-source rebranding.
- Stage the deepest engine fork work separately, because executable/helper/update-channel/signing renames require source-level Zen/Firefox build-system work.

## Capabilities

### New Capabilities

- `drama-browser-product-identity`: product identity, launch isolation, host adapter boundaries, preference namespace migration, macOS package identity, and decoupling verification.

### Modified Capabilities

- `zen-native-uiux-quality`: clarify that Zen-native UI/UX gates validate the Zen/Gecko adapter path and do not by themselves satisfy Drama Browser product identity.
- `zen-native-concurrency-performance`: clarify that runtime launch budgets remain valid, but product launch verification must distinguish Drama Browser package launch from original Zen Browser launch.

## Impact

- Primary implementation areas:
  - `apps/drama-browser-shell`
  - `packages/drama-host`
  - `packages/drama-plm-ui`
  - `scripts/package-zen-drama-mac.sh`
  - `scripts/launch-drama-browser-mac.sh`
  - `scripts/verify-zen-drama-mac.sh`
  - `zen-drama-chrome/ZenDramaManager.mjs`
- Product/runtime behavior:
  - Drama Browser must not fallback to `/Applications/Zen Browser.app`.
  - Launch scripts must open the packaged Drama Browser bundle by path.
  - Compatibility URLs and old prefs may continue to work during migration.
- Verification:
  - OpenSpec strict validation.
  - Browser shell typecheck/build.
  - Package verification that records bundle id, active process path, surface classification, prefs namespace, and whether original Zen was awakened.
- Non-goals for this change:
  - Rebuilding the full browser engine from source.
  - Renaming every Firefox/Zen helper executable in the first implementation slice.
  - Removing the Zen/Gecko adapter before an equivalent Drama Browser chrome manager is in place.

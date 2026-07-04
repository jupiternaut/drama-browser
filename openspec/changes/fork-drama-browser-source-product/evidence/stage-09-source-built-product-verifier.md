# Stage 09 - Source-Built Product Verifier

## Scope

Stage 09 consolidates prior source-built gates into one machine-readable verifier. The verifier fails if product-level identity still exposes Zen as the product owner.

## Verification Coverage

`scripts/verify-drama-source-product.ts` checks:

- main app bundle id, display name, bundle name, and executable;
- helper app bundle ids and executable names;
- `drama://` URL scheme and document metadata;
- `application.ini` app/profile/remoting metadata;
- code signature validity;
- disabled updater / absent updater artifacts;
- source-registered Drama chrome packaged in `browser/omni.ja`;
- packaged Chrome manager legacy-pref migration behavior;
- Stage 7 profile evidence and Stage 8 signing evidence;
- short source-built launch process tree;
- no new original `/Applications/Zen Browser.app` wakeup.

## Allowed Attribution

Mozilla/Firefox/Gecko/Zen-derived strings are allowed only in source attribution, compatibility aliases, migration diagnostics, or upstream dependency metadata. They are not allowed in product identity fields.

## Command

```bash
bun run scripts/verify-drama-source-product.ts \
  --source-workspace /Users/gengrf/zen-browser-desktop \
  --app-bundle "/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app" \
  --out openspec/changes/fork-drama-browser-source-product/evidence/stage-09-source-product.json
```

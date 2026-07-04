# Stage 03 - Drama Browser Build-Time Branding

Status: passed

Date: 2026-06-29

## Source Workspace

- Source workspace: `/Users/gengrf/zen-browser-desktop`
- Wrapper/OpenSpec workspace: `/Users/gengrf/drama-browser`
- Source repo branch: `stable`
- Source repo HEAD used by generated `engine/mozconfig`: `eb4cae5bf6e25cbdfe9215c6d4a800fb43274c79`

## Implemented Source-Level Changes

- Updated `/Users/gengrf/zen-browser-desktop/surfer.json`:
  - `name`: `Drama Browser`
  - `vendor`: `Drama Browser Team`
  - `appId`: `local`
  - release brand: `Drama Browser`
  - twilight brand: `Drama Browser Twilight`
  - release metadata repo: `jupiternaut/drama-browser`
  - update hostname seed: `updates.drama-browser.local`
- Updated `/Users/gengrf/zen-browser-desktop/configs/common/mozconfig`:
  - `MOZ_APP_BASENAME="Drama Browser"`
  - distribution id: `app.drama-browser`
  - user app dir: `DramaBrowser`
  - source repo metadata: `https://github.com/jupiternaut/drama-browser`
- Updated `/Users/gengrf/zen-browser-desktop/src/toolkit/moz-configure.patch`:
  - default vendor: `Drama Browser Team`
  - default profile: `drama-browser`
- Updated source patches:
  - `/Users/gengrf/zen-browser-desktop/src/toolkit/moz-configure.patch`
  - `/Users/gengrf/zen-browser-desktop/src/build/moz-build.patch`
  - `/Users/gengrf/zen-browser-desktop/src/browser/app/macbuild/Contents/Info-plist-in.patch`
- Replaced release and twilight source branding icons from Drama Browser app icon assets.

## Verification

Source-only verifier:

```bash
bun run scripts/verify-drama-source-branding.ts \
  --source-workspace /Users/gengrf/zen-browser-desktop \
  --out openspec/changes/fork-drama-browser-source-product/evidence/stage-03-build-time-branding.json
```

Result: `ok: true`

Verifier checks passed:

- source workspace exists
- `surfer.json` product name/vendor/app id are Drama-owned
- release and twilight brands no longer expose Zen product names
- source update host seed is `updates.drama-browser.local`
- `configs/common/mozconfig` sets Drama app basename, distribution id, user app dir, and source repo
- vendor and profile are provided by toolkit configure defaults instead of invalid mozconfig exports
- toolkit defaults no longer fall back to Zen identity
- `application.ini` update host default no longer points at Zen update host
- `drama://` is registered through a source patch, not a post-build plist edit
- release/twilight branding icons exist in source

Generated mozconfig proof:

```text
ac_add_options --with-app-basename="Drama Browser"
export MOZ_APP_BASENAME="Drama Browser"
ac_add_options --with-distribution-id=app.drama-browser
ac_add_options --with-user-appdir=DramaBrowser
export MOZ_SOURCE_REPO=https://github.com/jupiternaut/drama-browser
export MOZ_APPUPDATE_HOST=updates.drama-browser.local
export MOZ_MACBUNDLE_NAME="Drama Browser.app"
```

Patch import:

```bash
PATH="$HOME/.cargo/bin:$PATH" SURFER_NO_BRANDING_PATCH=true npx surfer import
```

Result: passed; `.surfer/patchCount` is `241`, including the new `Info-plist-in.patch`.

## Compatibility Note

Running `npx surfer import` without `SURFER_NO_BRANDING_PATCH=true` currently fails inside `async-icns` on Node 22:

```text
TypeError [ERR_INVALID_ARG_VALUE]: The property 'options.recursive' is no longer supported. Received true
```

This is a Surfer branding importer compatibility issue, not a Drama product configuration failure. As a local workaround for this stage, source branding assets were synchronized into `engine/browser/branding/{release,twilight}` after the source-level icon replacement.

## Boundary to Stage 04

`engine/mozconfig` still contains:

```text
ac_add_options --with-app-name=zen
```

That is expected at the end of Stage 03. Main executable and helper names are Stage 04 acceptance criteria.

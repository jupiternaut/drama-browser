# Stage 02 Baseline Source Build Evidence

Date: 2026-06-28

## Build / Package Command

Source workspace:

`/Users/gengrf/zen-browser-desktop`

Command run:

```sh
PATH="$HOME/.cargo/bin:$PATH" \
SURFER_PLATFORM=darwin \
SURFER_COMPAT=aarch64 \
ZEN_RELEASE=1 \
ZEN_GA_DISABLE_PGO=true \
npm run package
```

Result: command exited successfully and wrote output to `/Users/gengrf/zen-browser-desktop/dist`.

Important packaging warnings/errors observed during the command:

- Firefox latest version warning: frozen `152.0` differs from latest `152.0.3`.
- `packager.py` hit `AttributeError: 'NoneType' object has no attribute 'open'` while reading a plist during `stage-package`.
- `browser/app` packaging hit `cp: ../../dist/Zen.app/Contents/MacOS/updater.app/Contents/MacOS/org.mozilla.updater: No such file or directory`.
- `mach package-multi-locale` reported a non-zero nested make error, but Surfer still finished with `SUCCESS Packaging complected!`.

This makes the artifact usable as a baseline identity artifact, but not a clean release-quality build.

## Baseline Artifact

- DMG: `/Users/gengrf/zen-browser-desktop/dist/zen-1.21.2b.en-US.mac.dmg`
- Package name: `zen-1.21.2b.en-US.mac.dmg`
- DMG format: `UDBZ`
- DMG total bytes: `314085376`
- DMG CRC32: `$D5C42F54`
- Source stamp in `application.ini`: `eb4cae5bf6e25cbdfe9215c6d4a800fb43274c79`

Mounted baseline app for inspection:

`/tmp/zen-baseline-dmg-36119/Zen.app`

## App Identity Before Drama Branding

- App bundle id: `app.zen-browser.zen`
- App bundle name: `Zen`
- Main executable: `zen`
- Icon file: `firefox.icns`
- URL schemes: `http`, `https`, `file`
- Permission prompt strings include `Zen`
- `application.ini`:
  - `Vendor=Mozilla`
  - `Name=Zen`
  - `RemotingName=zen`
  - `Profile=zen`
  - `SourceRepository=https://github.com/zen-browser/desktop`
  - `SourceStamp=eb4cae5bf6e25cbdfe9215c6d4a800fb43274c79`
  - `AppUpdate URL=https://updates.zen-browser.app/updates/browser/%BUILD_TARGET%/%CHANNEL%/update.xml`

## Helper / Updater Identity Before Drama Branding

- GPU helper:
  - App path: `Zen.app/Contents/MacOS/gpu-helper.app`
  - Bundle id: `app.zen-browser.zen-gpu-helper`
  - Executable: `Zen GPU Helper`
- Media plugin helper:
  - App path: `Zen.app/Contents/MacOS/media-plugin-helper.app`
  - Bundle id: `app.zen-browser.zen-media-plugin-helper`
  - Executable: `Zen Media Plugin Helper`
- Plugin container:
  - App path: `Zen.app/Contents/MacOS/plugin-container.app`
  - Bundle id: `app.zen-browser.plugincontainer`
  - Executable: `plugin-container`
- Updater:
  - App path: `Zen.app/Contents/MacOS/updater.app`
  - Bundle id: `org.mozilla.updater`
  - Executable: `org.mozilla.updater`
  - Privileged executable key: `org.mozilla.updater`
  - Authorized client requirement references `app.zen-browser.zen`

## Runtime Process Evidence

Forced-profile headless baseline run:

```sh
"/tmp/zen-baseline-dmg-36119/Zen.app/Contents/MacOS/zen" \
  --headless --no-remote \
  -profile /tmp/drama-stage02-zen-baseline-run-forced-profile/profile \
  about:blank
```

Observed main process:

`/tmp/zen-baseline-dmg-36119/Zen.app/Contents/MacOS/zen --headless --no-remote -profile /tmp/drama-stage02-zen-baseline-run-forced-profile/profile about:blank`

Observed child helper process:

`/tmp/zen-baseline-dmg-36119/Zen.app/Contents/MacOS/plugin-container.app/Contents/MacOS/plugin-container ... -profile /private/tmp/drama-stage02-zen-baseline-run-forced-profile/profile ...`

Forced profile created Zen-named profile files such as:

- `zen-sessions.jsonlz4`
- `zen-keyboard-shortcuts.json`
- `zen-themes.json`

Default-profile run evidence:

When launched without `-profile`, the baseline app selected a Zen-owned profile path:

`/Users/gengrf/Library/Application Support/Zen/Profiles/ym72roow.Default (release)-6`

It also created/used:

`/Users/gengrf/Library/Application Support/Zen`

## Baseline Performance Snapshot

Source-built Zen baseline headless screenshot attempts:

- Attempt 1: `762.9 ms`
- Attempt 2: `757.8 ms`
- Attempt 3: `731.1 ms`
- Mean: `750.6 ms`

Current wrapper PLM product-path comparison from:

`/Users/gengrf/drama-browser/docs/verification/zen-drama-mac-marionette-performance-plm-current.json`

- Classification: `product-zen-panel`
- Marionette duration: `10885 ms`
- Shell document load: `89.6 ms`
- First styled viewport: `179.9 ms`
- Runtime ready: `194.4 ms`
- Sidecar ready: `328.1 ms`
- Route ready: `399.3 ms`
- Max startup blocking: `8.0 ms`

These are not identical metrics: the source baseline is a headless Zen browser screenshot, while the wrapper comparison is a headed Drama PLM panel inside the transitional Zen/Gecko adapter. The comparison is sufficient for Stage 02 baseline recording, but the final Stage 11 gate must use source-built Drama Browser identity first and then measure the same Drama surfaces.

## Acceptance Mapping

- 2.1 complete: source workspace package command produced the Zen-derived macOS artifact in `dist`.
- 2.2 complete: app bundle, executable, helper identities, updater state, URL schemes, and profile identity recorded.
- 2.3 complete: baseline app was launched and process/helper names were captured with a forced temporary profile.
- 2.4 complete: source baseline launch timing was compared with the current wrapper PLM performance evidence.
- 2.5 complete: this dated source-fork verification artifact stores the Stage 02 baseline evidence.

## Stage 03 Inputs

The fields that must be replaced by source/build configuration are now explicit:

- `app.zen-browser.zen`
- `Zen`
- `zen`
- `firefox.icns` as product icon
- `Profile=zen`
- `RemotingName=zen`
- `updates.zen-browser.app`
- `app.zen-browser.zen-gpu-helper`
- `Zen GPU Helper`
- `app.zen-browser.zen-media-plugin-helper`
- `Zen Media Plugin Helper`
- `org.mozilla.updater`


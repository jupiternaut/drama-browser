# Stage 06 Production Build And Packaging

Date: 2026-06-29

## Files Changed

- `package.json`
- `scripts/package-drama-browser-mac.sh`
- `scripts/install-drama-browser-mac.sh`
- `scripts/launch-drama-browser-mac.sh`
- `scripts/legacy-electron-notice.ts`
- `packages/drama-plm-ui/src/PlotPilotNativePage.tsx`
- `packages/drama-plm-ui/tsconfig.json`
- `packages/drama-plm-ui/tsconfig.build.json`

## Production Commands Added

- `drama:browser:build`
- `drama:browser:package:mac`
- `drama:browser:install:mac`
- `drama:browser:launch:mac`
- `drama:browser:verify`

These commands build and package the source-built Gecko Drama Browser path and do not call `electron-builder`.

## Legacy Marking

Legacy Electron commands now print:

```text
[legacy] Electron is no longer a production Drama Browser host. Use drama:browser:* for production builds.
```

This applies to:

- `electron:build`
- `electron:start`
- `electron:dev`
- `electron:dist*`

## Build Fix

`packages/drama-plm-ui` no longer imports `../../drama-host/src/surface.ts` directly. It imports public `@drama/host` types, and its build config resolves `@drama/host` through built package types.

## Verification

Commands:

```bash
bun run drama:browser:build
bun run drama:browser:package:mac -- --skip-build
```

Results:

- Drama boundary check passed.
- Drama packages built.
- Browser shell typecheck passed.
- Browser shell production build passed.
- Drama Runtime typecheck passed.
- source chrome verifier passed.
- macOS package created at `/Users/gengrf/drama-browser/dist/drama-browser-mac/Drama Browser.app`.
- DMG created at `/Users/gengrf/drama-browser/dist/drama-browser-mac/Drama Browser.dmg`.

Packaged app verification:

- `CFBundleIdentifier`: `app.drama-browser.local`
- `CFBundleExecutable`: `drama-browser`
- `Electron Framework.framework`: absent
- top-level Frameworks: `ChannelPrefs.framework`
- DMG format: `UDZO`

## Updater Boundary

The new `drama:browser:*` production commands do not use Electron updater or Electron release manifests. Drama-owned updater infrastructure remains disabled/not implemented.


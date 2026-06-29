# remove-electron-host Final Handoff

Generated: 2026-06-29

## Accepted Production Path

- Production app: `/Applications/Drama Browser.app`
- Bundle id: `app.drama-browser.local`
- Executable: `drama-browser`
- Source-built app input: `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app`
- Packaged app: `/Users/gengrf/drama-browser/dist/drama-browser-mac/Drama Browser.app`
- Packaged DMG: `/Users/gengrf/drama-browser/dist/drama-browser-mac/Drama Browser.dmg`
- URL scheme: `drama://` resolves to `/Applications/Drama Browser.app`

## Production Commands

- Build: `bun run drama:browser:build`
- Package macOS: `bun run drama:browser:package:mac -- --skip-build`
- Install macOS: `bun run drama:browser:install:mac`
- Verify source chrome and no Electron bundle: `bun run drama:browser:verify`
- Verify installed app and process tree: `bun run scripts/verify-no-production-electron.ts -- --app "/Applications/Drama Browser.app" --legacy-app "/Applications/Drama.app" --check-processes`

## Legacy Electron Boundary

- Legacy app remains installed at `/Applications/Drama.app`.
- Legacy app bundle id is `com.jupiternaut.drama`.
- Legacy app contains `Electron Framework.framework` and is rejected by the production verifier.
- Legacy source remains under `apps/electron` and `scripts/legacy/electron`.
- Electron launch/package scripts print the legacy warning before running.
- Root production dependency sections no longer include `electron`, `electron-builder`, `@electron/packager`, `@sentry/electron`, `electron-updater`, or `electron-winstaller`.

## Evidence

- Electron production gate: `stage-07-no-electron-production.json`
- Runtime unavailable recovery: `stage-08-runtime-unavailable-current.json`
- Source-built UI/runtime parity: `stage-12-source-built-ui-runtime-parity.json`
- Runtime singleton: `stage-09-runtime-singleton.json`
- Performance gate: `stage-09-source-built-performance-plm-accepted.json`
- Runtime workflow smoke: `stage-10-runtime-workflow-smoke.json`
- Cross-platform path smoke: `stage-10-cross-platform-paths.json`
- Installed app identity: `stage-11-installed-app-identity.txt`
- Spotlight/LaunchServices: `stage-11-spotlight-launchservices.txt`
- `drama://` target and real open: `stage-11-drama-url-scheme-target.txt`, `stage-11-drama-url-open-process.txt`
- Legacy app rejection: `stage-11-legacy-drama-rejected.json`
- Installed production no-Electron verifier: `stage-12-no-electron-installed-process.json`
- OpenSpec strict validation: passed with `openspec validate remove-electron-host --strict --json`

## Known Non-Electron Blockers

- Updater remains disabled until Drama-owned update infrastructure, signing metadata, rollback policy, and channel hosting exist.
- Public distribution still needs release signing and notarization hardening beyond the local ad-hoc/internal build.
- PLM route-switch performance passed the accepted 20s evidence gate; the stricter 500ms exploratory gate failed and remains performance debt.
- Windows packaging still needs a separate Windows source-built package gate on an actual Windows machine.

## Rollback

- Keep using the production app with `/Applications/Drama Browser.app`.
- If source-built production breaks, legacy Electron can still be launched through explicit legacy scripts such as `bun run electron:dev`; those scripts are intentionally outside production validation.
- Do not use `/Applications/Drama.app` as production while it contains `Electron Framework.framework`.

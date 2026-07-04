# Stage 05 - Updater and Release Channel Ownership

Status: passed with re-enable blockers

Date: 2026-06-29

## Source Workspace

- Source workspace: `/Users/gengrf/zen-browser-desktop`
- Current source-built app: `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app`
- Current DMG: `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser-1.21.2b.en-US.mac.dmg`

## Implementation

Updater is disabled at compile/configure time for the first source-built Drama Browser artifact:

```text
configs/common/mozconfig:
ac_add_options --disable-updater

engine/mozconfig:
ac_add_options --disable-updater
```

The app `Info.plist` source patch now also removes the inherited privileged updater declaration:

```text
browser/app/macbuild/Contents/Info.plist.in
SMPrivilegedExecutables / org.mozilla.updater removed
```

Patch export:

```bash
PATH="$HOME/.cargo/bin:$PATH" \
npx surfer export browser/app/macbuild/Contents/Info.plist.in
```

Result: `src/browser/app/macbuild/Contents/Info-plist-in.patch` contains both `drama://` registration and removal of the inherited updater privilege declaration.

Configure command:

```bash
PATH="$HOME/.cargo/bin:$PATH" \
SURFER_PLATFORM=darwin \
SURFER_COMPAT=aarch64 \
ZEN_RELEASE=1 \
ZEN_GA_DISABLE_PGO=true \
./mach configure
```

Configure proof:

```text
Adding configure options from /Users/gengrf/zen-browser-desktop/engine/mozconfig
--disable-updater
```

Package command:

```bash
PATH="$HOME/.cargo/bin:$PATH" \
SURFER_PLATFORM=darwin \
SURFER_COMPAT=aarch64 \
ZEN_RELEASE=1 \
ZEN_GA_DISABLE_PGO=true \
npm run package
```

Result: passed.

## Verification

Verifier:

```bash
node scripts/verify-drama-source-updater.ts \
  --source-workspace /Users/gengrf/zen-browser-desktop \
  --out openspec/changes/fork-drama-browser-source-product/evidence/stage-05-updater-ownership.json
```

Result: `ok: true`

Passed checks:

- source and engine mozconfigs disable updater
- configured objdir does not enable `MOZ_UPDATER`
- app bundle contains no updater files or updater directories
- app `Info.plist` contains no `SMPrivilegedExecutables` or `org.mozilla.updater`
- app bundle contains no Zen update identity strings

Manual bundle scan:

```bash
find "/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app/Contents" \
  -maxdepth 8 \
  \( -iname '*updater*' -o -name 'org.mozilla.updater' \) \
  -print
```

Result: no output.

Text scan:

```bash
rg -n \
  'SMPrivilegedExecutables|org\.mozilla\.updater|app\.zen-browser|zen-browser|Zen Browser|github\.com/zen-browser|updates\.zen' \
  "/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app/Contents" \
  --hidden \
  --glob '*.plist' --glob '*.ini' --glob '*.js' --glob '*.json' --glob '*.properties' --glob '*.strings' --glob '*.xml'
```

Result: no output.

## Re-enable Blockers

Updater re-enablement is still blocked. These are not shipped inside the app bundle, but they must be resolved before a public distributable updater exists:

- `/Users/gengrf/zen-browser-desktop/dist/output.mar` is still generated as a package side effect.
- `/Users/gengrf/zen-browser-desktop/dist/drama-browser-1.21.2b.en-US.mac.update_framework_artifacts.zip` is still generated as a package side effect.
- `MOZ_UPDATE_CHANNEL` and MAR channel ids still say `release` in `config.status`.
- A future Drama updater must define Drama-owned signing identity, metadata endpoint, verification keys, channel names, and rollback policy before updater is re-enabled.

## Acceptance Boundary

This stage accepts the internal source-built artifact because the shipped app cannot run updater checks or elevate `org.mozilla.updater`, and it has no Zen update identity in the app bundle.

It does not claim that Drama Browser has a finished public updater. That remains intentionally blocked until a Drama-owned update system is designed and signed.

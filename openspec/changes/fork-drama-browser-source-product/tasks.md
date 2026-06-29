## 1. Source Workspace Bootstrap

- [x] 1.1 Choose and record the canonical source workspace path for the Drama Browser source fork
- [x] 1.2 Fork or clone the Zen Browser desktop source into the source workspace
- [x] 1.3 Record upstream repository URL, branch, commit hash, and local toolchain versions
- [x] 1.4 Run the Zen source bootstrap/download workflow that materializes the Firefox/Gecko engine source
- [x] 1.5 Verify the source workspace contains browser build entrypoints such as `mach`, `moz.configure`, or an equivalent Zen engine build path
- [x] 1.6 If bootstrap fails, write a blocker log with exact failing command, environment, and next action

## 2. Baseline Source Build Evidence

- [x] 2.1 Build an unmodified Zen-derived macOS artifact from the source workspace
- [x] 2.2 Record baseline app bundle path, executable path, helper app names, helper bundle ids, updater state, URL schemes, and profile path
- [x] 2.3 Run the baseline app enough to capture process tree and helper process names
- [x] 2.4 Compare baseline source-built launch performance against the current wrapper package launch
- [x] 2.5 Store baseline evidence in a dated source-fork verification artifact

## 3. Drama Browser Build-Time Branding

- [x] 3.1 Add a Drama Browser branding directory or equivalent source-level product config
- [x] 3.2 Set Drama Browser product name, display name, vendor name, bundle id, app icon, and about metadata through build configuration
- [x] 3.3 Set `drama://` as the canonical Drama Browser product URL scheme
- [x] 3.4 Set source-built profile naming and default-browser prompt naming to Drama Browser
- [x] 3.5 Add a verifier check proving branding values originate from source/build config rather than post-build plist-only edits

## 4. Executable and Helper Product Identity

- [x] 4.1 Rename or configure the main source-built executable to a Drama-owned name
- [x] 4.2 Rename macOS helper app display names and helper bundle ids to Drama Browser helpers
- [x] 4.3 Update paths, launcher references, sandbox expectations, and entitlements that depend on executable/helper names
- [x] 4.4 Launch the source-built product and verify main/helper process names do not identify as Zen
- [x] 4.5 Record any remaining Zen process names as blockers unless they are source attribution or explicitly approved compatibility labels

## 5. Updater and Release Channel Ownership

- [x] 5.1 Locate inherited Zen/Firefox updater configuration and update channel metadata
- [x] 5.2 Disable inherited Zen updater behavior for the first source-built Drama Browser artifact
- [x] 5.3 Add verification proving update checks cannot replace Drama Browser with a Zen artifact
- [x] 5.4 Define the later Drama updater ownership requirements: signing identity, metadata endpoint, verification keys, channel names, and rollback policy
- [x] 5.5 Keep updater re-enablement blocked until those Drama-owned release requirements are met

## 6. Source-Registered Drama Chrome

- [x] 6.1 Map current `gecko-drama-chrome` resources to source build chrome/resource registration points
- [x] 6.2 Register Drama shell resources at build time instead of copying them into an already-built bundle
- [x] 6.3 Route Start, Graph, PLM, Skill Crew, and Basic Memory through source-registered resources
- [x] 6.4 Preserve the current wrapper package injection only as a transitional adapter path
- [x] 6.5 Verify the source-built app loads Drama surfaces without package-script chrome injection

## 7. Profile, Preferences, and Migration

- [x] 7.1 Set source-built profile directories and profile owner metadata to Drama Browser naming
- [x] 7.2 Keep `drama.browser.*` as the canonical preference namespace
- [x] 7.3 Treat `zen.drama.*` as a migration import only, not a source-built product namespace
- [x] 7.4 Add a one-way migration or import plan for existing wrapper profiles
- [x] 7.5 Verify a fresh source-built profile does not create Zen-owned product profile paths

## 8. Signing, Entitlements, and Notarization Boundary

- [x] 8.1 Inspect source-built signing requirements for main app and helpers
- [x] 8.2 Update entitlements and helper bundle ids consistently with Drama Browser naming
- [x] 8.3 For internal builds, document unsigned/ad-hoc signing limitations explicitly
- [x] 8.4 For distributable builds, add codesign and notarization verification steps
- [x] 8.5 Verify macOS permission prompts and security dialogs identify the app as Drama Browser

## 9. Source-Built Product Verifier

- [x] 9.1 Add a source-built verifier that scans bundle id, display name, executable, helpers, updater, profile, URL schemes, LaunchServices, process tree, and document URI
- [x] 9.2 Make the verifier fail on Zen product identity in running processes, helper app names, updater channel, app metadata, or profile owner metadata
- [x] 9.3 Make the verifier allow Zen/Firefox/Mozilla text only in source attribution, licenses, compatibility docs, or dependency metadata
- [x] 9.4 Add no-original-Zen-wakeup detection for source-built Drama Browser launch
- [x] 9.5 Output a machine-readable JSON report and a short human-readable summary

## 10. UI and Runtime Parity

- [x] 10.1 Launch source-built Drama Browser to Start and capture a nonblank first viewport screenshot
- [x] 10.2 Launch source-built Drama Browser to Graph and verify runtime readiness or a styled runtime failure state
- [x] 10.3 Launch source-built Drama Browser to PLM and verify sidecar/AI/workspace/parity states remain visible
- [x] 10.4 Launch source-built Drama Browser to Skill Crew and Basic Memory and capture parity screenshots
- [x] 10.5 Verify visible host chrome, app title, prompts, and browser-owned controls identify as Drama Browser

## 11. Performance and Regression Gates

- [x] 11.1 Run source-built startup timing and compare against wrapper baseline
- [x] 11.2 Verify first viewport, runtime readiness, sidecar readiness, route switch time, and listener counts are recorded
- [x] 11.3 Fail the source-built performance gate if identity verification fails first
- [x] 11.4 Record any performance regression caused by source build flags, missing PGO/LTO, or signing/sandbox differences
- [x] 11.5 Decide whether the source-built artifact can replace the wrapper path for local daily use

## 12. Final Acceptance and PR/Handoff

- [x] 12.1 Run OpenSpec strict validation for this change
- [x] 12.2 Produce final source-fork evidence with source commit, build artifact path, verifier JSON, screenshots, and blocker status
- [x] 12.3 Update PR or handoff documentation to distinguish wrapper adapter, source-built internal artifact, and public distributable product
- [x] 12.4 Keep wrapper launchers available until source-built identity and parity gates pass
- [x] 12.5 Mark complete only when source-built Drama Browser passes identity, updater, helper, profile, chrome, UI, runtime, and no-original-Zen-wakeup verification

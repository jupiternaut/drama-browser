# Stage 01 Source Workspace Bootstrap Evidence

Date: 2026-06-28

## Decision

Canonical source workspace for this run:

`/Users/gengrf/zen-browser-desktop`

Reason: the checkout already exists outside the wrapper repo, contains the Zen desktop source plus a materialized Firefox/Gecko engine tree, and is 19 GB. Creating a second full copy under `/Users/gengrf/drama-browser-source` would duplicate a large local source/build tree before the baseline is clean. This path is separate from the wrapper/planning repo at `/Users/gengrf/drama-browser`.

## Source Repositories

Desktop source:

- Path: `/Users/gengrf/zen-browser-desktop`
- Remote: `https://github.com/zen-browser/desktop.git`
- Branch: `stable`
- Commit: `eb4cae5bf6e25cbdfe9215c6d4a800fb43274c79`
- Local status: dirty only in `surfer.json`; the diff is the missing trailing newline at EOF.

Engine source:

- Path: `/Users/gengrf/zen-browser-desktop/engine`
- Branch: `zen_browser`
- Commit: `b616015a4dfebd4191d05223c7f6c518d1cb2db8`
- Local status: dirty with many imported/generated Zen engine changes already present. This is a Stage 02 reproducibility risk, not Stage 01 workspace absence.

## Size

- `/Users/gengrf/zen-browser-desktop`: 19 GB
- `/Users/gengrf/zen-browser-desktop/engine`: 18 GB
- `/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin`: 12 GB

## Toolchain Snapshot

- Node: `v22.22.3`
- Bun: `1.3.14`
- Python: `Python 3.14.6`
- Xcode: `26.5` (`17F42`)
- macOS: `26.4.1` (`25E253`)
- Repo requested Node: `.nvmrc` = `22`
- Repo requested Python: `.python-version` = `3.11`
- Repo requested Rust: `.rust-toolchain` = `1.90`
- Local Rust: `rustc` and `cargo` are not currently on PATH.

## Build Entrypoints Verified

The source workspace contains browser build entrypoints:

- `/Users/gengrf/zen-browser-desktop/package.json`
- `/Users/gengrf/zen-browser-desktop/surfer.json`
- `/Users/gengrf/zen-browser-desktop/engine/mach`
- `/Users/gengrf/zen-browser-desktop/engine/moz.configure`
- `/Users/gengrf/zen-browser-desktop/engine/browser/moz.configure`
- `/Users/gengrf/zen-browser-desktop/engine/build/moz.configure`

## Bootstrap / Materialization

The Firefox/Gecko engine source is already materialized at `/Users/gengrf/zen-browser-desktop/engine` with its own Git metadata and build entrypoints. I did not rerun `surfer download`, `surfer import`, or `surfer bootstrap` during Stage 01 because the existing source tree is dirty and rerunning import/bootstrap could overwrite local state before Stage 02 baseline evidence is captured.

## Acceptance Mapping

- 1.1 complete: canonical source workspace path selected and recorded.
- 1.2 complete: existing Zen desktop source checkout recorded as the source workspace.
- 1.3 complete: upstream URL, branch, commit, and local toolchain versions recorded.
- 1.4 complete by existing materialized engine source; fresh bootstrap intentionally deferred to Stage 02 after dirty-state handling.
- 1.5 complete: `mach` and `moz.configure` entrypoints verified.
- 1.6 complete: no bootstrap command failed in Stage 01; the only blocker-like finding is missing Rust on PATH, recorded for Stage 02.


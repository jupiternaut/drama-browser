# Drama Browser

Zen Browser hosted Drama workbench with Graph, PLM, Skill Crew, and a standalone local runtime.

This repository is not an Electron app handoff, even though legacy Electron files remain in the tree. The production boundary is the de-Electronized Drama Browser path: browser chrome resources, `apps/drama-browser-shell`, `apps/drama-runtime`, Drama packages, and guard scripts such as `check:no-electron-production`.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Repository Layout](#repository-layout)
- [Status](#status)
- [Maintainer](#maintainer)
- [Contributing](#contributing)
- [License and Upstream](#license-and-upstream)

## Background

Drama Browser is the public-facing Drama/Zen browser workbench fork. It packages and validates a Zen-hosted product path:

```text
Zen Browser chrome
  -> chrome://browser/content/drama/app/index.html
  -> Drama browser shell
  -> local Drama runtime at http://127.0.0.1:3198
  -> Graph / PLM / Crew surfaces
```

Important boundaries:

- `apps/electron/` is legacy compatibility and resource history. Do not treat it as the production host.
- `scripts/legacy/electron/` exists to keep old Electron commands explicit and noisy.
- `scripts/verify-no-production-electron.ts` guards production paths against Electron dependencies.
- `apps/webui/` is not the current Drama Browser source layout.
- PlotPilot integration is through `packages/drama-plm`, `packages/drama-plm-ui`, runtime proxying, and package-time sidecar inputs. PlotPilot source is not the primary source boundary of this repository.

## Install

Requirements for local development:

- Bun
- Node-compatible package tooling
- Zen Browser source or packaged Zen inputs for product-path validation
- PowerShell for Windows packaging and product gate scripts

Clone this fork:

```sh
git clone https://github.com/jupiternaut/drama-browser.git
cd drama-browser
bun install
```

## Usage

Core validation:

```sh
bun run drama:browser:build
bun run drama:browser:verify
bun run browser-shell:typecheck
bun run browser-shell:build
bun run runtime:typecheck
```

Local runtime and browser shell development:

```sh
bun run zen:drama:dev
```

macOS package path:

```sh
bun run drama:browser:package:mac
bun run drama:browser:install:mac
bun run drama:browser:launch:mac
```

Windows product path:

```powershell
bun run zen:drama:prepare-zen-bin:win
bun run zen:drama:package:win
bun run zen:drama:windows-gate
```

Electron commands may still exist for legacy work, but production README readers should start with the Drama Browser commands above.

## Repository Layout

- `gecko-drama-chrome/` - browser chrome integration for the Drama product path.
- `zen-drama-chrome/` - Zen-specific browser chrome resources.
- `apps/drama-browser-shell/` - React shell rendered inside the browser-hosted workbench.
- `apps/drama-runtime/` - local runtime server for Graph, PLM, Crew, filesystem, and sidecar proxying.
- `apps/drama-module-harness/` - local harness for Drama module surfaces.
- `packages/drama-host/` - host/runtime client abstractions.
- `packages/drama-core/` - graph and event primitives.
- `packages/drama-graph/` and `packages/drama-graph-ui/` - graph model and UI.
- `packages/drama-plm/` and `packages/drama-plm-ui/` - PlotPilot-facing contracts and PLM Script Studio UI.
- `packages/drama-crew/` - Skill Crew runtime helpers.
- `packages/drama-ui/` - shared Drama UI primitives.
- `apps/electron/` - legacy Electron compatibility surface and historical resources.
- `scripts/legacy/electron/` - explicit legacy Electron wrappers.
- `scripts/verify-no-production-electron.ts` - production boundary check.
- `docs/` and `openspec/` - migration handoff, ADRs, verification notes, and change specs.

## Status

Active Zen Browser product-path fork.

The current README deliberately fixes stale `apps/electron` assumptions. A reader should not conclude that the product is still an Electron app just because legacy files are present. The intended product path is Zen/browser chrome plus local runtime.

Known gaps remain around full PlotPilot parity, final Graph canvas polish, and complete AgentOS/Crew parity. Built packages and verification artifacts belong outside source unless explicitly documented.

## Maintainer

Maintained in the `jupiternaut/drama-browser` repository.

## Contributing

Keep changes aligned with the de-Electronized boundary:

- Production code should avoid direct Electron dependencies.
- If you touch product-path code, run `bun run drama:browser:verify` or a narrower equivalent.
- If you touch Windows packaging, record the package command and gate output.
- If you touch PLM, state whether the change affects runtime contracts, UI, or a package-time sidecar.

## License and Upstream

Licensed under Apache-2.0. See [LICENSE](LICENSE).

This repository is maintained as `jupiternaut/drama-browser`. It carries Craft Agents lineage and Drama-specific changes, but its README should describe the Drama Browser source boundary rather than upstream Craft Agents marketing copy.

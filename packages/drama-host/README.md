# @drama/host

Host capability contracts for running Drama outside Electron.

## Purpose

`@drama/host` is the boundary between Drama UI packages and whichever desktop or browser shell runs them.

Electron, a browser harness, and a Gecko adapter should implement this package instead of letting React code call `window.electronAPI` directly. Drama Browser is the product identity; Zen/Gecko is an adapter implementation detail for the current packaged browser path.

## Public API

- `DramaHostKind`: `electron`, `browser`, `gecko`, or `test`.
- `DramaHostApi`: shell, file, dialog, clipboard, lifecycle, notification, and RPC capability groups.
- `createBrowserHostApi`: a browser-safe fallback implementation for web harnesses.
- `assertHostCapability`: a guard for features that require a native host.
- `classifyDramaPlmSurface`: classifies product, localhost, browser fallback, and legacy Electron surfaces.
- `product-drama-browser`: canonical packaged Drama Browser product classification.
- `product-zen-panel`: deprecated compatibility alias for archived Zen/Gecko product-path evidence.

## Boundary

This package is platform-neutral. It must not import Electron, Node filesystem APIs, React, or Drama feature packages.

Feature-specific packages such as `@drama/graph-ui` and `@drama/plm-ui` should receive their own typed feature APIs through props and use `@drama/host` only for generic shell capabilities.

## Commands

- `bun run typecheck`
- `bun run test`
- `bun run build`

# Stage 02 DramaHost Contract

Date: 2026-06-29

## Files Changed

- `packages/drama-host/src/index.ts`
- `packages/drama-host/src/drama-browser.ts`
- `packages/drama-host/src/legacy-electron.ts`
- `packages/drama-host/src/drama-browser.test.ts`
- `packages/drama-host/package.json`

## Contract Added

`@drama/host` now exposes typed host capability surfaces for:

- navigation and browser chrome commands
- dialogs and files
- runtime status/capabilities/RPC
- sessions
- PLM sidecar
- Graph
- Skill Crew
- Basic Memory
- settings
- diagnostics

Capability discovery was expanded with:

- `getMissingHostCapabilities`
- `hasHostCapabilities`
- `assertHostCapabilities`

## Production Adapter

`@drama/host/drama-browser` adds `createDramaBrowserHostApi()`, which:

- reports `kind: "gecko"`
- talks to Drama Runtime through `/runtime/rpc`
- exposes production namespaces for sessions, PLM, Graph, Skill Crew, Basic Memory, settings, and diagnostics
- optionally delegates browser-level navigation to a Gecko chrome command bridge
- does not depend on Electron preload or `window.electronAPI`

## Legacy Boundary

`@drama/host/legacy-electron` adds `createLegacyElectronHostApi()` as an explicit import path only. The root `@drama/host` contract does not export this adapter.

## Verification

Commands:

```bash
cd /Users/gengrf/drama-browser/packages/drama-host
bun run typecheck
ulimit -n 8192; bun test src/*.test.ts
```

Results:

- TypeScript check passed.
- 10 tests passed.
- New tests prove the production Drama Browser host reports `gecko`, exposes runtime/session/Basic Memory capabilities, routes session commands through Drama Runtime RPC, and does not export the legacy Electron adapter from the root host contract.


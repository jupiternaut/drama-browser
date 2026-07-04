# Stage 04 Runtime Capability Migration

Date: 2026-06-29

## Files Changed

- `apps/drama-runtime/src/server.ts`
- `packages/drama-host/src/runtime-client.ts`
- `packages/drama-host/src/runtime-client.test.ts`
- `packages/drama-host/src/drama-browser.ts`
- `packages/drama-host/src/index.ts`

## Runtime APIs Added

Drama Runtime now exposes:

- `GET /health`
- `GET /capabilities`
- `GET /runtime/capabilities`
- `runtime:capabilities`
- `files:readText`
- `files:writeText`
- `files:preview`
- `files:importText`
- `files:exportText`
- `sessions:command`
- `sessions:cancel`
- `sessions:status`
- `settings:read`
- `settings:write`
- `diagnostics:snapshot`
- `diagnostics:process`
- `basic-memory:search`
- `basic-memory:read`
- `basic-memory:write`
- `drama:graph:persist`
- `skill-crew:refresh-skills`
- `skill-crew:import-skill`
- `skill-crew:run-codex-skill`
- `skill-crew:record-feedback`

Existing PLM and Graph channels remain owned by Runtime:

- `plotpilot:runtime:status`
- `plotpilot:runtime:start`
- `plotpilot:runtime:stop`
- `plotpilot:runtime:restart`
- `plotpilot:runtime:logs`
- `drama:graph:*`

## Safety Boundary

Runtime file read/write is constrained to:

- configured Drama workspace root
- configured Basic Memory root

Native open/reveal is not implemented in Runtime. It is assigned to Gecko chrome and verified in Stage 05.

## Verification

Commands:

```bash
cd /Users/gengrf/drama-browser/packages/drama-host
bun run typecheck
ulimit -n 8192; bun test src/*.test.ts

cd /Users/gengrf/drama-browser/apps/drama-runtime
bun run typecheck
```

Smoke test:

- launched an isolated runtime on a temporary port
- verified `/health`
- verified `/capabilities`
- verified `/runtime/capabilities`
- verified `sessions:command`
- verified `files:writeText`
- verified `settings:write` + `settings:read`
- verified `diagnostics:snapshot`

Results:

- `@drama/host` typecheck passed.
- `@drama/host` tests passed: 11 tests.
- `@drama/runtime` typecheck passed.
- runtime smoke test passed.

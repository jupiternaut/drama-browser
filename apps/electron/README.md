# Legacy Electron Host

`apps/electron` is a legacy compatibility host. It is not the production Drama Browser desktop app.

Production builds must use the source-built Gecko app through the root `drama:browser:*` scripts:

```bash
bun run drama:browser:build
bun run drama:browser:package:mac
bun run drama:browser:install:mac
bun run drama:browser:verify
```

The Electron host remains here only as an emergency rollback and compatibility archive while Gecko-hosted parity is being verified.

Allowed legacy entrypoints:

```bash
bun run electron:build
bun run electron:start
bun run electron:dev
bun run electron:dist
```

Those commands print a legacy warning before running. They must not be used as production evidence for OpenSpec `remove-electron-host`.

Production acceptance rejects:

- `Electron Framework.framework` inside a Drama Browser app bundle;
- Electron Helper processes during Drama Browser verification;
- root production dependencies on `electron`, `electron-builder`, `@electron/packager`, `@sentry/electron`, or `electron-updater`;
- production UI code that calls `window.electronAPI`, `ipcRenderer`, `contextBridge`, or imports `electron`.

Rollback rule: if Gecko-hosted parity fails before final removal, run the Electron app only as a temporary legacy fallback. Do not reintroduce Electron into `drama:browser:*` scripts.

## Why

Drama currently has one effective visual theme. The shell already exposes `--drama-*` semantic variables, but there is no product-level skin registry, no UI switcher, and no persisted appearance choice across Graph, PLM, and Skill Crew.

Warp's local source shows the right architectural shape: an appearance manager owns the active theme, a theme registry describes built-in and custom themes, and components consume semantic colors rather than raw palette values. Drama needs the same kind of product boundary before more PLM/Graph UI is migrated away from hard-coded dark classes.

## What Changes

- Add a Drama skin registry for product-owned skins.
- Apply the active skin through document-level attributes and CSS variables.
- Add a compact skin switcher in the workbench chrome.
- Persist the chosen skin locally and keep it through reloads.
- Emit a readiness signal so automated verification can assert which skin is active.
- Keep Zen host token bridging as one selectable skin mode, instead of making Zen the only path.
- Promote `jade-glass` and `opal-bloom` as the two future Drama skin bases for jade/cream glass and pink/blue opal glass art direction.

## Capabilities

### New Capabilities

- `drama-ui-skin-system`: product-level skin registry, switcher, persistence, and semantic token application.

### Modified Capabilities

- `zen-native-uiux-quality`: product-path UI/UX acceptance includes skin application and persistence.
- `zen-drama-workbench-ui`: workbench chrome exposes appearance controls without replacing Graph/PLM/Crew navigation.

## Impact

- Primary implementation areas:
  - `apps/drama-browser-shell`
  - `packages/drama-ui/src/styles.css`
  - OpenSpec verification for Zen UI/UX
- Verification:
  - OpenSpec strict validation
  - Browser shell typecheck/build
  - Structural checks that the active skin is visible through `data-drama-skin` and local storage

## Non-Goals

- Importing every Warp theme file in this first slice.
- Copying Warp's Rust `AppearanceManager` implementation.
- Fully rewriting every PLM/Graph Tailwind hard-coded color in one pass.
- Adding a theme marketplace or custom theme editor.

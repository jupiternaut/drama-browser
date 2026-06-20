## Context

The current Drama UI already has semantic CSS tokens such as `--drama-bg`, `--drama-surface-strong`, `--drama-border`, and `--drama-accent`. Those tokens are a good foundation, but they are assigned once at `:root` and partly overridden by `:root[data-host="zen"]`.

Warp's local implementation separates:

- a theme kind / registry
- appearance state
- transient preview vs persisted settings
- semantic accessors consumed by components

Drama should adopt that product shape in browser-shell terms:

```text
skin registry
  -> persisted selected skin
  -> document data-drama-skin
  -> CSS semantic tokens
  -> shell / PLM / Graph / Crew components
```

## Decisions

### 1. Use Drama-owned skin ids

The first built-in skins are product-owned ids:

- `drama-classic`
- `zen-follow`
- `warp-midnight`
- `solar-script`
- `paper-light`
- `jade-glass`
- `opal-bloom`

`warp-midnight` is an inspired skin name and token profile, not a direct import of Warp theme files.

`jade-glass` and `opal-bloom` are the two future skin design bases, not one-off color variants:

- `jade-glass`: translucent jade, cream glass, green mineral depth, and calm production focus.
- `opal-bloom`: pink / lavender / ice-blue pearl glass, softer creative energy, and a lighter emotional writing surface.

Future Drama skins SHOULD branch from one of these two product art bases unless a later OpenSpec change introduces a third base. Component-level expressions such as the native Zen pinned PLM entry SHOULD inherit the same visual grammar instead of defining unrelated palettes.

### 2. Skin state lives at the document root

The active skin is applied as:

```html
<html data-drama-skin="warp-midnight">
```

The shell root mirrors the value for automation:

```html
<div data-drama-active-skin="warp-midnight">
```

This lets shell, PLM, Graph, and Crew receive the same variables even when route packages are nested below the shell.

### 3. Persist only the skin id

The first slice persists the active skin id in local storage. Token values stay in CSS so packaged Zen chrome resources do not need runtime JSON hydration.

### 4. Zen is a skin, not a hardcoded one-way override

When `zen-follow` is active and `host=zen`, Drama maps Zen variables into Drama tokens. When another skin is selected, Drama uses that skin's tokens even inside the Zen panel.

### 5. Migrate hard-coded route styling incrementally

Graph and PLM still contain many Tailwind arbitrary values. The first slice makes global surfaces, shell chrome, shared controls, Graph shell overrides, and Crew surfaces skin-aware. A later slice should replace the remaining `text-white/*`, `bg-black/*`, and `border-white/*` route-local classes with semantic token utilities.

## Risks / Trade-offs

**Risk: Skins appear incomplete in deeply nested PLM cards**

Mitigation: keep first slice honest in OpenSpec. Mark full PLM/Graph hard-coded class migration as a follow-up, while making the shell and shared frame actually switch skins now.

**Risk: Zen token bridge loses priority**

Mitigation: make `zen-follow` explicit, and keep `data-host="zen"` available for host detection.

**Risk: Light skins expose unreadable route-local white text**

Mitigation: first light skin uses conservative paper tones and CSS overrides for shared surfaces. Full parity requires route-local token migration before calling every PLM card fully skin-native.

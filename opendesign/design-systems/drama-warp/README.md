# Drama / Warp OpenDesign Baseline

This design system defines Drama's current native product style. It is extracted from the existing Electron shell and shared UI package, then normalized into rules for future Storylet, PlotPilot, Skill Crew, and AgentOS surfaces.

## Sources Consulted

- `apps/electron/src/renderer/index.css`
- `packages/ui/src/styles/index.css`
- `apps/electron/src/renderer/components/ui/TopBarButton.tsx`
- `apps/electron/src/renderer/components/ui/HeaderIconButton.tsx`
- `apps/electron/src/renderer/components/app-shell/PanelHeader.tsx`
- `apps/electron/src/renderer/components/app-shell/panel-constants.ts`
- `apps/electron/src/renderer/components/app-shell/LeftSidebar.tsx`
- `apps/electron/src/renderer/components/skill-crew/SkillCrewNavigatorPanel.tsx`
- `apps/electron/src/renderer/components/skill-crew/moments/MomentCard.tsx`
- `apps/electron/src/renderer/components/workspace-tools/WorkspaceToolPage.tsx`
- `apps/electron/src/renderer/components/workspace-tools/WorkspaceToolNavigatorPanel.tsx`

## Definition

Drama's style is a compact dark-first agent workspace:

- Neutral, low-chroma shell with one sparse purple accent.
- Multi-pane command workspace, not a card-based SaaS dashboard.
- Dense 13px list rows, 10-12px metadata, mono endpoints and IDs.
- Thin separators, foreground alpha hover/active states, minimal shadows.
- Small radii only where needed: 4px badges, 6px nav/buttons, 8px panes/media.
- Icon-led controls, short labels, status dots, compact badges.
- Native Drama chrome owns navigation, headers, status, loading, recovery, and runtime labels.

## What This Rules Out

- Storylet's current white/purple sidebar as Drama chrome.
- PlotPilot's current blue sidebar, large white cards, and SaaS empty states as Drama chrome.
- Large imported app logos as primary top-level identity.
- Gradient-heavy AI dashboard styling.
- Decorative panel backgrounds, oversized cards, and hero copy inside tools.

## Projection Boundary

Storylet and PlotPilot can remain visually distinct inside an iframe or canvas while they are being integrated. Their outer shell must still be Drama-native:

- Left navigation uses Drama list grammar.
- Headers use `PanelHeader` and `HeaderIconButton`.
- Runtime state uses compact badges and dots.
- Original product names move to source metadata, not the main route label.
- Iframes/canvases fill the viewport and are paint-contained.

## Refactor Target For Current Screens

The screenshots are not yet Drama-native because the embedded apps still expose their original visual systems. The next UI refactor should not globally repaint those apps. It should first replace or mask host-level elements:

- Rename visible app identity to Drama-native labels.
- Remove imported sidebars from the first-level Drama shell.
- Move endpoint/source/bridge details into compact mono metadata.
- Keep Storylet graph semantics and PlotPilot long-context workflow, but present them through Drama's pane and command language.

## Files

- `SKILL.md`: executable rules for future UI work.
- `tokens/colors_and_type.css`: normalized OpenDesign tokens mapped to existing Drama CSS variables.
- `style-guide.md`: concise do/don't guidance for implementation reviews.

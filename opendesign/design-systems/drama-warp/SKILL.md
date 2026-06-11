---
name: drama-warp
description: OpenDesign baseline for Drama's native Warp-inspired agent workspace shell.
---

# Drama Native Workspace

Use this system for every Drama-native surface: app shell, navigation, Skill Crew, Tasks, Storylet/PlotPilot projection hosts, bridge states, error states, loading states, and settings surfaces.

This system is intentionally not Storylet's white graph editor and not PlotPilot's blue SaaS dashboard. Imported tools may keep their own internal canvas or editor while Drama owns all outer chrome, naming, status, routing, recovery, and cross-tool controls.

## Design Intent

Drama is an agent operating workspace: a compact command center for crews, tasks, memory, graph projections, and long-context writing. It should feel native to Warp-like desktop tooling: quiet, dense, technical, and low-chroma.

The user should feel they are inside one Drama application, with Storylet and PlotPilot behaving as projections inside Drama. Do not let imported project branding become the primary application identity.

## Visual DNA

- Dark-first neutral workspace, derived from `--background`, `--foreground`, `--foreground-*`, and `--border`.
- Purple `--accent` is an active/brand/control accent, not a page theme. Do not fill whole panes with purple.
- Semantic color is sparse: `--success` for connected/ready, `--info` for waiting/warning, `--destructive` for failure.
- Surfaces are made from foreground alpha layers: `bg-background`, `bg-foreground/[0.025]`, `bg-foreground/[0.035]`, `bg-foreground/[0.06]`, `bg-foreground/[0.07]`.
- Thin borders and minimal shadows. Prefer `border-border/60` and `shadow-minimal`.
- Avoid gradients, oversized hero areas, decorative blobs, floating marketing cards, and high-saturation blue/purple dashboards.
- Low radius hierarchy: 4px for badges and header icon buttons, 5px for compact chips, 6px for nav rows and topbar buttons, 7px for form controls, 8px for media/pane surfaces.
- App-level radius remains flat: root `--radius: 0rem`; component radii are deliberate exceptions.

## Layout

- Use the native pane stack: global sidebar, navigator panel, main content panel, optional inspector/detail panel.
- Topbar height is 48px. `PanelHeader` height is 42px. Panel gap and window inset are 6px.
- Headers are compact command bars, not page heroes. Center title, right-side icon actions, optional small badge.
- Navigator surfaces are lists, not card grids. Rows scan as icon, primary label, short secondary role, optional mono metadata.
- Panel content should fill available space. Avoid centered empty SaaS cards unless the entire surface is truly empty.
- Repeated objects can use cards only when each object is a real record. Do not put page sections inside cards.
- Use stable dimensions for toolbars, tabs, controls, graph hosts, and iframe viewports so content cannot resize the shell unexpectedly.

## Component Grammar

- Topbar icon button: `h-7 w-7`, radius 6, icon 16-18px, hover `bg-foreground/5`.
- Panel header icon button: `h-7 w-7`, radius 4, muted icon, hover `text-foreground bg-foreground/3`.
- Sidebar row: `text-[13px]`, icon 14px, radius 6, `py-[5px] px-2`, active `bg-foreground/[0.07]`.
- Navigator group header: `px-3 py-3`, uppercase eyebrow `text-[11px] tracking-[0.18em]`, secondary mono or muted metadata.
- Status badge: radius 4-5, `text-[10px]` or `text-[11px]`, foreground alpha background, optional 1.5px dot.
- Metadata and endpoints use `font-mono`, 10-11px, muted foreground.
- Inputs and compact selects use height 32-36px, radius 7, `border-border/70`, `bg-background`.
- Use lucide icons for actions. Use text labels for navigation and primary commands only.

## Projection Rules

- Primary app label is always Drama. Tool source names are secondary metadata.
- Use Drama-native names for imported workspaces:
  - `Drama Graph` for the Storylet state graph projection.
  - `Drama PLM` for the PlotPilot long-context projection.
- If source names are needed, show them as metadata: `source: Storylet`, `source: PlotPilot`, `runtime: localhost:3000`.
- Projection host chrome must be Drama-native: `PanelHeader`, compact status badge, refresh/open controls, endpoint/bridge strip, lightweight loading/error overlay.
- Embedded Storylet and PlotPilot content can remain visually distinct inside the viewport until native adapters exist.
- Do not wrap an embedded app in a second branded sidebar that competes with Drama navigation.
- Do not show large imported logos, imported blue/purple sidebars, or imported marketing copy in Drama shell.

## Performance

- Keep iframe/canvas wrappers `contain: layout paint`.
- Do not animate iframes, graph canvases, large SVG edge layers, or full-pane backgrounds.
- Use color/opacity transitions only, usually 100-180ms.
- Loading overlays are small, non-blocking, and removed after readiness.
- Avoid backdrop blur over graph canvases and iframe contents; it is expensive and makes projections feel foggy.
- Do not force a host theme into Storylet's graph canvas by default. Theme adapters should target host-side controls first.

## Copy

- Use short operational Chinese by default: `投影`, `本地`, `就绪`, `等待`, `加载`, `状态图`, `长上下文`, `运行时桥`.
- Avoid marketing taglines such as "作家的领航员" or product slogans from imported apps.
- Avoid explanatory paragraphs inside the app chrome. Put details in tooltips, popovers, or documentation.
- Prefer nouns and states over sentences: `Crew Tree`, `Skill Crew`, `Drama 投影`, `本地 iframe 桥`.

## Explicit Non-Goals

- Do not recreate PlotPilot's bright blue sidebar, large white cards, and rounded SaaS panels as Drama style.
- Do not recreate Storylet's white inspector/sidebar and purple pill buttons as Drama style.
- Do not solve visual mismatch by applying a global purple gradient or a generic AI dashboard theme.
- Do not let `Storylet` or `PlotPilot` be top-level app identity. They are projections under Drama.

## Acceptance Checklist

- The outer chrome looks like the existing Drama shell, not the embedded app.
- All colors come from Drama semantic variables or derived foreground alpha layers.
- The layout is dense enough for repeated daily work.
- Source/runtime/tool identity is visible but secondary.
- Hover, active, loading, ready, waiting, and error states are all visible without large cards.
- Storylet graph performance is protected: no host blur, no animated iframe, no forced canvas theme.

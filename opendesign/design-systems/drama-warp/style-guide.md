# Drama Native Workspace Style Guide

Use this guide when reviewing Drama UI changes or adapting Storylet and PlotPilot into the Drama shell.

## North Star

Drama should read as a native desktop agent workspace: compact, technical, quiet, and capable. The visual language is closer to a command center than a creator SaaS dashboard.

## Do

- Use Drama variables: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border/60`, `bg-foreground/[0.03]`, `bg-foreground/[0.07]`.
- Keep controls compact: h-7 icon buttons, 42px panel headers, 6px panel gaps.
- Use lucide icons for actions and keep labels short.
- Use `font-mono` for local endpoints, bridge names, source labels, file paths, IDs, and status metadata.
- Put projection identity in Drama language first: `Drama Graph`, `Drama PLM`, `Skill Crew`, `Tasks`.
- Show imported names as secondary metadata: `source: Storylet`, `source: PlotPilot`, `runtime: localhost:3000`.
- Use status dots and small chips for connection/readiness states.
- Let graph/canvas/editor content occupy the full pane without ornamental frames.

## Don't

- Do not use PlotPilot's bright blue sidebar or large rounded white dashboard cards as Drama style.
- Do not use Storylet's white graph editor sidebar and purple gradient buttons as Drama shell chrome.
- Do not add a hero section, marketing headline, or explanatory page inside a tool route.
- Do not use broad gradients, decorative blobs, or high-saturation theme fills.
- Do not make nested cards for sections inside panels.
- Do not animate full panes, iframes, graph canvases, or large background layers.
- Do not make imported product names the app title or main navigation identity.

## Integration Pattern

For Storylet and PlotPilot, use a three-layer pattern:

1. Drama route and navigator: native sidebar row, Drama label, projection role, endpoint, bridge state.
2. Drama host header and strip: `PanelHeader`, compact runtime badge, refresh/open actions, source metadata.
3. Projection viewport: iframe/canvas/native adapter that preserves the tool's internal semantics until a native rewrite exists.

When native adapters are built, port controls gradually from imported UI into Drama components. Start with navigation, document actions, status, errors, and loading states before touching graph/node/editor internals.

## Review Checklist

- Does the outer shell still look like Drama when the iframe fails to load?
- Can a user identify source, runtime, readiness, and recovery action within one glance?
- Are all top-level labels Drama-owned rather than imported brand names?
- Are colors token-based and low-chroma?
- Are rows dense enough for repeated daily work?
- Is performance protected with no blur or large animation over projection content?

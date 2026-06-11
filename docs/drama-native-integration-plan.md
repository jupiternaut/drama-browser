# Implementation Plan: Drama Native Graph, PLM, and Crew Integration

## Overview
Drama should own the narrative runtime instead of embedding Storylet or PlotPilot as external apps. The target architecture is a native Electron/React workspace where Drama Graph is the canonical story state machine, Drama PLM is the long-form writing surface backed by the PlotPilot engine, and Skill Crew/AgentOS reads and writes structured graph events instead of loose text.

## Master Goal
Ship Drama as one native narrative workbench:

- `DramaGraph` is the canonical state. Storylet JSON and PlotPilot data are compatibility projections, not the runtime source of truth.
- `Drama Graph` is a native, editable, Obsidian-Canvas-like state-machine editor.
- `Drama PLM` is a native Drama React writing surface using the PlotPilot engine only as a managed sidecar.
- `Skill Crew` and Director controls operate on structured graph state and graph events.
- Workspace data survives restart, app crash, failed writes, and sidecar failure.
- Desktop startup, tray, quit, and packaging behave like one reliable Windows app.

## Current Baseline
- Done: `DramaGraph` schema exists with nodes, edges, scenes, chapters, bible, drafts, and task bindings.
- Done: Storylet import/export adapters exist.
- Done: workspace graph persistence writes `.drama/graphs/*.json`, creates backups, appends events, and can recover valid backups.
- Done: native Graph route no longer requires Storylet `localhost:3000` as the main view.
- Done: baseline graph editing exists: position save, node create/update/delete, edge create/update/delete, search, minimap, layout, selection, and version history.
- Done: PlotPilot Python runtime is managed by Electron as a sidecar with health/log IPC.
- Done: native Drama PLM can open chapters, edit/save text, generate through the sidecar, and write chapter drafts back into `DramaGraph`.
- Partial: Graph Inspector can show node fields, diagnostics, version history, and PLM draft links.
- Missing: full Obsidian-like canvas ergonomics, undo/redo, richer field schemas, full task/agent binding, Crew graph-event proposal flow, final UI unification, and packaged lifecycle verification.

## One-Pass Execution Strategy
The work should proceed as vertical slices, not disconnected rewrites. Each slice must leave the app launchable and the graph file recoverable.

### Slice 1: Freeze State Contracts
- Acceptance: graph schema version, graph-event envelope, preload API shapes, Storylet/PlotPilot adapters, and migration boundaries are stable.
- Verification: graph/store/bridge tests and `bun run typecheck:electron`.

### Slice 2: Finish Native Graph Editing
- Acceptance: drag, edit, create, delete, copy/paste, multi-select, box-select, align, search, auto-layout, minimap, zoom, fit, edge drag-connect, edge type/label editing, diagnostics focus, and undo/redo all persist.
- Verification: restart app after edits; no crash overlay or layout jump on the current large graph.

### Slice 3: Finish Inspector as Command Panel
- Acceptance: inspector has fields, story, scene/chapter, PLM, versions, tasks, and agents tabs; chapter nodes can open the matching PLM chapter; drafts show source/status/version/content preview.
- Verification: inspector edits create graph events and survive restart.

### Slice 4: Close Graph to PLM Loop
- Acceptance: graph can produce novel/bible/beat input; scene/chapter nodes generate正文 using graph state, long context, and memory hooks; generated text writes back to `DramaDraft`; status moves through `draft`, `revision`, and `final`.
- Verification: select chapter node, open PLM, generate, save, return Graph, and see the draft attached to the node.

### Slice 5: Wire Skill Crew and Director Control
- Acceptance: nodes bind to tasks, agents, and crews; Crew reads compact graph state, diagnostics, recent events, and retrieved memory; Crew output is proposed graph events with accept/reject; Director panel shows story-state health and ownership.
- Verification: accepting a Crew proposal mutates `DramaGraph` through the same safe persistence layer.

### Slice 6: Unify Drama/Warp UI
- Acceptance: names are `Drama Graph`, `Drama PLM`, and `Skill Crew`; Storylet styling is scoped to graph cards; PLM removes PlotPilot SaaS styling; shell, title bar, status bar, icons, diagnostics, buttons, empty states, app icon, tray, and shortcut share one Drama language.
- Verification: visual review on Graph, PLM, and Crew at desktop and narrow widths.

### Slice 7: Harden Desktop Lifecycle and Packaging
- Acceptance: single-instance lock, double-click focus, stable tray icon, Open/Quit menu, sidecar shutdown, no stale Electron/Python processes, packaged Windows app, and restart-persistent workspace data.
- Verification: manual double-click, close, tray quit, relaunch, reboot-style restart, and process-list checks.

## Parallel Agent Map
- Agent A: Graph editor ergonomics, edge editor, diagnostics, undo/redo.
- Agent B: PLM sidecar, Graph-to-PLM DTOs, generation writeback, chapter editor.
- Agent C: Skill Crew graph context, task binding, agent proposal events, Director panel.
- Agent D: Drama/Warp UI pass, icon/tray/shortcut, packaging and launch lifecycle.

Shared contracts that must be changed only deliberately:
- `DramaGraph` and graph-event schema.
- Electron preload API signatures.
- PLM DTOs and Graph-to-PLM bridge.
- Task/agent binding schema.

## Final Done Definition
- Drama opens Graph with Storylet stopped.
- Drama opens PLM with PlotPilot frontend stopped.
- Restarting the computer does not lose graph data, node positions, fields, edges, drafts, or bindings.
- Failed writes leave a backup and recoverable graph.
- Chapter text can be generated from graph state and written back into graph drafts.
- Crew can read story state and propose structured graph events.
- Double-click desktop Drama always launches or focuses.
- Quit behavior is explicit and leaves no stale sidecar.
- There is no iframe and no `localhost:3000` as the main Graph path.

## Architecture Decisions
- `DramaGraph` is the long-term source of truth. Storylet JSON is only an import/export compatibility format.
- Graph persistence stays workspace-local first: `.drama/graphs/*.json`, `.backups`, and `graph-events.jsonl`.
- Storylet visual identity is preserved only inside graph cards and relation semantics. The shell, panels, title bars, status bars, and PLM views follow Drama/Warp styling.
- PlotPilot frontend is not embedded. Drama keeps the Python engine as a sidecar and rewrites the writing UI in React.
- Agents must write durable `graph-events.jsonl` records so story changes are replayable, reviewable, and recoverable.

## Phase 1: Canonical State and Safety
Status: mostly complete.

### Task 1: Drama schema
Description: Define versioned shared types for `DramaGraph`, `DramaNode`, `DramaEdge`, `DramaScene`, `DramaChapter`, `DramaBible`, `DramaDraft`, and `DramaTaskBinding`.

Acceptance criteria:
- `DramaGraph` is independent from Storylet runtime state.
- Storylet import/export adapters preserve source IDs and known fields.
- Tests cover adapter round trips and malformed inputs.

Verification:
- `bun test apps/electron/src/shared/__tests__/drama-graph.test.ts`
- `bun test apps/electron/src/shared/__tests__/storylet-native-graph.test.ts`

### Task 2: Safe persistence
Description: Store graphs under each workspace and make all writes crash-safe.

Acceptance criteria:
- Each workspace has `.drama/graphs/*.json`.
- Every overwrite creates a backup first.
- Every mutation appends `graph-events.jsonl`.
- Startup loads the latest valid graph and recovers from backup if the current file is corrupt.

Verification:
- `bun test apps/electron/src/main/__tests__/drama-graph-store.test.ts`
- Manual corrupt-file recovery check.

### Task 3: Version history panel
Description: Replace the temporary restore probe with a permanent version history surface.

Acceptance criteria:
- Inspector shows recent backups and graph events.
- User can restore from a validated backup path.
- Restore itself is logged as a graph event and preserves a backup of the pre-restore graph.

Verification:
- Electron smoke check confirms `版本历史`, `恢复此备份`, and `graph-events.jsonl` are visible.

## Phase 2: Native Drama Graph Editor
Status: partially complete.

### Task 4: Editable canvas baseline
Description: Make the current native React Flow graph a real editor, not a read-only projection.

Acceptance criteria:
- Dragging nodes saves position.
- Create, delete, edit title/type/fields all persist.
- Copy/paste and keyboard delete work without affecting text inputs.
- Multi-select state is reliable.

Verification:
- Renderer build succeeds.
- Manual check after app restart confirms node positions and fields persist.

### Task 5: Canvas operations
Description: Bring graph navigation close to Obsidian Canvas behavior.

Acceptance criteria:
- Box select, multi-select, align, auto-layout, minimap, fit/zoom, and node search are stable.
- Undo/redo exists for node and edge mutations.
- Keyboard shortcuts are documented in code and discoverable through UI tooltips.

Verification:
- Browser/Electron smoke test on a large graph.
- No layout jump after selecting, dragging, or editing.

### Task 6: Edge relationship editor
Description: Treat edges as first-class state-machine relationships.

Acceptance criteria:
- Drag-to-connect creates typed edges.
- Edge inspector edits label and type.
- Types include `contains`, `next`, `blocks`, `supports`, `reveals`, and custom.
- Color and line style are driven by type.
- Deleting an edge persists immediately.

Verification:
- Create/edit/delete edge, restart app, confirm persisted result.

### Task 7: State-machine diagnostics
Description: Detect structural problems before generation or agent execution.

Acceptance criteria:
- Detect isolated nodes, dangling edges, duplicate edges, chapter chain gaps, self-loops, and `contains` cycles.
- Diagnostics are shown in the inspector and can focus the relevant node/edge.
- PLM and Crew flows can block or warn on high-severity diagnostics.

Verification:
- Unit tests for diagnostics.
- Manual check on current imported story graph.

## Phase 3: Drama Inspector
Status: started.

### Task 8: Structured field editor
Description: Replace field preview with a Drama-native inspector that adapts to selected node type.

Acceptance criteria:
- Base fields: title, type, summary, tags, status.
- Story fields: dramatic purpose, conflict, emotional tone, dialogue, next connection.
- Entity fields: character, location, world, faction, relationship metadata.
- Chapter fields: outline, beat list, draft links, revision state.
- PLM fields: prompt context, generated draft, revision, final text.

Verification:
- Editing any field records a graph event and survives restart.

### Task 9: Version, task, and agent tabs
Description: Make the inspector the command center for state, history, and ownership.

Acceptance criteria:
- Shows version history for selected graph/node.
- Shows linked tasks and assigned agent.
- Allows creating a task binding from the selected node.
- Shows last agent suggestion and accept/reject controls.

Verification:
- Graph event log records task and agent mutations.

## Phase 4: Native Drama PLM
Status: partially complete, still high priority.

### Task 10: PlotPilot engine sidecar
Description: Keep PlotPilot generation logic but run it as a managed sidecar, not a separate frontend.

Acceptance criteria:
- Electron starts/stops Python sidecar with app lifecycle.
- Health check, logs, and error states are visible in Drama.
- Typed API client wraps all PLM calls.
- App does not crash if the sidecar is missing or unhealthy.

Verification:
- `bun test apps/electron/src/main/__tests__/plotpilot-runtime.test.ts`
- Manual start/quit confirms sidecar exits.

### Task 11: React PLM workspace
Description: Rebuild PlotPilot writing views in Drama React style.

Acceptance criteria:
- Book, bible, beat, chapter, and draft panels exist in Drama.
- Chapter can be opened, read, edited, saved, and versioned.
- Empty-state and error-state UI matches Drama/Warp shell.

Verification:
- Create chapter, edit text, restart, confirm content remains.

### Task 12: Graph-to-PLM loop
Description: Make graph nodes drive long-form generation and receive generated output.

Acceptance criteria:
- Generate `novel`, `bible`, and `beat` data from the graph.
- Generate chapter body from scene/chapter nodes.
- Write generated text back to `DramaDraft` and node PLM fields.
- Node status transitions through `draft`, `revision`, and `final`.

Verification:
- Select a chapter node, generate body, reopen graph, confirm draft is attached.

## Phase 5: Skill Crew and AgentOS Integration
Status: not complete.

### Task 13: Graph-aware task binding
Description: Connect nodes to Drama tasks without making tasks the primary story state.

Acceptance criteria:
- Any node can bind to one or more tasks.
- Task cards can open the linked graph node.
- Node inspector shows task state.

Verification:
- Create a task from a node and confirm bidirectional navigation.

### Task 14: Crew reads graph state
Description: Agents should consume structured story context.

Acceptance criteria:
- Crew can read current `DramaGraph`, selected node, diagnostics, and recent graph events.
- Crew prompts receive compact graph state plus retrieved memory.
- Context is bounded and does not dump the entire graph blindly.

Verification:
- Run a crew action and inspect the payload sent to the agent.

### Task 15: Crew writes graph events
Description: Agent output must become structured, reviewable graph changes.

Acceptance criteria:
- Agent suggestions are written as proposed graph events.
- User can accept/reject suggestions.
- Accepted suggestions mutate graph state through the same safe persistence layer.
- Director panel shows story state, blocked nodes, open revisions, and agent ownership.

Verification:
- Agent creates a scene suggestion, user accepts it, graph updates and event log records it.

## Phase 6: Unified Drama UI
Status: in progress.

### Task 16: Shell consistency
Description: Remove visible Storylet/PlotPilot branding from Drama surfaces.

Acceptance criteria:
- Entrances are named `Drama Graph`, `Drama PLM`, and `Skill Crew`.
- Title bar, sidebar, status bar, icon system, and empty states use Drama/Warp styling.
- Storylet card style is scoped to graph cards only.
- PLM no longer uses PlotPilot blue-purple SaaS styling.

Verification:
- Visual review on Graph, PLM, and Skill Crew routes.

### Task 17: Canvas visual refinement
Description: Keep graph readable at scale while matching Drama's dark workbench.

Acceptance criteria:
- Node cards stay legible at zoomed-out and zoomed-in levels.
- Edge labels do not dominate the canvas.
- Minimap, grid, diagnostics badges, and selected states use one coherent token set.

Verification:
- Screenshot comparison against current large story graph.

## Phase 7: Startup, Packaging, and Desktop Reliability
Status: partially complete, needs hardening.

### Task 18: Electron lifecycle
Description: Fix the double-click, tray, and background-process problems at the lifecycle layer.

Acceptance criteria:
- Single-instance lock is enforced.
- Double-click while running focuses the existing window.
- Tray icon is stable and shows quit/open actions.
- Quit menu kills Electron child processes and PLM sidecar.
- Closing window behavior is explicit and consistent.

Verification:
- Manual double-click test.
- Windows process list has no stale sidecar after quit.

### Task 19: Native routing without localhost
Description: Drama Graph and Drama PLM must not depend on external web servers as primary routes.

Acceptance criteria:
- Graph opens without Storylet or `localhost:3000`.
- PLM opens without PlotPilot frontend or `127.0.0.1:8005`.
- Sidecar failure shows a Drama error state, not a crash overlay.

Verification:
- Start Drama with no Storylet/PlotPilot frontend running.

### Task 20: Release packaging
Description: Produce an installable Windows build with icon and desktop shortcut.

Acceptance criteria:
- App icon uses the final cleaned Drama icon asset.
- Desktop shortcut launches or focuses Drama.
- Packaged app can open Graph, PLM, and Skill Crew.
- App restart preserves graph state.

Verification:
- Install package, reboot or relaunch, open existing workspace, confirm graph data remains.

## Final Acceptance Checklist
- [ ] `DramaGraph` is the canonical runtime schema.
- [ ] Storylet JSON imports/exports but is not required at runtime.
- [ ] Graph data persists under `.drama/graphs`.
- [ ] Backups, event log, restore UI, and startup recovery work.
- [ ] Drama Graph opens without `localhost:3000`.
- [ ] Nodes and edges can be created, edited, deleted, copied, searched, laid out, and persisted.
- [ ] Relationship diagnostics identify broken state-machine structure.
- [ ] Drama PLM opens without PlotPilot frontend.
- [ ] PLM can generate chapter text from graph state and write it back.
- [ ] Skill Crew reads graph state and writes proposed graph events.
- [ ] Drama/Warp style wraps all surfaces.
- [ ] Desktop double-click launches or focuses the app.
- [ ] Quit behavior leaves no stale Electron or Python sidecar processes.

## Parallelization Plan
- Agent A: Graph editor operations, diagnostics, and inspector behavior.
- Agent B: PlotPilot sidecar, typed PLM API client, and generation writeback.
- Agent C: Skill Crew graph context, task binding, and agent event proposal flow.
- Agent D: UI unification, icon/packaging, tray and desktop lifecycle verification.

Shared contracts that must be frozen before parallel work:
- `DramaGraph` schema and event envelope.
- Electron preload API names and result shapes.
- PLM request/response DTOs.
- Task/agent binding structure.

## Risks and Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Schema churn corrupts user data | High | Version schemas, keep adapters, add migration tests before changing persisted shape. |
| PLM sidecar blocks app startup | High | Start asynchronously, show health state, never gate Graph route on sidecar readiness. |
| Agent output becomes unreviewable text | High | Require proposed graph events and accept/reject workflow. |
| Large graph becomes slow | Medium | Keep graph model normalized, debounce saves, virtualize heavy inspector lists, profile React Flow. |
| UI becomes three products stitched together | Medium | Use Drama shell tokens and only scope legacy visual language to graph cards. |
| Desktop app appears closed but process remains | High | Single-instance lock, explicit tray behavior, sidecar lifecycle tests, manual process verification. |

## Immediate Next Implementation Order
1. Finish Graph editor durability: undo/redo, richer inspector save paths, and node/edge focus from diagnostics.
2. Finish PLM chapter generation and writeback: selected chapter node -> generation request -> `DramaDraft` -> graph event.
3. Add task/agent binding to selected nodes and let Skill Crew read compact graph state.
4. Harden desktop lifecycle: tray icon, focus existing instance, sidecar shutdown, packaged smoke test.
5. Visual pass across Graph, PLM, and Skill Crew after the behavior is stable.

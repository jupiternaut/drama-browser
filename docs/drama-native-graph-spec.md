# Spec: Drama Native Graph

## Objective
Drama Graph becomes the runtime source of truth for narrative state machines. Storylet JSON remains an import/export compatibility format, not the long-term runtime model. The first implementation slice establishes a typed DramaGraph schema and safe workspace-local persistence so later canvas editing, PLM generation, and Skill Crew integration can build on stable storage.

## Tech Stack
- TypeScript shared model in `apps/electron/src/shared`
- Electron main-process persistence in `apps/electron/src/main`
- Bun tests with `bun test`
- React renderer consumes `DramaGraph` through Electron preload IPC

## Commands
- Unit tests: `bun test apps/electron/src/shared/__tests__/drama-graph.test.ts apps/electron/src/main/__tests__/drama-graph-store.test.ts`
- Existing bridge regression: `bun test apps/electron/src/shared/__tests__/storylet-plotpilot-bridge.test.ts apps/electron/src/shared/__tests__/storylet-native-graph.test.ts`
- Electron typecheck: `bun run typecheck:electron`
- Renderer build: `bun run electron:build:renderer`

## Project Structure
- `apps/electron/src/shared/drama-graph.ts` -> canonical graph schema and Storylet adapters
- `apps/electron/src/main/drama-graph-store.ts` -> `.drama/graphs` persistence, backups, recovery, event log
- `apps/electron/src/renderer/components/workspace-tools/*` -> native Graph UI
- `docs/drama-native-graph-spec.md` -> living spec

## Code Style
Use additive, versioned schemas and explicit conversion functions.

```ts
export interface DramaGraph {
  schema: 'drama.graph.v1'
  id: string
  title: string
  nodes: DramaNode[]
  edges: DramaEdge[]
  updatedAt: number
}

export function dramaGraphFromStoryletState(input: StoryletStoryState): DramaGraph
```

## Testing Strategy
- Pure model adapters use small unit tests.
- File persistence uses temp-directory integration tests.
- Renderer changes require typecheck/build and browser/Electron smoke verification.
- Future editing features must test state changes before UI wiring.

## Boundaries
- Always: write backups before overwriting graph files, append `graph-events.jsonl`, preserve Storylet source IDs.
- Ask first: deleting compatibility adapters, changing persisted schema version, adding a database.
- Never: make Storylet localhost or PlotPilot frontend required for Drama startup, overwrite graph files without backup, silently discard invalid graph data.

## Success Criteria
- DramaGraph contains `DramaGraph`, `DramaNode`, `DramaEdge`, `DramaScene`, `DramaChapter`, `DramaBible`, `DramaDraft`, and `DramaTaskBinding` concepts.
- Storylet state imports to DramaGraph and exports back to Storylet-compatible JSON.
- Workspace storage writes to `.drama/graphs/*.json`.
- Rewrites create backups and append event log records.
- Corrupt current graph files recover from the latest valid backup.
- Drama Graph can load without `localhost:3000` as the main path.

## Open Questions
- Whether future multi-graph workspaces should show a graph picker or auto-open the last graph.
- Whether `DramaGraph` should later move from JSON files to SQLite after the schema stabilizes.

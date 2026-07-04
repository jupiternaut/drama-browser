# Stage 11 Source-Built Performance Gate

Status: PASS

Identity gate: True (`/Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-09-source-product.json`)

## Source Measurements

- firstStyledViewportMs: 138.147
- runtimeReadyMs: 151.587
- sidecarReadyMs: 176.467
- startupMainThreadTaskMs: 13.149
- shellState: parity-blocked

## Route Switches

- graph: 37.456 ms, state=runtime-ready, ok=True
- crew: 40.51 ms, state=runtime-ready, ok=True
- memory: 20.404 ms, state=runtime-ready, ok=True
- plm: 38.189 ms, state=workspace-missing, ok=True

## Wrapper Comparison

- firstStyledViewportMs delta: 47.919 ms
- runtimeReadyMs delta: 46.841 ms
- sidecarReadyMs delta: -61.981 ms
- startupMainThreadTaskMs delta: 5.105 ms

## Decision

canReplaceWrapperForDailyUse: False
Performance gate passes, but packed distributable and loose UI artifact evidence are not yet unified into one signed source-built app bundle.

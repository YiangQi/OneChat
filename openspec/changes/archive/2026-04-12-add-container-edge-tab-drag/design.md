## Context

Current tab drag splitting is scoped to `TabGroup`: the dragged tab must hover over a rendered panel for `dragover` to calculate an edge position and for `drop` to call `panelStore.handleDrop`. This works for panel-local operations, but it does not cover the larger editor/split layout surface. When the user drags a tab to the outer edges of `SplitLayoutContainer`, the intended interaction is a root-level split similar to VS Code editor groups.

The app also uses persistent webviews positioned by layout state, so container-level splitting must move tabs and resize existing webviews without recreating them.

## Goals / Non-Goals

**Goals:**
- Allow dragging an existing tab to the left, right, top, or bottom edge of the whole `SplitLayoutContainer`.
- Show a container-level preview that communicates the resulting root split direction.
- Create the new split at the root layout level when dropped on a valid container edge.
- Preserve existing `TabGroup` edge and center drop behavior.
- Respect minimum panel size constraints and show a blocked preview when the target split would be too small.
- Keep persistent webviews mounted and only update their geometry after the split.

**Non-Goals:**
- Reordering tabs inside a tab bar.
- Detaching tabs into new windows.
- Changing the webview persistence/session model.
- Replacing `splitpanes`.

## Decisions

1. Container-level drag detection lives in `SplitLayoutContainer`.

   `SplitLayoutContainer` owns the outer editor geometry, so it is the correct place to calculate whole-layout edge zones. `TabGroup` should continue to own panel-local drag behavior. Container-level handlers should ignore drag events already handled by a `TabGroup` when the preview target is panel-local.

2. The store exposes an explicit container/root drop operation.

   Reusing `handleDrop(tabId, position, targetPanelId)` directly would force container drops to masquerade as panel drops. A dedicated root/container drop path keeps semantics clear: container edges split the root layout, while panel edges split a specific panel.

3. Preview state is shared but annotated by target scope.

   `DragPreview` should be able to represent both panel-level and container-level previews. The preview layer can render the same geometry model, but the store should distinguish the target as container-level to avoid accidental panel drops.

4. Minimum size checks happen before showing a valid drop target and again on drop.

   The preview should warn early when the split is blocked, but the store must still validate on drop because layout can change between dragover and drop.

5. Persistent webviews remain outside the panel component tree.

   Container-level splitting must not remount webviews. The global webview layer should update each active tab's wrapper position after the panel tree changes.

## Risks / Trade-offs

- Container and panel drag handlers may both receive drag events -> Use event target checks and preview target scope to keep the innermost panel behavior authoritative unless the cursor is in the outer container edge zone.
- Root-level splitting can create unexpected nesting if the existing root direction differs -> Define root split behavior explicitly and add E2E coverage for left/right/top/bottom container edges.
- Minimum-size blocked previews may feel too aggressive on small windows -> Keep thresholds centralized so they can be tuned after manual testing.
- Webview geometry can lag behind animated splitpanes transitions -> Schedule layout updates after the store mutation and rely on observed content areas for final geometry.

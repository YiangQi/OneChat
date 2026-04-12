## Why

Tab drag splitting currently depends on hovering over an individual `TabGroup`, which makes the interaction feel narrow and easy to miss once multiple panes and webviews are present. Users expect a VS Code-like behavior where dragging a tab to the outer edges of the whole editor area creates a new split in that direction.

## What Changes

- Add container-level edge drop zones on `SplitLayoutContainer` for left, right, top, and bottom.
- When a tab is dragged over the outer edge of the split layout container, show a preview for the whole-container split target.
- Dropping on a valid container edge creates a root-level split in the requested direction.
- Preserve existing panel-level drag behavior for splitting or merging within a specific panel.
- Reuse the existing minimum panel size guard and blocked preview messaging for container-level drops.
- Ensure webviews continue to persist and resize without reload when container-level splitting moves tabs.

## Capabilities

### New Capabilities
- `container-edge-tab-drag`: Dragging a tab to the outer edges of the split layout container can create root-level left/right/top/bottom splits.

### Modified Capabilities

## Impact

- Affects renderer drag-and-drop flow in `SplitLayoutContainer`, `TabGroup`, `DragPreviewLayer`, and `panelStore`.
- Adds or updates E2E coverage for outer-container edge drop zones.
- No new dependencies or external APIs expected.

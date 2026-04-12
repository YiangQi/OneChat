## 1. Store Support

- [x] 1.1 Extend drag preview state so it can distinguish panel-level targets from container-level targets.
- [x] 1.2 Add store logic for root/container edge drops that creates left/right/top/bottom root splits.
- [x] 1.3 Reuse minimum-size validation for container-level dragover and drop paths.
- [x] 1.4 Ensure root split operations keep tab ownership in `tabIds` and clean up empty panels consistently.

## 2. UI Integration

- [x] 2.1 Add `SplitLayoutContainer` dragover/drop handling for outer left/right/top/bottom edge zones.
- [x] 2.2 Render container-level previews with the existing `DragPreviewLayer`.
- [x] 2.3 Show blocked preview messaging when the container edge drop would violate minimum size.
- [x] 2.4 Preserve existing `TabGroup` panel-level split and center-merge behavior.

## 3. Webview And Resize Behavior

- [x] 3.1 Verify container-level drops do not remount or reload persistent webviews.
- [x] 3.2 Trigger webview geometry updates after container-level root split mutations.
- [x] 3.3 Confirm splitter resizing still updates webview bounds after container-level splits.

## 4. Testing

- [x] 4.1 Add store tests for container-level edge split validation and blocked drops.
- [x] 4.2 Add E2E tests for dragging to each outer container edge.
- [x] 4.3 Add E2E coverage confirming panel-level drops still behave as before.
- [x] 4.4 Run component/store unit tests, split-layout E2E tests, and production build.

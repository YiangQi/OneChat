## Why

OneChat currently opens each AI website in webviews, but users still have to interact with each site's own input box and toolbar. A global bottom composer lets users ask once, control common website actions from the client, and send text or attachments to the active or selected AI tabs from a consistent place.

## What Changes

- Add a bottom composer area below the split webview workspace with a multiline input field.
- Allow the composer height to be resized vertically and persisted across sessions.
- Allow the composer to be expanded and collapsed without losing draft text.
- Add toolbar actions for login, website sidebar visibility, website input visibility, new conversation, target/model selection, add file, add image, and send.
- Dispatch composer text, send actions, visibility actions, and attachment actions to target webviews through the existing per-model injection adapter pattern.
- Support at least the active tab and all tabs as send targets.
- Preserve existing split layout, tab dragging, webview persistence, and sidebar resizing behavior.

## Capabilities

### New Capabilities
- `global-bottom-composer`: Defines the bottom composer UI, target selection, resizing/collapse behavior, and webview action dispatch contract.

### Modified Capabilities

None.

## Impact

- Renderer layout: `App.vue`, `SplitLayoutContainer.vue`, and a new composer component/store.
- Webview integration: `WebViewContainer.vue` and preload/main IPC as needed to dispatch events into webviews.
- Online adapters: existing `online/*/inject.js` handlers may need completion or fixes for the new composer actions.
- Tests: component/store tests for composer state and e2e coverage for layout, resizing, target selection, and dispatch behavior.

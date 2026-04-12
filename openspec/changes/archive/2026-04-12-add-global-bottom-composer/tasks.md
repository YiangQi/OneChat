## 1. Composer State and Layout

- [x] 1.1 Create a composer store for draft text, height, collapsed state, target mode, website sidebar visibility, and website input visibility.
- [x] 1.2 Persist and restore composer height and collapsed state with min/max validation.
- [x] 1.3 Add a main content wrapper so `SplitLayoutContainer` sits above the bottom composer in a vertical flex layout.
- [x] 1.4 Implement the bottom composer component with resize handle, multiline input, toolbar, target selector, send button, add file button, add image button, login button, website sidebar toggle, website input toggle, new conversation button, and collapse/expand control.
- [x] 1.5 Ensure resizing or collapsing the composer updates available workspace height without webviews overlaying the composer.

## 2. Webview Action Dispatch

- [x] 2.1 Add utilities to resolve composer target tabs for active-tab and all-tabs modes.
- [x] 2.2 Add a dispatch path from renderer composer actions to webview adapter events by tab id.
- [x] 2.3 Dispatch `inputTextChanged` as composer text changes for selected target webviews.
- [x] 2.4 Dispatch `inputTextChanged` and `inputTextSended` when sending a non-empty draft.
- [x] 2.5 Dispatch `loginButtonClicked`, `sidebarVisibleChanged`, `inputBoxVisibleChanged`, and `chatNewButtonClicked` from toolbar controls.
- [x] 2.6 Handle missing, unloaded, or unsupported webviews without uncaught errors.

## 3. Attachment Dispatch

- [x] 3.1 Add an Electron-safe file selection path for image selection.
- [x] 3.2 Add an Electron-safe file selection path for general file selection.
- [x] 3.3 Convert selected files into payloads containing data, file name, and MIME type.
- [x] 3.4 Dispatch image payloads through `addImageButtonClicked`.
- [x] 3.5 Dispatch file payloads through `addFileButtonClicked`.

## 4. Provider Adapter Readiness

- [x] 4.1 Review existing `online/*/inject.js` handlers for text sync, send, visibility, login, new chat, image, and file actions.
- [x] 4.2 Fill or harden adapter handlers where existing TODOs block the composer workflow for supported providers.
- [x] 4.3 Ensure unsupported provider actions fail gracefully and do not block dispatch to other tabs.

## 5. Tests and Verification

- [x] 5.1 Add store tests for composer defaults, persistence, resizing bounds, collapse behavior, and target resolution.
- [x] 5.2 Add component tests for toolbar controls, draft preservation, target selection, and disabled/no-target states.
- [x] 5.3 Add e2e coverage for composer layout below the split workspace, resize behavior, collapse/expand, and webview non-overlap.
- [x] 5.4 Add e2e or integration coverage for active-tab and all-tabs dispatch paths.
- [x] 5.5 Run the relevant unit tests, e2e tests, and production build.

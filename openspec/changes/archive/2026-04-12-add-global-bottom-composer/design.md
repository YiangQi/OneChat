## Context

The renderer currently lays out `ActivityBar`, `Sidebar`, and `SplitLayoutContainer` as a single horizontal flex row. The split container owns the visible panel geometry, while `WebViewLayer` positions persistent webviews over panel content slots inside `.split-layout-container`.

The `online/*/inject.js` files already define handlers for client-driven events such as `inputTextChanged`, `inputTextSended`, `inputBoxVisibleChanged`, `sidebarVisibleChanged`, `loginButtonClicked`, `addImageButtonClicked`, `addFileButtonClicked`, and `chatNewButtonClicked`. The missing piece is a first-class renderer UI and dispatch path that sends these actions to the active or selected webviews.

## Goals / Non-Goals

**Goals:**
- Add a bottom composer that occupies real layout height below the split workspace.
- Keep the split workspace as the coordinate root for webview layout so bottom composer resizing does not overlay or clip webviews incorrectly.
- Provide a small state model for composer text, height, collapsed state, target mode, website sidebar visibility, and website input visibility.
- Dispatch composer actions to active tab and all-tab targets using the existing per-site injection contract.
- Keep the first implementation small enough to land with focused unit and e2e coverage.

**Non-Goals:**
- Replacing each AI website's native conversation UI.
- Implementing a full conversation-history sidebar in OneChat.
- Guaranteeing attachment upload support for every provider in the first implementation.
- Changing the split-panel data model or tab drag behavior.
- Introducing a new UI framework or heavy editor dependency.

## Decisions

### Place the Composer Outside the Split Container

The main content area should become a vertical flex column containing `SplitLayoutContainer` and the new composer. The composer should not be rendered inside `.split-layout-container`.

Alternative considered: render the composer as an absolute overlay inside the split container. This would be visually quick, but it would compete with `WebViewLayer`, drag previews, and panel hit testing.

### Use a Dedicated Composer Store

Create a Pinia store for composer state: draft text, persisted height, collapsed state, target mode, website sidebar visibility, and website input visibility. Keep the store independent from `panel.ts` except where it resolves target tabs through existing tab/panel state.

Alternative considered: keep all state local to the component. That would reduce files, but makes target dispatch, persistence, and tests harder.

### Dispatch Through a Webview Bridge

Renderer actions should resolve target tabs, find their webview elements by `data-tab-id`, and execute or send the corresponding adapter event to the webview. The UI should use semantic client action names that match the existing injection contract:

- `inputTextChanged`
- `inputTextSended`
- `inputBoxVisibleChanged`
- `sidebarVisibleChanged`
- `loginButtonClicked`
- `addImageButtonClicked`
- `addFileButtonClicked`
- `chatNewButtonClicked`

Alternative considered: hard-code DOM selectors for providers in Vue components. That would bypass the adapter layer and make every provider change a renderer change.

### Start with Active Tab and All Tabs Targets

The first target selector should support `Active Tab` and `All Tabs`. More granular multi-select can be added later after the dispatch and tests are stable.

Alternative considered: build full per-tab multi-select immediately. It is useful, but it adds interaction and persistence complexity that is not required to match the initial screenshot-level workflow.

### Treat File and Image Buttons as Dispatch Entrypoints

The add file and add image buttons should open an Electron file picker, read the selected file into a serializable payload, and dispatch it to the target adapters. Provider-specific upload reliability remains the responsibility of each adapter.

Alternative considered: expose native file paths to webviews. That risks leaking host paths and does not match browser `File` APIs as cleanly as transferring file data.

## Risks / Trade-offs

- Provider DOM selectors are fragile -> Keep provider-specific logic in `online/*/inject.js` and make unsupported actions fail without breaking the composer.
- Dispatching to hidden webviews can have surprising timing -> Only dispatch to loaded target webviews; report or no-op unloaded tabs rather than creating hidden webviews solely to send.
- Composer resize can starve the workspace on small windows -> Enforce minimum and maximum heights and preserve a usable split-container minimum.
- All-tabs send can submit to unintended providers -> Make the selected target visible in the toolbar and default to active tab unless product direction explicitly prefers all tabs.
- File upload support differs across providers -> Add tests for payload creation and at least one adapter path; document unsupported providers as adapter gaps.

## Migration Plan

1. Introduce the composer store and UI with no dispatch side effects.
2. Wrap the current split layout in a main content column and verify webview layout still follows panel content bounds.
3. Add text/send/visibility/new-chat/login dispatch to active and all-tab targets.
4. Add file and image picker dispatch.
5. Fill or harden provider adapters where the current `TODO` handlers block the new UI.
6. Add component/store tests and targeted e2e tests for layout, resizing, collapse, and dispatch affordances.

Rollback is straightforward: remove the composer component and return `App.vue` to rendering `SplitLayoutContainer` directly beside `Sidebar`.

## Open Questions

- Should the default target be `Active Tab` or `All Tabs`? The screenshot shows `All Tabs`, but a safer first-run default is `Active Tab`.
- Should the sidebar toggle control only the website's internal sidebar, or also OneChat's model sidebar? This design treats website sidebar visibility as the toolbar action and leaves OneChat sidebar collapse as a separate possible enhancement.

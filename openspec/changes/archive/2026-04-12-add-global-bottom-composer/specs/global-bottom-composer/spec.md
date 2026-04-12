## ADDED Requirements

### Requirement: Bottom Composer Layout
The system SHALL provide a bottom composer below the split webview workspace without overlaying the split workspace or webview layer.

#### Scenario: Composer occupies bottom area
- **WHEN** the application renders with the composer expanded
- **THEN** the split workspace occupies the remaining space above the composer
- **AND** active webviews remain bounded to their panel content areas

#### Scenario: Composer remains below split layout after panel changes
- **WHEN** the user creates, resizes, or rearranges split panels
- **THEN** the composer remains anchored below the split workspace
- **AND** panel webviews do not cover the composer

### Requirement: Composer Height Resizing
The system SHALL allow the user to resize the bottom composer vertically within configured minimum and maximum heights.

#### Scenario: Resize composer height
- **WHEN** the user drags the composer resize handle upward or downward
- **THEN** the composer height changes within the allowed range
- **AND** the split workspace updates to fill the remaining available height

#### Scenario: Persist composer height
- **WHEN** the user changes the composer height and restarts the renderer
- **THEN** the composer restores the last valid persisted height

### Requirement: Composer Collapse
The system SHALL allow the user to collapse and expand the composer without losing draft text.

#### Scenario: Collapse composer
- **WHEN** the user clicks the composer collapse control
- **THEN** the text input area is hidden
- **AND** a control remains available to expand it again

#### Scenario: Restore draft after expand
- **WHEN** the user enters draft text, collapses the composer, and expands it again
- **THEN** the draft text is still present

### Requirement: Composer Toolbar Actions
The system SHALL provide toolbar controls for login, website sidebar visibility, website input visibility, new conversation, target/model selection, add file, add image, and send.

#### Scenario: Toolbar controls are available
- **WHEN** the composer is expanded
- **THEN** the toolbar exposes controls for login, sidebar visibility, input visibility, new conversation, target/model selection, add file, add image, and send

#### Scenario: Visibility actions update target websites
- **WHEN** the user toggles website sidebar visibility or website input visibility
- **THEN** the system dispatches the corresponding visibility action to the selected target webviews

### Requirement: Target Selection
The system SHALL allow the user to choose whether composer actions target the active tab or all open tabs.

#### Scenario: Send to active tab
- **WHEN** the target selector is set to active tab and the user sends a prompt
- **THEN** the system dispatches text and send actions only to the active tab's webview

#### Scenario: Send to all tabs
- **WHEN** the target selector is set to all tabs and the user sends a prompt
- **THEN** the system dispatches text and send actions to every open tab's loaded webview

### Requirement: Text Dispatch
The system SHALL synchronize composer text to target webviews and trigger send through the provider adapter contract.

#### Scenario: Text changes are synchronized
- **WHEN** the user edits the composer draft
- **THEN** the system dispatches `inputTextChanged` with the full draft text to the selected target webviews

#### Scenario: Send action is dispatched
- **WHEN** the user clicks send with non-empty draft text
- **THEN** the system dispatches `inputTextChanged` followed by `inputTextSended` to the selected target webviews

### Requirement: Attachment Dispatch
The system SHALL let the user pick a file or image and dispatch a file payload to selected target webviews.

#### Scenario: Add image
- **WHEN** the user selects an image through the add image control
- **THEN** the system dispatches `addImageButtonClicked` with file data, name, and MIME type to selected target webviews

#### Scenario: Add file
- **WHEN** the user selects a non-image file through the add file control
- **THEN** the system dispatches `addFileButtonClicked` with file data, name, and MIME type to selected target webviews

### Requirement: Safe No-op For Unavailable Targets
The system SHALL handle missing, unloaded, or unsupported target webviews without breaking the composer UI.

#### Scenario: No active tab
- **WHEN** the target selector is set to active tab and no active tab exists
- **THEN** composer dispatch actions do not throw an uncaught error
- **AND** the composer remains usable

#### Scenario: Unsupported provider action
- **WHEN** a target provider adapter does not implement an action
- **THEN** the failed action does not prevent dispatch to other selected target webviews

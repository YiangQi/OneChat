# container-edge-tab-drag Specification

## Purpose
TBD - created by archiving change add-container-edge-tab-drag. Update Purpose after archive.
## Requirements
### Requirement: Container edge split preview
The system SHALL show a split preview when a dragged tab enters the left, right, top, or bottom edge zone of the whole split layout container.

#### Scenario: Dragging over the container right edge
- **WHEN** a user drags a tab over the right edge zone of `SplitLayoutContainer`
- **THEN** the system shows a right-side split preview spanning the container-level target area

#### Scenario: Dragging over the container top edge
- **WHEN** a user drags a tab over the top edge zone of `SplitLayoutContainer`
- **THEN** the system shows a top-side split preview spanning the container-level target area

### Requirement: Container edge drop creates root split
The system SHALL create a root-level split when a dragged tab is dropped on a valid outer edge of the split layout container.

#### Scenario: Dropping on the container right edge
- **WHEN** a user drops a dragged tab on the right edge zone of `SplitLayoutContainer`
- **THEN** the system creates a root-level right split and moves the dragged tab into the new right-side panel

#### Scenario: Dropping on the container bottom edge
- **WHEN** a user drops a dragged tab on the bottom edge zone of `SplitLayoutContainer`
- **THEN** the system creates a root-level bottom split and moves the dragged tab into the new bottom panel

### Requirement: Panel drop behavior remains unchanged
The system SHALL preserve existing panel-level drag behavior when the dragged tab is over an individual panel's drop zones.

#### Scenario: Dropping on a panel center
- **WHEN** a user drops a dragged tab on the center zone of an existing panel
- **THEN** the system moves the dragged tab into that panel without creating a container-level split

#### Scenario: Dropping on a panel edge
- **WHEN** a user drops a dragged tab on an edge zone inside an existing panel
- **THEN** the system performs the existing panel-level split behavior for that panel

### Requirement: Container drops respect minimum panel size
The system SHALL prevent container-level splits that would create a panel smaller than the configured minimum width or height.

#### Scenario: Container edge too small
- **WHEN** a user drags a tab over a container edge where splitting would make a pane smaller than the minimum size
- **THEN** the system shows a blocked preview message and does not create a split on drop

### Requirement: Container drops preserve webview state
The system SHALL keep existing webviews mounted when a tab is moved by a container-level split.

#### Scenario: Moving loaded webview to a container split
- **WHEN** a loaded tab is dropped on a valid outer container edge
- **THEN** the corresponding webview remains mounted and is resized to the new panel content area without reloading


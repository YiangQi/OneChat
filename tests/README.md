# Test Layout

OneChat uses layered tests so Electron-specific behavior does not get mixed with fast renderer tests.

- `unit/`: fast Vitest tests for renderer stores, composables, components, and utilities. Electron APIs are mocked in `setup/vitest.renderer.ts`.
- `integration/renderer/`: Vitest tests that exercise multiple renderer modules together without launching Electron.
- `integration/adapters/`: Vitest tests for `online/*/inject.js` adapter scripts using small DOM fixtures.
- `integration/main/`: main-process IPC and filesystem contract tests.
- `integration/preload/`: preload API exposure and channel contract tests.
- `e2e/specs/`: Playwright Electron tests that launch the built app and verify user flows.
- `e2e/helpers/`: shared Electron launch helpers for E2E tests.
- `e2e/debug/`: local debugging specs that are not included by default.

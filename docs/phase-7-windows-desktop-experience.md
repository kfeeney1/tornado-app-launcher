# Phase 7 — Windows desktop experience

Starting `main`: `205f8451b12b1d912787e664b538c5149f909996`.

Phase 6 PR #21 was merged before Phase 7 began, and its final head passed the repository Quality workflow.

## Lifecycle

Tornado continues to use the shared React/Vite app with Electron 44.3.0 on Windows. Native Windows window chrome is retained.

A single-instance lock now prevents duplicate independent Tornado windows. Starting Tornado again restores and focuses the existing window.

Closing the main window exits Tornado. No tray is added, so close behaviour remains predictable.

## Window geometry

The default window is 1280×800 with a 900×620 minimum size and remains resizable.

Normal window bounds are stored in Electron's local user-data directory only. Saved coordinates are checked against current display work areas before restore. Invalid or off-screen state falls back to the centered default window.

This state is local to the Windows device and is not part of portable account configuration.

## Back navigation

Web keeps the existing root exit confirmation.

Windows keeps nested history navigation, but reaching the root boundary returns/remains on Home rather than showing browser-style exit confirmation or closing the desktop app.

## Desktop controls and optional features

Native Windows title-bar controls remain in use, so no renderer window-control API is required.

Fullscreen mode, system tray, Start with Windows, native notifications and manual executable selection are deferred because the current product does not require them and adding them would increase complexity without improving the core launcher experience.

## Existing integration retained

Phase 7 keeps the existing Windows launch, installed-app discovery, game resolution, stale-state recovery, Firebase Authentication, profile management and cross-device synchronization architecture.

Portable launcher and appearance state remain shared. Windows-only discovery state and window geometry remain local.

## Security

The Electron baseline remains unchanged: context isolation enabled, Node integration disabled, sandbox enabled and the preload bridge kept narrow. External navigation continues through the existing validated operating-system browser path.

Window geometry persistence is handled only by the Electron main process and is not exposed to React.

## Packaging

Current package identity remains:

- product: Tornado
- app ID: `ie.tornado.launcher`
- version: `0.1.0`
- Electron: `44.3.0`
- Windows target: portable x64 executable

Production continues to load the built `dist/index.html` renderer.

## Automated coverage

Phase 7 adds checks for single-instance handling, second-launch focus behaviour, minimized-window restoration, local geometry persistence, display validation and desktop-specific root Back handling.

Existing CI continues to cover lint, unit tests, desktop security/platform tests, web build, Firebase emulator rules tests, Playwright smoke tests and the Windows package build.

## Phase 8 boundary

The recommended next phase is Windows distribution and update readiness: release-channel design, packaging choice, signing prerequisites, update architecture, versioning, release notes and installation/upgrade regression testing.

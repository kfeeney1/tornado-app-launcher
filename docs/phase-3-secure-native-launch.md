# Phase 3 — Secure native app and game launching

Starting `main`: `7348a9a21af3b61c72878a4a02f2123325828d71`.

## Architecture

Shared React calls the shared launch service with a Tornado catalogue item. The launch service resolves a typed target, then delegates native launch to the active platform adapter. On Windows the adapter sends only `{ appId, type }` through the preload bridge. Electron main treats that payload as untrusted and resolves it against a trusted allowlist before asking the OS to open the registered protocol.

`React → launchApp → Windows adapter → preload → validated IPC → trusted app-ID allowlist → shell.openExternal(allowlisted protocol)`

The renderer never receives Node.js, `child_process`, `exec`, `spawn`, PowerShell, `cmd.exe`, unrestricted filesystem access, generic `ipcRenderer`, or unrestricted Electron shell access.

## Supported native targets

The current catalogue needs registered protocols for:

- `minecraft` → `minecraft://`
- `fortnite` → Epic Games Launcher protocol for Fortnite
- `roblox` → `roblox://`

The renderer cannot substitute a protocol string. Unknown IDs, wrong target types, additional command-like payload fields, malformed payloads, and unsupported targets are rejected at the trusted desktop boundary.

Validated executable-path launching is intentionally not added yet because the live catalogue has no device-local executable mappings and Phase 4/6 establish discovery and robust device-local resolution. This avoids inventing or syncing Windows paths prematurely.

## Web and Android

Web remains unable to claim native launch capability. When native launch is unsupported or fails, the shared launch service uses the catalogue's existing official web/install fallback. Android keeps its existing adapter and is not modified by this phase.

## Cloud/local boundary

Portable configuration continues to store Tornado app/game IDs only. Native Windows launch details are trusted desktop implementation details and no executable path, registry key, Windows username, shortcut path, or installed-software inventory is added to Firestore.

## Tests

Phase 3 adds deterministic tests for:

- Windows capability detection
- valid native launch
- malformed target rejection before IPC
- trusted Electron allowlist resolution
- rejection of unknown IDs and command-like payload fields
- shared Web/install fallback
- stable Tornado app identity flowing through the native boundary

Existing lint, unit, Electron security, Firebase emulator, Playwright, Web build, and Windows package checks remain in the quality workflow.

## Deferred to later phases

- installed-app discovery — Phase 4
- launcher/game ecosystem resolution beyond the current registered protocols — Phase 5
- persisted local executable/path selection and stale-path recovery — Phase 6
- broader Windows desktop experience — Phase 7

# Phase 2 — Shared Platform Layer

Tornado keeps one shared React/Vite application. Platform-specific behaviour is selected once through `src/platform/index.js` and exposed through a narrow capability-based API.

## Architecture

```text
Shared React UI
    |
    v
Tornado Platform API
    |-- Web adapter
    |-- Windows adapter -> preload bridge -> validated Electron IPC -> main process
    `-- Android adapter -> Capacitor runtime/plugin when present
```

Shared React code must not import Electron or branch on Capacitor directly. Prefer:

```js
await platform.openExternal(url)
```

Do not add component-level `window.tornadoPlatform`, `Capacitor.getPlatform()`, `process.platform`, or user-agent checks.

## Current capabilities

Phase 2 implements `open-external` on Web, Windows and Android. The contract also reserves `native-app-launch`, `local-filesystem`, `installed-app-discovery`, `desktop-window-controls`, and `native-notifications` for later phases.

`native-app-launch` is intentionally unsupported in Phase 2. Existing Tornado catalogue IDs remain portable identities; platform-specific executable paths or machine installation data must not be synchronized.

## External URLs

The shared policy allows only `https:`, `http:` and `mailto:`. Electron repeats validation in the main process before `shell.openExternal`. The renderer cannot invoke arbitrary IPC channels.

## Windows boundary

The preload bridge exposes only:

- `getPlatform()`
- `openExternal(url)`

Electron keeps `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and `webSecurity: true`. Unexpected renderer navigation and popups are denied; approved external URLs are opened by the OS shell.

## Android

The repository currently contains no committed Capacitor native project or Android build pipeline. The Android adapter detects an injected Capacitor runtime and uses the Browser plugin when available, with a browser-safe fallback. Adding a native Android project is separate from this Phase 2 architecture work.

## Adding a capability

1. Add the typed capability to `contracts.js` and `contracts.d.ts`.
2. Define the portable request/result type; use Tornado app IDs, not display names or executable paths.
3. Implement explicit Web behaviour, including unsupported behaviour where appropriate.
4. Implement Windows behaviour through a narrow preload method and validated main-process IPC only when native access is required.
5. Implement Android behaviour through the existing Capacitor boundary where available.
6. Add deterministic adapter tests and security-boundary tests.
7. Confirm device-specific resolution data remains outside Firestore portable configuration.

## Phase 3 readiness

Phase 3 should extend `native-app-launch` using the existing flow:

```text
Tornado app/game ID
    -> shared launch service
    -> platform adapter
    -> Windows resolver
    -> validated launch target
```

Do not expose generic command execution or arbitrary IPC invocation. Native launch resolution belongs below the portable configuration layer.

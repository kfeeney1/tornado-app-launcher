# Phase 1 — Windows Foundation & Shared Architecture

Tornado remains one React/Vite application. The web renderer in `src/` is shared by browser hosting and Electron; there is no Windows-specific React copy.

## Architecture

- `src/` — shared React application, Firebase/Auth/Firestore/sync, UI and portable/device configuration.
- `src/platform/` — shared platform boundary. UI code uses this layer rather than importing Electron/Node APIs.
- `electron/main/` — trusted Electron main process and narrowly scoped IPC handlers.
- `electron/preload/` — sandboxed preload bridge. It exposes only `getPlatform()` and `openExternal()` in Phase 1.
- `electron/scripts/` — desktop development orchestration.
- Future Android/Capacitor code should integrate through the same `src/platform/` boundary rather than adding renderer-side native imports.

The current repository does not contain a landed Capacitor/Android native project. The platform API nevertheless recognises a Capacitor Android runtime if one is introduced/reintroduced later.

## Security baseline

Electron uses `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and `webSecurity: true`. The renderer receives no unrestricted Node, filesystem, process execution or shell API. New-window requests are denied; HTTP/HTTPS links may be opened externally. Main-frame navigation is restricted to the configured Vite development origin or the packaged local renderer. IPC validates the only Phase 1 native operation (`platform:open-external`).

## Commands

```bash
npm ci
npm run dev              # Tornado Web development
npm run build            # Tornado Web production build
npm run desktop:dev      # Vite + Electron development
npm run desktop:test     # platform/security foundation tests
npm run desktop:dir      # unpacked desktop package (host OS)
npm run desktop:build    # Windows x64 portable package
npm run lint
npm test
```

Desktop tooling is pinned by the scripts/configuration to Electron 44.3.0 and electron-builder 26.15.3. They are intentionally invoked through pinned `npx` commands so the existing npm lockfile and `npm ci` workflows remain valid in this phase.

## Firebase

Web keeps the existing Firebase Hosting fallback (`/__/firebase/init.json`). A packaged Electron renderer runs from `file://`, so production desktop builds must provide the existing `VITE_FIREBASE_*` variables at Vite build time. No second Firebase project or desktop-only identity is introduced. Auth persistence, Firestore access, cloud profiles and sync continue to use the shared renderer implementation.

## Portable vs device-specific data

The Electron bridge does not write machine paths or native application data to Firebase. Future Windows executable paths, discovery results and system information belong in the device-local configuration side of Tornado's existing configuration architecture. Portable launcher selections and appearance remain in the existing sync layer.

## Packaging

`electron-builder.yml` produces a Windows x64 portable executable in `release/`. This is a validation package for the desktop foundation, not the final public installer/release system. Code signing, auto-update, polished installer UX and public download infrastructure remain deferred.

## Phase 2 boundary

Recommended Phase 2 scope: add narrowly scoped Windows-native launcher capabilities behind the platform API, beginning with device-local app/game launch records and explicit user-selected executable paths. Do not begin broad automatic installed-app/Steam/Epic/Store discovery until the local launch model and permission/validation rules are proven.

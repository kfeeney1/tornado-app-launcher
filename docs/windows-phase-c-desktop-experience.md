# Phase C — Windows Desktop Experience

## Starting state

- Starting `main`: `f2912cfe5486fb0af9c1ba3115c8af32c385c43f`
- Phase B PR #34 is merged.
- Deferred real-Windows acceptance from Phases A/B remains open under the product-owner scheduling exception and is not represented as passed.

## Objective

Make the shared Tornado client behave coherently as a Windows desktop application without creating a second Windows UI or weakening the Electron boundary.

## Live-state findings

The existing desktop shell already provides a strong baseline:

- single-instance lock and second-instance focus/restore
- one controlled BrowserWindow
- device-local window geometry persistence
- minimum window bounds and off-screen recovery
- delayed show until `ready-to-show`
- restricted external navigation/window creation
- context isolation, Node disabled, sandbox and web security
- local renderer/native failure logging
- desktop Back behaviour returns to Tornado home instead of invoking the Web exit-confirmation path

Phase C therefore hardens and verifies the existing desktop lifecycle rather than redesigning it.

## Desktop contract

1. Launch creates one Tornado window.
2. A second launch focuses/restores the existing window.
3. Minimize/restore, move and resize use normal Windows behaviour.
4. Window geometry remains device-local and invalid/off-screen state recovers safely.
5. Tornado content is not shown before the renderer is ready.
6. Internal navigation remains shared with Web; desktop Back returns toward Tornado Home and never exits through browser-history confirmation.
7. External HTTPS/HTTP/mail links open outside Tornado; arbitrary navigation remains denied.
8. Renderer load/native launch/discovery failures are logged locally without exposing raw Node or filesystem APIs to React.
9. Closing the last window exits on Windows; no speculative tray/background process is introduced.
10. Security defaults remain `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.

## Automated acceptance

CI must prove source/logic contracts for:

- single-instance lifecycle
- minimized-window restoration and focus
- window-state persistence and off-screen recovery
- minimum bounds
- ready-to-show behavior
- close lifecycle
- external URL allowlist and navigation denial
- Electron security settings
- desktop-vs-Web Back distinction
- production build and packaged Windows build
- existing shared Web regression suite

## Deferred Windows acceptance

Actual Windows shell feel, taskbar/window-manager behaviour, representative resize/minimize/restore and packaged Back/navigation remain deferred while a Windows machine is unavailable. This remains acceptance debt, not a pass. It becomes blocking before Phase D can be declared fully accepted and before any feature-complete/release-ready claim.

## Gate under the scheduling exception

Phase C development may merge and Phase D preparation may begin when automated CI is green, no P0/P1 desktop defect is known from available evidence, the PR is merged, and `main` is re-inspected. Deferred real-machine checks must remain explicit.

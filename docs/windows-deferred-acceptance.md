# Deferred Windows Acceptance Register

This register exists because development is currently authorised to continue while a real Windows machine is unavailable. A deferred check is **not passed**. It remains release-blocking acceptance debt.

## Phase A — Windows Launcher Core

- A1: installed supported app is identified and native target opens
- A2: installed supported game resolves and launches
- A3: missing supported game is identified and official install destination is offered
- A4: stale mapping fails, invalidates, rediscovery/repair occurs and usable launch is restored
- A5: same-account Web/cloud inspection confirms no executable/shortcut/Start Menu/native mapping data is uploaded

## Phase B — Shared Parity & Cross-Device Acceptance

- same account signs into packaged Windows and Web
- appearance change made on one client is observed on the other
- launcher selection/order change made on one client is observed on the other
- Windows device appears correctly in the account device registry
- account switch on Windows does not expose previous account portable state
- offline packaged Windows state remains usable and reconciles after reconnect

## Phase C — Windows Desktop Experience

- clean packaged launch shows one Tornado window without startup flash
- second launch restores/focuses the existing window
- minimize/restore behaves normally
- resize and move remain usable at realistic desktop sizes
- saved window state restores safely
- desktop Back/navigation feels coherent and does not trigger browser exit confirmation
- external links leave Tornado appropriately
- closing Tornado exits normally with no unexpected background/tray process

## Blocking rule

Phase D can be developed and its automated package validation can run under the current scheduling exception, but Phase D cannot be declared fully accepted while these checks are outstanding. Phase E cannot be declared feature-complete/release-ready and no production candidate may be promoted until all applicable deferred checks have been executed on a real Windows installation and blocking defects are repaired.
